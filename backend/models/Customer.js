const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    totalSales: { type: Number, default: 0 },
    totalReceived: { type: Number, default: 0 },
    outstandingReceivable: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
