const router      = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const { isAdmin, isUser } = require('../middleware/isAdmin');
const {
  getBalls, createBall, updateBall, deleteBall,
  loanBall, returnBall, getMyLoans
} = require('../controllers/ball.controller');

router.get('/',            verifyToken, isUser, getBalls);
router.post('/',           verifyToken, isAdmin, createBall);
router.put('/:id',         verifyToken, isAdmin, updateBall);
router.delete('/:id',      verifyToken, isAdmin, deleteBall);

// Loans
router.get('/loans/mine',         verifyToken, isUser, getMyLoans);
router.post('/loans',             verifyToken, isUser, loanBall);
router.put('/loans/:id/return',   verifyToken, isUser, returnBall);

module.exports = router;
