const express = require('express');
const router = express.Router();
const { createReturn, getReturns } = require('../controllers/saleReturnController');

router.post('/', createReturn);
router.get('/', getReturns);

module.exports = router;
