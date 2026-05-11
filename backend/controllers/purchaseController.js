const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { addLedgerEntry } = require('../utils/ledgerHelper');

exports.createPurchase = async (req, res) => {
    try {
        const { supplier, items, paymentType, paidAmount, purchaseDate } = req.body;

        let grandTotal = 0;
        for (const item of items) {
            grandTotal += item.totalCost;
        }

        const balanceAmount = grandTotal - paidAmount;

        const purchase = new Purchase({
            supplier,
            items,
            grandTotal,
            paidAmount,
            balanceAmount,
            paymentType,
            purchaseDate
        });

        const savedPurchase = await purchase.save();

        // Update Stock & Average Cost
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                const oldQty = product.stockInPieces || 0;
                const oldCost = product.costPricePerPiece || 0;
                
                const piecesPerCtn = product.piecesPerCarton || 1;
                const qty = item.quantity || item.quantityInCartons || 0;
                const costRate = item.costAtPurchase || item.costPerCarton || 0;
                const newQtyPieces = item.unit === 'Carton' ? (qty * piecesPerCtn) : qty;
                const newTotalCost = item.totalCost || (qty * costRate) || 0;

                const totalQty = oldQty + newQtyPieces;
                if (totalQty > 0) {
                    if (oldQty <= 0) {
                        // If stock was 0 or negative, reset average cost to the new purchase price
                        const costRate = item.costAtPurchase || item.costPerCarton || 0;
                        product.costPricePerPiece = costRate / (item.unit === 'Carton' ? piecesPerCtn : 1);
                    } else {
                        const newAvgCostPerPiece = ((oldQty * oldCost) + newTotalCost) / totalQty;
                        product.costPricePerPiece = newAvgCostPerPiece;
                    }
                    product.costPricePerCarton = product.costPricePerPiece * piecesPerCtn;
                } else if (totalQty === 0 && newQtyPieces > 0) {
                    const costRate = item.costAtPurchase || item.costPerCarton || 0;
                    product.costPricePerPiece = costRate / (item.unit === 'Carton' ? piecesPerCtn : 1);
                    product.costPricePerCarton = product.costPricePerPiece * piecesPerCtn;
                }

                // Update Last Purchase Prices
                if (item.unit === 'Carton') {
                    product.lastPurchasePricePerCarton = item.costAtPurchase;
                    product.lastPurchasePricePerPiece = item.costAtPurchase / piecesPerCtn;
                } else {
                    product.lastPurchasePricePerPiece = item.costAtPurchase;
                    product.lastPurchasePricePerCarton = item.costAtPurchase * piecesPerCtn;
                }

                product.stockInPieces = totalQty;
                await product.save();
            }
        }

        // Update Supplier & Ledger
        const supplierDoc = await Supplier.findById(supplier);
        if (supplierDoc) {
            supplierDoc.totalPurchases += grandTotal;
            supplierDoc.totalPaid += paidAmount;
            supplierDoc.outstandingPayable += balanceAmount;
            await supplierDoc.save();

            // Add Ledger Entry
            // For Supplier: Purchase is Credit (increases payable)
            await addLedgerEntry({
                entityType: 'Supplier',
                entityId: supplier,
                transactionType: 'Purchase',
                referenceId: savedPurchase._id,
                credit: grandTotal,
                description: `Purchase - Ref: ${savedPurchase._id}`
            });

            if (paidAmount > 0) {
                await addLedgerEntry({
                    entityType: 'Supplier',
                    entityId: supplier,
                    transactionType: 'Payment',
                    referenceId: savedPurchase._id,
                    debit: paidAmount,
                    description: `Payment for Purchase - Ref: ${savedPurchase._id}`
                });
            }
        }

        res.status(201).json(savedPurchase);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getPurchases = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.purchaseDate = { $gte: start, $lte: end };
        }
        const purchases = await Purchase.find(query).populate('supplier').sort({ purchaseDate: -1 });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPurchaseById = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id).populate('supplier').populate('items.product');
        if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
        res.json(purchase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePurchase = async (req, res) => {
    try {
        const originalPurchase = await Purchase.findById(req.params.id);
        if (!originalPurchase) return res.status(404).json({ message: 'Purchase not found' });

        const { supplier, items, paymentType, paidAmount, purchaseDate } = req.body;

        // 1. Revert Old Stock
        for (const item of originalPurchase.items) {
            const product = await Product.findById(item.product);
            if (product) {
                const qty = item.quantity || item.quantityInCartons || 0;
                const piecesToReduce = item.unit === 'Carton' ? (qty * product.piecesPerCarton) : qty;
                product.stockInPieces -= piecesToReduce;
                await product.save();
            }
        }

        // 2. Revert Old Supplier Totals
        const oldSupplierDoc = await Supplier.findById(originalPurchase.supplier);
        if (oldSupplierDoc) {
            oldSupplierDoc.totalPurchases -= originalPurchase.grandTotal;
            oldSupplierDoc.totalPaid -= originalPurchase.paidAmount;
            oldSupplierDoc.outstandingPayable -= originalPurchase.balanceAmount;
            await oldSupplierDoc.save();
        }

        // 3. New Totals
        let grandTotal = 0;
        for (const item of items) {
            grandTotal += item.totalCost;
        }
        const balanceAmount = grandTotal - paidAmount;

        // 4. Apply New Stock & Re-calc Average Cost
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                const oldQty = product.stockInPieces || 0;
                const oldCost = product.costPricePerPiece || 0;
                
                const piecesPerCtn = product.piecesPerCarton || 1;
                const qty = item.quantity || item.quantityInCartons || 0;
                const costRate = item.costAtPurchase || item.costPerCarton || 0;
                const newQtyPieces = item.unit === 'Carton' ? (qty * piecesPerCtn) : qty;
                const newTotalCost = item.totalCost || (qty * costRate) || 0;

                const totalQty = oldQty + newQtyPieces;
                if (totalQty > 0) {
                    if (oldQty <= 0) {
                        const costRate = item.costAtPurchase || item.costPerCarton || 0;
                        product.costPricePerPiece = costRate / (item.unit === 'Carton' ? piecesPerCtn : 1);
                    } else {
                        const newAvgCostPerPiece = ((oldQty * oldCost) + newTotalCost) / totalQty;
                        product.costPricePerPiece = newAvgCostPerPiece;
                    }
                    product.costPricePerCarton = product.costPricePerPiece * piecesPerCtn;
                }
                product.stockInPieces = totalQty;
                await product.save();
            }
        }

        // 5. Update Supplier & Ledger
        const supplierDoc = await Supplier.findById(supplier);
        if (supplierDoc) {
            supplierDoc.totalPurchases += grandTotal;
            supplierDoc.totalPaid += paidAmount;
            supplierDoc.outstandingPayable += balanceAmount;
            await supplierDoc.save();

            await addLedgerEntry({
                entityType: 'Supplier',
                entityId: supplier,
                transactionType: 'Purchase',
                referenceId: originalPurchase._id,
                credit: grandTotal,
                description: `Edited Purchase Adjustment - Ref: ${originalPurchase._id}`
            });

            if (paidAmount > 0) {
                await addLedgerEntry({
                    entityType: 'Supplier',
                    entityId: supplier,
                    transactionType: 'Payment',
                    referenceId: originalPurchase._id,
                    debit: paidAmount,
                    description: `Edited Payment Adjustment - Ref: ${originalPurchase._id}`
                });
            }
        }

        // 6. Save Updated Purchase
        Object.assign(originalPurchase, {
            supplier,
            items,
            grandTotal,
            paidAmount,
            balanceAmount,
            paymentType,
            purchaseDate
        });

        const updatedPurchase = await originalPurchase.save();
        res.json(updatedPurchase);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deletePurchase = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

        // 1. Revert Stock & Adjust Average Cost
        for (const item of purchase.items) {
            const product = await Product.findById(item.product);
            if (product) {
                const currentQty = product.stockInPieces || 0;
                const currentCost = product.costPricePerPiece || 0;
                
                const piecesPerCtn = product.piecesPerCarton || 1;
                const removeQty = item.unit === 'Carton' ? (item.quantity * piecesPerCtn) : item.quantity;
                const removeValue = item.totalCost;

                const newQty = currentQty - removeQty;
                if (newQty > 0) {
                    const newValue = (currentQty * currentCost) - removeValue;
                    product.costPricePerPiece = newValue / newQty;
                    product.costPricePerCarton = product.costPricePerPiece * piecesPerCtn;
                }
                product.stockInPieces = newQty;
                await product.save();
            }
        }

        // 2. Revert Supplier Totals
        const supplierDoc = await Supplier.findById(purchase.supplier);
        if (supplierDoc) {
            supplierDoc.totalPurchases -= purchase.grandTotal;
            supplierDoc.totalPaid -= purchase.paidAmount;
            supplierDoc.outstandingPayable -= purchase.balanceAmount;
            await supplierDoc.save();
        }

        // 3. Delete Ledger Entries
        const Ledger = require('../models/Ledger');
        await Ledger.deleteMany({ referenceId: purchase._id });

        // 4. Delete Purchase
        await purchase.deleteOne();
        res.json({ message: 'Purchase deleted and reversed successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
