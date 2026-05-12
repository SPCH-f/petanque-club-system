const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /committee?year=2569
const getCommittee = async (req, res) => {
  try {
    const year = req.query.year || 2569;
    const [rows] = await db.query(
      `SELECT * FROM committee_members 
       WHERE academic_year = ?
       ORDER BY sort_order ASC`,
      [year]
    );
    return sendSuccess(res, rows);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการดึงข้อมูลกรรมการ');
  }
};

// GET /committee/years — distinct years
const getYears = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT academic_year FROM committee_members ORDER BY academic_year DESC'
    );
    return sendSuccess(res, rows.map(r => r.academic_year));
  } catch (err) {
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// POST /committee
const createMember = async (req, res) => {
  try {
    const { prefix, name, nickname, position, position_en, category, photo_url, sort_order, academic_year } = req.body;
    if (!name || !position || !category) return sendError(res, 400, 'กรุณากรอกข้อมูลให้ครบถ้วน');

    const id = uuidv4();
    await db.query(
      `INSERT INTO committee_members 
       (id, prefix, name, nickname, position, position_en, category, photo_url, sort_order, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, prefix || 'นาย', name, nickname || null, position, position_en || null,
       category, photo_url || null, sort_order || 0, academic_year || 2569]
    );

    const [rows] = await db.query('SELECT * FROM committee_members WHERE id = ?', [id]);
    return sendSuccess(res, rows[0], 'เพิ่มกรรมการสำเร็จ', 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการเพิ่มกรรมการ');
  }
};

// PUT /committee/:id
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = ['prefix', 'name', 'nickname', 'position', 'position_en', 'category', 'photo_url', 'sort_order', 'academic_year', 'is_active'];
    const updates = [];
    const params = [];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field] === '' ? null : req.body[field]);
      }
    });

    if (updates.length === 0) return sendError(res, 400, 'ไม่มีข้อมูลที่เปลี่ยนแปลง');
    params.push(id);

    await db.query(`UPDATE committee_members SET ${updates.join(', ')} WHERE id = ?`, params);
    const [rows] = await db.query('SELECT * FROM committee_members WHERE id = ?', [id]);
    if (!rows[0]) return sendError(res, 404, 'ไม่พบกรรมการ');

    return sendSuccess(res, rows[0], 'อัปเดตข้อมูลสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการอัปเดต');
  }
};

// DELETE /committee/:id
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id FROM committee_members WHERE id = ?', [id]);
    if (!rows[0]) return sendError(res, 404, 'ไม่พบกรรมการ');

    await db.query('DELETE FROM committee_members WHERE id = ?', [id]);
    return sendSuccess(res, null, 'ลบกรรมการสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการลบ');
  }
};

// PUT /committee/reorder — bulk update sort_order
const reorderMembers = async (req, res) => {
  try {
    const { orders } = req.body; // [{ id, sort_order }, ...]
    if (!Array.isArray(orders)) return sendError(res, 400, 'ข้อมูลไม่ถูกต้อง');

    for (const item of orders) {
      await db.query('UPDATE committee_members SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
    return sendSuccess(res, null, 'อัปเดตลำดับสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

module.exports = { getCommittee, getYears, createMember, updateMember, deleteMember, reorderMembers };
