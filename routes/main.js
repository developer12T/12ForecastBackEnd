const express = require('express');
const router = express.Router();
const mainController = require('../controllers/main_controllers');

router.get('/zone', mainController.getZone);
router.get('/area', mainController.getArea);
router.get('/search', mainController.getdata);
module.exports = router;
