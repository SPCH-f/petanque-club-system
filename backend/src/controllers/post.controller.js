const db   = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const cache    = require('../config/redis');
const auditLog = require('../middleware/auditLog');
const { notifyAdminsOfComment } = require('../services/notificationService');

// ── GET /api/posts  (public, paginated) ───────────────────────
const getPosts = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
    const userId = req.user?.id || null;

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL'
    );

    const [posts] = await db.query(
      `SELECT p.*,
              CONCAT(u.first_name, ' ', u.last_name) as author_name,
              (SELECT COUNT(*) FROM post_likes   WHERE post_id = p.id) as like_count,
              (SELECT COUNT(*) FROM comments     WHERE post_id = p.id AND deleted_at IS NULL) as comment_count,
              EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked,
              EXISTS(SELECT 1 FROM post_saves WHERE post_id = p.id AND user_id = ?) as is_saved
       FROM posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.deleted_at IS NULL
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, limit, offset]
    );

    return sendPaginated(res, posts, total, page, limit);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาดในการโหลดโพสต์');
  }
};

// ── GET /api/posts/:id ────────────────────────────────────────
const getPost = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const [rows] = await db.query(
      `SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) as author_name,
              (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count
              ${userId ? `, (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked` : ', 0 as is_liked'}
       FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      userId ? [userId, req.params.id] : [req.params.id]
    );
    const post = rows[0];
    if (!post) return sendError(res, 404, 'ไม่พบโพสต์');

    // Increment view count
    await db.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);

    // Get comments
    const [comments] = await db.query(
      `SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.role
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    return sendSuccess(res, { ...post, comments });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── POST /api/posts ────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const { title, content, image_url } = req.body;
    if (!title || !content) return sendError(res, 422, 'กรุณากรอก title และ content');

    const id = uuidv4();
    await db.query(
      'INSERT INTO posts (id, title, content, image_url, author_id) VALUES (?, ?, ?, ?, ?)',
      [id, title, content, image_url || null, req.user.id]
    );
    await auditLog({ userId: req.user.id, action: 'CREATE', entityType: 'post', entityId: id,
      newValues: { title }, ipAddress: req.ip });

    const [[post]] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
    return sendSuccess(res, post, 'สร้างโพสต์สำเร็จ', 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── PUT /api/posts/:id ────────────────────────────────────────
const updatePost = async (req, res) => {
  try {
    const { title, content, image_url, is_pinned } = req.body;
    const [rows] = await db.query(
      'SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL', [req.params.id]
    );
    const post = rows[0];
    if (!post) return sendError(res, 404, 'ไม่พบโพสต์');
    if (post.author_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'ไม่มีสิทธิ์แก้ไขโพสต์นี้');
    }

    await db.query(
      `UPDATE posts SET title = COALESCE(?, title), content = COALESCE(?, content),
       image_url = COALESCE(?, image_url), is_pinned = COALESCE(?, is_pinned)
       WHERE id = ?`,
      [title || null, content || null, image_url || null,
       is_pinned !== undefined ? is_pinned : null, req.params.id]
    );
    await auditLog({ userId: req.user.id, action: 'UPDATE', entityType: 'post',
      entityId: req.params.id, ipAddress: req.ip });

    return sendSuccess(res, null, 'อัปเดตโพสต์สำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── DELETE /api/posts/:id ─────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL', [req.params.id]
    );
    const post = rows[0];
    if (!post) return sendError(res, 404, 'ไม่พบโพสต์');
    if (post.author_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'ไม่มีสิทธิ์ลบโพสต์นี้');
    }

    await db.query('UPDATE posts SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    await auditLog({ userId: req.user.id, action: 'DELETE', entityType: 'post',
      entityId: req.params.id, ipAddress: req.ip });

    return sendSuccess(res, null, 'ลบโพสต์สำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── POST /api/posts/:id/like ──────────────────────────────────
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const [[existing]] = await db.query(
      'SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [id, req.user.id]
    );

    if (existing) {
      await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [id, req.user.id]);
      return sendSuccess(res, { liked: false }, 'ยกเลิก Like แล้ว');
    } else {
      await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, req.user.id]);
      return sendSuccess(res, { liked: true }, 'Like แล้ว');
    }
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── POST /api/posts/:id/comments ─────────────────────────────
const addComment = async (req, res) => {
  try {
    const { content, parent_id } = req.body;
    if (!content?.trim()) return sendError(res, 422, 'กรุณากรอกความคิดเห็น');

    const [rows] = await db.query(
      'SELECT id, title FROM posts WHERE id = ? AND deleted_at IS NULL', [req.params.id]
    );
    const post = rows[0];
    if (!post) return sendError(res, 404, 'ไม่พบโพสต์');

    const commentId = uuidv4();
    await db.query(
      'INSERT INTO comments (id, post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?, ?)',
      [commentId, req.params.id, req.user.id, content.trim(), parent_id || null]
    );

    // Notify admins
    await notifyAdminsOfComment(req.user.first_name, post.title);

    const [[comment]] = await db.query(
      `SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.role FROM comments c
       JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      [commentId]
    );
    return sendSuccess(res, comment, 'เพิ่มความคิดเห็นสำเร็จ', 201);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── DELETE /api/posts/:postId/comments/:commentId ──────────────
const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const [[comment]] = await db.query(
      'SELECT * FROM comments WHERE id = ? AND post_id = ? AND deleted_at IS NULL',
      [commentId, postId]
    );
    if (!comment) return sendError(res, 404, 'ไม่พบความคิดเห็น');
    
    // Only author or admin can delete
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'ไม่มีสิทธิ์ลบความคิดเห็นนี้');
    }

    await db.query('UPDATE comments SET deleted_at = NOW() WHERE id = ?', [commentId]);
    return sendSuccess(res, null, 'ลบความคิดเห็นสำเร็จ');
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── POST /api/posts/:id/save ──────────────────────────────────
const toggleSavePost = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    const post = rows[0];
    if (!post) return sendError(res, 404, 'ไม่พบโพสต์');

    const [[existing]] = await db.query(
      'SELECT * FROM post_saves WHERE user_id = ? AND post_id = ?',
      [req.user.id, req.params.id]
    );

    if (existing) {
      await db.query('DELETE FROM post_saves WHERE user_id = ? AND post_id = ?', [req.user.id, req.params.id]);
      return sendSuccess(res, { saved: false }, 'ยกเลิกการบันทึกแล้ว');
    } else {
      await db.query('INSERT INTO post_saves (user_id, post_id) VALUES (?, ?)', [req.user.id, req.params.id]);
      return sendSuccess(res, { saved: true }, 'บันทึกโพสต์แล้ว');
    }
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

// ── GET /api/posts/saved ──────────────────────────────────────
const getSavedPosts = async (req, res) => {
  try {
    const [posts] = await db.query(
      `SELECT p.*, 
        CONCAT(u.first_name, ' ', u.last_name) as author_name,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comment_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked,
        1 as is_saved
       FROM posts p
       JOIN post_saves s ON s.post_id = p.id
       JOIN users u ON u.id = p.author_id
       WHERE s.user_id = ? AND p.deleted_at IS NULL
       ORDER BY s.created_at DESC`,
      [req.user.id, req.user.id]
    );

    return sendSuccess(res, posts);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'เกิดข้อผิดพลาด');
  }
};

module.exports = { 
  getPosts, getPost, createPost, updatePost, deletePost, 
  toggleLike, addComment, deleteComment, toggleSavePost, getSavedPosts
};
