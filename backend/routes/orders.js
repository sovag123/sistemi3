const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');


router.get('/test', (req, res) => {
  res.json({ message: 'Orders route is working' });
});


router.post('/buy-now', authenticateToken, async (req, res) => {
  console.log('=== BUY NOW DEBUG ===');
  console.log('Request user:', req.user);
  console.log('Request body:', req.body);
  console.log('====================');
  
  try {
    const { productId, shippingAddress, paymentMethod = 'card', notes = '' } = req.body;
    
    
    if (!req.user || !req.user.id) {
      console.error('User not authenticated or user ID missing');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const buyerId = req.user.id;
    console.log('Buy now request:', { productId, buyerId, shippingAddress });

    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    if (!shippingAddress || shippingAddress.trim() === '') {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    
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
    
    
    if (product.seller_id === buyerId) {
      return res.status(400).json({ message: 'You cannot buy your own product' });
    }

    
    const [orderResult] = await db.execute(`
      INSERT INTO order_table (buyer_id, total_amount, order_status, shipping_address, payment_method, notes)
      VALUES (?, ?, 'confirmed', ?, ?, ?)
    `, [buyerId, product.price, shippingAddress.trim(), paymentMethod, notes.trim()]);

    const orderId = orderResult.insertId;

    
    await db.execute(`
      INSERT INTO order_item (order_id, product_id, quantity, price_at_time)
      VALUES (?, ?, 1, ?)
    `, [orderId, productId, product.price]);

    
    await db.execute(`
      UPDATE product SET is_active = FALSE WHERE id = ?
    `, [productId]);

    console.log('Order created successfully:', orderId);

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
    res.status(500).json({ 
      message: 'Failed to create order', 
      error: error.message 
    });
  }
});


router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const [orders] = await db.execute(`
      SELECT 
        o.*,
        oi.product_id,
        oi.quantity,
        oi.price_at_time,
        p.title as product_title,
        pi.image_url as product_image,
        u.username as seller_name
      FROM order_table o
      JOIN order_item oi ON o.id = oi.order_id
      JOIN product p ON oi.product_id = p.id
      LEFT JOIN product_image pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN user u ON p.seller_id = u.id
      WHERE o.buyer_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});


router.get('/my-sales', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const [sales] = await db.execute(`
      SELECT 
        o.*,
        oi.product_id,
        oi.quantity,
        oi.price_at_time,
        p.title as product_title,
        pi.image_url as product_image,
        u.username as buyer_name
      FROM order_table o
      JOIN order_item oi ON o.id = oi.order_id
      JOIN product p ON oi.product_id = p.id
      LEFT JOIN product_image pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN user u ON o.buyer_id = u.id
      WHERE p.seller_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Failed to fetch sales' });
  }
});

module.exports = router;