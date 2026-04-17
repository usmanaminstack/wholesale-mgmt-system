const mongoose = require('mongoose');

const saleSchema = mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Optional for retail
    customerName: { type: String }, // For guest/retail customers
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true }, // in pieces or cartons? I'll handle unit in the controller
        unit: { type: String, enum: ['Carton', 'Piece'], required: true },
        costAtSale: { type: Number, default: 0 },
        priceAtSale: { type: Number, required: true },
        totalPrice: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    receivedAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentType: { type: String, enum: ['Cash', 'Credit'], required: true },
    saleDate: { type: Date, default: Date.now },
    isRetail: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
