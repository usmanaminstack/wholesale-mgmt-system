const Customer = require('../models/Customer');

exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({});
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const customer = new Customer(req.body);
        customer.outstandingReceivable = (customer.openingBalance || 0);
        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer) {
            Object.assign(customer, req.body);
            customer.outstandingReceivable = (customer.openingBalance || 0) + (customer.totalSales || 0) - (customer.totalReceived || 0);
            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getCustomerLedger = async (req, res) => {
    try {
        const Ledger = require('../models/Ledger');
        const Sale = require('../models/Sale');
        const Payment = require('../models/Payment');
        const SaleReturn = require('../models/SaleReturn');

        const ledgerEntries = await Ledger.find({ entityId: req.params.id, entityType: 'Customer' });

        // Resolve dates from the actual documents
        const resolvedEntries = await Promise.all(ledgerEntries.map(async (entry) => {
            let actualDate = entry.date;
            if (entry.transactionType === 'Sale') {
                const sale = await Sale.findById(entry.referenceId);
                if (sale && sale.saleDate) actualDate = sale.saleDate;
            } else if (entry.transactionType === 'Payment') {
                const payment = await Payment.findById(entry.referenceId);
                if (payment && payment.paymentDate) actualDate = payment.paymentDate;
            } else if (entry.transactionType === 'Return') {
                const saleReturn = await SaleReturn.findById(entry.referenceId);
                if (saleReturn && saleReturn.returnDate) actualDate = saleReturn.returnDate;
            }
            
            // Return plain object with the updated date
            const obj = entry.toObject();
            obj.date = actualDate;
            return obj;
        }));

        // Sort descending by date, then createdAt
        resolvedEntries.sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(resolvedEntries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Optional: Check if customer has outstanding balance or transactions
        // For MVP, we'll allow deletion but clear the ledger
        const Ledger = require('../models/Ledger');
        await Ledger.deleteMany({ entityId: customer._id, entityType: 'Customer' });

        await customer.deleteOne();
        res.json({ message: 'Customer and their ledger history removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCustomerPDFStatement = async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const Customer = require('../models/Customer');
        const Sale = require('../models/Sale');
        const SaleReturn = require('../models/SaleReturn');
        const Payment = require('../models/Payment');
        const Ledger = require('../models/Ledger');

        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        const cid = customer._id;
        const FROM_DATE = new Date('2026-06-01T00:00:00.000Z');

        const sales = await Sale.find({ customer: cid, saleDate: { $gte: FROM_DATE } })
            .populate('items.product', 'name')
            .sort({ saleDate: 1 });

        const payments = await Payment.find({ entityType: 'Customer', entityId: cid, paymentDate: { $gte: FROM_DATE } })
            .sort({ paymentDate: 1 });

        const returns = await SaleReturn.find({ customer: cid, returnDate: { $gte: FROM_DATE } })
            .populate('items.product', 'name')
            .sort({ returnDate: 1 });

        const rows = [];
        for (const s of sales) rows.push({ type: 'SALE', date: s.saleDate, doc: s });
        for (const p of payments) rows.push({ type: 'PAYMENT', date: p.paymentDate, doc: p });
        for (const r of returns) rows.push({ type: 'RETURN', date: r.returnDate, doc: r });

        rows.sort((a, b) => {
            const da = new Date(a.date), db = new Date(b.date);
            if (da - db !== 0) return da - db;
            return new Date(a.doc.createdAt) - new Date(b.doc.createdAt);
        });

        const totalBillsJune = sales.reduce((s, x) => s + (x.totalAmount - (x.discount || 0)), 0);
        const totalPaymentsJune = payments.reduce((s, x) => s + x.amount, 0);
        const totalReturnsJune = returns.reduce((s, x) => s + x.totalRefundAmount, 0);

        let runningBal = customer.outstandingReceivable - totalBillsJune + totalPaymentsJune + totalReturnsJune;
        const openingJune = runningBal;

        for (const row of rows) {
            if (row.type === 'SALE') {
                const net = row.doc.totalAmount - (row.doc.discount || 0);
                runningBal += net;
                row.debit = net;
                row.credit = 0;
            } else if (row.type === 'PAYMENT') {
                runningBal -= row.doc.amount;
                row.debit = 0;
                row.credit = row.doc.amount;
            } else if (row.type === 'RETURN') {
                runningBal -= row.doc.totalRefundAmount;
                row.debit = 0;
                row.credit = row.doc.totalRefundAmount;
            }
            row.balance = runningBal;
        }

        const totalBills = rows.filter(r => r.type === 'SALE').reduce((s, r) => s + r.debit, 0);
        const totalPayments = rows.filter(r => r.type !== 'SALE').reduce((s, r) => s + r.credit, 0);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${customer.name.replace(/\s+/g, '_')}_Statement.pdf"`);

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        doc.pipe(res);

        const PW = doc.page.width - 80;
        const LM = 40;
        const C = {
            primary: '#1e3a5f',
            accent: '#2563eb',
            sale: '#dc2626',
            payment: '#16a34a',
            muted: '#64748b',
            light: '#f8fafc',
            border: '#e2e8f0',
            white: '#ffffff',
            black: '#0f172a',
            yellow: '#f59e0b',
        };

        const fmtDate = (d) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
        const fmtAmt = (n) => 'PKR ' + (n || 0).toLocaleString();

        // Header
        doc.rect(0, 0, doc.page.width, 115).fill(C.primary);
        doc.fillColor(C.white).fontSize(22).font('Helvetica-Bold').text('ACCOUNT STATEMENT', LM, 22, { align: 'center', width: PW + 40 });
        doc.fontSize(10).font('Helvetica').text('Wholesale Management System', LM, 52, { align: 'center', width: PW + 40 });
        doc.fontSize(8).text(`Generated: ${new Date().toLocaleString('en-PK')}`, LM, 70, { align: 'center', width: PW + 40 });
        doc.fontSize(7.5).fillColor('#93c5fd').text('Dates sourced directly from entry logs', LM, 86, { align: 'center', width: PW + 40 });

        // Cust Info
        const iY = 125;
        doc.rect(LM, iY, PW, 75).fill(C.light).stroke(C.border);
        doc.fillColor(C.black).font('Helvetica-Bold').fontSize(14).text(customer.name, LM + 12, iY + 10);
        doc.fillColor(C.muted).font('Helvetica').fontSize(8.5)
            .text(`Phone: ${customer.phone}`, LM + 12, iY + 28)
            .text(`Statement Period: 1 Jun 2026 – Present`, LM + 12, iY + 41)
            .text(`Opening Balance (carried fwd): ${fmtAmt(openingJune)}`, LM + 12, iY + 54);

        // Box Summaries
        const bW = 110, bH = 54, bY = iY + 10, b1 = LM + PW - bW * 3 - 8;
        const sBox = (x, lbl, val, bg) => {
            doc.rect(x, bY, bW, bH).fill(bg);
            doc.fillColor(C.white).font('Helvetica').fontSize(7).text(lbl, x + 6, bY + 8);
            doc.font('Helvetica-Bold').fontSize(10).text(val, x + 6, bY + 22);
        };
        sBox(b1, 'TOTAL BILLS', fmtAmt(totalBills), C.sale);
        sBox(b1 + bW + 4, 'TOTAL RECEIVED', fmtAmt(totalPayments), C.payment);
        sBox(b1 + (bW + 4) * 2, 'OUTSTANDING', fmtAmt(customer.outstandingReceivable), C.accent);

        let tY = iY + 87;
        const cols = {
            no: { x: LM, w: 24 },
            date: { x: LM + 24, w: 70 },
            type: { x: LM + 94, w: 55 },
            desc: { x: LM + 149, w: 185 },
            bill: { x: LM + 334, w: 76 },
            pay: { x: LM + 410, w: 76 },
            bal: { x: LM + 486, w: 78 },
        };

        const drawHdr = (y) => {
            doc.rect(LM, y, PW, 20).fill(C.primary);
            doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5);
            const h = y + 6;
            doc.text('#', cols.no.x + 3, h);
            doc.text('DATE', cols.date.x + 2, h);
            doc.text('TYPE', cols.type.x + 2, h);
            doc.text('DESCRIPTION', cols.desc.x + 2, h);
            doc.text('BILL (DR)', cols.bill.x, h, { width: cols.bill.w, align: 'right' });
            doc.text('RECEIVED', cols.pay.x, h, { width: cols.pay.w, align: 'right' });
            doc.text('BALANCE', cols.bal.x, h, { width: cols.bal.w, align: 'right' });
            return y + 20;
        };

        tY = drawHdr(tY);
        let rowNo = 0;

        for (const r of rows) {
            rowNo++;
            const isSale = r.type === 'SALE';
            const isRet = r.type === 'RETURN';
            const isPay = r.type === 'PAYMENT';

            let rH = 18;
            if (isSale) {
                rH = 18 + (r.doc.items || []).length * 11 + (r.doc.discount > 0 ? 11 : 0);
            }

            if (tY + rH > doc.page.height - 90) {
                doc.addPage();
                tY = 40;
                tY = drawHdr(tY);
            }

            doc.rect(LM, tY, PW, rH).fill(isSale ? '#fff5f5' : isRet ? '#f0fdf4' : rowNo % 2 === 0 ? C.light : C.white);
            doc.rect(LM, tY, 3, rH).fill(isSale ? C.sale : C.payment);

            const ty = tY + 5;
            doc.fillColor(isSale ? C.sale : C.muted).font('Helvetica-Bold').fontSize(7.5).text(String(rowNo), cols.no.x + 3, ty);
            doc.fillColor(C.black).font('Helvetica').fontSize(8).text(fmtDate(r.date), cols.date.x + 2, ty);

            doc.rect(cols.type.x + 2, ty - 2, 50, 13).fill(isSale ? C.sale : isRet ? C.yellow : C.payment);
            doc.fillColor(C.white).font('Helvetica-Bold').fontSize(6).text(r.type, cols.type.x + 4, ty + 1.5, { width: 46, align: 'center' });

            if (isSale) {
                let iy = ty;
                for (const it of r.doc.items) {
                    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(7.5).text(it.product?.name || 'Unknown', cols.desc.x + 2, iy);
                    doc.fillColor(C.muted).font('Helvetica').fontSize(7).text(`${it.quantity} ${it.unit} x ${fmtAmt(it.priceAtSale)} = ${fmtAmt(it.totalPrice)}`, cols.desc.x + 105, iy);
                    iy += 11;
                }
                if (r.doc.discount > 0) {
                    doc.fillColor(C.sale).font('Helvetica').fontSize(7).text(`Discount: -${fmtAmt(r.doc.discount)}`, cols.desc.x + 2, iy);
                }
            } else if (isPay) {
                doc.fillColor(C.muted).font('Helvetica').fontSize(7.5).text(`${r.doc.paymentMethod} payment`, cols.desc.x + 2, ty);
                if (r.doc.note) doc.fillColor(C.muted).fontSize(7).text(`Note: ${r.doc.note}`, cols.desc.x + 2, ty + 10);
            }

            doc.font('Helvetica-Bold').fontSize(8);
            if (isSale) {
                doc.fillColor(C.sale).text(fmtAmt(r.debit), cols.bill.x, ty, { width: cols.bill.w, align: 'right' });
            } else {
                doc.fillColor(C.payment).text(fmtAmt(r.credit), cols.pay.x, ty, { width: cols.pay.w, align: 'right' });
            }
            doc.fillColor(C.black).text(fmtAmt(r.balance), cols.bal.x, ty, { width: cols.bal.w, align: 'right' });

            doc.moveTo(LM, tY + rH).lineTo(LM + PW, tY + rH).lineWidth(0.3).stroke(C.border);
            tY += rH;
        }

        if (tY + 120 > doc.page.height) {
            doc.addPage();
            tY = 40;
        }

        tY += 10;
        doc.rect(LM, tY, PW, 75).fill(C.primary);
        doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9.5).text('PERIOD SUMMARY (1 Jun 2026 - Present)', LM + 12, tY + 8);
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(8);
        doc.text('Opening Balance', LM + 12, tY + 26);
        doc.text('Total Bills', LM + 12, tY + 38);
        doc.text('Total Payments Received', LM + 12, tY + 50);

        doc.fillColor(C.white).font('Helvetica-Bold');
        doc.text(fmtAmt(openingJune), LM + PW - 130, tY + 26, { width: 120, align: 'right' });
        doc.text(fmtAmt(totalBills), LM + PW - 130, tY + 38, { width: 120, align: 'right' });
        doc.text(fmtAmt(totalPayments), LM + PW - 130, tY + 50, { width: 120, align: 'right' });

        tY += 80;
        doc.rect(LM, tY, PW, 32).fill(C.accent);
        doc.fillColor(C.white).font('Helvetica').fontSize(8.5).text('CURRENT OUTSTANDING BALANCE', LM + 12, tY + 10);
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#fef08a').text(fmtAmt(customer.outstandingReceivable), LM + 12, tY + 8, { width: PW - 16, align: 'right' });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
