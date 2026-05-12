const jwt = require('jsonwebtoken');
const db   = require('../config/db');
const { sendError } = require('../utils/apiResponse');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'ไม่มี token กรุณาเข้าสู่ระบบ');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Pull fresh user data (check if still active / not deleted)
    const [rows] = await db.query(
      'SELECT id, username, email, first_name, last_name, avatar_url, role, user_type, status, phone, student_id, signature_url FROM users WHERE id = ? AND deleted_at IS NULL',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return sendError(res, 401, 'บัญชีผู้ใช้ไม่มีอยู่หรือถูกระงับ');
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return sendError(res, 403, 'บัญชีของคุณยังไม่ได้รับการอนุมัติหรือถูกระงับการใช้งาน');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    }
    return sendError(res, 401, 'Token ไม่ถูกต้อง');
  }
};

module.exports = verifyToken;
