const Supplier = require('../models/Supplier');

exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({});
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const supplier = new Supplier(req.body);
        supplier.outstandingPayable = (supplier.openingBalance || 0);
        const createdSupplier = await supplier.save();
        res.status(201).json(createdSupplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (supplier) {
            Object.assign(supplier, req.body);
            supplier.outstandingPayable = (supplier.openingBalance || 0) + (supplier.totalPurchases || 0) - (supplier.totalPaid || 0);
            const updatedSupplier = await supplier.save();
            res.json(updatedSupplier);
        } else {
            res.status(404).json({ message: 'Supplier not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSupplierLedger = async (req, res) => {
    try {
        const Ledger = require('../models/Ledger');
        const Purchase = require('../models/Purchase');
        const Payment = require('../models/Payment');

        const ledgerEntries = await Ledger.find({ entityId: req.params.id, entityType: 'Supplier' });

        // Resolve dates from the actual transaction documents
        const resolvedEntries = await Promise.all(ledgerEntries.map(async (entry) => {
            let actualDate = entry.date;
            if (entry.transactionType === 'Purchase') {
                const purchase = await Purchase.findById(entry.referenceId);
                if (purchase && purchase.purchaseDate) actualDate = purchase.purchaseDate;
            } else if (entry.transactionType === 'Payment') {
                const payment = await Payment.findById(entry.referenceId);
                if (payment && payment.paymentDate) actualDate = payment.paymentDate;
            }

            // Return plain object with the resolved date
            const obj = entry.toObject();
            obj.date = actualDate;
            return obj;
        }));

        // Sort descending by date, then createdAt
        resolvedEntries.sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(resolvedEntries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

        const Ledger = require('../models/Ledger');
        await Ledger.deleteMany({ entityId: supplier._id, entityType: 'Supplier' });

        await supplier.deleteOne();
        res.json({ message: 'Supplier and their ledger history removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
