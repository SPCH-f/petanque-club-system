const router      = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const optionalVerifyToken = require('../middleware/optionalVerifyToken');
const { isUser }  = require('../middleware/isAdmin');
const {
  getPosts, getPost, createPost, updatePost, deletePost, 
  toggleLike, addComment, deleteComment, toggleSavePost, getSavedPosts
} = require('../controllers/post.controller');

router.get('/',         optionalVerifyToken, getPosts);
router.get('/saved',    verifyToken, isUser, getSavedPosts);
router.get('/:id',      optionalVerifyToken, getPost);
router.post('/',         verifyToken, isUser, createPost);
router.put('/:id',       verifyToken, isUser, updatePost);
router.delete('/:id',    verifyToken, isUser, deletePost);
router.post('/:id/like', verifyToken, isUser, toggleLike);
router.post('/:id/save', verifyToken, isUser, toggleSavePost);
router.post('/:id/comments', verifyToken, isUser, addComment);
router.delete('/:postId/comments/:commentId', verifyToken, isUser, deleteComment);

module.exports = router;
