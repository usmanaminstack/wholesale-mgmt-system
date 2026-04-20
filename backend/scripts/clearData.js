const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Ledger = require('../models/Ledger');

async function clearAll() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        await Promise.all([
            Customer.deleteMany({}),
            Supplier.deleteMany({}),
            Product.deleteMany({}),
            Sale.deleteMany({}),
            Purchase.deleteMany({}),
            Expense.deleteMany({}),
            Payment.deleteMany({}),
            Ledger.deleteMany({})
        ]);

        console.log('All data cleared successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
}

clearAll();
