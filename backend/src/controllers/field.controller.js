const { v4: uuidv4 } = require('uuid');
const db       = require('../config/db');
const cache    = require('../config/redis');
const auditLog = require('../middleware/auditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const CACHE_TTL = 300; // 5 minutes

// ── GET /api/fields ────────────────────────────────────────────
const getFields = async (req, res) => {
  try {
    const cacheKey = 'fields:all';
    const cached = await cache.get(cacheKey);
    if (cached) return sendSuccess(res, cached);

    const [fields] = await db.query(
      `SELECT f.*,
         (SELECT COUNT(*) FROM bookings b
          WHERE b.field_id = f.id AND b.status = 'approved'
            AND b.start_time > NOW() AND b.deleted_at IS NULL) as upcoming_bookings
       FROM fields f
       WHERE f.deleted_at IS NULL
       ORDER BY f.name ASC`
    );

    await cache.set(cacheKey, fields, CACHE_TTL);
    return sendSuccess(res, fields);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── GET /api/fields/:id ────────────────────────────────────────
const getField = async (req, res) => {
  try {
    const [[field]] = await db.query(
      'SELECT * FROM fields WHERE id = ? AND deleted_at IS NULL', [req.params.id]
    );
    if (!field) return sendError(res, 404, 'ไม่พบสนาม');
    return sendSuccess(res, field);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── GET /api/fields/:id/bookings?date=YYYY-MM-DD ──────────────
const getFieldBookings = async (req, res) => {
  try {
    const { date } = req.query;
    const fieldId = req.params.id;

    let query = `
      SELECT b.id, b.start_time, b.end_time, b.status, b.player_count,
             CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM bookings b JOIN users u ON u.id = b.user_id
      WHERE b.field_id = ? AND b.deleted_at IS NULL
        AND b.status NOT IN ('cancelled','rejected','no-show')
    `;
    const params = [fieldId];

    if (date) {
      query += ` AND DATE(b.start_time) = ?`;
      params.push(date);
    } else {
      // Default: next 30 days
      query += ` AND b.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)`;
    }
    query += ' ORDER BY b.start_time ASC';

    const [bookings] = await db.query(query, params);
    return sendSuccess(res, bookings);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── POST /api/fields (Admin) ───────────────────────────────────
const createField = async (req, res) => {
  try {
    const { name, description, location_lat, location_lng, location_name, image_url, max_players } = req.body;
    if (!name) return sendError(res, 422, 'กรุณากรอกชื่อสนาม');

    const id = uuidv4();
    await db.query(
      `INSERT INTO fields (id, name, description, location_lat, location_lng, location_name, image_url, max_players)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description || null, location_lat || null, location_lng || null,
       location_name || null, image_url || null, max_players || 6]
    );
    await cache.del('fields:all');
    await auditLog({ userId: req.user.id, action: 'CREATE', entityType: 'field', entityId: id,
      newValues: { name }, ipAddress: req.ip });

    const [[field]] = await db.query('SELECT * FROM fields WHERE id = ?', [id]);
    return sendSuccess(res, field, 'สร้างสนามสำเร็จ', 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/fields/:id (Admin) ───────────────────────────────
const updateField = async (req, res) => {
  try {
    const [[field]] = await db.query(
      'SELECT * FROM fields WHERE id = ? AND deleted_at IS NULL', [req.params.id]
    );
    if (!field) return sendError(res, 404, 'ไม่พบสนาม');

    const { name, description, location_lat, location_lng, location_name, image_url, status, max_players } = req.body;
    await db.query(
      `UPDATE fields SET
        name = COALESCE(?, name), description = COALESCE(?, description),
        location_lat = COALESCE(?, location_lat), location_lng = COALESCE(?, location_lng),
        location_name = COALESCE(?, location_name), image_url = COALESCE(?, image_url),
        status = COALESCE(?, status), max_players = COALESCE(?, max_players)
       WHERE id = ?`,
      [name || null, description || null, location_lat || null, location_lng || null,
       location_name || null, image_url || null, status || null, max_players || null, req.params.id]
    );
    await cache.del('fields:all');
    await auditLog({ userId: req.user.id, action: 'UPDATE', entityType: 'field',
      entityId: req.params.id, ipAddress: req.ip });

    const [[updated]] = await db.query('SELECT * FROM fields WHERE id = ?', [req.params.id]);
    return sendSuccess(res, updated, 'อัปเดตสนามสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── DELETE /api/fields/:id (Admin, soft delete) ───────────────
const deleteField = async (req, res) => {
  try {
    const [[field]] = await db.query(
      'SELECT * FROM fields WHERE id = ? AND deleted_at IS NULL', [req.params.id]
    );
    if (!field) return sendError(res, 404, 'ไม่พบสนาม');

    await db.query('UPDATE fields SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await cache.del('fields:all');
    await auditLog({ userId: req.user.id, action: 'DELETE', entityType: 'field',
      entityId: req.params.id, ipAddress: req.ip });

    return sendSuccess(res, null, 'ลบสนามสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

module.exports = { getFields, getField, getFieldBookings, createField, updateField, deleteField };
