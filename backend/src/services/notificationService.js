const db    = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a notification for a user
 */
const createNotification = async ({ userId, type, title, message, link = null }) => {
  try {
    const id = uuidv4();
    await db.query(
      `INSERT INTO notifications (id, user_id, type, title, message, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, type, title, message, link]
    );
    return id;
  } catch (err) {
    console.error('Notification create error:', err.message);
    return null;
  }
};

// Pre-defined notification templates
const notifyBookingSuccess = (userId, fieldName, startTime) =>
  createNotification({
    userId,
    type:    'booking_submitted',
    title:   'ส่งคำขอจองสนามแล้ว',
    message: `คุณได้ส่งคำขอจองสนาม "${fieldName}" เวลา ${new Date(startTime).toLocaleString('th-TH')} รอการอนุมัติจาก Admin`,
    link:    '/history',
  });

const notifyBookingApproved = (userId, fieldName, startTime) =>
  createNotification({
    userId,
    type:    'booking_approved',
    title:   '✅ การจองได้รับการอนุมัติ',
    message: `การจองสนาม "${fieldName}" เวลา ${new Date(startTime).toLocaleString('th-TH')} ได้รับการอนุมัติแล้ว`,
    link:    '/history',
  });

const notifyBookingRejected = (userId, fieldName, reason) =>
  createNotification({
    userId,
    type:    'booking_rejected',
    title:   '❌ การจองถูกปฏิเสธ',
    message: `การจองสนาม "${fieldName}" ถูกปฏิเสธ${reason ? `: ${reason}` : ''}`,
    link:    '/history',
  });

const notifyBookingReminder = (userId, fieldName, startTime) =>
  createNotification({
    userId,
    type:    'booking_reminder',
    title:   '⏰ แจ้งเตือน: ใกล้ถึงเวลาใช้สนาม',
    message: `คุณมีการจองสนาม "${fieldName}" ในอีก 1 ชั่วโมง (${new Date(startTime).toLocaleString('th-TH')})`,
    link:    '/history',
  });

const notifyRoleChanged = (userId, newRole) =>
  createNotification({
    userId,
    type:    'role_changed',
    title:   'สถานะบัญชีมีการเปลี่ยนแปลง',
    message: `สถานะบัญชีของคุณถูกเปลี่ยนเป็น "${newRole === 'user' ? 'สมาชิก' : newRole === 'admin' ? 'ผู้ดูแลระบบ' : 'รอการอนุมัติ'}"`,
  });

const notifyLoanApproved = (userId, ballName) =>
  createNotification({
    userId,
    type:    'loan_approved',
    title:   '✅ การยืมอุปกรณ์อนุมัติแล้ว',
    message: `คำขอยืม "${ballName}" ได้รับการอนุมัติแล้ว กรุณามารับอุปกรณ์ที่ห้องชมรม`,
    link:    '/history',
  });

const notifyLoanRejected = (userId, ballName, reason) =>
  createNotification({
    userId,
    type:    'loan_rejected',
    title:   '❌ การยืมอุปกรณ์ถูกปฏิเสธ',
    message: `คำขอยืม "${ballName}" ถูกปฏิเสธ${reason ? `: ${reason}` : ''}`,
    link:    '/history',
  });

const notifyLoanReturned = (userId, ballName) =>
  createNotification({
    userId,
    type:    'loan_returned',
    title:   '📦 คืนอุปกรณ์เรียบร้อย',
    message: `คุณได้คืนอุปกรณ์ "${ballName}" เรียบร้อยแล้ว ขอบคุณที่ใช้บริการ`,
    link:    '/history',
  });

const notifyAdminsOfLoan = async (userName, ballName) => {
  try {
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL");
    const notifications = admins.map(admin => createNotification({
      userId: admin.id,
      type: 'admin_loan_request',
      title: '🔔 มีคำขอยืมอุปกรณ์ใหม่',
      message: `ผู้ใช้ ${userName} ต้องการยืม "${ballName}"`,
      link: '/admin/bookings?tab=loans'
    }));
    await Promise.all(notifications);
  } catch (err) {
    console.error('Notify admins error:', err.message);
  }
};

const notifyAdminsOfBooking = async (userName, fieldName) => {
  try {
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL");
    const notifications = admins.map(admin => createNotification({
      userId: admin.id,
      type: 'admin_booking_request',
      title: '📅 มีคำขอจองสนามใหม่',
      message: `ผู้ใช้ ${userName} จองสนาม "${fieldName}" รอการตรวจสอบ`,
      link: '/admin/bookings?tab=bookings'
    }));
    await Promise.all(notifications);
  } catch (err) {
    console.error('Notify admins error:', err.message);
  }
};

const notifyAdminsOfComment = async (userName, postTitle) => {
  try {
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL");
    const notifications = admins.map(admin => createNotification({
      userId: admin.id,
      type: 'admin_new_comment',
      title: '💬 มีคอมเมนต์ใหม่',
      message: `ผู้ใช้ ${userName} คอมเมนต์ในโพสต์ "${postTitle}"`,
      link: '/admin/posts'
    }));
    await Promise.all(notifications);
  } catch (err) {
    console.error('Notify admins error:', err.message);
  }
};

const notifyAdminsOfDocumentRequest = async (userName, templateName) => {
  try {
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL");
    const notifications = admins.map(admin => createNotification({
      userId: admin.id,
      type: 'admin_document_request',
      title: '📝 มีคำขออนุมัติเอกสารใหม่',
      message: `ผู้ใช้ ${userName} ส่งคำขออนุมัติ "${templateName}" รอการลงนาม`,
      link: '/admin/approvals'
    }));
    await Promise.all(notifications);
  } catch (err) {
    console.error('Notify admins error:', err.message);
  }
};

const notifyDocumentApproved = (userId, templateName, isFullyApproved) =>
  createNotification({
    userId,
    type:    'document_approved',
    title:   isFullyApproved ? '✅ เอกสารอนุมัติครบถ้วนแล้ว' : '🖋️ มีการลงนามในเอกสารแล้ว',
    message: isFullyApproved 
      ? `เอกสาร "${templateName}" ได้รับการอนุมัติและลงนามครบถ้วนแล้ว คุณสามารถดาวน์โหลดได้ทันที`
      : `เอกสาร "${templateName}" มีการลงนามเพิ่มแล้ว รอการลงนามจากลำดับถัดไป`,
    link:    '/history',
  });

const notifyDocumentRejected = (userId, templateName) =>
  createNotification({
    userId,
    type:    'document_rejected',
    title:   '❌ คำขออนุมัติเอกสารไม่ผ่าน',
    message: `คำขออนุมัติเอกสาร "${templateName}" ถูกปฏิเสธ`,
    link:    '/history',
  });

module.exports = {
  createNotification,
  notifyBookingSuccess,
  notifyBookingApproved,
  notifyBookingRejected,
  notifyBookingReminder,
  notifyRoleChanged,
  notifyLoanApproved,
  notifyLoanRejected,
  notifyLoanReturned,
  notifyAdminsOfLoan,
  notifyAdminsOfBooking,
  notifyAdminsOfComment,
  notifyAdminsOfDocumentRequest,
  notifyDocumentApproved,
  notifyDocumentRejected
};
