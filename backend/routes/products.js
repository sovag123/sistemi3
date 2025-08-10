const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);
router.post('/', authenticateToken, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'model_3d', maxCount: 1 }
]), productController.createProduct);

router.get('/user/:userId', authenticateToken, productController.getUserProducts);
router.get('/:id/stats', authenticateToken, productController.getProductStats);

router.put('/:id', authenticateToken, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'model_3d', maxCount: 1 }
]), productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

router.get('/health', (req, res) => {
  res.json({ status: 'Products API is working!' });
});

module.exports = router;