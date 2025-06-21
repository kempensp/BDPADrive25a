var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');

// GET explorer page (authed users only)
router.get('/', auth.requireAuth, function(req, res, next) {
    // TODO: Fetch user's files/folders and pass to view
    res.render('explorer', {
        title: 'BDPADrive Explorer',
        files: [], // Placeholder
        folders: [], // Placeholder
        error: null,
        success: null
    });
});

// POST create new folder
router.post('/folder', auth.requireAuth, function(req, res, next) {
    // TODO: Implement folder creation logic
    res.redirect('/explorer');
});

// POST create new file
router.post('/file', auth.requireAuth, function(req, res, next) {
    // TODO: Implement file creation logic
    res.redirect('/explorer');
});

module.exports = router;
