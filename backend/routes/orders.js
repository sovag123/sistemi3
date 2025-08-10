const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Test route to verify orders are working
router.get('/test', (req, res) => {
  res.json({ message: 'Orders route is working' });
});

// Create a new order (Buy Now)
router.post('/buy-now', authenticateToken, async (req, res) => {
  console.log('Buy now route hit with user:', req.user);
  
  try {
    const { productId, shippingAddress, paymentMethod = 'card', notes = '' } = req.body;
    const buyerId = req.user.userId;

    console.log('Buy now request:', { productId, buyerId, shippingAddress });

    // Get product details and check if it's available
    const [products] = await db.execute(`
      SELECT p.*, u.username as seller_name 
      FROM product p
      JOIN user u ON p.seller_id = u.id
      WHERE p.id = ? AND p.is_active = TRUE
    `, [productId]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found or no longer available' });
    }

    const product = products[0];

    // Prevent users from buying their own products
    if (product.seller_id === buyerId) {
      return res.status(400).json({ message: 'You cannot buy your own product' });
    }

    // Create order using the correct table name and columns from your schema
    const [orderResult] = await db.execute(`
      INSERT INTO order_table (buyer_id, total_amount, order_status, shipping_address, payment_method, notes)
      VALUES (?, ?, 'confirmed', ?, ?, ?)
    `, [buyerId, product.price, shippingAddress, paymentMethod, notes]);

    const orderId = orderResult.insertId;

    // Create order item
    await db.execute(`
      INSERT INTO order_item (order_id, product_id, quantity, price_at_time)
      VALUES (?, ?, 1, ?)
    `, [orderId, productId, product.price]);

    // Mark product as inactive (sold)
    await db.execute(`
      UPDATE product SET is_active = FALSE WHERE id = ?
    `, [productId]);

    res.status(201).json({
      message: 'Order created successfully',
      orderId: orderId,
      orderDetails: {
        orderId,
        productTitle: product.title,
        price: product.price,
        seller: product.seller_name
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// Get user's orders (purchases)
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT 
        ot.id as order_id,
        ot.total_amount,
        ot.order_status,
        ot.shipping_address,
        ot.payment_method,
        ot.created_at,
        p.title as product_title,
        p.id as product_id,
        pi.image_url as product_image,
        u.username as seller_name
      FROM order_table ot
      JOIN order_item oi ON ot.id = oi.order_id
      JOIN product p ON oi.product_id = p.id
      LEFT JOIN product_image pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN user u ON p.seller_id = u.id
      WHERE ot.buyer_id = ?
      ORDER BY ot.created_at DESC
    `, [req.user.userId]);

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get user's sales
router.get('/my-sales', authenticateToken, async (req, res) => {
  try {
    const [sales] = await db.execute(`
      SELECT 
        ot.id as order_id,
        ot.total_amount,
        ot.order_status,
        ot.shipping_address,
        ot.created_at,
        p.title as product_title,
        p.id as product_id,
        pi.image_url as product_image,
        u.username as buyer_name,
        u.email as buyer_email
      FROM order_table ot
      JOIN order_item oi ON ot.id = oi.order_id
      JOIN product p ON oi.product_id = p.id
      LEFT JOIN product_image pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN user u ON ot.buyer_id = u.id
      WHERE p.seller_id = ?
      ORDER BY ot.created_at DESC
    `, [req.user.userId]);

    res.json({ sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Failed to fetch sales' });
  }
});

module.exports = router;