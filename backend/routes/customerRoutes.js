const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer, getCustomerLedger } = require('../controllers/customerController');

router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').get(getCustomerById).put(updateCustomer).delete(deleteCustomer);
router.get('/:id/ledger', getCustomerLedger);

module.exports = router;
