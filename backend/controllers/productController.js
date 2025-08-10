const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const productController = {
  getAllProducts: async (req, res) => {
    try {
      const { search, category, condition, minPrice, maxPrice } = req.query;
      
      let query = `
        SELECT 
          p.*,
          c.category_name,
          pi.image_url as primary_image,
          pm.model_url as model_3d,
          u.first_name as seller_first_name,
          u.last_name as seller_last_name,
          COUNT(pc.id) as comment_count
        FROM product p
        LEFT JOIN category c ON p.category_id = c.id
        LEFT JOIN product_image pi ON p.id = pi.product_id AND pi.is_primary = TRUE
        LEFT JOIN product_3d_model pm ON p.id = pm.product_id
        LEFT JOIN user u ON p.seller_id = u.id
        LEFT JOIN product_comment pc ON p.id = pc.product_id
        WHERE p.is_active = TRUE
      `;
      
      const params = [];
      
      if (search) {
        query += ` AND (p.title LIKE ? OR p.product_description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (category) {
        query += ` AND c.category_name = ?`;
        params.push(category);
      }
      
      if (condition) {
        query += ` AND p.condition_type = ?`;
        params.push(condition);
      }
      
      if (minPrice) {
        query += ` AND p.price >= ?`;
        params.push(parseFloat(minPrice));
      }
      
      if (maxPrice) {
        query += ` AND p.price <= ?`;
        params.push(parseFloat(maxPrice));
      }
      
      query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
      
      const [products] = await db.execute(query, params);
      
      console.log('Products found:', products.length);
      console.log('Sample product with model:', products.find(p => p.model_3d));
      
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  },

  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const viewerIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const userId = req.user?.id || null;
      
      console.log('Fetching product with ID:', id, 'Viewer IP:', viewerIP, 'User ID:', userId);
      
      // Get product details with category and seller info
      const [productResults] = await db.execute(`
        SELECT 
          p.*,
          c.category_name,
          u.first_name as seller_first_name,
          u.last_name as seller_last_name,
          u.username as seller_username,

          u.country,
          CONCAT(u.first_name, ' ', u.last_name) as seller_name
        FROM product p
        LEFT JOIN category c ON p.category_id = c.id
        LEFT JOIN user u ON p.seller_id = u.id
        WHERE p.id = ?
      `, [id]);
      
      if (productResults.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const product = productResults[0];
      
      // Get product images
      const [images] = await db.execute(`
        SELECT * FROM product_image 
        WHERE product_id = ? 
        ORDER BY is_primary DESC, sort_order ASC
      `, [id]);
      
      // Get 3D model
      const [models] = await db.execute(`
        SELECT * FROM product_3d_model 
        WHERE product_id = ? AND is_active = TRUE
        LIMIT 1
      `, [id]);
      
      // Get comments (updated to use product_comment table)
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
      `, [id]);
      
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
      
      // Increment view count (only if not the seller viewing their own product)
      if (!userId || userId !== product.seller_id) {
        await db.execute('UPDATE product SET views_count = views_count + 1 WHERE id = ?', [id]);
        product.views_count = product.views_count + 1; // Update the returned data
        console.log(`View count incremented for product ${id}. New count: ${product.views_count}`);
      } else {
        console.log(`Seller viewing their own product ${id}. View count not incremented.`);
      }
      
      // Combine all data
      const result = {
        ...product,
        images: images,
        model_3d: models[0] || null,
        comments: structuredComments,
        comment_count: comments.length
      };
      
      console.log('Product fetched successfully:', result.title, 'Views:', result.views_count);
      res.json(result);
      
    } catch (error) {
      console.error('Error in getProductById:', error);
      res.status(500).json({ message: 'Failed to fetch product details' });
    }
  },

  // Add a new endpoint to get view stats
  getProductStats: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      // Check if user owns the product
      const [product] = await db.execute(
        'SELECT seller_id, views_count, title FROM product WHERE id = ?',
        [id]
      );
      
      if (product.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      if (product[0].seller_id !== userId) {
        return res.status(403).json({ message: 'You can only view stats for your own products' });
      }
      
      // Get additional stats
      const [commentStats] = await db.execute(
        'SELECT COUNT(*) as total_comments FROM product_comment WHERE product_id = ?',
        [id]
      );
      
      const [favoriteStats] = await db.execute(
        'SELECT COUNT(*) as total_favorites FROM favorite WHERE product_id = ?',
        [id]
      );
      
      res.json({
        product_id: id,
        title: product[0].title,
        views_count: product[0].views_count,
        total_comments: commentStats[0].total_comments,
        total_favorites: favoriteStats[0].total_favorites
      });
      
    } catch (error) {
      console.error('Error fetching product stats:', error);
      res.status(500).json({ message: 'Failed to fetch product stats' });
    }
  },

  createProduct: async (req, res) => {
    try {
      const { title, product_description, price, category_id, condition_type, seller_id, thumbnail_index = 0 } = req.body;
      
      console.log('Creating product with data:', req.body);
      console.log('Files:', req.files);

      // Validation
      if (!title || !product_description || !price || !category_id || !seller_id) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (!req.files || !req.files.images || req.files.images.length === 0) {
        return res.status(400).json({ message: 'At least one image is required' });
      }

      // Insert product with views_count initialized to 0
      const [productResult] = await db.execute(`
        INSERT INTO product (title, product_description, price, category_id, seller_id, condition_type, views_count)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `, [title, product_description, price, category_id, seller_id, condition_type]);

      const productId = productResult.insertId;

      // Handle images
      if (req.files.images) {
        for (let i = 0; i < req.files.images.length; i++) {
          const image = req.files.images[i];
          const imagePath = `/uploads/images/${image.filename}`;
          const isPrimary = i === parseInt(thumbnail_index);
          
          console.log(`Saving image ${i}: ${imagePath}, isPrimary: ${isPrimary}`);
          
          await db.execute(`
            INSERT INTO product_image (product_id, image_url, is_primary, sort_order)
            VALUES (?, ?, ?, ?)
          `, [productId, imagePath, isPrimary, i]);
        }
      }

      // Handle 3D model
      if (req.files.model_3d && req.files.model_3d[0]) {
        const model = req.files.model_3d[0];
        const modelPath = `/uploads/models/${model.filename}`;
        const modelType = path.extname(model.filename).substring(1);
        
        console.log(`Saving 3D model: ${modelPath}, type: ${modelType}, size: ${model.size}`);
        
        await db.execute(`
          INSERT INTO product_3d_model (product_id, model_url, model_type, file_size)
          VALUES (?, ?, ?, ?)
        `, [productId, modelPath, modelType, model.size]);
      }

      res.status(201).json({
        message: 'Product created successfully',
        productId: productId
      });

    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Failed to create product', error: error.message });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, product_description, price, category_id, condition_type, seller_id } = req.body;
      
      console.log('Updating product with ID:', id);
      console.log('Update data:', req.body);
      
      // Check if product exists and user owns it
      const [existingProduct] = await db.execute('SELECT seller_id FROM product WHERE id = ?', [id]);
      
      if (existingProduct.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      if (existingProduct[0].seller_id !== parseInt(seller_id)) {
        return res.status(403).json({ message: 'You can only edit your own products' });
      }
      
      // Update product (views_count is preserved)
      await db.execute(`
        UPDATE product 
        SET title = ?, product_description = ?, price = ?, category_id = ?, condition_type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [title, product_description, price, category_id, condition_type, id]);
      
      res.json({ message: 'Product updated successfully' });
      
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      console.log('Deleting product with ID:', id, 'by user:', userId);
      
      // Check if product exists and user owns it
      const [existingProduct] = await db.execute('SELECT seller_id FROM product WHERE id = ?', [id]);
      
      if (existingProduct.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      if (existingProduct[0].seller_id !== userId) {
        return res.status(403).json({ message: 'You can only delete your own products' });
      }
      
      // Get all files to delete
      const [images] = await db.execute('SELECT image_url FROM product_image WHERE product_id = ?', [id]);
      const [models] = await db.execute('SELECT model_url FROM product_3d_model WHERE product_id = ?', [id]);
      
      // Delete the product (cascade will handle related records)
      await db.execute('DELETE FROM product WHERE id = ?', [id]);
      
      // Delete physical files (optional - you might want to keep them for backup)
      try {
        for (const image of images) {
          const imagePath = path.join(__dirname, '..', image.image_url);
          await fs.unlink(imagePath);
        }
        
        for (const model of models) {
          const modelPath = path.join(__dirname, '..', model.model_url);
          await fs.unlink(modelPath);
        }
      } catch (fileError) {
        console.error('Error deleting files:', fileError);
        // Don't fail the request if file deletion fails
      }
      
      res.json({ message: 'Product deleted successfully' });
      
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  },

  getCategories: async (req, res) => {
    try {
      const [categories] = await db.execute(`
        SELECT * FROM category 
        WHERE is_active = TRUE 
        ORDER BY category_name ASC
      `);
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  },

  getUserProducts: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const [products] = await db.execute(`
        SELECT 
          p.*,
          c.category_name,
          pi.image_url as primary_image,
          pm.model_url as model_3d,
          COUNT(pc.id) as comment_count,
          COUNT(f.id) as favorite_count
        FROM product p
        LEFT JOIN category c ON p.category_id = c.id
        LEFT JOIN product_image pi ON p.id = pi.product_id AND pi.is_primary = TRUE
        LEFT JOIN product_3d_model pm ON p.id = pm.product_id
        LEFT JOIN product_comment pc ON p.id = pc.product_id
        LEFT JOIN favorite f ON p.id = f.product_id
        WHERE p.seller_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `, [userId]);
      
      console.log(`Found ${products.length} products for user ${userId}`);
      res.json(products);
      
    } catch (error) {
      console.error('Error fetching user products:', error);
      res.status(500).json({ message: 'Failed to fetch user products' });
    }
  },
};

module.exports = productController;