const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');

router.post('/adjust', cashController.createAdjustment);
router.get('/adjustments', cashController.getAdjustments);
router.delete('/adjustments/:id', cashController.deleteAdjustment);

module.exports = router;
