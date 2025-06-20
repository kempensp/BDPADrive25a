var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'BDPADrive - Modern Word Processing' });
});

/* GET dashboard page - protected route */
router.get('/dashboard', auth.requireAuth, function (req, res, next) {
  res.render('dashboard', {
    title: 'BDPADrive - Dashboard',
    user: req.session.user
  });
});

module.exports = router;
