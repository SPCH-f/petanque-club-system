const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'คำขอมากเกินไป กรุณารอสักครู่' },
});

// Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'ลองเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที' },
});

// Booking creation
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'จองมากเกินไป กรุณารอ 1 นาที' },
});

module.exports = { apiLimiter, authLimiter, bookingLimiter };
