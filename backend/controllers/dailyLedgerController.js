/**
 * Daily Ledger Controller
 * GET /api/reports/daily-ledger?from=2026-06-15&to=2026-06-27
 * Returns day-by-day cash in hand, cash in bank, payments in/out
 */

const Sale           = require('../models/Sale');
const Purchase       = require('../models/Purchase');
const Payment        = require('../models/Payment');
const Expense        = require('../models/Expense');
const CashAdjustment = require('../models/CashAdjustment');

const BANK_METHODS = ['Bank', 'Bank Transfer', 'Cheque'];
const CASH_METHODS = ['Cash'];

// ── helpers ──────────────────────────────────────────────────
function dayStart(d) {
    const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
function dayEnd(d) {
    const x = new Date(d); x.setHours(23, 59, 59, 999); return x;
}
function addDays(d, n) {
    const x = new Date(d); x.setDate(x.getDate() + n); return x;
}
const g = (arr) => arr[0]?.total || 0;

// Cumulative balance up to (not including) a given date
async function calcBalanceUpTo(upTo) {
    const f = { $lt: upTo };

    const [cashSalesIn, custCashIn, cashAdj,
           cashPurchOut, suppCashOut, cashExpOut,
           custBankIn, bankAdj, suppBankOut, bankExpOut] = await Promise.all([
        Sale.aggregate([{ $match: { saleDate: f, paymentType: 'Cash' } },           { $group: { _id: null, total: { $sum: '$receivedAmount' } } }]),
        Payment.aggregate([{ $match: { paymentDate: f, entityType: 'Customer', paymentMethod: { $in: CASH_METHODS } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        CashAdjustment.aggregate([{ $match: { adjustmentDate: f, accountType: 'Cash' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Purchase.aggregate([{ $match: { purchaseDate: f, paymentType: 'Cash' } },    { $group: { _id: null, total: { $sum: '$paidAmount' } } }]),
        Payment.aggregate([{ $match: { paymentDate: f, entityType: 'Supplier', paymentMethod: { $in: CASH_METHODS } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Expense.aggregate([{ $match: { expenseDate: f, paymentMethod: 'Cash' } },    { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Payment.aggregate([{ $match: { paymentDate: f, entityType: 'Customer', paymentMethod: { $in: BANK_METHODS } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        CashAdjustment.aggregate([{ $match: { adjustmentDate: f, accountType: 'Bank' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Payment.aggregate([{ $match: { paymentDate: f, entityType: 'Supplier', paymentMethod: { $in: BANK_METHODS } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Expense.aggregate([{ $match: { expenseDate: f, paymentMethod: { $in: ['Bank Transfer', 'Cheque'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    return {
        cashInHand: (g(cashSalesIn) + g(custCashIn) + g(cashAdj)) - (g(cashPurchOut) + g(suppCashOut) + g(cashExpOut)),
        cashInBank: (g(custBankIn) + g(bankAdj)) - (g(suppBankOut) + g(bankExpOut)),
    };
}

// All transactions for a single day
async function getDayTransactions(dayS, dayE) {
    const df = { $gte: dayS, $lte: dayE };

    const [cashSales, creditSalesAdv, custPayments,
           purchases, suppPayments, expenses, adjustments] = await Promise.all([
        Sale.find({ saleDate: df, paymentType: 'Cash' }).populate('customer', 'name'),
        Sale.find({ saleDate: df, paymentType: 'Credit', receivedAmount: { $gt: 0 } }).populate('customer', 'name'),
        Payment.find({ paymentDate: df, entityType: 'Customer' }).populate('entityId', 'name phone'),
        Purchase.find({ purchaseDate: df, paidAmount: { $gt: 0 } }).populate('supplier', 'name'),
        Payment.find({ paymentDate: df, entityType: 'Supplier' }).populate('entityId', 'name phone'),
        Expense.find({ expenseDate: df }),
        CashAdjustment.find({ adjustmentDate: df }),
    ]);

    // Build money-in list
    const moneyIn = [];
    cashSales.forEach(s => {
        if ((s.receivedAmount || 0) > 0)
            moneyIn.push({ label: 'Cash Sale', from: s.customer?.name || s.customerName || 'Walk-in', amount: s.receivedAmount, method: 'Cash', note: '' });
    });
    creditSalesAdv.forEach(s => {
        if ((s.receivedAmount || 0) > 0)
            moneyIn.push({ label: 'Credit Sale Advance', from: s.customer?.name || s.customerName || 'Walk-in', amount: s.receivedAmount, method: 'Cash', note: '' });
    });
    custPayments.forEach(p => {
        moneyIn.push({ label: 'Customer Payment', from: p.entityId?.name || 'Unknown', amount: p.amount, method: p.paymentMethod, note: p.note || '' });
    });
    adjustments.forEach(a => {
        moneyIn.push({ label: 'Cash Adjustment', from: 'Manual', amount: a.amount, method: a.accountType, note: a.reason || '' });
    });

    // Build money-out list
    const moneyOut = [];
    purchases.forEach(p => {
        if ((p.paidAmount || 0) > 0)
            moneyOut.push({ label: 'Purchase Payment', to: p.supplier?.name || 'Unknown', amount: p.paidAmount, method: p.paymentType, note: p.referenceId || '' });
    });
    suppPayments.forEach(p => {
        moneyOut.push({ label: 'Supplier Payment', to: p.entityId?.name || 'Unknown', amount: p.amount, method: p.paymentMethod, note: p.note || '' });
    });
    expenses.forEach(e => {
        moneyOut.push({ label: 'Expense', to: e.category || 'General', amount: e.amount, method: e.paymentMethod || 'Cash', note: e.description || '' });
    });

    // Compute totals
    let cashIn = 0, bankIn = 0, cashOut = 0, bankOut = 0;
    moneyIn.forEach(t => {
        if (BANK_METHODS.includes(t.method)) bankIn += t.amount || 0;
        else cashIn += t.amount || 0;
    });
    moneyOut.forEach(t => {
        if (BANK_METHODS.includes(t.method)) bankOut += t.amount || 0;
        else cashOut += t.amount || 0;
    });

    return { moneyIn, moneyOut, cashIn, bankIn, cashOut, bankOut };
}

// ── Main controller ───────────────────────────────────────────
exports.getDailyLedger = async (req, res) => {
    try {
        const fromStr = req.query.from || '2026-06-15';
        const toStr   = req.query.to   || new Date().toISOString().slice(0, 10);

        const fromDate = new Date(fromStr + 'T00:00:00.000+05:00');
        const toDate   = new Date(toStr   + 'T23:59:59.999+05:00');

        // Opening balance for first day
        let balance = await calcBalanceUpTo(fromDate);
        const days = [];

        for (let d = new Date(fromDate); d <= toDate; d = addDays(d, 1)) {
            const ds  = dayStart(d);
            const de  = dayEnd(d);
            const txn = await getDayTransactions(ds, de);

            const closingCash = balance.cashInHand + txn.cashIn  - txn.cashOut;
            const closingBank = balance.cashInBank + txn.bankIn  - txn.bankOut;

            days.push({
                date         : new Date(d).toISOString().slice(0, 10),
                openingCash  : balance.cashInHand,
                openingBank  : balance.cashInBank,
                moneyIn      : txn.moneyIn,
                moneyOut     : txn.moneyOut,
                totalCashIn  : txn.cashIn,
                totalBankIn  : txn.bankIn,
                totalCashOut : txn.cashOut,
                totalBankOut : txn.bankOut,
                closingCash,
                closingBank,
            });

            balance = { cashInHand: closingCash, cashInBank: closingBank };
        }

        res.json({ from: fromStr, to: toStr, days });
    } catch (err) {
        console.error('dailyLedger error:', err);
        res.status(500).json({ message: err.message });
    }
};
