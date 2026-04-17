const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
    category: { type: String, required: true }, // rent, fuel, salary, etc.
    amount: { type: Number, required: true },
    description: { type: String },
    expenseDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
