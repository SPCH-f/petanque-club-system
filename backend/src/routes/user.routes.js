const router      = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const db          = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/users/profile
router.get('/profile', verifyToken, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id,email,name,role,avatar_url,phone,student_id,department,created_at FROM users WHERE id=?',
    [req.user.id]
  );
  if (!rows.length) return sendError(res, 404, 'ไม่พบผู้ใช้');
  return sendSuccess(res, rows[0]);
});

// PUT /api/users/profile
router.put('/profile', verifyToken, async (req, res) => {
  const { name, phone, student_id, department } = req.body;
  await db.query(
    'UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), student_id=COALESCE(?,student_id), department=COALESCE(?,department) WHERE id=?',
    [name||null, phone||null, student_id||null, department||null, req.user.id]
  );
  const [rows] = await db.query(
    'SELECT id,email,name,role,avatar_url,phone,student_id,department FROM users WHERE id=?',
    [req.user.id]
  );
  return sendSuccess(res, rows[0], 'อัปเดตโปรไฟล์สำเร็จ');
});

module.exports = router;
