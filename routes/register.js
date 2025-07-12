var express = require('express');
var router = express.Router();

// GET register page
router.get('/', function(req, res, next) {
  // Generate a simple CAPTCHA (e.g., 2+2)
  const captcha = {
    question: 'What is 2 + 2?',
    answer: 4
  };
  res.render('register', { captcha });
});

module.exports = router;
