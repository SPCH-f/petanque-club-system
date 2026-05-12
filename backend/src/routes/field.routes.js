const router      = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const { isAdmin } = require('../middleware/isAdmin');
const {
  getFields, getField, getFieldBookings, createField, updateField, deleteField
} = require('../controllers/field.controller');

router.get('/',                  getFields);
router.get('/:id',               getField);
router.get('/:id/bookings',      getFieldBookings);
router.post('/',    verifyToken, isAdmin, createField);
router.put('/:id',  verifyToken, isAdmin, updateField);
router.delete('/:id', verifyToken, isAdmin, deleteField);

module.exports = router;
