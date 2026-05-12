const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const verifyToken = require('../middleware/verifyToken');
const { isAdmin } = require('../middleware/isAdmin');

// All dashboard stats are admin-only
router.get('/stats', verifyToken, isAdmin, dashboardController.getAdminStats);

module.exports = router;
