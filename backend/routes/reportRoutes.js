const express = require('express');
const router = express.Router();
const { getDashboardStats, getSalesReport, getPurchaseReport, getProfitReport, getTrends, getRecentActivity } = require('../controllers/reportController');

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/profit', getProfitReport);
router.get('/trends', getTrends);
router.get('/activity', getRecentActivity);

module.exports = router;
