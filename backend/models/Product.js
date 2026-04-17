const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String },
    piecesPerCarton: { type: Number, required: true },
    costPricePerCarton: { type: Number, default: 0 },
    costPricePerPiece: { type: Number, default: 0 },
    pricePerCarton: { type: Number, required: true },
    pricePerPiece: { type: Number, required: true },
    stockInPieces: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Virtuals for stock in cartons
productSchema.virtual('stockInCartons').get(function () {
    return (this.stockInPieces / this.piecesPerCarton).toFixed(2);
});

module.exports = mongoose.model('Product', productSchema);
