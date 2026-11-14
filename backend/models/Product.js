const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    customerProductName: { type: String }, // For invoices (e.g. "Airpods Pro Case", "Samsung 25W Adapter")
    category: { type: String },
    costPricePerPiece: { type: Number, default: 0 },
    lastPurchasePricePerPiece: { type: Number, default: 0 },
    pricePerPiece: { type: Number, required: true },
    stockInPieces: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
