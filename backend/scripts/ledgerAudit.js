/**
 * LEDGER AUDIT SCRIPT
 * Checks Customer & Supplier ledgers for discrepancies:
 *   1. Stored totals (on Customer/Supplier doc) vs actual Sales/Purchases/Payments
 *   2. Ledger running balance consistency
 *   3. Outstanding balance cross-check
 *
 * Run: node scripts/ledgerAudit.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Ledger   = require('../models/Ledger');
const Sale     = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Payment  = require('../models/Payment');
require('../models/SaleReturn');

const W    = 90;
const line = (c = '─') => console.log(c.repeat(W));
const dline= ()         => console.log('═'.repeat(W));
const r    = (n)        => Math.round((n || 0) * 100) / 100;
const fmt  = (n)        => `Rs. ${r(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const diff = (a, b)     => Math.abs(r(a) - r(b));
const OK   = '  ✅';
const ERR  = '  ❌ MISMATCH';
const WARN = '  ⚠️  WARN';

let totalIssues = 0;

function check(label, stored, computed, tolerance = 1) {
    const d = diff(stored, computed);
    if (d <= tolerance) {
        console.log(`${OK}  ${label.padEnd(40)} stored=${fmt(stored)}  computed=${fmt(computed)}`);
        return false;
    } else {
        console.log(`${ERR} ${label.padEnd(40)} stored=${fmt(stored)}  computed=${fmt(computed)}  gap=${fmt(d)}`);
        totalIssues++;
        return true;
    }
}

// ─── Check Ledger running balance sequence ────────────────────
async function checkRunningBalance(entityType, entityId, entityName) {
    const entries = await Ledger.find({ entityType, entityId }).sort({ date: 1, createdAt: 1 });
    if (entries.length === 0) return;

    let issues = 0;
    let runBal = 0;
    for (const e of entries) {
        runBal = r(runBal + e.debit - e.credit);
        const stored = r(e.balance);
        if (Math.abs(runBal - stored) > 1) {
            if (issues === 0) console.log(`\n  ⚠️  Running balance errors in ${entityName}:`);
            console.log(`     Entry ${e._id} | type=${e.transactionType} | date=${e.date?.toISOString().slice(0,10)} | computed=${fmt(runBal)} stored=${fmt(stored)}`);
            issues++;
            totalIssues++;
        }
    }
    if (issues === 0) {
        console.log(`  ✅  Running balance sequence OK (${entries.length} entries)`);
    }
}

// ════════════════════════════════════════════════════════════════════
//  CUSTOMER AUDIT
// ════════════════════════════════════════════════════════════════════
async function auditCustomers() {
    dline();
    console.log('  👤  CUSTOMER LEDGER AUDIT');
    dline();

    const customers = await Customer.find({}).sort({ name: 1 });
    console.log(`  Total customers: ${customers.length}\n`);

    for (const cust of customers) {
        line();
        console.log(`\n  📋 ${cust.name}  (${cust._id})`);
        line();

        // 1. Sales total from Sale collection (net of discount)
        const sales = await Sale.find({ customer: cust._id });
        const salesTotal = sales.reduce((a, s) => a + ((s.totalAmount || 0) - (s.discount || 0)), 0);

        // 2. Payments received from Payment collection
        const payments = await Payment.find({ customer: cust._id, type: 'received' });
        const paymentsTotal = payments.reduce((a, p) => a + (p.amount || 0), 0);

        // Also count receivedAmount from sale docs (some might be paid at sale time)
        const saleReceivedTotal = sales.reduce((a, s) => a + (s.receivedAmount || 0), 0);
        const totalReceived = paymentsTotal + saleReceivedTotal;

        // 3. Outstanding = totalSales - totalReceived
        const computedOutstanding = r(salesTotal - totalReceived);

        // 4. From ledger entries
        const ledgerEntries = await Ledger.find({ entityType: 'Customer', entityId: cust._id });
        const ledgerDebits  = ledgerEntries.reduce((a, e) => a + (e.debit  || 0), 0);
        const ledgerCredits = ledgerEntries.reduce((a, e) => a + (e.credit || 0), 0);
        const ledgerBalance = r(ledgerDebits - ledgerCredits);
        const lastEntry     = await Ledger.findOne({ entityType: 'Customer', entityId: cust._id }).sort({ date: -1, createdAt: -1 });

        console.log(`\n  Stored on Customer doc:`);
        console.log(`    totalSales            : ${fmt(cust.totalSales)}`);
        console.log(`    totalReceived         : ${fmt(cust.totalReceived)}`);
        console.log(`    outstandingReceivable : ${fmt(cust.outstandingReceivable)}`);
        console.log(`    openingBalance        : ${fmt(cust.openingBalance)}`);

        console.log(`\n  Computed from transactions:`);
        console.log(`    Sales (net)           : ${fmt(salesTotal)}  (${sales.length} sales)`);
        console.log(`    Payments received     : ${fmt(totalReceived)}  (payment docs + sale cash)`);
        console.log(`    Outstanding (calc)    : ${fmt(computedOutstanding)}`);

        console.log(`\n  Ledger entries: ${ledgerEntries.length}  |  Debits: ${fmt(ledgerDebits)}  Credits: ${fmt(ledgerCredits)}  Net: ${fmt(ledgerBalance)}`);
        console.log(`  Last ledger balance: ${lastEntry ? fmt(lastEntry.balance) : 'N/A'}`);

        console.log(`\n  Cross-checks:`);
        check('totalSales vs Sale docs',            cust.totalSales,            salesTotal);
        check('totalReceived vs Payment+SaleCash',  cust.totalReceived,         totalReceived);
        check('outstandingReceivable (stored vs calc)', cust.outstandingReceivable, computedOutstanding);
        check('Ledger net vs outstandingReceivable', cust.outstandingReceivable, ledgerBalance);
        if (lastEntry) check('Last ledger balance vs outstanding', cust.outstandingReceivable, lastEntry.balance);

        await checkRunningBalance('Customer', cust._id, cust.name);
        console.log('');
    }
}

// ════════════════════════════════════════════════════════════════════
//  SUPPLIER AUDIT
// ════════════════════════════════════════════════════════════════════
async function auditSuppliers() {
    dline();
    console.log('  🏪  SUPPLIER LEDGER AUDIT');
    dline();

    const suppliers = await Supplier.find({}).sort({ name: 1 });
    console.log(`  Total suppliers: ${suppliers.length}\n`);

    for (const sup of suppliers) {
        line();
        console.log(`\n  📋 ${sup.name}  (${sup._id})`);
        line();

        // 1. Purchase total
        const purchases = await Purchase.find({ supplier: sup._id });
        const purchasesTotal = purchases.reduce((a, p) => a + (p.grandTotal || 0), 0);

        // 2. Payments made — from Payment collection
        const payments = await Payment.find({ supplier: sup._id, type: 'made' });
        const paymentsTotal = payments.reduce((a, p) => a + (p.amount || 0), 0);

        // Also paidAmount on purchase docs
        const purchasePaidTotal = purchases.reduce((a, p) => a + (p.paidAmount || 0), 0);
        const totalPaid = paymentsTotal + purchasePaidTotal;

        // 3. Outstanding = purchases - paid
        const computedOutstanding = r(purchasesTotal - totalPaid);

        // 4. Ledger
        const ledgerEntries = await Ledger.find({ entityType: 'Supplier', entityId: sup._id });
        const ledgerDebits  = ledgerEntries.reduce((a, e) => a + (e.debit  || 0), 0);
        const ledgerCredits = ledgerEntries.reduce((a, e) => a + (e.credit || 0), 0);
        // Supplier: Credit = purchase (owes them), Debit = payment (reduces owe)
        const ledgerBalance = r(ledgerCredits - ledgerDebits);  // what we OWE = credits - debits
        const lastEntry     = await Ledger.findOne({ entityType: 'Supplier', entityId: sup._id }).sort({ date: -1, createdAt: -1 });

        console.log(`\n  Stored on Supplier doc:`);
        console.log(`    totalPurchases        : ${fmt(sup.totalPurchases)}`);
        console.log(`    totalPaid             : ${fmt(sup.totalPaid)}`);
        console.log(`    outstandingPayable    : ${fmt(sup.outstandingPayable)}`);
        console.log(`    openingBalance        : ${fmt(sup.openingBalance)}`);

        console.log(`\n  Computed from transactions:`);
        console.log(`    Purchases total       : ${fmt(purchasesTotal)}  (${purchases.length} purchases)`);
        console.log(`    Total paid            : ${fmt(totalPaid)}  (payment docs + purchase cash)`);
        console.log(`    Outstanding (calc)    : ${fmt(computedOutstanding)}`);

        console.log(`\n  Ledger entries: ${ledgerEntries.length}  |  Credits(owed): ${fmt(ledgerCredits)}  Debits(paid): ${fmt(ledgerDebits)}  Net owe: ${fmt(ledgerBalance)}`);
        console.log(`  Last ledger balance: ${lastEntry ? fmt(lastEntry.balance) : 'N/A'}`);

        console.log(`\n  Cross-checks:`);
        check('totalPurchases vs Purchase docs',       sup.totalPurchases,    purchasesTotal);
        check('totalPaid vs Payment+PurchaseCash',     sup.totalPaid,         totalPaid);
        check('outstandingPayable (stored vs calc)',   sup.outstandingPayable, computedOutstanding);
        check('Ledger net vs outstandingPayable',      sup.outstandingPayable, ledgerBalance);

        await checkRunningBalance('Supplier', sup._id, sup.name);
        console.log('');
    }
}

// ════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════
async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅  Connected to MongoDB\n');

    await auditCustomers();
    await auditSuppliers();

    dline();
    if (totalIssues === 0) {
        console.log(`\n  ✅  ALL CLEAR — No discrepancies found in any ledger!\n`);
    } else {
        console.log(`\n  ❌  AUDIT COMPLETE — ${totalIssues} issue(s) found. Review above.\n`);
    }
    dline();

    await mongoose.disconnect();
}

run().catch(err => { console.error('\n❌', err.message); process.exit(1); });
