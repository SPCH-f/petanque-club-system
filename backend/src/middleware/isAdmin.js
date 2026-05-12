const { sendError } = require('../utils/apiResponse');

const isAdmin = (req, res, next) => {
  if (!req.user) return sendError(res, 401, 'ไม่ได้เข้าสู่ระบบ');
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (ต้องการสิทธิ์ Admin)');
  }
  next();
};

const isUser = (req, res, next) => {
  if (!req.user) return sendError(res, 401, 'ไม่ได้เข้าสู่ระบบ');
  // At this point, verifyToken has already ensured the user is 'active'
  next();
};

module.exports = { isAdmin, isUser };
