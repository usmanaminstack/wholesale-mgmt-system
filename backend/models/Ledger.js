const mongoose = require('mongoose');

const ledgerSchema = mongoose.Schema({
    entityType: { type: String, enum: ['Customer', 'Supplier'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'entityType' },
    transactionType: { type: String, enum: ['Sale', 'Purchase', 'Payment', 'Return'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of Sale, Purchase, or Payment
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, required: true }, // Running balance
    description: { type: String },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
