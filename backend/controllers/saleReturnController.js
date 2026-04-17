const SaleReturn = require('../models/SaleReturn');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { addLedgerEntry } = require('../utils/ledgerHelper');

exports.createReturn = async (req, res) => {
    try {
        const { saleId, items, totalRefundAmount, reason } = req.body;

        const sale = await Sale.findById(saleId);
        if (!sale) return res.status(404).json({ message: 'Sale not found' });

        const saleReturn = new SaleReturn({
            saleId,
            customer: sale.customer,
            items,
            totalRefundAmount,
            reason
        });

        const savedReturn = await saleReturn.save();

        // 1. Update Stock (Increase for returned items)
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                const piecesToAdd = item.unit === 'Carton' ? (item.quantity * product.piecesPerCarton) : item.quantity;
                product.stockInPieces += piecesToAdd;
                await product.save();
            }
        }

        // 2. Update Customer Balance (Decrease receivable)
        if (sale.customer) {
            const customerDoc = await Customer.findById(sale.customer);
            if (customerDoc) {
                customerDoc.outstandingReceivable -= totalRefundAmount;
                await customerDoc.save();

                await addLedgerEntry({
                    entityType: 'Customer',
                    entityId: sale.customer,
                    transactionType: 'Return',
                    referenceId: savedReturn._id,
                    credit: totalRefundAmount, // Credit decreases receivable
                    description: `Sale Return - Ref: ${savedReturn._id} (Orig Sale: ${saleId})`
                });
            }
        }

        res.status(201).json(savedReturn);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getReturns = async (req, res) => {
    try {
        const returns = await SaleReturn.find().populate('customer').sort({ returnDate: -1 });
        res.json(returns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
