const Ledger = require('../models/Ledger');

exports.addLedgerEntry = async ({
    entityType,
    entityId,
    transactionType,
    referenceId,
    debit = 0,
    credit = 0,
    description
}) => {
    // Get last balance
    const lastEntry = await Ledger.findOne({ entityId, entityType }).sort({ date: -1 });
    let lastBalance = 0;
    if (lastEntry) {
        lastBalance = lastEntry.balance;
    } else {
        // Fallback to Opening Balance from Customer/Supplier if it's the first entry
        const EntityModel = entityType === 'Customer' ? require('../models/Customer') : require('../models/Supplier');
        const entity = await EntityModel.findById(entityId);
        lastBalance = entity ? (entity.openingBalance || 0) : 0;
    }

    // Customer: Debit (Sale/Increase receivable), Credit (Payment/Decrease receivable)
    // Supplier: Debit (Payment/Decrease payable), Credit (Purchase/Increase payable)
    // Wait, the user logic says:
    // Customer: Credit Sale -> +balance, Payment -> -balance
    // Supplier: Credit Purchase -> +payable, Payment -> -payable

    // Let's stick to simple: Current Balance = Previous Balance + Debit - Credit
    // For Customer: Debit = Sale, Credit = Payment
    // For Supplier: Debit = Payment, Credit = Purchase (No, wait)

    // Let's redefine for clarity as per user request:
    // Customer: Sale increases balance, Payment decreases it.
    // Supplier: Purchase increases payable, Payment decreases it.

    let newBalance;
    if (entityType === 'Customer') {
        newBalance = lastBalance + debit - credit;
    } else {
        // Supplier logic: Purchase is credit (increases payable), Payment is debit (decreases payable)
        newBalance = lastBalance + credit - debit;
    }

    const ledgerEntry = new Ledger({
        entityType,
        entityId,
        transactionType,
        referenceId,
        debit,
        credit,
        balance: newBalance,
        description
    });

    await ledgerEntry.save();
    return newBalance;
};
