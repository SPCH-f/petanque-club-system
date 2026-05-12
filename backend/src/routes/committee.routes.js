const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { isAdmin } = require('../middleware/isAdmin');
const {
  getCommittee, getYears, createMember,
  updateMember, deleteMember, reorderMembers
} = require('../controllers/committee.controller');

// Public routes
router.get('/', getCommittee);
router.get('/years', getYears);

// Admin only routes
router.post('/', verifyToken, isAdmin, createMember);
router.put('/reorder', verifyToken, isAdmin, reorderMembers);
router.put('/:id', verifyToken, isAdmin, updateMember);
router.delete('/:id', verifyToken, isAdmin, deleteMember);

module.exports = router;
