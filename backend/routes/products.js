const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');


router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);


router.get('/health', (req, res) => {
  res.json({ status: 'Products API is working!' });
});

module.exports = router;