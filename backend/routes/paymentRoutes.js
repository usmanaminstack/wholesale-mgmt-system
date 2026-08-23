const express = require('express');
const router = express.Router();
const { createPayment, getPayments, deletePayment, createBulkPayments } = require('../controllers/paymentController');

router.route('/').get(getPayments).post(createPayment);
router.post('/bulk', createBulkPayments);
router.delete('/:id', deletePayment);

module.exports = router;
