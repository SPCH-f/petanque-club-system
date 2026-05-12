const db = require('../config/db');

/**
 * Detect booking conflicts for a given field and time range.
 * Returns conflicting bookings if any.
 */
const detectConflict = async (fieldId, startTime, endTime, excludeBookingId = null) => {
  let query = `
    SELECT id, user_id, start_time, end_time, status
    FROM bookings
    WHERE field_id = ?
      AND deleted_at IS NULL
      AND status NOT IN ('cancelled', 'rejected', 'no-show')
      AND start_time < ?
      AND end_time   > ?
  `;
  const params = [fieldId, endTime, startTime];

  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

/**
 * Check if a time range is valid
 * - start must be before end
 * - start must be in the future (for new bookings)
 * - duration must be at least 30 minutes
 * - duration must not exceed 4 hours
 */
const validateTimeRange = (startTime, endTime, isNew = true) => {
  const start = new Date(startTime);
  const end   = new Date(endTime);
  const now   = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, message: 'เวลาไม่ถูกต้อง' };
  }
  if (end <= start) {
    return { valid: false, message: 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น' };
  }
  if (isNew && start <= now) {
    return { valid: false, message: 'ไม่สามารถจองเวลาในอดีต' };
  }

  const durationMinutes = (end - start) / 60000;
  if (durationMinutes < 30) {
    return { valid: false, message: 'ระยะเวลาจองต้องไม่น้อยกว่า 30 นาที' };
  }
  if (durationMinutes > 240) {
    return { valid: false, message: 'ระยะเวลาจองต้องไม่เกิน 4 ชั่วโมง' };
  }

  // Check max days ahead
  const maxDaysAhead = 30;
  const maxDate = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);
  if (start > maxDate) {
    return { valid: false, message: `จองล่วงหน้าได้ไม่เกิน ${maxDaysAhead} วัน` };
  }

  return { valid: true };
};

module.exports = { detectConflict, validateTimeRange };
