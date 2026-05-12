const router   = require('express').Router();
const { authLimiter } = require('../middleware/rateLimiter');
const validate        = require('../middleware/validate');
const verifyToken     = require('../middleware/verifyToken');
const {
  register, registerRules,
  login,    loginRules,
  refreshToken,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');

// Email/password auth
router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login',    authLimiter, loginRules,    validate, login);
router.post('/refresh',  refreshToken);

// Password recovery
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password',  authLimiter, resetPassword);

// Me
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
