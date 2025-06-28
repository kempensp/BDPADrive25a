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
        }        // Step 1: Get user data (including salt) from API
        const userUrl = `${apiConfig.baseUrl}${apiConfig.endpoints.users}/${encodeURIComponent(username)}`;
        debugLog('API CALL - GET User Data', {
            url: userUrl,
            method: 'GET',
            headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
        });

        const userResponse = await apiRequests.getWithBearerToken(userUrl, BEARER_TOKEN);
        debugLog('API RESPONSE - GET User Data', {
            url: userUrl,
            status: userResponse.status,
            responseData: userResponse.data
        });

        if (userResponse.status !== 200) {
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

        const salt = userResponse.data.user.salt;
        debugLog('Retrieved salt for user', { username, saltLength: salt.length });

        // Step 2: Generate key using password and salt
        const key = cryptoUtils.generateKey(password, salt);
        debugLog('Generated key for authentication', { keyLength: key.length });

        // Step 3: Authenticate with API using user-specific auth endpoint
        const authUrl = `${apiConfig.baseUrl}${apiConfig.endpoints.users}/${encodeURIComponent(username)}/auth`;
        const authData = {
            key: key
        };

        debugLog('API CALL - POST Authentication', {
            url: authUrl,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            },
            requestData: authData
        });

        const authResponse = await apiRequests.postWithBearerToken(authUrl, BEARER_TOKEN, authData);
        debugLog('API RESPONSE - POST Authentication', {
            url: authUrl,
            status: authResponse.status,
            responseData: authResponse.data
        });

        if (authResponse.status === 200) {
            // Successful authentication - use user data from initial API call
            req.session.user = {
                id: userResponse.data.user.user_id,
                username: userResponse.data.user.username,
                email: userResponse.data.user.email
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
        debugLog('EXCEPTION - Login error', {
            error: error.message,
            stack: error.stack,
            username: username || 'unknown'
        });
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
        debugLog('Generated salt and key for new user', {
            username,
            saltLength: salt.length,
            keyLength: key.length,
            salt: salt,
            key: key.substring(0, 20) + '...' // Show first 20 chars of key for security
        });

        // Create user via API
        const createUserUrl = `${apiConfig.baseUrl}${apiConfig.endpoints.users}`;
        const userData = {
            username: username,
            email: email,
            salt: salt,
            key: key
        };

        debugLog('API CALL - POST Create User', {
            url: createUserUrl,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            },
            requestData: {
                username: userData.username,
                email: userData.email,
                salt: userData.salt,
                key: userData.key.substring(0, 20) + '...' // Truncate key for security
            }
        });

        const createResponse = await apiRequests.postWithBearerToken(createUserUrl, BEARER_TOKEN, userData);
        debugLog('API RESPONSE - POST Create User', {
            url: createUserUrl,
            status: createResponse.status,
            responseData: createResponse.data
        });

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
            debugLog('API ERROR - User creation failed', {
                url: createUserUrl,
                status: createResponse.status,
                responseData: createResponse.data,
                requestData: {
                    username: userData.username,
                    email: userData.email,
                    salt: userData.salt,
                    key: userData.key.substring(0, 20) + '...'
                }
            });
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
        debugLog('EXCEPTION - Registration error', {
            error: error.message,
            stack: error.stack,
            url: createUserUrl || 'unknown'
        });
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
