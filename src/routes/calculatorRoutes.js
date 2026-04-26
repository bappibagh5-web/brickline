const express = require('express');
const calculatorController = require('../controllers/calculatorController');

const router = express.Router();

router.post('/calculator/calculate', calculatorController.calculate);
router.post('/calculator/dscr-calculate', calculatorController.calculateDscr);
router.post('/calculator/dscr/calculate', calculatorController.calculateDscr);

module.exports = router;
