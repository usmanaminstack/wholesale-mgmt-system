const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');

router.post('/adjust', cashController.createAdjustment);
router.get('/adjustments', cashController.getAdjustments);

module.exports = router;
