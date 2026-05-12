const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/verifyToken');
const { isAdmin, isUser } = require('../middleware/isAdmin');
const {
  getTemplates,
  getTemplate,
  createTemplate,
  generateDocument,
  requestApproval,
  getRequests,
  getMyRequests,
  downloadRequest,
  approveRequest,
  rejectRequest,
  deleteTemplate,
  updateTemplate,
  previewDocument
} = require('../controllers/document.controller');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/templates'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    console.log('Multer receiving file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    // ยอมรับไปก่อนเพื่อทดสอบ
    cb(null, true);
  }
});

// User Routes
router.get('/my-requests',   verifyToken, getMyRequests);
router.post('/generate',     verifyToken, generateDocument);
router.post('/preview',      verifyToken, previewDocument);
router.post('/request-approval', verifyToken, requestApproval);
router.get('/requests/:id/download', verifyToken, downloadRequest);

// Admin Routes
router.get('/requests',      verifyToken, isAdmin, getRequests);
router.post('/requests/:id/approve', verifyToken, isAdmin, approveRequest);
router.post('/requests/:id/reject',  verifyToken, isAdmin, rejectRequest);

// Base Routes
router.get('/',              verifyToken, getTemplates);
router.get('/:id',           verifyToken, getTemplate);
router.post('/',             verifyToken, isAdmin, upload.single('template'), createTemplate);
router.put('/:id',            verifyToken, isAdmin, upload.single('template'), updateTemplate);
router.delete('/:id',        verifyToken, isAdmin, deleteTemplate);

module.exports = router;
