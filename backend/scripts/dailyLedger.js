/**
 * ════════════════════════════════════════════════════════════
 *   DAILY FINANCIAL LEDGER  ─  15 Jun 2026  →  27 Jun 2026
 *   Har din ka: Opening → Payments IN → Payments OUT → Closing
 *   Cash in Hand  +  Cash in Bank  ─  Day by Day
 * ════════════════════════════════════════════════════════════
 *   Run:  node scripts/dailyLedger.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// ── Models ───────────────────────────────────────────────────
const Sale           = require('../models/Sale');
const Purchase       = require('../models/Purchase');
const Payment        = require('../models/Payment');
const Expense        = require('../models/Expense');
const CashAdjustment = require('../models/CashAdjustment');
const Customer       = require('../models/Customer');
const Supplier       = require('../models/Supplier');

// ── Date helpers ─────────────────────────────────────────────
const START_DATE = new Date('2026-06-15T00:00:00.000+05:00');
const END_DATE   = new Date('2026-06-27T23:59:59.999+05:00');

function dayStart(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function dayEnd(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}
function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function fmtDate(d) {
    return d.toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtAmt(n) {
    const v = Number(n || 0);
    return `Rs. ${v.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Print helpers ────────────────────────────────────────────
const W = 72;
const line   = (c = '─') => console.log(c.repeat(W));
const dline  = ()         => console.log('═'.repeat(W));
const header = (t)        => { dline(); console.log(`  ${t}`); dline(); };
const sub    = (t)        => { line(); console.log(`  ▶  ${t}`); line(); };

// ────────────────────────────────────────────────────────────
//  STEP 1 – Show collection names & sample docs
// ────────────────────────────────────────────────────────────
async function showCollectionInfo() {
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    const names = cols.map(c => c.name);

    header('DATABASE COLLECTIONS');
    names.forEach((n, i) => console.log(`  ${i + 1}. ${n}`));

    header('SAMPLE DOCUMENT FROM EACH COLLECTION');
    for (const name of names) {
        console.log(`\n  ── ${name.toUpperCase()} ──`);
        const doc = await db.collection(name).findOne({});
        if (doc) {
            // Print key → type so it's readable
            Object.entries(doc).forEach(([k, v]) => {
                const type = Array.isArray(v) ? `Array(${v.length})` : (v instanceof Date ? 'Date' : typeof v);
                const preview = v instanceof Date ? v.toISOString()
                    : Array.isArray(v) ? JSON.stringify(v[0] || {}).substring(0, 60) + '…'
                    : String(v).substring(0, 60);
                console.log(`    ${k.padEnd(22)} ${type.padEnd(12)} ${preview}`);
            });
        } else {
            console.log('    (empty collection)');
        }
    }
}

// ────────────────────────────────────────────────────────────
//  STEP 2 – Calculate cumulative cash/bank up to a given date
// ────────────────────────────────────────────────────────────
const BANK_METHODS = ['Bank', 'Bank Transfer', 'Cheque'];
const CASH_METHODS = ['Cash'];

async function calcBalanceUpTo(upTo) {
    const filter = { $lt: upTo };

    // --- CASH INFLOWS ---
    // 1. Cash sales (receivedAmount on cash sales)
    const cashSalesIn = await Sale.aggregate([
        { $match: { saleDate: filter, paymentType: 'Cash' } },
        { $group: { _id: null, total: { $sum: '$receivedAmount' } } }
    ]);
    // 2. Customer payments via Cash
    const custCashIn = await Payment.aggregate([
        { $match: { paymentDate: filter, entityType: 'Customer', paymentMethod: { $in: CASH_METHODS } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    // 3. Cash adjustments (Cash account)
    const cashAdj = await CashAdjustment.aggregate([
        { $match: { adjustmentDate: filter, accountType: 'Cash' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // --- CASH OUTFLOWS ---
    // 4. Cash purchases paid
    const cashPurchOut = await Purchase.aggregate([
        { $match: { purchaseDate: filter, paymentType: 'Cash' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    // 5. Supplier payments via Cash
    const suppCashOut = await Payment.aggregate([
        { $match: { paymentDate: filter, entityType: 'Supplier', paymentMethod: { $in: CASH_METHODS } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    // 6. Cash expenses
    const cashExpOut = await Expense.aggregate([
        { $match: { expenseDate: filter, paymentMethod: 'Cash' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // --- BANK INFLOWS ---
    const custBankIn = await Payment.aggregate([
        { $match: { paymentDate: filter, entityType: 'Customer', paymentMethod: { $in: BANK_METHODS } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const bankAdj = await CashAdjustment.aggregate([
        { $match: { adjustmentDate: filter, accountType: 'Bank' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // --- BANK OUTFLOWS ---
    const suppBankOut = await Payment.aggregate([
        { $match: { paymentDate: filter, entityType: 'Supplier', paymentMethod: { $in: BANK_METHODS } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const bankExpOut = await Expense.aggregate([
        { $match: { expenseDate: filter, paymentMethod: { $in: ['Bank Transfer', 'Cheque'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const g = (arr) => arr[0]?.total || 0;

    const cashInHand = (g(cashSalesIn) + g(custCashIn) + g(cashAdj))
                     - (g(cashPurchOut) + g(suppCashOut) + g(cashExpOut));

    const cashInBank = (g(custBankIn) + g(bankAdj))
                     - (g(suppBankOut) + g(bankExpOut));

    return { cashInHand, cashInBank };
}

// ────────────────────────────────────────────────────────────
//  STEP 3 – Get all transactions for a single day
// ────────────────────────────────────────────────────────────
async function getDayTransactions(dayS, dayE) {
    const dateFilter = { $gte: dayS, $lte: dayE };

    // ── Inflows (money coming IN) ────────────────────────────

    // Cash sales
    const cashSales = await Sale.find({
        saleDate    : dateFilter,
        paymentType : 'Cash'
    }).populate('customer', 'name');

    // Credit sale partial payments (receivedAmount > 0)
    const creditSalesWithReceipt = await Sale.find({
        saleDate      : dateFilter,
        paymentType   : 'Credit',
        receivedAmount: { $gt: 0 }
    }).populate('customer', 'name');

    // Customer payments received
    const custPayments = await Payment.find({
        paymentDate : dateFilter,
        entityType  : 'Customer'
    }).populate('entityId', 'name phone');

    // ── Outflows (money going OUT) ───────────────────────────

    // Cash purchases
    const cashPurchases = await Purchase.find({
        purchaseDate: dateFilter,
        paidAmount  : { $gt: 0 }
    }).populate('supplier', 'name');

    // Supplier payments made
    const suppPayments = await Payment.find({
        paymentDate : dateFilter,
        entityType  : 'Supplier'
    }).populate('entityId', 'name phone');

    // Expenses
    const expenses = await Expense.find({ expenseDate: dateFilter });

    // Cash adjustments
    const adjustments = await CashAdjustment.find({ adjustmentDate: dateFilter });

    // ── Net calculation for the day ──────────────────────────
    let cashIn = 0, bankIn = 0, cashOut = 0, bankOut = 0;

    cashSales.forEach(s           => { cashIn  += s.receivedAmount || 0; });
    creditSalesWithReceipt.forEach(s=> { cashIn += s.receivedAmount || 0; });

    custPayments.forEach(p => {
        if (CASH_METHODS.includes(p.paymentMethod)) cashIn += p.amount || 0;
        else if (BANK_METHODS.includes(p.paymentMethod)) bankIn += p.amount || 0;
    });

    cashPurchases.forEach(p => {
        if (p.paymentType === 'Cash') cashOut += p.paidAmount || 0;
        else bankOut += p.paidAmount || 0;
    });

    suppPayments.forEach(p => {
        if (CASH_METHODS.includes(p.paymentMethod)) cashOut += p.amount || 0;
        else if (BANK_METHODS.includes(p.paymentMethod)) bankOut += p.amount || 0;
    });

    expenses.forEach(e => {
        if (e.paymentMethod === 'Cash') cashOut += e.amount || 0;
        else bankOut += e.amount || 0;
    });

    adjustments.forEach(a => {
        if (a.accountType === 'Cash') cashIn += a.amount || 0;
        else bankIn += a.amount || 0;
    });

    return {
        cashSales,
        creditSalesWithReceipt,
        custPayments,
        cashPurchases,
        suppPayments,
        expenses,
        adjustments,
        cashIn,
        bankIn,
        cashOut,
        bankOut
    };
}

// ────────────────────────────────────────────────────────────
//  STEP 4 – Print one day's report
// ────────────────────────────────────────────────────────────
function printDayReport(date, opening, txn) {
    const closingCash = opening.cashInHand + txn.cashIn  - txn.cashOut;
    const closingBank = opening.cashInBank + txn.bankIn  - txn.bankOut;

    dline();
    console.log(`  📅  ${fmtDate(date).toUpperCase()}`);
    dline();

    // Opening balances
    console.log(`\n  ┌─────────────────────────────────────────────────┐`);
    console.log(`  │  OPENING CASH IN HAND  :  ${fmtAmt(opening.cashInHand).padEnd(22)} │`);
    console.log(`  │  OPENING CASH IN BANK  :  ${fmtAmt(opening.cashInBank).padEnd(22)} │`);
    console.log(`  └─────────────────────────────────────────────────┘`);

    // ── MONEY IN ────────────────────────────────────────────
    sub('MONEY IN  ↓  (Payments Received)');

    let hasIn = false;

    // Cash Sales
    txn.cashSales.forEach(s => {
        const who = s.customer ? s.customer.name : (s.customerName || 'Walk-in');
        console.log(`  [CASH SALE]  From: ${who.padEnd(22)} ${fmtAmt(s.receivedAmount).padStart(14)}  [CASH]`);
        hasIn = true;
    });

    // Credit sales with advance
    txn.creditSalesWithReceipt.forEach(s => {
        const who = s.customer ? s.customer.name : (s.customerName || 'Walk-in');
        console.log(`  [CREDIT SALE-ADV]  From: ${who.padEnd(18)} ${fmtAmt(s.receivedAmount).padStart(14)}  [CASH]`);
        hasIn = true;
    });

    // Customer payments
    txn.custPayments.forEach(p => {
        const who = p.entityId ? p.entityId.name : 'Unknown Customer';
        const tag = BANK_METHODS.includes(p.paymentMethod) ? '[BANK]' : '[CASH]';
        const note = p.note ? ` — ${p.note}` : '';
        console.log(`  [CUSTOMER PAY]  From: ${who.padEnd(18)} ${fmtAmt(p.amount).padStart(14)}  ${p.paymentMethod.padEnd(14)} ${tag}${note}`);
        hasIn = true;
    });

    // Cash adjustments (inflows)
    txn.adjustments.forEach(a => {
        const tag = a.accountType === 'Bank' ? '[BANK]' : '[CASH]';
        console.log(`  [ADJ]  ${(a.reason || 'Adjustment').padEnd(30)} ${fmtAmt(a.amount).padStart(14)}  ${a.accountType.padEnd(14)} ${tag}`);
        hasIn = true;
    });

    if (!hasIn) console.log('  (No payments received today)');

    console.log(`\n  ${''.padEnd(46)} ──────────────────`);
    console.log(`  Cash Received Today  :${fmtAmt(txn.cashIn).padStart(20)}  [CASH]`);
    console.log(`  Bank Received Today  :${fmtAmt(txn.bankIn).padStart(20)}  [BANK]`);

    // ── MONEY OUT ────────────────────────────────────────────
    sub('MONEY OUT  ↑  (Payments Made)');

    let hasOut = false;

    // Purchases paid
    txn.cashPurchases.filter(p => p.paidAmount > 0).forEach(p => {
        const who = p.supplier ? p.supplier.name : 'Unknown Supplier';
        const tag = p.paymentType === 'Cash' ? '[CASH]' : '[BANK]';
        console.log(`  [PURCHASE]  To: ${who.padEnd(22)} ${fmtAmt(p.paidAmount).padStart(14)}  ${p.paymentType.padEnd(14)} ${tag}`);
        hasOut = true;
    });

    // Supplier payments
    txn.suppPayments.forEach(p => {
        const who = p.entityId ? p.entityId.name : 'Unknown Supplier';
        const tag = BANK_METHODS.includes(p.paymentMethod) ? '[BANK]' : '[CASH]';
        const note = p.note ? ` — ${p.note}` : '';
        console.log(`  [SUPP PAY]  To: ${who.padEnd(22)} ${fmtAmt(p.amount).padStart(14)}  ${p.paymentMethod.padEnd(14)} ${tag}${note}`);
        hasOut = true;
    });

    // Expenses
    txn.expenses.forEach(e => {
        const tag = e.paymentMethod === 'Cash' ? '[CASH]' : '[BANK]';
        const desc = (e.description || e.category || 'Expense').substring(0, 30);
        console.log(`  [EXPENSE]  ${desc.padEnd(27)} ${fmtAmt(e.amount).padStart(14)}  ${(e.paymentMethod || 'Cash').padEnd(14)} ${tag}`);
        hasOut = true;
    });

    if (!hasOut) console.log('  (No payments made today)');

    console.log(`\n  ${''.padEnd(46)} ──────────────────`);
    console.log(`  Cash Paid Out Today  :${fmtAmt(txn.cashOut).padStart(20)}  [CASH]`);
    console.log(`  Bank Paid Out Today  :${fmtAmt(txn.bankOut).padStart(20)}  [BANK]`);

    // ── Closing balances ────────────────────────────────────
    const netCash = txn.cashIn - txn.cashOut;
    const netBank = txn.bankIn - txn.bankOut;

    console.log(`\n  ┌─────────────────────────────────────────────────┐`);
    console.log(`  │  NET CASH FLOW   :  ${(netCash >= 0 ? '+' : '') + fmtAmt(netCash) + (netCash >= 0 ? ' ✅' : ' ❌')}`);
    console.log(`  │  NET BANK FLOW   :  ${(netBank >= 0 ? '+' : '') + fmtAmt(netBank) + (netBank >= 0 ? ' ✅' : ' ❌')}`);
    console.log(`  ├─────────────────────────────────────────────────┤`);
    console.log(`  │  CLOSING CASH IN HAND  :  ${fmtAmt(closingCash).padEnd(22)} │`);
    console.log(`  │  CLOSING CASH IN BANK  :  ${fmtAmt(closingBank).padEnd(22)} │`);
    console.log(`  └─────────────────────────────────────────────────┘\n`);

    return { cashInHand: closingCash, cashInBank: closingBank };
}

// ────────────────────────────────────────────────────────────
//  MAIN
// ────────────────────────────────────────────────────────────
async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅  Connected to MongoDB Atlas\n');

    // ── Step 1: Collection info ──────────────────────────────
    await showCollectionInfo();

    // ── Step 2: Grand opening balance (before June 15) ──────
    header('CALCULATING OPENING BALANCE AS OF 15-JUN-2026 00:00');
    const opening15 = await calcBalanceUpTo(new Date('2026-06-15T00:00:00.000+05:00'));
    console.log(`\n  All-time Cash In Hand up to 14-Jun midnight : ${fmtAmt(opening15.cashInHand)}`);
    console.log(`  All-time Cash In Bank up to 14-Jun midnight : ${fmtAmt(opening15.cashInBank)}`);
    console.log(`\n  This is the OPENING BALANCE for 15-Jun-2026\n`);

    // ── Step 3: Day-by-day loop ──────────────────────────────
    header('DAY-BY-DAY LEDGER  ─  15 Jun 2026  →  27 Jun 2026');

    let balance = { ...opening15 };
    const summaryRows = [];

    for (let d = new Date(START_DATE); d <= END_DATE; d = addDays(d, 1)) {
        const ds  = dayStart(d);
        const de  = dayEnd(d);
        const txn = await getDayTransactions(ds, de);

        const closing = printDayReport(d, balance, txn);

        summaryRows.push({
            date        : fmtDate(d),
            openCash    : balance.cashInHand,
            openBank    : balance.cashInBank,
            cashIn      : txn.cashIn,
            bankIn      : txn.bankIn,
            cashOut     : txn.cashOut,
            bankOut     : txn.bankOut,
            closeCash   : closing.cashInHand,
            closeBank   : closing.cashInBank
        });

        balance = closing;
    }

    // ── Step 4: Master summary table ─────────────────────────
    header('📊  MASTER SUMMARY  ─  ALL 13 DAYS AT A GLANCE');

    const C = { d:16, oc:14, ob:14, ci:12, bi:12, co:12, bo:12, cc:14, cb:14 };
    const hdr = [
        'Date'.padEnd(C.d),
        'Open Cash'.padStart(C.oc),
        'Open Bank'.padStart(C.ob),
        'Cash IN'.padStart(C.ci),
        'Bank IN'.padStart(C.bi),
        'Cash OUT'.padStart(C.co),
        'Bank OUT'.padStart(C.bo),
        'Close Cash'.padStart(C.cc),
        'Close Bank'.padStart(C.cb),
    ].join('  ');
    console.log('\n  ' + hdr);
    line();

    summaryRows.forEach(r => {
        const row = [
            r.date.replace(/, 2026/,'').padEnd(C.d),
            fmtAmt(r.openCash).padStart(C.oc),
            fmtAmt(r.openBank).padStart(C.ob),
            fmtAmt(r.cashIn).padStart(C.ci),
            fmtAmt(r.bankIn).padStart(C.bi),
            fmtAmt(r.cashOut).padStart(C.co),
            fmtAmt(r.bankOut).padStart(C.bo),
            fmtAmt(r.closeCash).padStart(C.cc),
            fmtAmt(r.closeBank).padStart(C.cb),
        ].join('  ');
        console.log('  ' + row);
    });

    line();
    const last = summaryRows[summaryRows.length - 1];
    console.log(`\n  FINAL CLOSING (27-Jun-2026 end of day):`);
    console.log(`  ╔══════════════════════════════════════════╗`);
    console.log(`  ║  CASH IN HAND  :  ${fmtAmt(last.closeCash).padEnd(23)} ║`);
    console.log(`  ║  CASH IN BANK  :  ${fmtAmt(last.closeBank).padEnd(23)} ║`);
    console.log(`  ╚══════════════════════════════════════════╝\n`);

    await mongoose.disconnect();
    console.log('✅  Done.\n');
}

run().catch(err => {
    console.error('\n❌  Error:', err);
    process.exit(1);
});
