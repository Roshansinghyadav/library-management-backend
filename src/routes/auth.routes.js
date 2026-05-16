const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, changePassword, forgotPassword, verifyOtp, resetPassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// ── Routes ─────────────────────────────────────────────────────────────────
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.post('/login-test', (req, res) => {
  // Simple dev stub – returns success without DB checks
  res.json({ message: 'Login success (dev stub)' });
});


// ── Forgot Password OTP Flow (Public) ──────────────────────────────────────
router.post('/forgot-password', body('email').isEmail().withMessage('Valid email is required'), validate, forgotPassword);
router.post('/verify-otp', body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'), validate, verifyOtp);
router.post('/reset-password', body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'), validate, resetPassword);

module.exports = router;

