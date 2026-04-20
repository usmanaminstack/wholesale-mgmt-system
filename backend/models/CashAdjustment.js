const mongoose = require('mongoose');

const cashAdjustmentSchema = mongoose.Schema({
    accountType: { type: String, enum: ['Cash', 'Bank'], required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    adjustmentDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CashAdjustment', cashAdjustmentSchema);
