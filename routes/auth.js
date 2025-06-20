var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');

/* GET auth page */
router.get('/', auth.redirectIfAuth, function (req, res, next) {
    res.render('auth', {
        title: 'BDPADrive - Authentication',
        error: null,
        success: null
    });
});

/* POST login */
router.post('/login', function (req, res, next) {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.render('auth', {
            title: 'BDPADrive - Authentication',
            error: 'Please provide both username and password',
            success: null
        });
    }

    // Simulate authentication (replace with actual API call)
    // For demo purposes, accept any non-empty credentials
    if (username.trim() && password.trim()) {
        req.session.user = {
            id: Date.now(), // Simple ID generation
            username: username,
            email: username + '@bdpacloud.com'
        };

        return res.redirect('/dashboard');
    } else {
        return res.render('auth', {
            title: 'BDPADrive - Authentication',
            error: 'Invalid credentials',
            success: null
        });
    }
});

/* POST register */
router.post('/register', function (req, res, next) {
    const { username, email, password, confirmPassword } = req.body;

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
        return res.render('auth', {
            title: 'BDPADrive - Authentication',
            error: 'Please fill in all fields',
            success: null
        });
    }

    if (password !== confirmPassword) {
        return res.render('auth', {
            title: 'BDPADrive - Authentication',
            error: 'Passwords do not match',
            success: null
        });
    }

    // Simulate registration (replace with actual API call)
    // For demo purposes, accept any valid input
    if (username.trim() && email.trim() && password.trim()) {
        req.session.user = {
            id: Date.now(), // Simple ID generation
            username: username,
            email: email
        };

        return res.redirect('/dashboard');
    } else {
        return res.render('auth', {
            title: 'BDPADrive - Authentication',
            error: 'Registration failed',
            success: null
        });
    }
});

/* POST logout */
router.post('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

module.exports = router;
