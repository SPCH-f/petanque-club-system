const router      = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const { isAdmin } = require('../middleware/isAdmin');
const {
  getDashboard, getUsers, updateUserRole, updateUserStatus,
  getAllBookings, getAuditLogs,
} = require('../controllers/admin.controller');
const {
  getAllLoans, approveLoan, rejectLoan, approveReturn
} = require('../controllers/ball.controller');

// All admin routes require auth + admin role
router.use(verifyToken, isAdmin);

router.get('/dashboard',      getDashboard);
router.get('/users',          getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.get('/bookings',       getAllBookings);
router.get('/audit-logs',     getAuditLogs);

// Ball Loans Management
router.get('/loans',           getAllLoans);
router.put('/loans/:id/approve', approveLoan);
router.put('/loans/:id/reject',  rejectLoan);
router.put('/loans/:id/approve-return', approveReturn);

module.exports = router;
