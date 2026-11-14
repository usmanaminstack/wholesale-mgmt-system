const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Payment = require('../models/Payment');
const Supplier = require('../models/Supplier');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const startDate2026 = new Date('2026-07-26T00:00:00.000Z');

        const payments = await Payment.find({
            entityType: 'Supplier',
            paymentDate: { $gte: startDate2026 }
        }).populate('entityId', 'name phone contactPerson').sort({ paymentDate: -1 });

        console.log('Total Count:', payments.length);
        
        let totalAmount = 0;
        const summary = payments.map((p, idx) => {
            const supplierName = p.entityId ? p.entityId.name : 'Unknown';
            const phone = p.entityId ? p.entityId.phone : '';
            totalAmount += p.amount;
            return {
                Index: idx + 1,
                Supplier: supplierName,
                Phone: phone,
                Amount: p.amount,
                Method: p.paymentMethod,
                Date: p.paymentDate ? p.paymentDate.toISOString().split('T')[0] : '',
                Note: p.note || ''
            };
        });

        console.table(summary);
        console.log('TOTAL AMOUNT PAID AFTER 26 JULY 2026:', totalAmount);

        console.log('\nJSON Output:');
        console.log(JSON.stringify(summary, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
