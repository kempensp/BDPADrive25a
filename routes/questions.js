var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var cryptoUtils = require('../utils/crypto');
var apiRequests = require('../middleware/APIRequests');
var apiConfig = require('../config/api');

require('dotenv').config();
const BEARER_TOKEN = process.env.BEARER_TOKEN;

/* GET questions listing */
router.get('/', function (req, res, next) {
  try {
    // Mock data for questions - in a real app, this would come from the API
    const questions = [
      {
        id: 1,
        title: "How do I implement authentication in Node.js?",
        content: "I'm building a Node.js application and need to implement user authentication. What's the best approach?",
        author: "developer123",
        votes: 5,
        answers_count: 3,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: "What are the best practices for database design?",
        content: "I'm designing a new database schema and want to follow best practices. What should I consider?",
        author: "dbadmin",
        votes: 8,
        answers_count: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        title: "How to handle errors in Express.js?",
        content: "I'm getting various errors in my Express.js application. What's the proper way to handle them?",
        author: "webdev",
        votes: 12,
        answers_count: 5,
        created_at: new Date().toISOString()
      }
    ];

    res.render('questions', {
      title: 'BDPADrive - Questions',
      questions: questions,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Questions listing error:', error);
    res.render('questions', {
      title: 'BDPADrive - Questions',
      questions: [],
      user: req.session.user || null
    });
  }
});

/* GET new question form */
router.get('/new', auth.requireAuth, function (req, res, next) {
  res.render('question-form', {
    title: 'BDPADrive - Ask Question',
    user: req.session.user
  });
});

/* POST new question */
router.post('/new', auth.requireAuth, async function (req, res, next) {
  try {
    const { title, content } = req.body;
    const user = req.session.user;

    // Validate inputs
    if (!title || !content) {
      return res.render('question-form', {
        title: 'BDPADrive - Ask Question',
        user: user,
        error: 'Please provide both title and content'
      });
    }

    // In a real application, you would save this to the database via API
    console.log(`User ${user.username} asked a question: ${title}`);
    
    // Redirect to questions list with success message
    res.redirect('/questions?success=Question posted successfully');
  } catch (error) {
    console.error('Post question error:', error);
    res.render('question-form', {
      title: 'BDPADrive - Ask Question',
      user: req.session.user,
      error: 'An error occurred while posting your question'
    });
  }
});

/* GET specific question and answers */
router.get('/:id', function (req, res, next) {
  try {
    const questionId = parseInt(req.params.id);
    
    // Mock data for question and answers - in a real app, this would come from the API
    const question = {
      id: questionId,
      title: "How do I implement authentication in Node.js?",
      content: "I'm building a Node.js application and need to implement user authentication. What's the best approach? I've heard about various methods like JWT, sessions, and OAuth. Which one should I use and why?",
      author: "developer123",
      author_email: "developer123@example.com",
      votes: 5,
      created_at: new Date().toISOString()
    };

    const answers = [
      {
        id: 1,
        question_id: questionId,
        content: "For Node.js authentication, I recommend using JWT (JSON Web Tokens) with a library like jsonwebtoken. Here's why and how to implement it...",
        author: "authexpert",
        author_email: "authexpert@example.com",
        votes: 8,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        question_id: questionId,
        content: "Sessions are also a good option, especially if you're using Express.js. You can use express-session middleware...",
        author: "backenddev",
        author_email: "backenddev@example.com",
        votes: 3,
        created_at: new Date().toISOString()
      }
    ];

    // Generate gravatars for all users
    question.gravatar = cryptoUtils.generateGravatarUrl(question.author_email);
    answers.forEach(answer => {
      answer.gravatar = cryptoUtils.generateGravatarUrl(answer.author_email);
    });

    res.render('question-detail', {
      title: `BDPADrive - ${question.title}`,
      question: question,
      answers: answers,
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Question detail error:', error);
    res.status(404).render('error', {
      title: 'BDPADrive - Question Not Found',
      error: 'Question not found'
    });
  }
});

/* POST answer to question */
router.post('/:id/answer', auth.requireAuth, async function (req, res, next) {
  try {
    const questionId = parseInt(req.params.id);
    const { content } = req.body;
    const user = req.session.user;

    // Validate input
    if (!content) {
      return res.redirect(`/questions/${questionId}?error=Please provide an answer`);
    }

    // In a real application, you would save this to the database via API
    console.log(`User ${user.username} answered question ${questionId}`);
    
    // Redirect back to question with success message
    res.redirect(`/questions/${questionId}?success=Answer posted successfully`);
  } catch (error) {
    console.error('Post answer error:', error);
    res.redirect(`/questions/${req.params.id}?error=An error occurred while posting your answer`);
  }
});

/* POST vote on question */
router.post('/:id/vote', auth.requireAuth, async function (req, res, next) {
  try {
    const questionId = parseInt(req.params.id);
    const { type } = req.body; // 'up' or 'down'
    const user = req.session.user;

    // In a real application, you would save this to the database via API
    console.log(`User ${user.username} voted ${type} on question ${questionId}`);
    
    // Return JSON response for AJAX requests
    res.json({ success: true, message: 'Vote recorded' });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while voting' });
  }
});

/* POST vote on answer */
router.post('/:questionId/answers/:answerId/vote', auth.requireAuth, async function (req, res, next) {
  try {
    const questionId = parseInt(req.params.questionId);
    const answerId = parseInt(req.params.answerId);
    const { type } = req.body; // 'up' or 'down'
    const user = req.session.user;

    // In a real application, you would save this to the database via API
    console.log(`User ${user.username} voted ${type} on answer ${answerId} for question ${questionId}`);
    
    // Return JSON response for AJAX requests
    res.json({ success: true, message: 'Vote recorded' });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while voting' });
  }
});

module.exports = router;
