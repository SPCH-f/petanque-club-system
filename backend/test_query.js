const db = require('./src/config/db');
require('dotenv').config();
async function check() {
  try {
    const query = `
      SELECT gd.*, u.first_name as user_name, t.name as template_name, t.fields as template_fields
      FROM generated_documents gd
      JOIN users u ON gd.user_id = u.id
      JOIN document_templates t ON gd.template_id = t.id
      WHERE gd.status = 'pending'
      ORDER BY gd.created_at DESC
    `;
    const [rows] = await db.query(query);
    console.log('Rows count:', rows.length);
    process.exit(0);
  } catch (err) {
    console.error('QUERY FAILED:', err);
    process.exit(1);
  }
}
check();
