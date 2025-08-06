const db = require('../config/database');

const productController = {
  getAllProducts: async (req, res) => {
    try {
      const { category, search, condition, minPrice, maxPrice, location } = req.query;
      
      let query = `
        SELECT p.*, c.category_name, u.username as seller_name, 
               l.city, l.country, pi.image_url as primary_image,
               pm.model_url as model_3d
        FROM product p
        LEFT JOIN category c ON p.category_id = c.category_id
        LEFT JOIN user u ON p.seller_id = u.user_id
        LEFT JOIN location l ON p.location_id = l.location_id
        LEFT JOIN product_image pi ON p.product_id = pi.product_id AND pi.is_primary = TRUE
        LEFT JOIN product_3d_model pm ON p.product_id = pm.product_id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (category) {
        query += ` AND c.category_name LIKE ?`;
        params.push(`%${category}%`);
      }
      
      if (search) {
        query += ` AND (p.title LIKE ? OR p.product_description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (condition) {
        query += ` AND p.condition_type = ?`;
        params.push(condition);
      }
      
      if (minPrice) {
        query += ` AND p.price >= ?`;
        params.push(minPrice);
      }
      
      if (maxPrice) {
        query += ` AND p.price <= ?`;
        params.push(maxPrice);
      }
      
      query += ` ORDER BY p.created_at DESC`;
      
      const [products] = await db.execute(query, params);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [products] = await db.execute(`
        SELECT p.*, c.category_name, u.username as seller_name, u.email as seller_email,
               l.city, l.country, l.region
        FROM product p
        LEFT JOIN category c ON p.category_id = c.category_id
        LEFT JOIN user u ON p.seller_id = u.user_id
        LEFT JOIN location l ON p.location_id = l.location_id
        WHERE p.product_id = ?
      `, [id]);
      
      if (products.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      const product = products[0];
      
      const [images] = await db.execute(`
        SELECT * FROM product_image WHERE product_id = ? ORDER BY sort_order
      `, [id]);
      
      const [models] = await db.execute(`
        SELECT * FROM product_3d_model WHERE product_id = ?
      `, [id]);
      
      const [reviews] = await db.execute(`
        SELECT r.*, u.username as reviewer_name
        FROM review r
        LEFT JOIN user u ON r.reviewer_id = u.user_id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
      `, [id]);
      
      product.images = images;
      product.model_3d = models[0] || null;
      product.reviews = reviews;
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCategories: async (req, res) => {
    try {
      const [categories] = await db.execute(`
        SELECT * FROM category ORDER BY category_name
      `);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = productController;