const Customer = require('../models/Customer');

exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({});
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const customer = new Customer(req.body);
        customer.outstandingReceivable = (customer.openingBalance || 0);
        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            Object.assign(customer, req.body);
            customer.outstandingReceivable = (customer.openingBalance || 0) + (customer.totalSales || 0) - (customer.totalReceived || 0);
            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getCustomerLedger = async (req, res) => {
    try {
        const Ledger = require('../models/Ledger');
        const ledger = await Ledger.find({ entityId: req.params.id, entityType: 'Customer' }).sort({ date: -1 });
        res.json(ledger);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Optional: Check if customer has outstanding balance or transactions
        // For MVP, we'll allow deletion but clear the ledger
        const Ledger = require('../models/Ledger');
        await Ledger.deleteMany({ entityId: customer._id, entityType: 'Customer' });

        await customer.deleteOne();
        res.json({ message: 'Customer and their ledger history removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
