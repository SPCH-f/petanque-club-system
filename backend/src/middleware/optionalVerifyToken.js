const jwt = require('jsonwebtoken');
const db   = require('../config/db');

const optionalVerifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.query(
      'SELECT id, username, email, first_name, last_name, avatar_url, role, user_type, status, phone, student_id, signature_url FROM users WHERE id = ? AND deleted_at IS NULL',
      [decoded.userId]
    );

    if (rows.length > 0 && rows[0].status === 'active') {
      req.user = rows[0];
    } else {
      req.user = null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

module.exports = optionalVerifyToken;
