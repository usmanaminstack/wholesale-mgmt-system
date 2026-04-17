const express = require('express');
const router = express.Router();
const { createPayment, getPayments, deletePayment } = require('../controllers/paymentController');

router.route('/').get(getPayments).post(createPayment);
router.delete('/:id', deletePayment);

module.exports = router;
