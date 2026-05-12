const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'petanque_user',
    password: 'petanque_pass',
    database: 'petanque_db'
  });

  try {
    const passwordHash = await bcrypt.hash('1234', 12);

    const users = [
      {
        id: uuidv4(),
        username: 'somchai_k',
        email: 'somchai@example.com',
        password_hash: passwordHash,
        first_name: 'สมชาย',
        last_name: 'ขยันเรียน',
        student_id: '64010123',
        phone: '0812345678',
        role: 'user',
        user_type: 'นักศึกษา',
        status: 'pending'
      },
      {
        id: uuidv4(),
        username: 'somsri_s',
        email: 'somsri@example.com',
        password_hash: passwordHash,
        first_name: 'สมศรี',
        last_name: 'ใจดี',
        student_id: 'ST1002',
        phone: '0823456789',
        role: 'user',
        user_type: 'บุคลากร',
        status: 'active'
      },
      {
        id: uuidv4(),
        username: 'john_doe',
        email: 'john@external.com',
        password_hash: passwordHash,
        first_name: 'John',
        last_name: 'Doe',
        student_id: null,
        phone: '0834567890',
        role: 'user',
        user_type: 'บุคคลภายนอก',
        status: 'suspended'
      }
    ];

    console.log('Seeding sample users...');
    
    for (const u of users) {
      await connection.query(
        `INSERT INTO users (id, username, email, password_hash, first_name, last_name, student_id, phone, role, user_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name, u.student_id, u.phone, u.role, u.user_type, u.status]
      );
    }

    console.log('✅ Sample users seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  } finally {
    await connection.end();
  }
}

seedUsers();
