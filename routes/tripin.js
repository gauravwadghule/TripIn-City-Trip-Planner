var express = require('express');
var router = express.Router();
const https = require('https');
var tripinController = require("../controllers/TripinController.js");
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('tripin/polylines');
});



router.get('/findPoi/:searchQuery', tripinController.save);

router.get('/:cityName',tripinController.getPoi);

module.exports = router;