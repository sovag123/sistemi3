const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const productController = require('../controllers/productController');

const router = express.Router();


router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});


const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'images') {
        const uploadPath = path.join(__dirname, '../uploads/images');
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
      } else if (file.fieldname === 'model_3d') {
        const uploadPath = path.join(__dirname, '../uploads/models');
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
      } else {
        cb(new Error('Invalid field name'), null);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      if (file.fieldname === 'images') {
        cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
      } else if (file.fieldname === 'model_3d') {
        cb(null, `model-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 15
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for images'), false);
      }
    } else if (file.fieldname === 'model_3d') {
      const allowedExtensions = ['.glb', '.gltf', '.obj', '.fbx'];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error('Only 3D model files (.glb, .gltf, .obj, .fbx) are allowed'), false);
      }
    } else {
      cb(new Error('Invalid field name'), false);
    }
  }
});


router.get('/test', (req, res) => {
  res.json({ message: 'Products route is working' });
});


router.get('/categories', productController.getCategories);
router.get('/user/:userId', productController.getUserProducts);
router.get('/:id/stats', authenticateToken, productController.getProductStats);
router.get('/:id', productController.getProductById);
router.get('/', productController.getAllProducts);


router.post('/', authenticateToken, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'model_3d', maxCount: 1 }
]), productController.createProduct);


router.put('/:id', authenticateToken, productController.updateProduct);
router.delete('/:id', authenticateToken, productController.deleteProduct);

module.exports = router;