const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateAdmin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'petanque_user',
    password: 'petanque_pass',
    database: 'petanque_db'
  });

  try {
    const newUsername = 'adminpt';
    const newPassword = '1234';
    const passwordHash = await bcrypt.hash(newPassword, 12);

    console.log(`Updating admin credentials...`);
    
    await connection.query(
      'UPDATE users SET username = ?, password_hash = ? WHERE id = ?',
      [newUsername, passwordHash, '00000000-0000-0000-0000-000000000001']
    );

    console.log('✅ Admin credentials updated successfully!');
    console.log(`Username: ${newUsername}`);
    console.log(`Password: ${newPassword}`);
  } catch (err) {
    console.error('❌ Update failed:', err.message);
  } finally {
    await connection.end();
  }
}

updateAdmin();
