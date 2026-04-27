const CashAdjustment = require('../models/CashAdjustment');

// @desc    Create a cash adjustment
// @route   POST /api/cash/adjust
exports.createAdjustment = async (req, res) => {
    try {
        const { accountType, amount, reason, adjustmentDate } = req.body;
        const adjustment = new CashAdjustment({
            accountType,
            amount,
            reason,
            adjustmentDate: adjustmentDate || Date.now()
        });
        const savedAdjustment = await adjustment.save();
        res.status(201).json(savedAdjustment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get adjustments
// @route   GET /api/cash/adjustments
exports.getAdjustments = async (req, res) => {
    try {
        const { accountType, startDate, endDate } = req.query;
        let query = {};
        if (accountType) query.accountType = accountType;
        if (startDate && endDate) {
            query.adjustmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        const adjustments = await CashAdjustment.find(query).sort({ adjustmentDate: -1 });
        res.json(adjustments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAdjustment = async (req, res) => {
    try {
        const adjustment = await CashAdjustment.findById(req.params.id);
        if (!adjustment) return res.status(404).json({ message: 'Adjustment not found' });
        await adjustment.deleteOne();
        res.json({ message: 'Adjustment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
