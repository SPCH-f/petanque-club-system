const router      = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const { isAdmin, isUser } = require('../middleware/isAdmin');
const { bookingLimiter } = require('../middleware/rateLimiter');
const {
  createBooking, getMyBookings, getBooking,
  cancelBooking, updateBookingStatus, getAllBookings
} = require('../controllers/booking.controller');

router.post('/',               verifyToken, isUser, bookingLimiter, createBooking);
router.get('/',                verifyToken, isUser, getMyBookings);
router.get('/calendar',        verifyToken, getAllBookings);
router.get('/:id',             verifyToken, isUser, getBooking);
router.put('/:id/cancel',      verifyToken, isUser, cancelBooking);
router.put('/:id/status',      verifyToken, isAdmin, updateBookingStatus);

module.exports = router;
