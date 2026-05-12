const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ── GET /api/notifications ─────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?', [req.user.id]
    );
    const [[{ unread }]] = await db.query(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]
    );

    const [notifications] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    return res.json({
      success: true,
      data: notifications,
      unread,
      pagination: {
        total, page, limit, totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/notifications/:id/read ───────────────────────────
const markAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return sendSuccess(res, null, 'อ่านแล้ว');
  } catch (err) {
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/notifications/read-all ───────────────────────────
const markAllRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]
    );
    return sendSuccess(res, null, 'อ่านทั้งหมดแล้ว');
  } catch (err) {
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

module.exports = { getNotifications, markAsRead, markAllRead };
