const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  guestLogin,
  getCurrentUser
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/guest-login', guestLogin);

// Protected routes
router.get('/me', auth, getCurrentUser);

module.exports = router;