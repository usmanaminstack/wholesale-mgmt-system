const mongoose = require('mongoose');

const supplierSchema = mongoose.Schema({
    name: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    totalPurchases: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    outstandingPayable: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
