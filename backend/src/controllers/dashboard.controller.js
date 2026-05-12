const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getAdminStats = async (req, res) => {
  try {
    // 1. Booking Stats (Count by day - simpler)
    const [bookingStats] = await db.query(`
      SELECT DATE(start_time) as date, COUNT(*) as count 
      FROM bookings 
      WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
        AND deleted_at IS NULL
      GROUP BY DATE(start_time) 
      ORDER BY date ASC
    `);

    // 2. Field Popularity
    const [fieldPopularity] = await db.query(`
      SELECT f.name as field_name, COUNT(b.id) as booking_count
      FROM fields f
      LEFT JOIN bookings b ON f.id = b.field_id AND b.deleted_at IS NULL
      WHERE f.deleted_at IS NULL
      GROUP BY f.id, f.name
      ORDER BY booking_count DESC
    `);

    // 3. User Breakdown
    const [userStats] = await db.query(`
      SELECT user_type, COUNT(*) as count 
      FROM users 
      WHERE deleted_at IS NULL 
      GROUP BY user_type
    `);

    // 4. Pending Actions (Individual queries for safety)
    const [pBookings] = await db.query("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending' AND deleted_at IS NULL");
    const [pUsers] = await db.query("SELECT COUNT(*) as count FROM users WHERE status = 'pending' AND deleted_at IS NULL");
    const [pLoans] = await db.query("SELECT COUNT(*) as count FROM ball_loans WHERE status = 'pending'");

    // 5. Active Loans
    const [overdueLoans] = await db.query(`
      SELECT bl.id, bl.status, bl.loan_end, u.first_name, u.last_name, u.phone,
             CONCAT(b.brand, ' ', b.model, ' (', b.code, ')') as ball_name
      FROM ball_loans bl
      JOIN users u ON u.id = bl.user_id
      JOIN balls b ON b.id = bl.ball_id
      WHERE bl.status IN ('active', 'returning')
      ORDER BY bl.loan_end ASC LIMIT 10
    `);

    // 6. Overall Totals
    const [tUsers] = await db.query("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL");
    const [tFields] = await db.query("SELECT COUNT(*) as count FROM fields WHERE deleted_at IS NULL");
    const [tBalls] = await db.query("SELECT COUNT(*) as count FROM balls WHERE deleted_at IS NULL");

    return sendSuccess(res, {
      booking_trends: bookingStats,
      field_popularity: fieldPopularity,
      user_breakdown: userStats,
      pending: {
        bookings: pBookings[0].count,
        users: pUsers[0].count,
        loans: pLoans[0].count
      },
      active_loans: overdueLoans,
      totals: {
        users: tUsers[0].count,
        fields: tFields[0].count,
        balls: tBalls[0].count
      }
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติ');
  }
};

module.exports = { getAdminStats };
