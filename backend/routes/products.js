const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { uploadImages, uploadModels } = require('../middleware/upload');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, minPrice, maxPrice, condition } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.username as seller_name, c.category_name, l.city, l.country,
             pi.image_url as primary_image
      FROM product p
      LEFT JOIN user u ON p.seller_id = u.id
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN location l ON p.location_id = l.id
      LEFT JOIN product_image pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      WHERE p.is_active = TRUE
    `;

    const params = [];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.title LIKE ? OR p.product_description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      query += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    if (condition) {
      query += ' AND p.condition_type = ?';
      params.push(condition);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await db.execute(query, params);

    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM').split('ORDER BY')[0];
    const [countResult] = await db.execute(countQuery, params.slice(0, -2));

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.execute(`
      SELECT p.*, u.username as seller_name, u.email as seller_email, u.phone as seller_phone,
             c.category_name, l.city, l.country
      FROM product p
      LEFT JOIN user u ON p.seller_id = u.id
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN location l ON p.location_id = l.id
      WHERE p.id = ? AND p.is_active = TRUE
    `, [req.params.id]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [images] = await db.execute(
      'SELECT * FROM product_image WHERE product_id = ? ORDER BY sort_order',
      [req.params.id]
    );

    const [models] = await db.execute(
      'SELECT * FROM product_3d_model WHERE product_id = ? AND is_active = TRUE',
      [req.params.id]
    );

    const [reviews] = await db.execute(`
      SELECT r.*, u.username as reviewer_name
      FROM review r
      LEFT JOIN user u ON r.reviewer_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    await db.execute(
      'UPDATE product SET views_count = views_count + 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({
      product: products[0],
      images,
      models,
      reviews
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, uploadImages.array('images', 10), async (req, res) => {
  try {
    const { title, description, price, categoryId, locationId, conditionType } = req.body;

    const [result] = await db.execute(
      'INSERT INTO product (title, product_description, price, category_id, seller_id, location_id, condition_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, price, categoryId, req.user.userId, locationId, conditionType]
    );

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        await db.execute(
          'INSERT INTO product_image (product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
          [result.insertId, `/uploads/images/${file.filename}`, i === 0, i]
        );
      }
    }

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/model', auth, uploadModels.single('model'), async (req, res) => {
  try {
    const productId = req.params.id;

    const [products] = await db.execute(
      'SELECT seller_id FROM product WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (products[0].seller_id !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No model file uploaded' });
    }

    const modelType = req.file.originalname.split('.').pop().toLowerCase();

    await db.execute(
      'INSERT INTO product_3d_model (product_id, model_url, model_type, file_size) VALUES (?, ?, ?, ?)',
      [productId, `/uploads/models/${req.file.filename}`, modelType, req.file.size]
    );

    res.json({ message: '3D model uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;