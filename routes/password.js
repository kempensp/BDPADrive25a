const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const usersFile = path.join(__dirname, '../config/users.json');

// Helper: load users
function loadUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile));
}
// Helper: save users
function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Request password reset form
router.get('/forgot', (req, res) => {
  res.render('forgot', { title: 'Forgot Password' });
});

// Handle password reset request
router.post('/forgot', (req, res) => {
  const { email } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.render('forgot', { title: 'Forgot Password', error: 'No account with that email.' });
  // Generate token
  const token = crypto.randomBytes(20).toString('hex');
  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 3600000; // 1 hour
  saveUsers(users);
  // Simulate sending email
  const resetLink = `http://localhost:3000/reset/${token}`;
  console.log(`Simulated email to ${email}:\nReset your password: ${resetLink}`);
  res.render('forgot', { title: 'Forgot Password', message: 'A password reset link has been sent (see console).' });
});

// Reset password form
router.get('/reset/:token', (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.resetToken === req.params.token && u.resetTokenExpires > Date.now());
  if (!user) return res.render('reset', { error: 'Invalid or expired token.' });
  res.render('reset', { token: req.params.token });
});

// Handle new password
router.post('/reset/:token', (req, res) => {
  const { password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.resetToken === req.params.token && u.resetTokenExpires > Date.now());
  if (!user) return res.render('reset', { error: 'Invalid or expired token.' });
  user.password = password; // In production, hash this!
  delete user.resetToken;
  delete user.resetTokenExpires;
  saveUsers(users);
  res.render('reset', { message: 'Password has been reset. You can now log in.' });
});

module.exports = router;
