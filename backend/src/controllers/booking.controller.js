const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const cache = require('../config/redis');
const auditLog = require('../middleware/auditLog');
const { detectConflict, validateTimeRange } = require('../services/bookingConflict');
const {
  notifyBookingSuccess,
  notifyBookingApproved,
  notifyBookingRejected,
  notifyAdminsOfBooking
} = require('../services/notificationService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// ── POST /api/bookings ─────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const { field_id, start_time, end_time, player_count, notes } = req.body;
    if (!field_id || !start_time || !end_time) {
      return sendError(res, 422, 'กรุณาระบุ field_id, start_time และ end_time');
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    // 1. Validate time range
    const validation = validateTimeRange(startDate, endDate, true);
    if (!validation.valid) return sendError(res, 422, validation.message);

    // 2. Check field exists
    const [[field]] = await db.query(
      "SELECT * FROM fields WHERE id = ? AND deleted_at IS NULL AND status = 'active'",
      [field_id]
    );
    if (!field) return sendError(res, 404, 'ไม่พบสนามหรือสนามไม่พร้อมใช้งาน');

    // 2.1 Limit: 1 booking per day per user
    const dateString = startDate.toISOString().split('T')[0];
    const [[existingBooking]] = await db.query(
      `SELECT id FROM bookings 
       WHERE user_id = ? 
       AND start_time >= ? AND start_time < ? 
       AND status IN ('pending', 'approved', 'completed')
       AND deleted_at IS NULL`,
      [req.user.id, `${dateString} 00:00:00`, `${dateString} 23:59:59`]
    );
    if (existingBooking) {
      return sendError(res, 403, 'คุณมีการจองสนามในวันนี้แล้ว สามารถจองใหม่ได้อีกครั้งในวันถัดไป');
    }

    // 3. Detect conflicts (CRITICAL)
    const conflicts = await detectConflict(field_id, startDate, endDate);
    if (conflicts.length > 0) {
      return sendError(res, 409, 'ช่วงเวลานี้มีการจองซ้อนอยู่แล้ว กรุณาเลือกเวลาอื่น', {
        conflicts: conflicts.map(c => ({
          start_time: c.start_time,
          end_time: c.end_time,
          status: c.status,
        })),
      });
    }

    // 4. Create booking
    const id = uuidv4();

    await db.query(
      `INSERT INTO bookings (id, user_id, field_id, start_time, end_time, player_count, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, field_id, startDate, endDate, player_count || 1, notes || null]
    );

    // 5. Invalidate cache
    await cache.delPattern('bookings:field:*');

    // 6. Send notification
    await notifyBookingSuccess(req.user.id, field.name, start_time);
    await notifyAdminsOfBooking(req.user.first_name, field.name);

    await auditLog({
      userId: req.user.id, action: 'CREATE', entityType: 'booking', entityId: id,
      newValues: { field_id, start_time, end_time }, ipAddress: req.ip
    });

    const [[booking]] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    return sendSuccess(res, booking, 'ส่งคำขอจองสำเร็จ รอการอนุมัติจาก Admin', 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── GET /api/bookings (My bookings) ───────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let where = 'WHERE b.user_id = ? AND b.deleted_at IS NULL';
    const params = [req.user.id];
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM bookings b ${where}`, params
    );

    const [bookings] = await db.query(
      `SELECT b.*, f.name as field_name, f.location_name
       FROM bookings b JOIN fields f ON f.id = b.field_id
       ${where}
       ORDER BY b.start_time DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return sendPaginated(res, bookings, total, page, limit);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── GET /api/bookings/:id ──────────────────────────────────────
const getBooking = async (req, res) => {
  try {
    const [[booking]] = await db.query(
      `SELECT b.*, f.name as field_name, f.location_name, f.location_lat, f.location_lng,
             CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email
       FROM bookings b
       JOIN fields f ON f.id = b.field_id
       JOIN users  u ON u.id = b.user_id
       WHERE b.id = ? AND b.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!booking) return sendError(res, 404, 'ไม่พบการจอง');

    // Only owner or admin can view
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'ไม่มีสิทธิ์');
    }

    return sendSuccess(res, booking);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/bookings/:id/cancel (User) ────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const [[booking]] = await db.query(
      "SELECT * FROM bookings WHERE id = ? AND deleted_at IS NULL", [req.params.id]
    );
    if (!booking) return sendError(res, 404, 'ไม่พบการจอง');
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'ไม่มีสิทธิ์');
    }
    if (!['pending', 'approved'].includes(booking.status)) {
      return sendError(res, 409, `ไม่สามารถยกเลิกการจองที่มีสถานะ "${booking.status}"`);
    }

    // Cancel policy: must be X hours before
    const cancelBeforeHours = parseInt(process.env.CANCEL_BEFORE_HOURS || 2);
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const hoursLeft = (startTime - now) / (1000 * 60 * 60);

    if (req.user.role !== 'admin' && hoursLeft < cancelBeforeHours) {
      return sendError(res, 409,
        `ยกเลิกได้ก่อน ${cancelBeforeHours} ชั่วโมง (เหลือเวลา ${hoursLeft.toFixed(1)} ชั่วโมง)`
      );
    }

    const { reason } = req.body;
    await db.query(
      "UPDATE bookings SET status='cancelled', cancel_reason=?, cancelled_at=NOW() WHERE id=?",
      [reason || null, req.params.id]
    );
    await cache.delPattern('bookings:field:*');
    await auditLog({
      userId: req.user.id, action: 'CANCEL', entityType: 'booking',
      entityId: req.params.id, ipAddress: req.ip
    });

    return sendSuccess(res, null, 'ยกเลิกการจองสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/bookings/:id/status (Admin) ──────────────────────
const updateBookingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ['approved', 'rejected', 'completed', 'no-show'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 422, `status ต้องเป็น: ${validStatuses.join(', ')}`);
    }

    const [[booking]] = await db.query(
      `SELECT b.*, f.name as field_name FROM bookings b
       JOIN fields f ON f.id = b.field_id
       WHERE b.id = ? AND b.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!booking) return sendError(res, 404, 'ไม่พบการจอง');

    const updateFields = { status };
    if (status === 'approved') {
      updateFields.approved_by = req.user.id;
      updateFields.approved_at = new Date();
    }
    if (reason) updateFields.cancel_reason = reason;

    await db.query('UPDATE bookings SET ? WHERE id = ?', [updateFields, req.params.id]);
    await cache.delPattern('bookings:field:*');

    // Notify user
    if (status === 'approved') {
      await notifyBookingApproved(booking.user_id, booking.field_name, booking.start_time);
    } else if (status === 'rejected') {
      await notifyBookingRejected(booking.user_id, booking.field_name, reason);
    }

    await auditLog({
      userId: req.user.id, action: `BOOKING_${status.toUpperCase()}`,
      entityType: 'booking', entityId: req.params.id, ipAddress: req.ip
    });

    return sendSuccess(res, null, `อัปเดตสถานะเป็น "${status}" สำเร็จ`);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

const getAllBookings = async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) return sendError(res, 422, 'กรุณาระบุวันที่ (date)');

    const [bookings] = await db.query(
      `SELECT b.field_id, b.start_time, b.end_time, b.status, 
              CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.start_time >= ? AND b.start_time < ? 
         AND b.deleted_at IS NULL 
         AND b.status IN ('pending', 'approved', 'completed')`,
      [`${date} 00:00:00`, `${date} 23:59:59`]
    );

    return sendSuccess(res, bookings);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  updateBookingStatus,
  getAllBookings,
};
