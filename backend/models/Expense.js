const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
    category: { type: String, required: true }, // rent, fuel, salary, etc.
    amount: { type: Number, required: true },
    description: { type: String },
    paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque'], default: 'Cash' },
    expenseDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
