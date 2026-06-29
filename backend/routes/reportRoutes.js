const express = require('express');
const router = express.Router();
const { getDashboardStats, getSalesReport, getPurchaseReport, getProfitReport, getTrends, getRecentActivity } = require('../controllers/reportController');
const { getDailyLedger } = require('../controllers/dailyLedgerController');

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/profit', getProfitReport);
router.get('/trends', getTrends);
router.get('/activity', getRecentActivity);
router.get('/daily-ledger', getDailyLedger);

module.exports = router;
