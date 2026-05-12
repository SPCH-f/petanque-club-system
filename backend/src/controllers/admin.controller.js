const db       = require('../config/db');
const auditLog = require('../middleware/auditLog');
const { notifyRoleChanged } = require('../services/notificationService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// ── GET /api/admin/dashboard ───────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const [[{ total_users }]]    = await db.query("SELECT COUNT(*) as total_users FROM users WHERE deleted_at IS NULL AND status = 'active'");
    const [[{ total_bookings }]] = await db.query('SELECT COUNT(*) as total_bookings FROM bookings WHERE deleted_at IS NULL');
    const [[{ total_loans }]]    = await db.query('SELECT COUNT(*) as total_loans FROM ball_loans');
    const [[{ pending_bookings }]] = await db.query("SELECT COUNT(*) as pending_bookings FROM bookings WHERE status='pending' AND deleted_at IS NULL");
    const [[{ pending_users }]]  = await db.query("SELECT COUNT(*) as pending_users FROM users WHERE status='pending' AND deleted_at IS NULL");

    // Bookings per day (last 30 days)
    const [bookingsPerDay] = await db.query(
      `SELECT DATE(start_time) as date, COUNT(*) as count
       FROM bookings
       WHERE start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND deleted_at IS NULL
       GROUP BY DATE(start_time)
       ORDER BY date ASC`
    );

    // Bookings by status
    const [bookingsByStatus] = await db.query(
      `SELECT status, COUNT(*) as count
       FROM bookings WHERE deleted_at IS NULL
       GROUP BY status`
    );

    // Popular fields (top 5)
    const [popularFields] = await db.query(
      `SELECT f.name, COUNT(b.id) as booking_count
       FROM bookings b JOIN fields f ON f.id = b.field_id
       WHERE b.deleted_at IS NULL AND b.status IN ('approved','completed')
       GROUP BY f.id, f.name
       ORDER BY booking_count DESC
       LIMIT 5`
    );

    // Bookings by hour (peak usage)
    const [peakHours] = await db.query(
      `SELECT HOUR(start_time) as hour, COUNT(*) as count
       FROM bookings
       WHERE deleted_at IS NULL AND status IN ('approved','completed')
       GROUP BY HOUR(start_time)
       ORDER BY hour ASC`
    );

    return sendSuccess(res, {
      stats: {
        total_users,
        total_bookings,
        total_loans,
        pending_bookings,
        pending_users,
      },
      charts: {
        bookingsPerDay,
        bookingsByStatus,
        popularFields,
        peakHours,
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard');
  }
};

// ── GET /api/admin/users ───────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const role   = req.query.role;
    const status = req.query.status;
    const search = req.query.search;

    let where = 'WHERE deleted_at IS NULL';
    const params = [];
    if (role)   { where += ' AND role = ?'; params.push(role); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (search) { 
      where += ' AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)'; 
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); 
    }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM users ${where}`, params);
    const [users] = await db.query(
      `SELECT id, username, email, first_name, last_name, role, user_type, status, student_id, phone, avatar_url, created_at
       FROM users ${where}
       ORDER BY (status = 'pending') DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return sendPaginated(res, users, total, page, limit);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการโหลดรายชื่อผู้ใช้');
  }
};

// ── PUT /api/admin/users/:id/role ─────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return sendError(res, 422, 'role ต้องเป็น: user หรือ admin');
    }

    const [[targetUser]] = await db.query(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [req.params.id]
    );
    if (!targetUser) return sendError(res, 404, 'ไม่พบผู้ใช้');

    if (req.params.id === req.user.id && role !== 'admin') {
      return sendError(res, 409, 'ไม่สามารถลดสิทธิ์ตัวเองได้');
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    await notifyRoleChanged(req.params.id, role);
    await auditLog({
      userId: req.user.id, action: 'UPDATE_ROLE', entityType: 'user',
      entityId: req.params.id, oldValues: { role: targetUser.role },
      newValues: { role }, ipAddress: req.ip,
    });

    return sendSuccess(res, null, `เปลี่ยนสิทธิ์เป็น "${role}" สำเร็จ`);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/admin/users/:id/status ───────────────────────────
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'pending', 'suspended'].includes(status)) {
      return sendError(res, 422, 'สถานะไม่ถูกต้อง');
    }

    const [[targetUser]] = await db.query(
      'SELECT status FROM users WHERE id = ? AND deleted_at IS NULL', [req.params.id]
    );
    if (!targetUser) return sendError(res, 404, 'ไม่พบผู้ใช้');

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    await auditLog({
      userId: req.user.id, action: 'UPDATE_STATUS', entityType: 'user',
      entityId: req.params.id, oldValues: { status: targetUser.status },
      newValues: { status }, ipAddress: req.ip,
    });

    return sendSuccess(res, null, `อัปเดตสถานะเป็น "${status}" สำเร็จ`);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── GET /api/admin/bookings ────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let where = 'WHERE b.deleted_at IS NULL';
    const params = [];
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM bookings b ${where}`, params);
    const [bookings] = await db.query(
      `SELECT b.*, f.name as field_name, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email
       FROM bookings b
       JOIN fields f ON f.id = b.field_id
       JOIN users  u ON u.id = b.user_id
       ${where}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return sendPaginated(res, bookings, total, page, limit);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── GET /api/admin/audit-logs ─────────────────────────────────
const getAuditLogs = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM audit_logs');
    const [logs] = await db.query(
      `SELECT al.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return sendPaginated(res, logs, total, page, limit);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

module.exports = {
  getDashboard,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getAllBookings,
  getAuditLogs,
};
