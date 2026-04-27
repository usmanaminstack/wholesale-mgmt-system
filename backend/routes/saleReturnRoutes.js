const express = require('express');
const router = express.Router();
const { createReturn, getReturns, deleteReturn } = require('../controllers/saleReturnController');

router.post('/', createReturn);
router.get('/', getReturns);
router.delete('/:id', deleteReturn);

module.exports = router;
