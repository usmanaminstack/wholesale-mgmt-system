const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { addLedgerEntry } = require('../utils/ledgerHelper');

exports.createSale = async (req, res) => {
    try {
        const { customer, customerName, items, paymentType, receivedAmount, saleDate, isRetail, discount = 0 } = req.body;

        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            totalAmount += item.totalPrice;
            const productDoc = await Product.findById(item.product);

            let cost = 0;
            if (productDoc) {
                const ppc = productDoc.piecesPerCarton || 1;
                const cCost = productDoc.costPricePerCarton || 0;
                const pCost = productDoc.costPricePerPiece || 0;

                if (item.unit === 'Carton') {
                    cost = cCost || (pCost * ppc);
                } else {
                    cost = pCost || (cCost / ppc);
                }
            }
            processedItems.push({ ...item, costAtSale: cost || 0 });
        }

        let finalCustomerId = customer;
        const balanceAmount = totalAmount - discount - receivedAmount;

        // Auto-convert guest to customer if credit or requested
        if (!finalCustomerId && (balanceAmount > 0 || req.body.saveAsCustomer)) {
            const newCustomer = new Customer({
                name: customerName || 'Walk-in Customer',
                phone: req.body.phone || '0000000000',
                address: req.body.address || 'Auto-created from Sale'
            });
            const savedCustomer = await newCustomer.save();
            finalCustomerId = savedCustomer._id;
        }

        const sale = new Sale({
            customer: finalCustomerId,
            customerName,
            items: processedItems,
            totalAmount,
            receivedAmount,
            discount,
            balanceAmount,
            paymentType,
            saleDate,
            isRetail
        });

        const savedSale = await sale.save();

        // Update Stock
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                const piecesToReduce = item.unit === 'Carton' ? (item.quantity * product.piecesPerCarton) : item.quantity;
                product.stockInPieces -= piecesToReduce;
                await product.save();
            }
        }

        // Update Customer & Ledger (if not guest retail)
        if (finalCustomerId) {
            const customerDoc = await Customer.findById(finalCustomerId);
            const netAmount = totalAmount - discount;
            if (customerDoc) {
                customerDoc.totalSales += netAmount;
                customerDoc.totalReceived += receivedAmount;
                customerDoc.outstandingReceivable += balanceAmount;
                await customerDoc.save();

                await addLedgerEntry({
                    entityType: 'Customer',
                    entityId: finalCustomerId,
                    transactionType: 'Sale',
                    referenceId: savedSale._id,
                    debit: netAmount,
                    description: `Sale (Net) - Ref: ${savedSale._id}${discount > 0 ? ` (Disc: ${discount})` : ''}`
                });

                if (receivedAmount > 0) {
                    await addLedgerEntry({
                        entityType: 'Customer',
                        entityId: finalCustomerId,
                        transactionType: 'Payment',
                        referenceId: savedSale._id,
                        credit: receivedAmount,
                        description: `Payment for Sale - Ref: ${savedSale._id}`
                    });
                }
            }
        }

        res.status(201).json(savedSale);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSales = async (req, res) => {
    try {
        const sales = await Sale.find({}).sort({ saleDate: -1 }).populate('customer').populate('items.product');
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id).populate('customer').populate('items.product');
        if (!sale) return res.status(404).json({ message: 'Sale not found' });
        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSale = async (req, res) => {
    try {
        const originalSale = await Sale.findById(req.params.id);
        if (!originalSale) return res.status(404).json({ message: 'Sale not found' });

        const { customer, customerName, items, paymentType, receivedAmount, saleDate, isRetail } = req.body;

        // 1. Revert Original Stock Changes
        for (const item of originalSale.items) {
            const product = await Product.findById(item.product);
            if (product) {
                const piecesToAdd = item.unit === 'Carton' ? (item.quantity * product.piecesPerCarton) : item.quantity;
                product.stockInPieces += piecesToAdd;
                await product.save();
            }
        }

        // 2. Revert Original Customer Totals (if applicable)
        if (originalSale.customer) {
            const oldCustomerDoc = await Customer.findById(originalSale.customer);
            if (oldCustomerDoc) {
                oldCustomerDoc.totalSales -= originalSale.totalAmount;
                oldCustomerDoc.totalReceived -= originalSale.receivedAmount;
                oldCustomerDoc.outstandingReceivable -= originalSale.balanceAmount;
                await oldCustomerDoc.save();
            }
        }

        // 3. Calculate New Totals & Robustly fetch costs
        let totalAmount = 0;
        const processedItems = [];
        for (const item of items) {
            totalAmount += item.totalPrice;
            const productDoc = await Product.findById(item.product);

            let cost = 0;
            if (productDoc) {
                const ppc = productDoc.piecesPerCarton || 1;
                const cCost = productDoc.costPricePerCarton || 0;
                const pCost = productDoc.costPricePerPiece || 0;

                if (item.unit === 'Carton') {
                    cost = cCost || (pCost * ppc);
                } else {
                    cost = pCost || (cCost / ppc);
                }
            }
            processedItems.push({ ...item, costAtSale: cost || 0 });
        }
        const balanceAmount = totalAmount - receivedAmount;

        // 4. Handle Customer Re-assignment or Auto-creation
        let finalCustomerId = customer;
        if (!finalCustomerId && (balanceAmount > 0 || req.body.saveAsCustomer)) {
            const newCustomer = new Customer({
                name: customerName || 'Walk-in Customer',
                phone: req.body.phone || '0000000000',
                address: req.body.address || 'Auto-created from Sale Edit'
            });
            const savedCustomer = await newCustomer.save();
            finalCustomerId = savedCustomer._id;
        }

        // 5. Apply New Stock Changes
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                const piecesToReduce = item.unit === 'Carton' ? (item.quantity * product.piecesPerCarton) : item.quantity;
                product.stockInPieces -= piecesToReduce;
                await product.save();
            }
        }

        // 6. Update Customer Totals & Ledger
        if (finalCustomerId) {
            const customerDoc = await Customer.findById(finalCustomerId);
            if (customerDoc) {
                customerDoc.totalSales += totalAmount;
                customerDoc.totalReceived += receivedAmount;
                customerDoc.outstandingReceivable += balanceAmount;
                await customerDoc.save();

                await addLedgerEntry({
                    entityType: 'Customer',
                    entityId: finalCustomerId,
                    transactionType: 'Sale',
                    referenceId: originalSale._id,
                    debit: totalAmount,
                    description: `Edited Sale Adjustment - Ref: ${originalSale._id}`
                });

                if (receivedAmount > 0) {
                    await addLedgerEntry({
                        entityType: 'Customer',
                        entityId: finalCustomerId,
                        transactionType: 'Payment',
                        referenceId: originalSale._id,
                        credit: receivedAmount,
                        description: `Edited Payment Adjustment - Ref: ${originalSale._id}`
                    });
                }
            }
        }

        // 7. Update the Sale record
        Object.assign(originalSale, {
            customer: finalCustomerId,
            customerName,
            items: processedItems,
            totalAmount,
            receivedAmount,
            balanceAmount,
            paymentType,
            saleDate: saleDate || originalSale.saleDate,
            isRetail
        });

        const updatedSale = await originalSale.save();
        res.json(updatedSale);

    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

exports.deleteSale = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) return res.status(404).json({ message: 'Sale not found' });

        // 1. Revert Stock
        for (const item of sale.items) {
            const product = await Product.findById(item.product);
            if (product) {
                const piecesToAdd = item.unit === 'Carton' ? (item.quantity * product.piecesPerCarton) : item.quantity;
                product.stockInPieces += piecesToAdd;
                await product.save();
            }
        }

        // 2. Revert Customer Totals
        if (sale.customer) {
            const customerDoc = await Customer.findById(sale.customer);
            if (customerDoc) {
                customerDoc.totalSales -= sale.totalAmount;
                customerDoc.totalReceived -= sale.receivedAmount;
                customerDoc.outstandingReceivable -= sale.balanceAmount;
                await customerDoc.save();
            }
        }

        // 3. Delete Ledger Entries
        const Ledger = require('../models/Ledger');
        await Ledger.deleteMany({ referenceId: sale._id });

        // 4. Delete Sale
        await sale.deleteOne();
        res.json({ message: 'Sale deleted and reversed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
