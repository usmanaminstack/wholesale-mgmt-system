/**
 * ============================================================
 *  FINANCIAL SNAPSHOT SCRIPT
 *  From Date : 15-Jun-2026  →  Today (27-Jun-2026)
 *  Purpose   : Full data dump + Cash-In-Hand + Payable Analysis
 * ============================================================
 *
 *  Run:  node scripts/financialSnapshot.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// ── Models ──────────────────────────────────────────────────
const Sale           = require('../models/Sale');
const Purchase       = require('../models/Purchase');
const Payment        = require('../models/Payment');
const Expense        = require('../models/Expense');
const CashAdjustment = require('../models/CashAdjustment');
const Customer       = require('../models/Customer');
const Supplier       = require('../models/Supplier');
const Ledger         = require('../models/Ledger');

// ── Config ───────────────────────────────────────────────────
const FROM_DATE = new Date('2026-06-15T00:00:00.000+05:00');  // 15 Jun 2026 midnight PKT
const TO_DATE   = new Date();                                   // Now

// ── Helpers ──────────────────────────────────────────────────
const fmt  = (n)    => `Rs. ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;
const fmtD = (d)    => d ? new Date(d).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A';
const sep  = (t)    => { console.log('\n' + '─'.repeat(70)); console.log(`  ${t}`); console.log('─'.repeat(70)); };
const line = ()     => console.log('─'.repeat(70));

// ─────────────────────────────────────────────────────────────
async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅  Connected to MongoDB Atlas');
    console.log(`📅  Date Range : ${fmtD(FROM_DATE)}  →  ${fmtD(TO_DATE)}\n`);

    const dateFilter    = { $gte: FROM_DATE, $lte: TO_DATE };

    // =========================================================
    //  1. SALES  (from 15-Jun)
    // =========================================================
    sep('1. SALES (from 15-Jun-2026)');
    const sales = await Sale.find({ saleDate: dateFilter })
        .populate('customer', 'name phone')
        .sort({ saleDate: 1 });

    let totalSales = 0, totalSalesReceived = 0, totalSalesBalance = 0;
    let cashSales = 0, creditSales = 0;

    if (sales.length === 0) {
        console.log('  No sales found in this period.');
    } else {
        console.log(`  ${'Date'.padEnd(14)} ${'Customer'.padEnd(20)} ${'Type'.padEnd(8)} ${'Total'.padStart(12)} ${'Received'.padStart(12)} ${'Balance'.padStart(12)}`);
        line();
        sales.forEach(s => {
            const cust = s.customer ? s.customer.name : (s.customerName || 'Walk-in');
            console.log(
                `  ${fmtD(s.saleDate).padEnd(14)} ${cust.padEnd(20)} ${s.paymentType.padEnd(8)} ${String(s.totalAmount).padStart(12)} ${String(s.receivedAmount).padStart(12)} ${String(s.balanceAmount).padStart(12)}`
            );
            totalSales         += s.totalAmount      || 0;
            totalSalesReceived += s.receivedAmount   || 0;
            totalSalesBalance  += s.balanceAmount    || 0;
            if (s.paymentType === 'Cash')   cashSales   += s.receivedAmount || 0;
            if (s.paymentType === 'Credit') creditSales += s.totalAmount    || 0;
        });
        line();
        console.log(`  ${'TOTAL'.padEnd(44)} ${String(totalSales).padStart(12)} ${String(totalSalesReceived).padStart(12)} ${String(totalSalesBalance).padStart(12)}`);
        console.log(`\n  Cash Sales Received : ${fmt(cashSales)}`);
        console.log(`  Credit Sales (total): ${fmt(creditSales)}`);
        console.log(`  Pending Receivable  : ${fmt(totalSalesBalance)}`);
    }

    // =========================================================
    //  2. CUSTOMER PAYMENTS RECEIVED (from 15-Jun)
    // =========================================================
    sep('2. CUSTOMER PAYMENTS RECEIVED (from 15-Jun-2026)');
    const custPayments = await Payment.find({
        entityType  : 'Customer',
        paymentDate : dateFilter
    }).populate('entityId', 'name phone').sort({ paymentDate: 1 });

    let totalCustPayReceived = 0;
    let cashCustPayReceived  = 0;

    if (custPayments.length === 0) {
        console.log('  No customer payments found in this period.');
    } else {
        console.log(`  ${'Date'.padEnd(14)} ${'Customer'.padEnd(22)} ${'Method'.padEnd(14)} ${'Amount'.padStart(12)}`);
        line();
        custPayments.forEach(p => {
            const name = p.entityId ? p.entityId.name : 'Unknown';
            console.log(`  ${fmtD(p.paymentDate).padEnd(14)} ${name.padEnd(22)} ${p.paymentMethod.padEnd(14)} ${String(p.amount).padStart(12)}`);
            totalCustPayReceived += p.amount || 0;
            if (p.paymentMethod === 'Cash') cashCustPayReceived += p.amount || 0;
        });
        line();
        console.log(`  Total Received from Customers : ${fmt(totalCustPayReceived)}`);
        console.log(`  Of which Cash                 : ${fmt(cashCustPayReceived)}`);
    }

    // =========================================================
    //  3. PURCHASES (from 15-Jun)
    // =========================================================
    sep('3. PURCHASES (from 15-Jun-2026)');
    const purchases = await Purchase.find({ purchaseDate: dateFilter })
        .populate('supplier', 'name phone')
        .sort({ purchaseDate: 1 });

    let totalPurchases = 0, totalPurchasesPaid = 0, totalPurchasesBalance = 0;
    let cashPurchases  = 0;

    if (purchases.length === 0) {
        console.log('  No purchases found in this period.');
    } else {
        console.log(`  ${'Date'.padEnd(14)} ${'Supplier'.padEnd(22)} ${'Type'.padEnd(8)} ${'Total'.padStart(12)} ${'Paid'.padStart(12)} ${'Balance'.padStart(12)}`);
        line();
        purchases.forEach(p => {
            const sup = p.supplier ? p.supplier.name : 'Unknown';
            console.log(
                `  ${fmtD(p.purchaseDate).padEnd(14)} ${sup.padEnd(22)} ${p.paymentType.padEnd(8)} ${String(p.grandTotal).padStart(12)} ${String(p.paidAmount).padStart(12)} ${String(p.balanceAmount).padStart(12)}`
            );
            totalPurchases        += p.grandTotal    || 0;
            totalPurchasesPaid    += p.paidAmount    || 0;
            totalPurchasesBalance += p.balanceAmount || 0;
            if (p.paymentType === 'Cash') cashPurchases += p.paidAmount || 0;
        });
        line();
        console.log(`  ${'TOTAL'.padEnd(46)} ${String(totalPurchases).padStart(12)} ${String(totalPurchasesPaid).padStart(12)} ${String(totalPurchasesBalance).padStart(12)}`);
        console.log(`\n  Cash Paid for Purchases : ${fmt(cashPurchases)}`);
        console.log(`  Pending Payable         : ${fmt(totalPurchasesBalance)}`);
    }

    // =========================================================
    //  4. SUPPLIER PAYMENTS MADE (from 15-Jun)
    // =========================================================
    sep('4. SUPPLIER PAYMENTS MADE (from 15-Jun-2026)');
    const suppPayments = await Payment.find({
        entityType  : 'Supplier',
        paymentDate : dateFilter
    }).populate('entityId', 'name phone').sort({ paymentDate: 1 });

    let totalSuppPaid     = 0;
    let cashSuppPaid      = 0;

    if (suppPayments.length === 0) {
        console.log('  No supplier payments found in this period.');
    } else {
        console.log(`  ${'Date'.padEnd(14)} ${'Supplier'.padEnd(22)} ${'Method'.padEnd(14)} ${'Amount'.padStart(12)}`);
        line();
        suppPayments.forEach(p => {
            const name = p.entityId ? p.entityId.name : 'Unknown';
            console.log(`  ${fmtD(p.paymentDate).padEnd(14)} ${name.padEnd(22)} ${p.paymentMethod.padEnd(14)} ${String(p.amount).padStart(12)}`);
            totalSuppPaid += p.amount || 0;
            if (p.paymentMethod === 'Cash') cashSuppPaid += p.amount || 0;
        });
        line();
        console.log(`  Total Paid to Suppliers : ${fmt(totalSuppPaid)}`);
        console.log(`  Of which Cash           : ${fmt(cashSuppPaid)}`);
    }

    // =========================================================
    //  5. EXPENSES (from 15-Jun)
    // =========================================================
    sep('5. EXPENSES (from 15-Jun-2026)');
    const expenses = await Expense.find({ expenseDate: dateFilter }).sort({ expenseDate: 1 });

    let totalExpenses     = 0;
    let cashExpenses      = 0;

    if (expenses.length === 0) {
        console.log('  No expenses found in this period.');
    } else {
        console.log(`  ${'Date'.padEnd(14)} ${'Category'.padEnd(20)} ${'Method'.padEnd(16)} ${'Amount'.padStart(12)}`);
        line();
        expenses.forEach(e => {
            console.log(`  ${fmtD(e.expenseDate).padEnd(14)} ${(e.category||'').padEnd(20)} ${(e.paymentMethod||'Cash').padEnd(16)} ${String(e.amount).padStart(12)}`);
            totalExpenses += e.amount || 0;
            if ((e.paymentMethod || 'Cash') === 'Cash') cashExpenses += e.amount || 0;
        });
        line();
        console.log(`  Total Expenses      : ${fmt(totalExpenses)}`);
        console.log(`  Cash Expenses       : ${fmt(cashExpenses)}`);
    }

    // =========================================================
    //  6. CASH ADJUSTMENTS (from 15-Jun)
    // =========================================================
    sep('6. CASH ADJUSTMENTS (from 15-Jun-2026)');
    const adjustments = await CashAdjustment.find({ adjustmentDate: dateFilter }).sort({ adjustmentDate: 1 });

    let totalCashAdj = 0;

    if (adjustments.length === 0) {
        console.log('  No cash adjustments found in this period.');
    } else {
        console.log(`  ${'Date'.padEnd(14)} ${'Type'.padEnd(8)} ${'Reason'.padEnd(30)} ${'Amount'.padStart(12)}`);
        line();
        adjustments.forEach(a => {
            console.log(`  ${fmtD(a.adjustmentDate).padEnd(14)} ${a.accountType.padEnd(8)} ${(a.reason||'').substring(0,30).padEnd(30)} ${String(a.amount).padStart(12)}`);
            totalCashAdj += a.amount || 0;
        });
        line();
        console.log(`  Net Cash Adjustments : ${fmt(totalCashAdj)}`);
    }

    // =========================================================
    //  7. OUTSTANDING RECEIVABLES (ALL customers)
    // =========================================================
    sep('7. ALL CUSTOMERS — OUTSTANDING RECEIVABLES');
    const customers = await Customer.find({ outstandingReceivable: { $gt: 0 } }).sort({ outstandingReceivable: -1 });

    let totalReceivable = 0;
    if (customers.length === 0) {
        console.log('  No outstanding receivables.');
    } else {
        console.log(`  ${'Customer'.padEnd(25)} ${'Phone'.padEnd(15)} ${'Outstanding'.padStart(15)}`);
        line();
        customers.forEach(c => {
            console.log(`  ${c.name.padEnd(25)} ${(c.phone||'').padEnd(15)} ${fmt(c.outstandingReceivable).padStart(15)}`);
            totalReceivable += c.outstandingReceivable || 0;
        });
        line();
        console.log(`  TOTAL RECEIVABLE FROM CUSTOMERS : ${fmt(totalReceivable)}`);
    }

    // =========================================================
    //  8. OUTSTANDING PAYABLES (ALL suppliers)
    // =========================================================
    sep('8. ALL SUPPLIERS — OUTSTANDING PAYABLES');
    const suppliers = await Supplier.find({ outstandingPayable: { $gt: 0 } }).sort({ outstandingPayable: -1 });

    let totalPayable = 0;
    if (suppliers.length === 0) {
        console.log('  No outstanding payables.');
    } else {
        console.log(`  ${'Supplier'.padEnd(25)} ${'Phone'.padEnd(15)} ${'Outstanding'.padStart(15)}`);
        line();
        suppliers.forEach(s => {
            console.log(`  ${s.name.padEnd(25)} ${(s.phone||'').padEnd(15)} ${fmt(s.outstandingPayable).padStart(15)}`);
            totalPayable += s.outstandingPayable || 0;
        });
        line();
        console.log(`  TOTAL PAYABLE TO SUPPLIERS : ${fmt(totalPayable)}`);
    }

    // =========================================================
    //  9. CASH IN HAND — CALCULATED
    //     Formula:
    //       Cash Sales (received)
    //     + Customer Payments Received (Cash)
    //     - Cash Purchases Paid
    //     - Supplier Payments (Cash)
    //     - Cash Expenses
    //     +/- Cash Adjustments
    // =========================================================
    sep('9. 💰  CASH IN HAND CALCULATION (15-Jun → Today)');

    const cashInflow  = cashSales + cashCustPayReceived;
    const cashOutflow = cashPurchases + cashSuppPaid + cashExpenses;
    const cashInHand  = cashInflow - cashOutflow + totalCashAdj;

    console.log(`\n  CASH INFLOWS:`);
    console.log(`    Cash Sales Received          : ${fmt(cashSales)}`);
    console.log(`    Customer Payments (Cash)     : ${fmt(cashCustPayReceived)}`);
    console.log(`    ─────────────────────────────────────────`);
    console.log(`    Total Cash Inflow            : ${fmt(cashInflow)}`);

    console.log(`\n  CASH OUTFLOWS:`);
    console.log(`    Cash Purchases Paid          : ${fmt(cashPurchases)}`);
    console.log(`    Supplier Payments (Cash)     : ${fmt(cashSuppPaid)}`);
    console.log(`    Cash Expenses                : ${fmt(cashExpenses)}`);
    console.log(`    ─────────────────────────────────────────`);
    console.log(`    Total Cash Outflow           : ${fmt(cashOutflow)}`);

    console.log(`\n  CASH ADJUSTMENTS (net)         : ${fmt(totalCashAdj)}`);

    console.log(`\n  ╔═══════════════════════════════════════════╗`);
    console.log(`  ║  CASH IN HAND (this period)  : ${fmt(cashInHand).padStart(12)} ║`);
    console.log(`  ╚═══════════════════════════════════════════╝`);

    // =========================================================
    //  10. PAYMENT CAPACITY ANALYSIS
    //      What can we pay today with cash in hand?
    // =========================================================
    sep('10. 📋  WHAT PAYMENTS CAN WE MAKE?');

    console.log(`\n  Current Cash In Hand       : ${fmt(cashInHand)}`);
    console.log(`  Total Payable (Suppliers)  : ${fmt(totalPayable)}`);

    let remaining = cashInHand;
    if (suppliers.length > 0 && cashInHand > 0) {
        console.log(`\n  Suggested Payment Order (highest payable first):`);
        console.log(`  ${'Supplier'.padEnd(25)} ${'Owed'.padStart(14)} ${'Can Pay'.padStart(14)} ${'After Payment'.padStart(16)}`);
        line();
        suppliers.forEach(s => {
            if (remaining <= 0) {
                console.log(`  ${s.name.padEnd(25)} ${fmt(s.outstandingPayable).padStart(14)} ${'—'.padStart(14)} ${'Insufficient'.padStart(16)}`);
                return;
            }
            const pay = Math.min(s.outstandingPayable, remaining);
            remaining -= pay;
            console.log(`  ${s.name.padEnd(25)} ${fmt(s.outstandingPayable).padStart(14)} ${fmt(pay).padStart(14)} ${fmt(remaining).padStart(16)}`);
        });
        line();
        console.log(`  Remaining Cash After All Possible Payments : ${fmt(Math.max(remaining, 0))}`);
        if (cashInHand < totalPayable) {
            console.log(`\n  ⚠️  Shortfall                               : ${fmt(totalPayable - cashInHand)}`);
            console.log(`  💡  Collect ${fmt(totalPayable - cashInHand)} from customers to clear all supplier dues.`);
        } else {
            console.log(`\n  ✅  You have enough cash to pay all suppliers!`);
            console.log(`  💰  Surplus after all payments              : ${fmt(cashInHand - totalPayable)}`);
        }
    } else if (cashInHand <= 0) {
        console.log(`\n  ❌  No cash available. Collect receivables first.`);
        console.log(`  💡  Potential from customer receivables      : ${fmt(totalReceivable)}`);
    } else {
        console.log(`\n  ✅  No supplier dues pending!`);
    }

    // =========================================================
    //  11. QUICK SUMMARY
    // =========================================================
    sep('11. 📊  QUICK SUMMARY');
    console.log(`
  Period          : ${fmtD(FROM_DATE)} → ${fmtD(TO_DATE)}

  Total Sales     : ${fmt(totalSales)}
  Total Received  : ${fmt(totalSalesReceived)}
  Pending (Sales) : ${fmt(totalSalesBalance)}

  Total Purchases : ${fmt(totalPurchases)}
  Total Paid      : ${fmt(totalPurchasesPaid)}
  Pending (Pur.)  : ${fmt(totalPurchasesBalance)}

  Total Expenses  : ${fmt(totalExpenses)}

  Receivable (All Customers) : ${fmt(totalReceivable)}
  Payable   (All Suppliers)  : ${fmt(totalPayable)}

  ┌─────────────────────────────────────────┐
  │  CASH IN HAND  : ${fmt(cashInHand).padEnd(22)} │
  │  NET POSITION  : ${fmt(totalReceivable - totalPayable).padEnd(22)} │
  └─────────────────────────────────────────┘
`);

    await mongoose.disconnect();
    console.log('✅  Done. Disconnected from MongoDB.\n');
}

run().catch(err => {
    console.error('❌  Error:', err.message);
    process.exit(1);
});
