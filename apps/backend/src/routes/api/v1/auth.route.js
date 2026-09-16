const express = require('express');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require('../../../controllers/auth.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authLimiter } = require('../../../middlewares/rateLimit.middleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('../../../validators/auth.validator');

const router = express.Router();

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', authLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', authLimiter, validateResetPassword, resetPassword);
router.post('/verify-email', verifyEmail);

module.exports = router;
