const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierLedger } = require('../controllers/supplierController');

router.route('/').get(getSuppliers).post(createSupplier);
router.route('/:id').put(updateSupplier).delete(deleteSupplier);
router.route('/:id/ledger').get(getSupplierLedger);

module.exports = router;
