const express = require('express');
const router = express.Router();
const { createPurchase, getPurchases, getPurchaseById, updatePurchase, deletePurchase, createBulkPurchases } = require('../controllers/purchaseController');

router.post('/', createPurchase);
router.post('/bulk', createBulkPurchases);
router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

module.exports = router;
