const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const { addLedgerEntry } = require('../utils/ledgerHelper');

exports.createPayment = async (req, res) => {
    try {
        const { entityType, entityId, amount, paymentDate, paymentMethod, note } = req.body;

        const payment = new Payment({
            entityType,
            entityId,
            amount,
            paymentDate,
            paymentMethod,
            note
        });

        const savedPayment = await payment.save();

        if (entityType === 'Customer') {
            const customer = await Customer.findById(entityId);
            if (customer) {
                customer.totalReceived += amount;
                customer.outstandingReceivable -= amount;
                await customer.save();

                await addLedgerEntry({
                    entityType: 'Customer',
                    entityId,
                    transactionType: 'Payment',
                    referenceId: savedPayment._id,
                    credit: amount,
                    description: note || 'Customer Payment'
                });
            }
        } else if (entityType === 'Supplier') {
            const supplier = await Supplier.findById(entityId);
            if (supplier) {
                supplier.totalPaid += amount;
                supplier.outstandingPayable -= amount;
                await supplier.save();

                await addLedgerEntry({
                    entityType: 'Supplier',
                    entityId,
                    transactionType: 'Payment',
                    referenceId: savedPayment._id,
                    debit: amount,
                    description: note || 'Supplier Payment'
                });
            }
        }

        res.status(201).json(savedPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find({}).sort({ paymentDate: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (payment.entityType === 'Customer') {
            const customer = await Customer.findById(payment.entityId);
            if (customer) {
                customer.totalReceived -= payment.amount;
                customer.outstandingReceivable += payment.amount;
                await customer.save();
            }
        } else if (payment.entityType === 'Supplier') {
            const supplier = await Supplier.findById(payment.entityId);
            if (supplier) {
                supplier.totalPaid -= payment.amount;
                supplier.outstandingPayable += payment.amount;
                await supplier.save();
            }
        }

        const Ledger = require('../models/Ledger');
        await Ledger.deleteOne({ referenceId: payment._id });

        await payment.deleteOne();
        res.json({ message: 'Payment deleted and balances reverted' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
