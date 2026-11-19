const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const validate = require('../middleware/validateMiddleware');
const protect = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
