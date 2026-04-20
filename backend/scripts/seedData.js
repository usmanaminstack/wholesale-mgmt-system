const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Ledger = require('../models/Ledger');

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // Clear all collections
        const collections = Object.keys(mongoose.connection.collections);
        for (const collectionName of collections) {
            await mongoose.connection.collections[collectionName].deleteMany({});
            console.log(`Cleared: ${collectionName}`);
        }

        console.log('--- Seeding Fresh Data ---');

        // 1. Add Product
        const prodA = await new Product({
            name: 'Verification Product A',
            category: 'Test',
            piecesPerCarton: 10,
            costPricePerCarton: 1000,
            costPricePerPiece: 100,
            pricePerCarton: 1500,
            pricePerPiece: 160,
            stockInPieces: 0,
            lowStockThreshold: 5
        }).save();

        // 2. Add Supplier & Customer
        const supplier = await new Supplier({ name: 'Main Supplier', phone: '111', totalPurchases: 0, totalPaid: 0, outstandingPayable: 0 }).save();
        const customer = await new Customer({ name: 'Main Customer', phone: '222', totalSales: 0, totalPaid: 0, outstandingReceivable: 0 }).save();

        const getDate = (daysAgo) => {
            const date = new Date();
            date.setHours(12, 0, 0, 0); // Noon to avoid boundary issues
            date.setDate(date.getDate() - daysAgo);
            return date;
        };

        // --- THE WORKFLOW ---

        // DAY -2: Initial Stock Up
        // 10 Cartons @ 1000 = 10,000
        console.log('Day -2: Purchase 10 @ 1000');
        const p1 = await new Purchase({
            supplier: supplier._id,
            items: [{ product: prodA._id, quantityInCartons: 10, costPerCarton: 1000, totalCost: 10000 }],
            grandTotal: 10000, paidAmount: 0, balanceAmount: 10000, paymentType: 'Credit', purchaseDate: getDate(2)
        }).save();
        prodA.stockInPieces = 100; // 10 cartons * 10 pieces
        await prodA.save();
        supplier.totalPurchases = 10000; supplier.outstandingPayable = 10000; await supplier.save();
        await new Ledger({ entityType: 'Supplier', entityId: supplier._id, transactionType: 'Purchase', referenceId: p1._id, credit: 10000, balance: 10000, date: getDate(2) }).save();

        // DAY -2: First Sale
        // 2 Cartons @ 2000 = 4,000 (Cost: 2 * 1000 = 2000. Profit: 2000)
        console.log('Day -2: Sale 2 @ 2000');
        const s1 = await new Sale({
            customer: customer._id,
            items: [{ product: prodA._id, quantity: 2, unit: 'Carton', priceAtSale: 2000, totalPrice: 4000, costAtSale: 1000 }],
            totalAmount: 4000, receivedAmount: 0, balanceAmount: 4000, paymentType: 'Credit', saleDate: getDate(2)
        }).save();
        prodA.stockInPieces = 80; await prodA.save();
        customer.totalSales = 4000; customer.outstandingReceivable = 4000; await customer.save();
        await new Ledger({ entityType: 'Customer', entityId: customer._id, transactionType: 'Sale', referenceId: s1._id, debit: 4000, balance: 4000, date: getDate(2) }).save();


        // DAY -1: New Purchase at Higher Rate (AVCO TEST)
        // Buy 10 more Cartons @ 1200 = 12,000
        // Old: 8 Cartons @ 1000 (Total 8000)
        // New: 10 Cartons @ 1200 (Total 12000)
        // Result: 18 Cartons @ (8000+12000)/18 = 1111.11 per carton
        console.log('Day -1: Purchase 10 @ 1200');
        const p2 = await new Purchase({
            supplier: supplier._id,
            items: [{ product: prodA._id, quantityInCartons: 10, costPerCarton: 1200, totalCost: 12000 }],
            grandTotal: 12000, paidAmount: 12000, balanceAmount: 0, paymentType: 'Cash', purchaseDate: getDate(1)
        }).save();

        prodA.stockInPieces = 180;
        prodA.costPricePerCarton = 20000 / 18;
        prodA.costPricePerPiece = (20000 / 18) / 10;
        await prodA.save();
        supplier.totalPurchases += 12000; supplier.totalPaid += 12000; await supplier.save();
        await new Ledger({ entityType: 'Supplier', entityId: supplier._id, transactionType: 'Purchase', referenceId: p2._id, credit: 12000, balance: 10000 + 12000, date: getDate(1) }).save();
        await new Ledger({ entityType: 'Supplier', entityId: supplier._id, transactionType: 'Payment', referenceId: p2._id, debit: 12000, balance: 10000, date: getDate(1) }).save();


        // DAY 0 (TODAY): Sale to verify profit
        // Sale 8 Cartons @ 2000 = 16,000
        // Total Sale Price: 16,000
        // Total Cost (AVCO): 8 * 1111.11 = 8888.88
        // Expected Profit: 7111.12
        console.log('Day 0: Sale 8 @ 2000');
        const s2 = await new Sale({
            customer: customer._id,
            items: [{ product: prodA._id, quantity: 8, unit: 'Carton', priceAtSale: 2000, totalPrice: 16000, costAtSale: 20000 / 18 }],
            totalAmount: 16000, receivedAmount: 16000, balanceAmount: 0, paymentType: 'Cash', saleDate: getDate(0)
        }).save();
        prodA.stockInPieces = 100; await prodA.save();
        customer.totalSales += 16000; customer.totalPaid += 16000; await customer.save();
        await new Ledger({ entityType: 'Customer', entityId: customer._id, transactionType: 'Sale', referenceId: s2._id, debit: 16000, balance: 4000 + 16000, date: getDate(0) }).save();
        await new Ledger({ entityType: 'Customer', entityId: customer._id, transactionType: 'Payment', referenceId: s2._id, credit: 16000, balance: 4000, date: getDate(0) }).save();


        // DAY 0: Fuel Expense
        await new Expense({ category: 'Fuel', amount: 500, description: 'Verification Fuel', expenseDate: getDate(0) }).save();
        console.log('Day 0: Expense 500');

        console.log('--- Simplified Seeding Completed Successfully! ---');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
