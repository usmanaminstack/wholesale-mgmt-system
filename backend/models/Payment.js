const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
    entityType: { type: String, enum: ['Customer', 'Supplier'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'entityType' },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['Cash', 'Bank', 'Other'], default: 'Cash' },
    note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
