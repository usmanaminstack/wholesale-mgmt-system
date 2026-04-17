const mongoose = require('mongoose');

const saleReturnSchema = mongoose.Schema({
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, enum: ['Carton', 'Piece'], required: true },
        priceAtReturn: { type: Number, required: true }
    }],
    totalRefundAmount: { type: Number, required: true },
    reason: { type: String },
    returnDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SaleReturn', saleReturnSchema);
