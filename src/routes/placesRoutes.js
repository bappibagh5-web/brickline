const express = require('express');
const placesController = require('../controllers/placesController');

const router = express.Router();

router.get('/places/autocomplete', placesController.autocomplete);
router.get('/places/details', placesController.details);

module.exports = router;

