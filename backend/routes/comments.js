const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Get all comments for a product (public)
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log('Fetching comments for product:', productId);
    
    // Get all comments with user info, ordered by parent/child relationship
    const [comments] = await db.execute(`
      SELECT 
        pc.*,
        u.first_name,
        u.last_name,
        u.username
      FROM product_comment pc
      JOIN user u ON pc.user_id = u.id
      WHERE pc.product_id = ?
      ORDER BY 
        CASE WHEN pc.parent_comment_id IS NULL THEN pc.id ELSE pc.parent_comment_id END,
        pc.parent_comment_id IS NULL DESC,
        pc.created_at ASC
    `, [productId]);
    
    console.log(`Found ${comments.length} comments for product ${productId}`);
    
    // Structure comments with replies
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
    
    res.json({
      comments: structuredComments,
      total: comments.length
    });
    
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Add a new comment (protected)
router.post('/product/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { comment_text, parent_comment_id } = req.body;
    
    console.log('=== ADD COMMENT DEBUG ===');
    console.log('Product ID:', productId);
    console.log('Request user:', req.user);
    console.log('User ID from req.user:', req.user?.id);
    console.log('Comment text:', comment_text?.substring(0, 50) + '...');
    console.log('Parent comment ID:', parent_comment_id);
    console.log('========================');
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.error('User not authenticated or user ID missing');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userId = req.user.id;
    
    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    if (comment_text.trim().length > 1000) {
      return res.status(400).json({ message: 'Comment is too long (max 1000 characters)' });
    }
    
    // Check if product exists
    const [products] = await db.execute('SELECT id FROM product WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if parent comment exists (if replying)
    if (parent_comment_id && parent_comment_id !== null && parent_comment_id !== undefined) {
      const [parentComments] = await db.execute(
        'SELECT id FROM product_comment WHERE id = ? AND product_id = ?', 
        [parent_comment_id, productId]
      );
      if (parentComments.length === 0) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }
    
    // Properly handle parent_comment_id - convert undefined to null
    const parentId = parent_comment_id && parent_comment_id !== undefined ? parent_comment_id : null;
    
    console.log('Final values for insertion:', {
      productId: parseInt(productId),
      userId: parseInt(userId),
      parentId,
      comment_text: comment_text.trim()
    });
    
    // Insert comment with explicit type conversion
    const [result] = await db.execute(`
      INSERT INTO product_comment (product_id, user_id, parent_comment_id, comment_text)
      VALUES (?, ?, ?, ?)
    `, [
      parseInt(productId), 
      parseInt(userId), 
      parentId, 
      comment_text.trim()
    ]);
    
    console.log('Comment inserted with ID:', result.insertId);
    
    // Get the created comment with user info
    const [newComment] = await db.execute(`
      SELECT 
        pc.*,
        u.first_name,
        u.last_name,
        u.username
      FROM product_comment pc
      JOIN user u ON pc.user_id = u.id
      WHERE pc.id = ?
    `, [result.insertId]);
    
    console.log('Comment added successfully:', result.insertId);
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment[0]
    });
    
  } catch (error) {
    console.error('Error adding comment:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update comment (protected - only comment owner)
router.put('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment_text } = req.body;
    const userId = req.user.id;
    
    console.log('Updating comment:', commentId, 'by user:', userId);
    
    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    if (comment_text.trim().length > 1000) {
      return res.status(400).json({ message: 'Comment is too long (max 1000 characters)' });
    }
    
    // Check if comment exists and user owns it
    const [comments] = await db.execute(
      'SELECT id, user_id FROM product_comment WHERE id = ?', 
      [commentId]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }
    
    // Update comment
    await db.execute(`
      UPDATE product_comment 
      SET comment_text = ?, is_edited = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [comment_text.trim(), commentId]);
    
    console.log('Comment updated successfully:', commentId);
    
    res.json({ message: 'Comment updated successfully' });
    
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Failed to update comment' });
  }
});

// Delete comment (protected - only comment owner)
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    console.log('Deleting comment:', commentId, 'by user:', userId);
    
    // Check if comment exists and user owns it
    const [comments] = await db.execute(
      'SELECT id, user_id FROM product_comment WHERE id = ?', 
      [commentId]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comments[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }
    
    // Delete comment (cascade will handle replies)
    await db.execute('DELETE FROM product_comment WHERE id = ?', [commentId]);
    
    console.log('Comment deleted successfully:', commentId);
    
    res.json({ message: 'Comment deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

module.exports = router;