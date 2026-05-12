const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'petanque_user',
    password: 'petanque_pass',
    database: 'petanque_db'
  });

  try {
    console.log('Recreating users table...');
    
    // Drop existing table (WARNING: data will be lost)
    // In a real production app we would use ALTER TABLE but here it's easier to recreate
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS users');
    
    await connection.query(`
      CREATE TABLE users (
        id            VARCHAR(36)  NOT NULL PRIMARY KEY,
        username      VARCHAR(100) NOT NULL UNIQUE,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name    VARCHAR(255) NOT NULL,
        last_name     VARCHAR(255) NOT NULL,
        student_id    VARCHAR(50)  NULL,
        phone         VARCHAR(20)  NULL,
        role          ENUM('user','admin') NOT NULL DEFAULT 'user',
        user_type     ENUM('นักศึกษา', 'บุคลากร', 'บุคคลภายนอก') NOT NULL DEFAULT 'นักศึกษา',
        status        ENUM('active','pending','suspended') NOT NULL DEFAULT 'pending',
        created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at    DATETIME     NULL,
        INDEX idx_users_username (username),
        INDEX idx_users_email (email),
        INDEX idx_users_role (role),
        INDEX idx_users_status (status)
      ) ENGINE=InnoDB
    `);

    // Re-insert admin
    await connection.query(`
      INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, status) VALUES
      ('00000000-0000-0000-0000-000000000001',
       'admin',
       'admin@petanque.club',
       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFz0Q1d.s3uCnL2',
       'System',
       'Admin',
       'admin',
       'active')
    `);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Users table recreated successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await connection.end();
  }
}

migrate();
