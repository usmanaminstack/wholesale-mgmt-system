/**
 * PROFIT DEBUG — 28 Jun 2026
 * Diagnoses why COGS doesn't match Purchase Price
 * Run: node scripts/profitDebug.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sale     = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product  = require('../models/Product');
require('../models/Supplier');   // register schema for populate
require('../models/Customer');   // register schema for populate

const DAY_S = new Date('2026-06-28T00:00:00.000+05:00');
const DAY_E = new Date('2026-06-28T23:59:59.999+05:00');
const W     = 80;
const line  = (c='─') => console.log(c.repeat(W));
const dline = ()       => console.log('═'.repeat(W));

const fmt = (n) => `Rs. ${Number(n||0).toLocaleString('en-PK',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅  Connected\n');

    // ── 1. PURCHASES on 28 Jun ────────────────────────────────
    dline();
    console.log('  📦  PURCHASES  —  28 Jun 2026');
    dline();

    const purchases = await Purchase.find({
        purchaseDate: { $gte: DAY_S, $lte: DAY_E }
    }).populate('supplier', 'name').populate('items.product', 'name piecesPerCarton costPricePerCarton costPricePerPiece');

    let totalPurchaseValue = 0;

    purchases.forEach((pur, pi) => {
        console.log(`\n  Purchase #${pi+1}  |  Supplier: ${pur.supplier?.name || 'N/A'}  |  Grand Total: ${fmt(pur.grandTotal)}`);
        line();
        console.log(`  ${'Product'.padEnd(28)} ${'Unit'.padEnd(8)} ${'Qty'.padStart(6)} ${'Cost/Unit'.padStart(12)} ${'Total Cost'.padStart(12)}`);
        line();
        pur.items.forEach(item => {
            const prod = item.product;
            const name = prod?.name || item.product?.toString() || 'Unknown';
            console.log(
                `  ${name.substring(0,28).padEnd(28)} ${item.unit.padEnd(8)} ${String(item.quantity).padStart(6)} ${fmt(item.costAtPurchase).padStart(12)} ${fmt(item.totalCost).padStart(12)}`
            );
            totalPurchaseValue += item.totalCost || 0;
        });
        line();
        console.log(`  Grand Total stored in Purchase doc : ${fmt(pur.grandTotal)}`);
        console.log(`  Sum of item.totalCost              : ${fmt(totalPurchaseValue)}`);
    });

    // ── 2. SALES on 28 Jun ───────────────────────────────────
    dline();
    console.log('  🛒  SALES  —  28 Jun 2026');
    dline();

    const sales = await Sale.find({
        saleDate: { $gte: DAY_S, $lte: DAY_E }
    }).populate('customer', 'name').populate('items.product', 'name piecesPerCarton costPricePerCarton costPricePerPiece');

    let totalRevenue   = 0;
    let totalCOGS_stored  = 0;  // using costAtSale
    let totalCOGS_fallback = 0; // using product current cost

    sales.forEach((sale, si) => {
        const cust = sale.customer?.name || sale.customerName || 'Walk-in';
        console.log(`\n  Sale #${si+1}  |  Customer: ${cust}  |  Total: ${fmt(sale.totalAmount)}  |  Type: ${sale.paymentType}`);
        line();
        console.log(`  ${'Product'.padEnd(28)} ${'Unit'.padEnd(8)} ${'Qty'.padStart(6)} ${'SalePrice'.padStart(11)} ${'costAtSale'.padStart(12)} ${'CurCostPrd'.padStart(12)} ${'Revenue'.padStart(10)} ${'COGS(stored)'.padStart(14)} ${'COGS(cur)'.padStart(11)}`);
        line();

        sale.items.forEach(item => {
            const prod = item.product;
            const name = prod?.name || 'Unknown';
            const ppc  = prod?.piecesPerCarton || 1;
            const cCost = prod?.costPricePerCarton || 0;
            const pCost = prod?.costPricePerPiece  || 0;

            // costAtSale — stored at time of sale
            const storedCost = item.costAtSale || 0;

            // Current product cost (fallback)
            let currentCost = 0;
            if (item.unit === 'Carton') currentCost = cCost || (pCost * ppc);
            else                         currentCost = pCost || (cCost / ppc);

            const revenue     = item.totalPrice || (item.quantity * item.priceAtSale);
            const cogsStored  = storedCost  * item.quantity;
            const cogsCurrent = currentCost * item.quantity;

            totalRevenue       += revenue;
            totalCOGS_stored   += cogsStored;
            totalCOGS_fallback += cogsCurrent;

            // Flag if costAtSale differs from current product cost
            const diff = Math.abs(storedCost - currentCost);
            const flag = diff > 0.01 ? ' ⚠️ DIFF' : '';

            console.log(
                `  ${name.substring(0,28).padEnd(28)} ${item.unit.padEnd(8)} ${String(item.quantity).padStart(6)} ${fmt(item.priceAtSale).padStart(11)} ${fmt(storedCost).padStart(12)} ${fmt(currentCost).padStart(12)} ${fmt(revenue).padStart(10)} ${fmt(cogsStored).padStart(14)} ${fmt(cogsCurrent).padStart(11)}${flag}`
            );
        });

        line();
        console.log(`  Sale Total Amount (stored)  : ${fmt(sale.totalAmount)}`);
        console.log(`  Sum of item revenues        : ${fmt(totalRevenue)}`);
    });

    // ── 3. PROFIT RECONCILIATION ─────────────────────────────
    dline();
    console.log('  📊  PROFIT RECONCILIATION  —  28 Jun 2026');
    dline();

    const purchaseTotal = purchases.reduce((a, p) => a + (p.grandTotal || 0), 0);
    const saleTotal     = sales.reduce((a, s)     => a + (s.totalAmount || 0), 0);

    console.log(`
  REVENUE (sum of sales)           : ${fmt(saleTotal)}

  ── Method A: Using Purchase Cost ─────────────────────────────
  Purchase Total (grandTotal)      : ${fmt(purchaseTotal)}
  Profit (A)                       : ${fmt(saleTotal - purchaseTotal)}

  ── Method B: Using costAtSale (SYSTEM METHOD) ────────────────
  COGS via costAtSale              : ${fmt(totalCOGS_stored)}
  Profit (B)  ← system uses this  : ${fmt(saleTotal - totalCOGS_stored)}

  ── Method C: Using Current Product Cost ──────────────────────
  COGS via current product cost    : ${fmt(totalCOGS_fallback)}
  Profit (C)                       : ${fmt(saleTotal - totalCOGS_fallback)}

  ──────────────────────────────────────────────────────────────
  DISCREPANCY (COGS_stored - Purchase) : ${fmt(totalCOGS_stored - purchaseTotal)}
  → This is the gap causing profit mismatch
`);

    // ── 4. ROOT CAUSE: per-item comparison ───────────────────
    dline();
    console.log('  🔍  ROOT CAUSE — Per Item Cost vs Purchase Cost');
    dline();
    console.log('  Compare costAtSale (what system uses for COGS) vs actual purchase cost\n');

    // Build a map of product → purchase cost from today's purchase
    const purchaseCostMap = {};
    purchases.forEach(pur => {
        pur.items.forEach(item => {
            const key = `${item.product?._id || item.product}__${item.unit}`;
            purchaseCostMap[key] = item.costAtPurchase;
        });
    });

    console.log(`  ${'Product'.padEnd(28)} ${'Unit'.padEnd(8)} ${'costAtSale'.padStart(12)} ${'costAtPurchase'.padStart(16)} ${'Qty'.padStart(6)} ${'CogsGap'.padStart(12)}`);
    line();

    sales.forEach(sale => {
        sale.items.forEach(item => {
            const prod = item.product;
            const name = prod?.name || 'Unknown';
            const key  = `${prod?._id || item.product}__${item.unit}`;
            const purchaseCost = purchaseCostMap[key] || 0;
            const gap = (item.costAtSale - purchaseCost) * item.quantity;

            console.log(
                `  ${name.substring(0,28).padEnd(28)} ${item.unit.padEnd(8)} ${fmt(item.costAtSale||0).padStart(12)} ${fmt(purchaseCost).padStart(16)} ${String(item.quantity).padStart(6)} ${fmt(gap).padStart(12)}${Math.abs(gap) > 0.01 ? ' ← GAP' : ''}`
            );
        });
    });

    dline();
    console.log(`
  💡  EXPLANATION:
  The system calculates COGS using 'costAtSale' stored on each sale item.
  If 'costAtSale' was captured from the product's stored cost at time of sale
  (not from today's purchase price), it may differ from your actual purchase cost.

  FIX OPTIONS:
  1. Update product cost BEFORE making a sale (so costAtSale captures new price)
  2. Or: use Purchase grandTotal directly for COGS when purchase & sale are same day
`);

    await mongoose.disconnect();
    console.log('✅  Done.\n');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
