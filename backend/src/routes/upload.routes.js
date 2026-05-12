const router = require('express').Router();
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');

router.post('/avatar', verifyToken, upload.any(), (req, res) => {
  try {
    // If using upload.any(), files are in req.files
    const file = req.file || (req.files && req.files[0]);
    
    if (!file) return sendError(res, 400, 'กรุณาเลือกไฟล์รูปภาพ (ไม่พบไฟล์ในคำขอ)');
    
    const fileUrl = `/uploads/avatars/${file.filename}`;
    return sendSuccess(res, { url: fileUrl }, 'อัปโหลดรูปภาพสำเร็จ');
  } catch (err) {
    console.error('Upload Avatar Error:', err);
    return sendError(res, 500, `เกิดข้อผิดพลาดในการอัปโหลด: ${err.message}`);
  }
});

router.post('/signature', verifyToken, upload.single('signature'), (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'กรุณาเลือกไฟล์ลายเซ็น');
    const fileUrl = `/uploads/signatures/${req.file.filename}`;
    return sendSuccess(res, { url: fileUrl }, 'อัปโหลดลายเซ็นสำเร็จ');
  } catch (err) {
    console.error('Upload Signature Error:', err);
    return sendError(res, 500, `เกิดข้อผิดพลาดในการอัปโหลด: ${err.message}`);
  }
});

router.post('/ball', verifyToken, upload.any(), (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) return sendError(res, 400, 'กรุณาเลือกไฟล์รูปภาพ');
    
    const fileUrl = `/uploads/balls/${file.filename}`;
    return sendSuccess(res, { url: fileUrl }, 'อัปโหลดรูปภาพลูกเปตองสำเร็จ');
  } catch (err) {
    console.error('Upload Ball Error:', err);
    return sendError(res, 500, `เกิดข้อผิดพลาดในการอัปโหลด: ${err.message}`);
  }
});

module.exports = router;
