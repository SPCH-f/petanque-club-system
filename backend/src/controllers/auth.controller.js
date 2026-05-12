const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body }       = require('express-validator');
const db             = require('../config/db');
const crypto         = require('crypto');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const auditLog = require('../middleware/auditLog');
const { sendResetPasswordEmail } = require('../services/emailService');

// ── Helpers ──────────────────────────────────────────────────
const generateTokens = (user) => {
  const payload = { userId: user.id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const safeUser = (user) => ({
  id:         user.id,
  username:   user.username,
  email:      user.email,
  first_name: user.first_name,
  last_name:  user.last_name,
  avatar_url: user.avatar_url,
  role:       user.role,
  user_type:  user.user_type,
  status:     user.status,
  student_id: user.student_id,
  phone:      user.phone,
  signature_url: user.signature_url,
  created_at: user.created_at,
});

const normalizeUrl = (url) => {
  if (!url) return url;
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    return '/uploads/' + parts[parts.length - 1];
  }
  return url;
};

// ── Validation rules ──────────────────────────────────────────
const registerRules = [
  body('username').trim().isLength({ min: 4 }).withMessage('Username ต้องมีอย่างน้อย 4 ตัวอักษร'),
  body('email').isEmail().normalizeEmail().withMessage('อีเมลไม่ถูกต้อง'),
  body('password').isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  body('first_name').trim().notEmpty().withMessage('กรุณากรอกชื่อจริง'),
  body('last_name').trim().notEmpty().withMessage('กรุณากรอกนามสกุล'),
  body('user_type').isIn(['นักศึกษา', 'บุคลากร', 'บุคคลภายนอก']).withMessage('ประเภทผู้ใช้ไม่ถูกต้อง'),
];

const loginRules = [
  body('account').notEmpty().withMessage('กรุณากรอก Username หรือ Email'),
  body('password').notEmpty().withMessage('กรุณากรอกรหัสผ่าน'),
];

// ── Controllers ───────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { 
      username, email, password, first_name, last_name, 
      phone, student_id, user_type 
    } = req.body;

    // Check existing username
    const [userExist] = await db.query('SELECT id FROM users WHERE username = ? AND deleted_at IS NULL', [username]);
    if (userExist.length > 0) return sendError(res, 409, 'Username นี้ถูกใช้งานแล้ว');

    // Check existing email
    const [emailExist] = await db.query('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
    if (emailExist.length > 0) return sendError(res, 409, 'อีเมลนี้ถูกใช้งานแล้ว');

    // Check existing student_id
    if (student_id) {
      const [idExist] = await db.query('SELECT id FROM users WHERE student_id = ? AND deleted_at IS NULL', [student_id]);
      if (idExist.length > 0) return sendError(res, 409, 'เลขประจำตัวนี้ถูกลงทะเบียนไว้แล้ว');
    }

    // Check existing phone
    if (phone) {
      const [phoneExist] = await db.query('SELECT id FROM users WHERE phone = ? AND deleted_at IS NULL', [phone]);
      if (phoneExist.length > 0) return sendError(res, 409, 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว');
    }

    const password_hash = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await db.query(
      `INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone, student_id, user_type, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'active')`,
      [id, username, email, password_hash, first_name, last_name, phone || null, student_id || null, user_type]
    );

    await auditLog({ 
      userId: id, action: 'REGISTER', entityType: 'user', entityId: id,
      newValues: { username, email, first_name, last_name }, ipAddress: req.ip 
    });

    return sendSuccess(res, null, 'ลงทะเบียนสำเร็จ สามารถเข้าสู่ระบบได้ทันที', 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการลงทะเบียน');
  }
};

const login = async (req, res) => {
  try {
    const { account, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND deleted_at IS NULL', 
      [account, account]
    );
    if (rows.length === 0) {
      return sendError(res, 401, 'Username/Email หรือรหัสผ่านไม่ถูกต้อง');
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return sendError(res, 401, 'Username/Email หรือรหัสผ่านไม่ถูกต้อง');

    if (user.status === 'suspended') {
      return sendError(res, 403, 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
    }

    const tokens = generateTokens(user);

    await auditLog({ 
      userId: user.id, action: 'LOGIN', entityType: 'user', entityId: user.id,
      ipAddress: req.ip, userAgent: req.get('User-Agent') 
    });

    return sendSuccess(res, { ...tokens, user: safeUser(user) }, 'เข้าสู่ระบบสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 401, 'ไม่มี refresh token');

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      [decoded.userId]
    );
    if (rows.length === 0) return sendError(res, 401, 'ไม่พบผู้ใช้');

    const tokens = generateTokens(rows[0]);
    return sendSuccess(res, { ...tokens, user: safeUser(rows[0]) });
  } catch {
    return sendError(res, 401, 'Refresh token ไม่ถูกต้องหรือหมดอายุ');
  }
};

const getMe = async (req, res) => {
  return sendSuccess(res, safeUser(req.user));
};

const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, avatar_url, signature_url, phone, student_id } = req.body;
    const updates = [];
    const params = [];

    // Helper to add update field
    const addField = (name, value, isRequired = false) => {
      if (value !== undefined) {
        updates.push(`${name} = ?`);
        // If required and empty, don't use null
        if (isRequired && (value === null || value === "")) {
          params.push(req.user[name]); // Use existing value if new one is empty
        } else {
          params.push(value === "" ? null : value);
        }
      }
    };

    addField('first_name', first_name, true);
    addField('last_name', last_name, true);
    addField('avatar_url', normalizeUrl(avatar_url));
    addField('signature_url', normalizeUrl(signature_url));
    addField('phone', phone);
    addField('student_id', student_id);

    if (updates.length === 0) {
      return sendSuccess(res, safeUser(req.user), 'ไม่มีข้อมูลที่เปลี่ยนแปลง');
    }

    params.push(req.user.id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.query(query, params);

    // Fetch updated user
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0]) return sendError(res, 404, 'ไม่พบข้อมูลผู้ใช้');
    
    const updatedUser = rows[0];

    try {
      await auditLog({ 
        userId: req.user.id, action: 'UPDATE_PROFILE', entityType: 'user', entityId: req.user.id,
        newValues: req.body, ipAddress: req.ip 
      });
    } catch (e) { console.error('Audit Log Error:', e); }

    return sendSuccess(res, safeUser(updatedUser), 'อัปเดตโปรไฟล์สำเร็จ');
  } catch (err) {
    console.error('CRITICAL UPDATE PROFILE ERROR:', err.message);
    console.error('Stack:', err.stack);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์: ' + err.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { identifier, newEmail, student_id, phone } = req.body;
    if (!identifier) return sendError(res, 400, 'กรุณากรอก Username หรือ Email');

    // Find user by username or email
    const [users] = await db.query(
      'SELECT id, email, student_id, phone FROM users WHERE (username = ? OR email = ?) AND deleted_at IS NULL', 
      [identifier, identifier]
    );

    if (users.length === 0) {
      return sendSuccess(res, null, 'หากข้อมูลถูกต้อง เราได้ดำเนินการส่งลิงก์ไปให้ท่านแล้ว');
    }

    const user = users[0];

    // Case: User wants to use a NEW email because they forgot the old one
    if (newEmail) {
      if (!student_id || !phone) {
        return sendError(res, 400, 'กรุณากรอกเลขประจำตัวและเบอร์โทรศัพท์เพื่อยืนยันตัวตน');
      }

      // Verify identity
      if (user.student_id !== student_id || user.phone !== phone) {
        return sendError(res, 401, 'ข้อมูลยืนยันตัวตนไม่ถูกต้อง');
      }

      // Check if new email is already used by someone else
      const [emailExist] = await db.query(
        'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
        [newEmail, user.id]
      );
      if (emailExist.length > 0) {
        return sendError(res, 409, 'อีเมลใหม่นี้ถูกใช้งานในระบบแล้ว');
      }

      // Update to new email
      await db.query('UPDATE users SET email = ? WHERE id = ?', [newEmail, user.id]);
      user.email = newEmail;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [token, expires, user.id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await sendResetPasswordEmail(user.email, resetUrl);

    await auditLog({ 
      userId: user.id, action: 'FORGOT_PASSWORD_REQUEST', entityType: 'user', entityId: user.id,
      details: newEmail ? `Email updated to ${newEmail} during recovery` : 'Standard recovery',
      ipAddress: req.ip 
    });

    const responseData = process.env.NODE_ENV === 'development' ? { resetUrl } : null;

    return sendSuccess(res, responseData, `เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมล ${newEmail ? 'ใหม่' : ''}ของคุณแล้ว`);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการดำเนินการ');
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return sendError(res, 400, 'ข้อมูลไม่ครบถ้วน');

    const [users] = await db.query(
      'SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW() AND deleted_at IS NULL',
      [token]
    );

    if (users.length === 0) {
      return sendError(res, 400, 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ');
    }

    const user = users[0];
    const password_hash = await bcrypt.hash(password, 12);

    await db.query(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [password_hash, user.id]
    );

    await auditLog({ 
      userId: user.id, action: 'RESET_PASSWORD_SUCCESS', entityType: 'user', entityId: user.id,
      ipAddress: req.ip 
    });

    return sendSuccess(res, null, 'เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว สามารถเข้าสู่ระบบได้ทันที');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
  }
};

module.exports = {
  register, registerRules,
  login,    loginRules,
  refreshToken,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
};
