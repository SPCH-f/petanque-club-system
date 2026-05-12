const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function migrateBalls() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'petanque_user',
    password: 'petanque_pass',
    database: 'petanque_db'
  });

  try {
    console.log('Starting balls table migration...');

    // 1. Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 2. Drop and recreate balls table
    await connection.query('DROP TABLE IF EXISTS balls');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS balls (
        id           VARCHAR(36)  NOT NULL PRIMARY KEY,
        brand        VARCHAR(255) NOT NULL,
        model        VARCHAR(255) NOT NULL,
        code         VARCHAR(100) NOT NULL UNIQUE,
        weight       INT          NOT NULL COMMENT 'weight in grams',
        diameter     INT          NOT NULL COMMENT 'diameter in mm',
        pattern      VARCHAR(255) NOT NULL,
        image_url    TEXT         NULL,
        status       ENUM('available','borrowed','reserved','maintenance','unavailable') NOT NULL DEFAULT 'available',
        condition_note TEXT       NULL,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at   DATETIME     NULL,
        INDEX idx_balls_status (status),
        INDEX idx_balls_code (code)
      ) ENGINE=InnoDB
    `);

    // 3. Seed data from Excel image
    const ballsData = [
      // LA FRANC
      { brand: 'LA FRANC', model: 'LA FRANC SM', code: '145HR', weight: 670, diameter: 71, pattern: 'ลูกลายคู่' },
      { brand: 'LA FRANC', model: 'LA FRANC SM', code: '578MR', weight: 670, diameter: 71, pattern: 'ลูกลายเดี่ยว' },
      { brand: 'LA FRANC', model: 'LA FRANC SM', code: '105MR', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'LA FRANC', model: 'LA FRANC SM', code: '076MR', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'LA FRANC', model: 'LA FRANC SM', code: '102MR', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'LA FRANC', model: 'LA FRANC SM', code: '440HR', weight: 680, diameter: 72, pattern: 'ลูกลายเดี่ยว' },
      { brand: 'LA FRANC', model: 'LA FRANC SM', code: '528HR', weight: 680, diameter: 72, pattern: 'ลูกลายเดี่ยว' },
      
      // MARATHON
      { brand: 'MARATHON', model: 'M - BLEM', code: '1NE386', weight: 680, diameter: 71, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'M - BLEM', code: '2NB192', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'M - BLEM', code: '3NC177', weight: 680, diameter: 73, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'M.T. TOUR/S', code: 'B168', weight: 660, diameter: 72, pattern: 'ลูกลายสาม' },
      { brand: 'MARATHON', model: 'M.T. TOUR/S', code: '2AA063', weight: 670, diameter: 72, pattern: 'ลูกลายสาม' },
      { brand: 'MARATHON', model: 'M.T. TOUR/S', code: '2AA641', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'M.T. TOUR/S', code: '2AB080', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'M.T. TOUR/S', code: '2SA358', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'M.T. TOUR/M', code: '71K920', weight: 680, diameter: 72, pattern: 'ลูกลายเดี่ยว' },
      { brand: 'MARATHON', model: 'M.T. TOUR/M', code: '2BA352', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'M.T. TOUR/M', code: '2BA554', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'M.T. TOUR/M', code: '2AD973', weight: 690, diameter: 71, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'M.T. TOUR/M', code: '4AA128', weight: 700, diameter: 74, pattern: 'ลูกเกลี้ยง' },
      { brand: 'MARATHON', model: 'P + T', code: '68A', weight: 670, diameter: 72, pattern: 'ลูกลายคู่' },
      { brand: 'MARATHON', model: 'P + T', code: '01L', weight: 700, diameter: 72, pattern: 'ลูกเกลี้ยง' },

      // OBUT
      { brand: 'OBUT', model: 'OBUT MATCH IT', code: 'V441', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'OBUT', model: 'OBUT MATCH IT', code: 'F250', weight: 680, diameter: 73, pattern: 'ลูกเกลี้ยง' },
      { brand: 'OBUT', model: 'OBUT MATCH', code: 'J13_T14', weight: 680, diameter: 71, pattern: 'ลูกเกลี้ยง' },
      { brand: 'OBUT', model: 'OBUT MATCH', code: '3L27', weight: 680, diameter: 72, pattern: 'ลูกเกลี้ยง' },
      { brand: 'OBUT', model: 'OBUT MATCH', code: 'V20', weight: 680, diameter: 73, pattern: 'ลูกลายเดี่ยว' },
      { brand: 'OBUT', model: 'OBUT MADE IN FRANCE', code: 'OMF-1', weight: 0, diameter: 0, pattern: 'ลูกลายเดี่ยว' },
      { brand: 'OBUT', model: 'OBUT MADE IN FRANCE', code: 'OMF-2', weight: 0, diameter: 0, pattern: 'ลูกเกลี้ยง' },
      { brand: 'OBUT', model: 'OBUT MADE IN FRANCE', code: 'OMF-3', weight: 0, diameter: 0, pattern: 'ลูกเกลี้ยง' },
      { brand: 'OBUT', model: 'OBUT MADE IN FRANCE', code: 'OMF-4', weight: 0, diameter: 0, pattern: 'ลูกเกลี้ยง' },
      { brand: 'OBUT', model: 'OBUT MADE IN FRANCE', code: 'OMF-5', weight: 0, diameter: 0, pattern: 'ลูกเกลี้ยง' }
    ];

    console.log('Seeding new balls data...');
    for (const ball of ballsData) {
      await connection.query(
        `INSERT INTO balls (id, brand, model, code, weight, diameter, pattern, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`,
        [uuidv4(), ball.brand, ball.model, ball.code, ball.weight, ball.diameter, ball.pattern]
      );
    }

    // 4. Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Balls table migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await connection.end();
  }
}

migrateBalls();
