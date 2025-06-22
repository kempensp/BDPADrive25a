var express = require('express');
var router = express.Router();
require('dotenv').config();

var auth = require('../middleware/auth');
var apiRequests = require('../middleware/APIRequests');
var cryptoUtils = require('../utils/crypto');
var apiConfig = require('../config/api');

const BEARER_TOKEN = process.env.BEARER_TOKEN;
const DEBUG = process.env.DEBUG === 'true';

// Helper function for debug logging
function debugLog(message, data = null) {
    if (DEBUG) {
        console.log('[AUTH DEBUG]', message, data ? JSON.stringify(data, null, 2) : '');
    }
}

// Helper function to validate username (alphanumeric, dashes, underscores)
function isValidUsername(username) {
    return /^[a-zA-Z0-9_-]+$/.test(username);
}

// Helper function to generate CAPTCHA question
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return {
        question: `What is ${num1} + ${num2}?`,
        answer: num1 + num2
    };
}

/* GET auth page */
router.get('/', auth.redirectIfAuth, function (req, res, next) {
    const captcha = generateCaptcha();
    req.session.captcha = captcha.answer;

    res.render('auth', {
        title: 'BDPADrive - Authentication',
        error: null,
        success: null,
        captchaQuestion: captcha.question,
        loginAttempts: req.session.loginAttempts || 0
    });
});

/* POST login */
router.post('/login', async function (req, res, next) {
    try {
        const { username, password, rememberMe } = req.body;

        debugLog('Login attempt', { username, rememberMe: !!rememberMe });

        // Check if user is locked out
        if (req.session.lockoutUntil && req.session.lockoutUntil > Date.now()) {
            const timeLeft = Math.ceil((req.session.lockoutUntil - Date.now()) / (1000 * 60));
            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: `Account locked. Please try again in ${timeLeft} minutes.`,
                success: null,
                captchaQuestion: generateCaptcha().question,
                loginAttempts: req.session.loginAttempts || 0
            });
        }

        // Basic validation
        if (!username || !password) {
            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Please provide both username and password',
                success: null,
                captchaQuestion: generateCaptcha().question,
                loginAttempts: req.session.loginAttempts || 0
            });
        }

        // Step 1: Get user salt from API
        const saltUrl = `${apiConfig.baseUrl}${apiConfig.endpoints.users}/${encodeURIComponent(username)}/salt`;
        debugLog('Fetching salt from', saltUrl);

        const saltResponse = await apiRequests.getWithBearerToken(saltUrl, BEARER_TOKEN);
        debugLog('Salt response', { status: saltResponse.status });

        if (saltResponse.status !== 200) {
            // Increment login attempts
            req.session.loginAttempts = (req.session.loginAttempts || 0) + 1;

            if (req.session.loginAttempts >= 3) {
                req.session.lockoutUntil = Date.now() + (60 * 60 * 1000); // 1 hour lockout
                debugLog('User locked out', { username, attempts: req.session.loginAttempts });
            }

            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Invalid username or password',
                success: null,
                captchaQuestion: generateCaptcha().question,
                loginAttempts: req.session.loginAttempts
            });
        }

        const salt = saltResponse.data.salt;
        debugLog('Retrieved salt for user', { username });

        // Step 2: Generate key using password and salt
        const key = cryptoUtils.generateKey(password, salt);
        debugLog('Generated key for authentication');

        // Step 3: Authenticate with API
        const authUrl = `${apiConfig.baseUrl}${apiConfig.endpoints.auth}`;
        const authData = {
            username: username,
            key: key
        };

        debugLog('Authenticating with API', { username });
        const authResponse = await apiRequests.postWithBearerToken(authUrl, BEARER_TOKEN, authData);
        debugLog('Auth response', { status: authResponse.status });

        if (authResponse.status === 200) {
            // Successful authentication
            req.session.user = {
                id: authResponse.data.user.id,
                username: authResponse.data.user.username,
                email: authResponse.data.user.email
            };

            // Handle remember me functionality
            if (rememberMe) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
                debugLog('Remember me enabled for user', { username });
            }

            // Clear login attempts
            delete req.session.loginAttempts;
            delete req.session.lockoutUntil;

            debugLog('User successfully authenticated', { username });
            return res.redirect('/dashboard');
        } else {
            // Failed authentication
            req.session.loginAttempts = (req.session.loginAttempts || 0) + 1;

            if (req.session.loginAttempts >= 3) {
                req.session.lockoutUntil = Date.now() + (60 * 60 * 1000); // 1 hour lockout
                debugLog('User locked out after failed attempts', { username, attempts: req.session.loginAttempts });
            }

            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Invalid username or password',
                success: null,
                captchaQuestion: generateCaptcha().question,
                loginAttempts: req.session.loginAttempts
            });
        }

    } catch (error) {
        debugLog('Login error', { error: error.message });
        return res.render('auth', {
            title: 'BDPADrive - Authentication',
            error: 'An error occurred during login. Please try again.',
            success: null,
            captchaQuestion: generateCaptcha().question,
            loginAttempts: req.session.loginAttempts || 0
        });
    }
});

/* POST register */
router.post('/register', async function (req, res, next) {
    try {
        const { username, email, password, confirmPassword, captcha } = req.body;

        debugLog('Registration attempt', { username, email });

        // Basic validation
        if (!username || !email || !password || !confirmPassword || !captcha) {
            const newCaptcha = generateCaptcha();
            req.session.captcha = newCaptcha.answer;
            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Please fill in all fields',
                success: null,
                captchaQuestion: newCaptcha.question,
                loginAttempts: req.session.loginAttempts || 0
            });
        }

        // Validate username format
        if (!isValidUsername(username)) {
            const newCaptcha = generateCaptcha();
            req.session.captcha = newCaptcha.answer;
            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Username must contain only letters, numbers, dashes, and underscores',
                success: null,
                captchaQuestion: newCaptcha.question,
                loginAttempts: req.session.loginAttempts || 0
            });
        }

        // Password validation
        if (password !== confirmPassword) {
            const newCaptcha = generateCaptcha();
            req.session.captcha = newCaptcha.answer;
            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Passwords do not match',
                success: null,
                captchaQuestion: newCaptcha.question,
                loginAttempts: req.session.loginAttempts || 0
            });
        }

        // Password strength validation
        if (password.length <= 10) {
            const newCaptcha = generateCaptcha();
            req.session.captcha = newCaptcha.answer;
            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Password is too weak. Use more than 10 characters for better security.',
                success: null,
                captchaQuestion: newCaptcha.question,
                loginAttempts: req.session.loginAttempts || 0
            });
        }

        // CAPTCHA validation
        if (parseInt(captcha) !== req.session.captcha) {
            const newCaptcha = generateCaptcha();
            req.session.captcha = newCaptcha.answer;
            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Incorrect security check answer',
                success: null,
                captchaQuestion: newCaptcha.question,
                loginAttempts: req.session.loginAttempts || 0
            });
        }

        // Generate salt and key for new user
        const { salt, key } = cryptoUtils.generateSaltAndKey(password);
        debugLog('Generated salt and key for new user', { username });

        // Create user via API
        const createUserUrl = `${apiConfig.baseUrl}${apiConfig.endpoints.users}`;
        const userData = {
            username: username,
            email: email,
            salt: salt,
            key: key
        };

        debugLog('Creating user via API', { username, email });
        const createResponse = await apiRequests.postWithBearerToken(createUserUrl, BEARER_TOKEN, userData);
        debugLog('Create user response', { status: createResponse.status });

        if (createResponse.status === 201) {
            // User created successfully
            debugLog('User created successfully', { username });

            // Generate new CAPTCHA for next potential registration
            const newCaptcha = generateCaptcha();
            req.session.captcha = newCaptcha.answer;

            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: null,
                success: 'Account created successfully! You can now log in with your credentials.',
                captchaQuestion: newCaptcha.question,
                loginAttempts: req.session.loginAttempts || 0
            });
        } else if (createResponse.status === 409) {
            // User already exists (username or email conflict)
            const newCaptcha = generateCaptcha();
            req.session.captcha = newCaptcha.answer;
            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Username or email already exists. Please choose different credentials.',
                success: null,
                captchaQuestion: newCaptcha.question,
                loginAttempts: req.session.loginAttempts || 0
            });
        } else {
            // Other API error
            debugLog('API error during user creation', { status: createResponse.status, data: createResponse.data });
            const newCaptcha = generateCaptcha();
            req.session.captcha = newCaptcha.answer;
            return res.render('auth', {
                title: 'BDPADrive - Authentication',
                error: 'Registration failed. Please try again.',
                success: null,
                captchaQuestion: newCaptcha.question,
                loginAttempts: req.session.loginAttempts || 0
            });
        }

    } catch (error) {
        debugLog('Registration error', { error: error.message });
        const newCaptcha = generateCaptcha();
        req.session.captcha = newCaptcha.answer;
        return res.render('auth', {
            title: 'BDPADrive - Authentication',
            error: 'An error occurred during registration. Please try again.',
            success: null,
            captchaQuestion: newCaptcha.question,
            loginAttempts: req.session.loginAttempts || 0
        });
    }
});

/* POST logout */
router.post('/logout', function (req, res, next) {
    const username = req.session.user ? req.session.user.username : 'unknown';
    debugLog('User logging out', { username });

    req.session.destroy(function (err) {
        if (err) {
            debugLog('Logout error', { error: err.message });
            return next(err);
        }
        debugLog('User logged out successfully', { username });
        res.redirect('/');
    });
});

module.exports = router;
