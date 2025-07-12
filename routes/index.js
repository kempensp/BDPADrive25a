var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var searchRouter = require('./search');
var cryptoUtils = require('../utils/crypto');
var apiRequests = require('../middleware/APIRequests');
var apiConfig = require('../config/api');

require('dotenv').config();
const BEARER_TOKEN = process.env.BEARER_TOKEN;

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'BDPADrive - Community Q&A Platform' });
});

/* GET dashboard page - protected route */
router.get('/dashboard', auth.requireAuth, async function (req, res, next) {
  try {
    const user = req.session.user;
    const gravatar = cryptoUtils.generateGravatarUrl(user.email);
    
    // Mock data for questions and answers - in a real app, this would come from the API
    const userQuestions = [
      {
        id: 1,
        title: "How do I implement authentication in Node.js?",
        content: "I'm building a Node.js application and need to implement user authentication. What's the best approach?",
        votes: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: "What are the best practices for database design?",
        content: "I'm designing a new database schema and want to follow best practices. What should I consider?",
        votes: 3,
        created_at: new Date().toISOString()
      }
    ];

    const userAnswers = [
      {
        id: 1,
        question_id: 3,
        question_title: "How to handle errors in Express.js?",
        content: "You can use middleware to handle errors in Express.js. Here's a comprehensive approach...",
        votes: 8,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        question_id: 4,
        question_title: "What is the difference between var, let, and const?",
        content: "The main differences are scope and hoisting behavior. Let me explain each one...",
        votes: 12,
        created_at: new Date().toISOString()
      }
    ];

    res.render('dashboard', {
      title: 'BDPADrive - Dashboard',
      user: user,
      gravatar: gravatar,
      userQuestions: userQuestions,
      userAnswers: userAnswers
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', {
      title: 'BDPADrive - Dashboard',
      user: req.session.user,
      gravatar: cryptoUtils.generateGravatarUrl(req.session.user.email),
      userQuestions: [],
      userAnswers: []
    });
  }
});

/* POST routes for account management */
router.post('/dashboard/change-email', auth.requireAuth, async function (req, res, next) {
  try {
    const { newEmail, currentPassword } = req.body;
    const user = req.session.user;

    // Validate inputs
    if (!newEmail || !currentPassword) {
      return res.redirect('/dashboard?error=Please provide both email and password');
    }

    // In a real application, you would:
    // 1. Verify the current password
    // 2. Update the email in the database via API
    // 3. Update the session
    
    // For now, just simulate the process
    console.log(`User ${user.username} attempting to change email to ${newEmail}`);
    
    // Update session (in real app, this would come from API response)
    req.session.user.email = newEmail;
    
    res.redirect('/dashboard?success=Email updated successfully');
  } catch (error) {
    console.error('Change email error:', error);
    res.redirect('/dashboard?error=An error occurred while updating email');
  }
});

router.post('/dashboard/change-password', auth.requireAuth, async function (req, res, next) {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const user = req.session.user;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.redirect('/dashboard?error=Please fill in all password fields');
    }

    if (newPassword !== confirmNewPassword) {
      return res.redirect('/dashboard?error=New passwords do not match');
    }

    if (newPassword.length < 8) {
      return res.redirect('/dashboard?error=New password must be at least 8 characters');
    }

    // In a real application, you would:
    // 1. Verify the current password
    // 2. Generate new salt and key
    // 3. Update the password in the database via API
    
    console.log(`User ${user.username} attempting to change password`);
    
    res.redirect('/dashboard?success=Password updated successfully');
  } catch (error) {
    console.error('Change password error:', error);
    res.redirect('/dashboard?error=An error occurred while updating password');
  }
});

router.post('/dashboard/delete-account', auth.requireAuth, async function (req, res, next) {
  try {
    const { password, confirmation } = req.body;
    const user = req.session.user;

    // Validate inputs
    if (!password || !confirmation) {
      return res.redirect('/dashboard?error=Please provide password and confirmation');
    }

    if (confirmation !== 'DELETE') {
      return res.redirect('/dashboard?error=Please type DELETE to confirm account deletion');
    }

    // In a real application, you would:
    // 1. Verify the password
    // 2. Delete all user data via API
    // 3. Destroy the session
    
    console.log(`User ${user.username} attempting to delete account`);
    
    // Destroy session and redirect to home
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.redirect('/dashboard?error=An error occurred while deleting account');
      }
      res.redirect('/?success=Account deleted successfully');
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.redirect('/dashboard?error=An error occurred while deleting account');
  }
});

router.use('/search', searchRouter);

module.exports = router;
