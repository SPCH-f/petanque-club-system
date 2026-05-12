const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'petanque_user',
  password:           process.env.DB_PASSWORD || 'petanque_pass',
  database:           process.env.DB_NAME     || 'petanque_db',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
  timezone:           '+07:00',
  charset:            'utf8mb4',
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    logger.info('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    logger.error('❌ MySQL connection failed:', err.message);
  });

module.exports = pool;
