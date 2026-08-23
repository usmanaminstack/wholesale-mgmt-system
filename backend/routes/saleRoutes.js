const express = require('express');
const router = express.Router();
const { getSales, createSale, getSaleById, updateSale, deleteSale, createBulkSales } = require('../controllers/saleController');

router.route('/').get(getSales).post(createSale);
router.post('/bulk', createBulkSales);
router.route('/:id').get(getSaleById).put(updateSale).delete(deleteSale);

module.exports = router;
