const db = require('../config/db');

/**
 * Creates an audit log entry.
 * Can be called as middleware OR as a function directly from controllers.
 */
const auditLog = async ({
  userId,
  action,
  entityType,
  entityId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await db.query(
      `INSERT INTO audit_logs
         (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId    || null,
        action,
        entityType,
        entityId  || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } catch (err) {
    // Non-critical — log to console but don't throw
    console.error('Audit log error:', err.message);
  }
};

module.exports = auditLog;
