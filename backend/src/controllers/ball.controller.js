const { v4: uuidv4 } = require('uuid');
const db       = require('../config/db');
const cache    = require('../config/redis');
const auditLog = require('../middleware/auditLog');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { 
  notifyAdminsOfLoan, 
  notifyLoanApproved, 
  notifyLoanRejected, 
  notifyLoanReturned 
} = require('../services/notificationService');

// ── GET /api/balls ─────────────────────────────────────────────
const getBalls = async (req, res) => {
  try {
    const statusFilter = req.query.status;
    let query  = 'SELECT * FROM balls WHERE deleted_at IS NULL';
    const params = [];
    if (statusFilter) { query += ' AND status = ?'; params.push(statusFilter); }
    query += ' ORDER BY brand ASC, model ASC, code ASC';

    const [balls] = await db.query(query, params);
    return sendSuccess(res, balls);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการโหลดข้อมูลลูกเปตอง');
  }
};

// ── POST /api/balls (Admin) ────────────────────────────────────
const createBall = async (req, res) => {
  try {
    const { brand, model, code, weight, diameter, pattern, image_url } = req.body;
    if (!brand || !model || !code) return sendError(res, 422, 'กรุณากรอก Brand, Model และ Code');

    const id = uuidv4();
    await db.query(
      `INSERT INTO balls (id, brand, model, code, weight, diameter, pattern, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, brand, model, code, weight || 0, diameter || 0, pattern || '', image_url || null]
    );
    await auditLog({ userId: req.user.id, action: 'CREATE', entityType: 'ball', entityId: id });

    const [[ball]] = await db.query('SELECT * FROM balls WHERE id = ?', [id]);
    return sendSuccess(res, ball, 'เพิ่มลูกเปตองสำเร็จ', 201);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'รหัสลูกเปตองนี้มีอยู่ในระบบแล้ว');
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/balls/:id (Admin) ────────────────────────────────
const updateBall = async (req, res) => {
  try {
    const [[ball]] = await db.query('SELECT * FROM balls WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (!ball) return sendError(res, 404, 'ไม่พบลูกเปตอง');

    const { brand, model, code, weight, diameter, pattern, image_url, status, condition_note } = req.body;
    await db.query(
      `UPDATE balls SET
        brand = COALESCE(?, brand), model = COALESCE(?, model),
        code = COALESCE(?, code), weight = COALESCE(?, weight),
        diameter = COALESCE(?, diameter), pattern = COALESCE(?, pattern),
        image_url = COALESCE(?, image_url), status = COALESCE(?, status), 
        condition_note = COALESCE(?, condition_note)
       WHERE id = ?`,
      [brand||null, model||null, code||null, weight||null, diameter||null,
       pattern||null, image_url||null, status||null, condition_note||null, req.params.id]
    );
    await auditLog({ userId: req.user.id, action: 'UPDATE', entityType: 'ball', entityId: req.params.id });

    const [[updated]] = await db.query('SELECT * FROM balls WHERE id = ?', [req.params.id]);
    return sendSuccess(res, updated, 'อัปเดตลูกเปตองสำเร็จ');
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'รหัสลูกเปตองนี้มีอยู่ในระบบแล้ว');
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── DELETE /api/balls/:id (Admin) ─────────────────────────────
const deleteBall = async (req, res) => {
  try {
    const [[ball]] = await db.query('SELECT * FROM balls WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (!ball) return sendError(res, 404, 'ไม่พบลูกเปตอง');

    await db.query('UPDATE balls SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await auditLog({ userId: req.user.id, action: 'DELETE', entityType: 'ball', entityId: req.params.id });
    return sendSuccess(res, null, 'ลบลูกเปตองสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── POST /api/balls/loans (ยืมลูก) ────────────────────────────
const loanBall = async (req, res) => {
  try {
    const { ball_id, loan_start, loan_end, notes } = req.body;
    if (!ball_id || !loan_end) return sendError(res, 422, 'กรุณาระบุ ball_id และเวลาคืน');

    const [[ball]] = await db.query(
      'SELECT * FROM balls WHERE id = ? AND deleted_at IS NULL', [ball_id]
    );
    if (!ball) return sendError(res, 404, 'ไม่พบลูกเปตอง');
    if (ball.status !== 'available') {
      return sendError(res, 409, `ลูกเปตองนี้ไม่พร้อมให้ยืม (สถานะ: ${ball.status})`);
    }

    // 2. Limit: 1 loan per day per user
    const start = loan_start ? new Date(loan_start) : new Date();
    const dateString = start.toISOString().split('T')[0];
    const [[existingLoan]] = await db.query(
      `SELECT id FROM ball_loans 
       WHERE user_id = ? 
       AND loan_start >= ? AND loan_start < ? 
       AND status IN ('pending', 'active', 'returning', 'returned')`,
      [req.user.id, `${dateString} 00:00:00`, `${dateString} 23:59:59`]
    );
    if (existingLoan) {
      return sendError(res, 403, 'คุณมีการยืมลูกเปตองในวันนี้แล้ว สามารถยืมใหม่ได้อีกครั้งในวันถัดไป');
    }

    const loanId = uuidv4();
    
    await db.query(
      `INSERT INTO ball_loans (id, user_id, ball_id, loan_start, loan_end, status, notes)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [loanId, req.user.id, ball_id, start, new Date(loan_end), notes || null]
    );
    
    await db.query("UPDATE balls SET status = 'reserved' WHERE id = ?", [ball_id]);
    
    const userName = `${req.user.first_name} ${req.user.last_name}`;
    await notifyAdminsOfLoan(userName, `${ball.brand} ${ball.model} (${ball.code})`);
    await auditLog({ userId: req.user.id, action: 'LOAN_REQUEST', entityType: 'ball', entityId: ball_id });

    const [[loan]] = await db.query('SELECT * FROM ball_loans WHERE id = ?', [loanId]);
    return sendSuccess(res, loan, 'ส่งคำขอยืมลูกเปตองสำเร็จ กรุณารอแอดมินอนุมัติ', 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── GET /api/admin/loans (Admin) ──────────────────────────────
const getAllLoans = async (req, res) => {
  try {
    const [loans] = await db.query(
      `SELECT bl.*, 
              CONCAT(b.brand, ' ', b.model, ' (', b.code, ')') as ball_name,
              CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email,
              CONCAT(admin_u.first_name, ' ', admin_u.last_name) as return_admin_name
       FROM ball_loans bl 
       JOIN balls b ON b.id = bl.ball_id
       JOIN users u ON u.id = bl.user_id
       LEFT JOIN users admin_u ON admin_u.id = bl.return_approved_by
       ORDER BY bl.created_at DESC`
    );
    return sendSuccess(res, loans);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/admin/loans/:id/approve (Admin) ──────────────────
const approveLoan = async (req, res) => {
  try {
    const [[loan]] = await db.query("SELECT * FROM ball_loans WHERE id = ?", [req.params.id]);
    if (!loan) return sendError(res, 404, 'ไม่พบรายการยืม');
    
    await db.query("UPDATE ball_loans SET status = 'active', approved_by = ? WHERE id = ?", [req.user.id, req.params.id]);
    await db.query("UPDATE balls SET status = 'borrowed' WHERE id = ?", [loan.ball_id]);
    
    // Notify user
    const [[ball]] = await db.query("SELECT brand, model, code FROM balls WHERE id = ?", [loan.ball_id]);
    await notifyLoanApproved(loan.user_id, `${ball.brand} ${ball.model} (${ball.code})`);

    await auditLog({ userId: req.user.id, action: 'APPROVE_LOAN', entityType: 'ball_loan', entityId: req.params.id });
    return sendSuccess(res, null, 'อนุมัติการยืมสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/admin/loans/:id/reject (Admin) ──────────────────
const rejectLoan = async (req, res) => {
  try {
    const [[loan]] = await db.query("SELECT * FROM ball_loans WHERE id = ?", [req.params.id]);
    if (!loan) return sendError(res, 404, 'ไม่พบรายการยืม');
    
    await db.query("UPDATE ball_loans SET status = 'rejected', approved_by = ? WHERE id = ?", [req.user.id, req.params.id]);
    await db.query("UPDATE balls SET status = 'available' WHERE id = ?", [loan.ball_id]);
    
    // Notify user
    const [[ball]] = await db.query("SELECT brand, model, code FROM balls WHERE id = ?", [loan.ball_id]);
    await notifyLoanRejected(loan.user_id, `${ball.brand} ${ball.model} (${ball.code})`, req.body.reason);

    await auditLog({ userId: req.user.id, action: 'REJECT_LOAN', entityType: 'ball_loan', entityId: req.params.id });
    return sendSuccess(res, null, 'ปฏิเสธการยืมแล้ว');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/balls/loans/:id/return ────────────────────────────
const returnBall = async (req, res) => {
  try {
    const [[loan]] = await db.query(
      "SELECT * FROM ball_loans WHERE id = ? AND status = 'active'", [req.params.id]
    );
    if (!loan) return sendError(res, 404, 'ไม่พบรายการยืมที่กำลังใช้งาน');
    if (loan.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'ไม่มีสิทธิ์');
    }

    await db.query(
      "UPDATE ball_loans SET status = 'returning', returned_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    // Note: ball.status stays 'borrowed' until admin approves return
    await auditLog({ userId: req.user.id, action: 'RETURN_REQUEST', entityType: 'ball', entityId: loan.ball_id });

    return sendSuccess(res, null, 'แจ้งคืนอุปกรณ์สำเร็จ กรุณานำลูกเปตองไปคืนแอดมินเพื่อยืนยัน');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/admin/loans/:id/approve-return (Admin) ────────────
const approveReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const [[loan]] = await db.query("SELECT * FROM ball_loans WHERE id = ?", [id]);
    
    if (!loan) return sendError(res, 404, 'ไม่พบรายการยืม');
    if (loan.status !== 'returning' && loan.status !== 'active') {
      return sendError(res, 400, 'รายการนี้ไม่ได้อยู่ในสถานะรอการคืน');
    }

    // Get admin signature
    const [adminRows] = await db.query('SELECT signature_url FROM users WHERE id = ?', [req.user.id]);
    const signature = adminRows[0]?.signature_url;

    if (!signature) {
      return sendError(res, 400, 'แอดมินยังไม่ได้อัปโหลดลายเซ็น กรุณาไปอัปโหลดในหน้าโปรไฟล์ก่อน');
    }

    // Normalize signature to relative path
    const normalizedSignature = signature && signature.includes('/uploads/') 
      ? '/uploads/' + signature.split('/uploads/').pop() 
      : signature;
      
    await db.query(
      `UPDATE ball_loans SET 
       status = 'returned', 
       return_approved_by = ?, 
       return_admin_signature = ?, 
       returned_at = COALESCE(returned_at, NOW()) 
       WHERE id = ?`,
      [req.user.id, normalizedSignature, id]
    );

    // Set ball back to available
    await db.query("UPDATE balls SET status = 'available' WHERE id = ?", [loan.ball_id]);

    // Notify user
    const [[ball]] = await db.query("SELECT brand, model, code FROM balls WHERE id = ?", [loan.ball_id]);
    await notifyLoanReturned(loan.user_id, `${ball.brand} ${ball.model} (${ball.code})`);

    await auditLog({ userId: req.user.id, action: 'APPROVE_RETURN', entityType: 'ball_loan', entityId: id });
    return sendSuccess(res, null, 'ยืนยันการรับคืนอุปกรณ์และลงลายเซ็นเรียบร้อย');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── GET /api/balls/loans (User's loans) ───────────────────────
const getMyLoans = async (req, res) => {
  try {
    const userId = req.user.id;
    const [loans] = await db.query(
      `SELECT bl.*, 
              b.brand, b.model, b.code, b.weight, b.diameter,
              CONCAT(b.brand, ' ', b.model, ' (', b.code, ')') as ball_name
       FROM ball_loans bl JOIN balls b ON b.id = bl.ball_id
       WHERE bl.user_id = ?
       ORDER BY bl.created_at DESC`,
      [userId]
    );
    return sendSuccess(res, loans);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

module.exports = { 
  getBalls, createBall, updateBall, deleteBall, 
  loanBall, returnBall, getMyLoans,
  getAllLoans, approveLoan, rejectLoan, approveReturn
};
