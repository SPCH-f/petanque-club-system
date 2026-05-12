require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./src/config/db');

const changeAdminPassword = async () => {
  const newPassword = process.argv[2];
  const email = 'admin@ubu.ac.th';

  if (!newPassword) {
    console.error('❌ กรุณาระบุรหัสผ่านใหม่ที่ต้องการด้วยครับ เช่น: node change-password.js MyNewPassword123');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(newPassword, 12);
    const [result] = await db.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);

    if (result.affectedRows > 0) {
      console.log(`✅ เปลี่ยนรหัสผ่านของแอดมิน (${email}) เป็น "${newPassword}" สำเร็จแล้ว!`);
    } else {
      console.log(`❌ ไม่พบบัญชีแอดมินนี้ในระบบ`);
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error.message);
  } finally {
    process.exit();
  }
};

changeAdminPassword();
