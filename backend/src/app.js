const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');

const { apiLimiter }          = require('./middleware/rateLimiter');
const authRoutes               = require('./routes/auth.routes');
const userRoutes               = require('./routes/user.routes');
const postRoutes               = require('./routes/post.routes');
const fieldRoutes              = require('./routes/field.routes');
const ballRoutes               = require('./routes/ball.routes');
const bookingRoutes            = require('./routes/booking.routes');
const notificationRoutes       = require('./routes/notification.routes');
const adminRoutes              = require('./routes/admin.routes');
const uploadRoutes             = require('./routes/upload.routes');
const committeeRoutes          = require('./routes/committee.routes');
const documentRoutes           = require('./routes/document.routes');
const dashboardRoutes          = require('./routes/dashboard.routes');

const app = express();

// ── Ensure Directories Exist ──────────────────────────────────
const fs = require('fs');
const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/avatars'),
  path.join(__dirname, '../uploads/signatures'),
  path.join(__dirname, '../uploads/templates'),
  path.join(__dirname, '../uploads/generated'),
  path.join(__dirname, '../uploads/balls'),
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.set('trust proxy', 1);

// ── Security / Headers ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}));

// ── Body parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ── Static files (uploads) ────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rate limiting (global) ────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api/fields',        fieldRoutes);
app.use('/api/balls',         ballRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/committee',     committeeRoutes);
app.use('/api/documents',     documentRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Petanque Club API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 20MB)' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `เกิดข้อผิดพลาดในการอัปโหลด: ${err.message}` });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS error' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
