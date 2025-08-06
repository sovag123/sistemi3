const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (uploadPath) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const modelFilter = (req, file, cb) => {
  const allowedTypes = ['.glb', '.gltf', '.obj', '.fbx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only 3D model files are allowed'), false);
  }
};

const uploadImages = multer({
  storage: createStorage('./uploads/images/'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadModels = multer({
  storage: createStorage('./uploads/models/'),
  fileFilter: modelFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

module.exports = {
  uploadImages,
  uploadModels
};