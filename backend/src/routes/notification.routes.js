const router      = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const { getNotifications, markAsRead, markAllRead } = require('../controllers/notification.controller');

router.get('/',                verifyToken, getNotifications);
router.put('/read-all',        verifyToken, markAllRead);
router.put('/:id/read',        verifyToken, markAsRead);

module.exports = router;
