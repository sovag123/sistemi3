const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [favorites] = await db.execute(`
      SELECT 
        f.id as favorite_id,
        f.created_at as favorited_at,
        p.id as product_id,
        p.title,
        p.price,
        p.condition_type,
        p.created_at as product_created_at,
        c.category_name,
        u.username as seller_name,
        l.city,
        l.country,
        pi.image_url as primary_image,
        pm.model_url as model_3d
      FROM favorite f
      JOIN product p ON f.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN user u ON p.seller_id = u.id
      LEFT JOIN location l ON p.location_id = l.id
      LEFT JOIN product_image pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN product_3d_model pm ON p.id = pm.product_id
      WHERE f.user_id = ? AND p.is_active = TRUE
      ORDER BY f.created_at DESC
    `, [req.user.userId]);

    res.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userId;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    const [products] = await db.execute(
      'SELECT id, seller_id FROM product WHERE id = ? AND is_active = TRUE',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found or no longer available' });
    }
    if (products[0].seller_id === userId) {
      return res.status(400).json({ message: 'You cannot favorite your own product' });
    }
    const [existingFavorites] = await db.execute(
      'SELECT id FROM favorite WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existingFavorites.length > 0) {
      return res.status(400).json({ message: 'Product already in favorites' });
    }
    await db.execute(
      'INSERT INTO favorite (user_id, product_id) VALUES (?, ?)',
      [userId, productId]
    );

    res.json({ message: 'Product added to favorites successfully' });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Failed to add product to favorites' });
  }
});
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const [result] = await db.execute(
      'DELETE FROM favorite WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Product removed from favorites successfully' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Failed to remove product from favorites' });
  }
});
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const [favorites] = await db.execute(
      'SELECT id FROM favorite WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    res.json({ isFavorited: favorites.length > 0 });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ message: 'Failed to check favorite status' });
  }
});

module.exports = router;