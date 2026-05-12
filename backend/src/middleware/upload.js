const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let type = 'avatars';
    const url = req.originalUrl || req.url || '';
    
    if (file.fieldname === 'signature' || url.includes('signature')) type = 'signatures';
    else if (file.fieldname === 'image' || url.includes('ball')) type = 'balls';
    
    const dir = path.join(__dirname, `../../uploads/${type}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let prefix = 'avatar-';
    const url = req.originalUrl || req.url || '';
    
    if (file.fieldname === 'signature' || url.includes('signature')) prefix = 'sig-';
    else if (file.fieldname === 'image' || url.includes('ball')) prefix = 'ball-';
    
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter
});

module.exports = upload;
