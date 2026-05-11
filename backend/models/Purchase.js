const mongoose = require('mongoose');

const purchaseSchema = mongoose.Schema({
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, enum: ['Carton', 'Piece'], default: 'Carton' },
        costAtPurchase: { type: Number, required: true }, // Price per unit (ctn or piece)
        totalCost: { type: Number, required: true }
    }],
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },
    paymentType: { type: String, enum: ['Cash', 'Credit'], required: true },
    purchaseDate: { type: Date, default: Date.now },
    referenceId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
