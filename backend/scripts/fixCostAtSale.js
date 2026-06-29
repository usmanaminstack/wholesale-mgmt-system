/**
 * PATCH SCRIPT — Fix costAtSale for 28 Jun 2026 sale
 * Updates each sale item's costAtSale to match actual purchase price
 * Run ONCE: node scripts/fixCostAtSale.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sale     = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product  = require('../models/Product');
require('../models/Supplier');
require('../models/Customer');

const DAY_S = new Date('2026-06-28T00:00:00.000+05:00');
const DAY_E = new Date('2026-06-28T23:59:59.999+05:00');

const fmt = (n) => `Rs. ${Number(n||0).toFixed(2)}`;

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅  Connected\n');

    // 1. Build purchase cost map from Jun 28 purchases
    const purchases = await Purchase.find({
        purchaseDate: { $gte: DAY_S, $lte: DAY_E }
    }).populate('items.product');

    // Map: productId__unit → costAtPurchase (per carton or per piece)
    const purchaseCostMap = {};
    purchases.forEach(pur => {
        pur.items.forEach(item => {
            const key = `${item.product?._id || item.product}__${item.unit}`;
            purchaseCostMap[key] = item.costAtPurchase;
            console.log(`  📦 Purchase map: ${item.product?.name || item.product} (${item.unit}) → ${fmt(item.costAtPurchase)}`);
        });
    });

    console.log(`\n  Total purchase lines found: ${Object.keys(purchaseCostMap).length}\n`);

    // 2. Find all sales on Jun 28
    const sales = await Sale.find({
        saleDate: { $gte: DAY_S, $lte: DAY_E }
    }).populate('items.product', 'name piecesPerCarton');

    if (sales.length === 0) {
        console.log('  ⚠️  No sales found on 28 Jun 2026');
        await mongoose.disconnect();
        return;
    }

    let totalFixed = 0;
    let totalSkipped = 0;

    for (const sale of sales) {
        console.log(`\n  🛒 Processing sale: ${sale._id}`);
        let modified = false;

        for (const item of sale.items) {
            const prod = item.product;
            const ppc  = prod?.piecesPerCarton || 1;

            // Look for cost in purchase map
            const key = `${prod?._id || item.product}__${item.unit}`;
            const purchaseCost = purchaseCostMap[key];

            if (purchaseCost !== undefined) {
                // Convert to per-piece if needed (costAtSale is stored per unit sold)
                // costAtSale should be per unit (carton price if unit=Carton, piece price if unit=Piece)
                const correctCost = purchaseCost; // already per carton / per piece matching unit

                const oldCost = item.costAtSale || 0;
                if (Math.abs(oldCost - correctCost) > 0.001) {
                    console.log(`    🔧 ${prod?.name || '?'} (${item.unit}): costAtSale ${fmt(oldCost)} → ${fmt(correctCost)}`);
                    item.costAtSale = correctCost;
                    modified = true;
                    totalFixed++;
                } else {
                    console.log(`    ✅ ${prod?.name || '?'} (${item.unit}): already correct (${fmt(oldCost)})`);
                    totalSkipped++;
                }
            } else {
                console.log(`    ⚠️  ${prod?.name || item.product} (${item.unit}): no matching purchase found, skipping`);
                totalSkipped++;
            }
        }

        if (modified) {
            sale.markModified('items');
            await sale.save();
            console.log(`  ✅ Sale ${sale._id} SAVED with corrected costs`);
        } else {
            console.log(`  — Sale ${sale._id} unchanged`);
        }
    }

    // 3. Verify new profit
    console.log('\n' + '═'.repeat(60));
    console.log('  VERIFICATION — Profit after patch');
    console.log('═'.repeat(60));

    const patchedSales = await Sale.find({ saleDate: { $gte: DAY_S, $lte: DAY_E } });
    for (const s of patchedSales) {
        const revenue = s.totalAmount || 0;
        const cogs = s.items.reduce((a, item) => a + (item.costAtSale || 0) * item.quantity, 0);
        const profit = revenue - cogs;
        console.log(`\n  Sale: ${s._id}`);
        console.log(`  Revenue : ${fmt(revenue)}`);
        console.log(`  COGS    : ${fmt(cogs)}`);
        console.log(`  Profit  : ${fmt(profit)}`);
    }

    const purchaseTotal = purchases.reduce((a, p) => a + p.grandTotal, 0);
    const saleTotal = patchedSales.reduce((a, s) => a + s.totalAmount, 0);
    console.log(`\n  Manual check — Revenue(${fmt(saleTotal)}) - Purchase(${fmt(purchaseTotal)}) = ${fmt(saleTotal - purchaseTotal)}`);

    console.log(`\n  ✅ Fixed: ${totalFixed} items  |  Skipped: ${totalSkipped} items\n`);

    await mongoose.disconnect();
    console.log('✅  Done.\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
