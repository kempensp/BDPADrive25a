var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var searchRouter = require('./search');

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

router.use('/search', searchRouter);

module.exports = router;
