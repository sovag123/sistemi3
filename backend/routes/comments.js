const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');


router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const [comments] = await db.execute(`
      SELECT 
        pc.*,
        u.first_name,
        u.last_name,
        u.username
      FROM product_comment pc
      LEFT JOIN user u ON pc.user_id = u.id
      WHERE pc.product_id = ?
      ORDER BY 
        CASE WHEN pc.parent_comment_id IS NULL THEN pc.id ELSE pc.parent_comment_id END,
        pc.parent_comment_id IS NULL DESC,
        pc.created_at ASC
    `, [productId]);

    
    const structuredComments = [];
    const commentMap = new Map();
    
    comments.forEach(comment => {
      const commentObj = {
        ...comment,
        replies: []
      };
      commentMap.set(comment.id, commentObj);
      
      if (comment.parent_comment_id === null) {
        structuredComments.push(commentObj);
      } else {
        const parentComment = commentMap.get(comment.parent_comment_id);
        if (parentComment) {
          parentComment.replies.push(commentObj);
        }
      }
    });
    
    res.json(structuredComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});


router.post('/product/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { comment_text, parent_comment_id } = req.body;
    const userId = req.user.id;
    
    console.log('Adding comment:', { productId, userId, comment_text, parent_comment_id });
    
    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    if (comment_text.length > 1000) {
      return res.status(400).json({ message: 'Comment is too long (max 1000 characters)' });
    }
    
    
    const [product] = await db.execute('SELECT id FROM product WHERE id = ? AND is_active = TRUE', [productId]);
    if (product.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    
    if (parent_comment_id) {
      const [parentComment] = await db.execute(
        'SELECT id FROM product_comment WHERE id = ? AND product_id = ?', 
        [parent_comment_id, productId]
      );
      if (parentComment.length === 0) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }
    
    const [result] = await db.execute(`
      INSERT INTO product_comment (product_id, user_id, comment_text, parent_comment_id)
      VALUES (?, ?, ?, ?)
    `, [productId, userId, comment_text.trim(), parent_comment_id || null]);
    
    
    const [newComment] = await db.execute(`
      SELECT 
        pc.*,
        u.first_name,
        u.last_name,
        u.username
      FROM product_comment pc
      LEFT JOIN user u ON pc.user_id = u.id
      WHERE pc.id = ?
    `, [result.insertId]);
    
    console.log('Comment added successfully:', newComment[0]);
    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});


router.put('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment_text } = req.body;
    const userId = req.user.id;
    
    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    if (comment_text.length > 1000) {
      return res.status(400).json({ message: 'Comment is too long (max 1000 characters)' });
    }
    
    
    const [comments] = await db.execute(`
      SELECT user_id FROM product_comment WHERE id = ?
    `, [commentId]);
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }
    
    await db.execute(`
      UPDATE product_comment 
      SET comment_text = ?, is_edited = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [comment_text.trim(), commentId]);
    
    
    const [updatedComment] = await db.execute(`
      SELECT 
        pc.*,
        u.first_name,
        u.last_name,
        u.username
      FROM product_comment pc
      LEFT JOIN user u ON pc.user_id = u.id
      WHERE pc.id = ?
    `, [commentId]);
    
    res.json(updatedComment[0]);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Failed to update comment' });
  }
});


router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    
    const [comments] = await db.execute(`
      SELECT user_id FROM product_comment WHERE id = ?
    `, [commentId]);
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }
    
    
    await db.execute(`
      DELETE FROM product_comment WHERE id = ?
    `, [commentId]);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

module.exports = router;