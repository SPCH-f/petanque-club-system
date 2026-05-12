const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBookings() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'petanque_user',
    password: process.env.DB_PASSWORD || 'petanque_pass',
    database: process.env.DB_NAME || 'petanque_db'
  });

  try {
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM bookings');
    const [[{ total_deleted }]] = await connection.execute('SELECT COUNT(*) as total_deleted FROM bookings WHERE deleted_at IS NOT NULL');
    const [[{ pending }]] = await connection.execute("SELECT COUNT(*) as pending FROM bookings WHERE status = 'pending' AND deleted_at IS NULL");
    const [[{ approved }]] = await connection.execute("SELECT COUNT(*) as approved FROM bookings WHERE status = 'approved' AND deleted_at IS NULL");

    console.log('--- ข้อมูลการจองในฐานข้อมูล ---');
    console.log(`จำนวนแถวทั้งหมด: ${rows[0].count} แถว`);
    console.log(`- รออนุมัติ (pending): ${pending} แถว`);
    console.log(`- อนุมัติแล้ว (approved): ${approved} แถว`);
    console.log(`- ถูกลบ (deleted): ${total_deleted} แถว`);
    console.log('---------------------------');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkBookings();
