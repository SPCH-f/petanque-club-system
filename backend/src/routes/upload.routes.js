const router = require('express').Router();
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { uploadToCloudinary } = require('../utils/cloudinary');

const isCloudinaryEnabled = () => {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
};

router.post('/avatar', verifyToken, upload.any(), async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) return sendError(res, 400, 'กรุณาเลือกไฟล์รูปภาพ (ไม่พบไฟล์ในคำขอ)');
    
    if (isCloudinaryEnabled()) {
      const url = await uploadToCloudinary(file.buffer, 'avatars');
      return sendSuccess(res, { url }, 'อัปโหลดรูปภาพสำเร็จ');
    } else {
      const fileUrl = `/uploads/avatars/${file.filename}`;
      return sendSuccess(res, { url: fileUrl }, 'อัปโหลดรูปภาพสำเร็จ');
    }
  } catch (err) {
    console.error('Upload Avatar Error:', err);
    return sendError(res, 500, `เกิดข้อผิดพลาดในการอัปโหลด: ${err.message}`);
  }
});

router.post('/signature', verifyToken, upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'กรุณาเลือกไฟล์ลายเซ็น');
    
    if (isCloudinaryEnabled()) {
      const url = await uploadToCloudinary(req.file.buffer, 'signatures');
      return sendSuccess(res, { url }, 'อัปโหลดลายเซ็นสำเร็จ');
    } else {
      const fileUrl = `/uploads/signatures/${req.file.filename}`;
      return sendSuccess(res, { url: fileUrl }, 'อัปโหลดลายเซ็นสำเร็จ');
    }
  } catch (err) {
    console.error('Upload Signature Error:', err);
    return sendError(res, 500, `เกิดข้อผิดพลาดในการอัปโหลด: ${err.message}`);
  }
});

router.post('/ball', verifyToken, upload.any(), async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) return sendError(res, 400, 'กรุณาเลือกไฟล์รูปภาพ');
    
    if (isCloudinaryEnabled()) {
      const url = await uploadToCloudinary(file.buffer, 'balls');
      return sendSuccess(res, { url }, 'อัปโหลดรูปภาพลูกเปตองสำเร็จ');
    } else {
      const fileUrl = `/uploads/balls/${file.filename}`;
      return sendSuccess(res, { url: fileUrl }, 'อัปโหลดรูปภาพลูกเปตองสำเร็จ');
    }
  } catch (err) {
    console.error('Upload Ball Error:', err);
    return sendError(res, 500, `เกิดข้อผิดพลาดในการอัปโหลด: ${err.message}`);
  }
});

module.exports = router;

