const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    
    if (file.fieldname === 'images') {
      uploadPath = path.join(__dirname, '../uploads/images');
    } else if (file.fieldname === 'model_3d') {
      uploadPath = path.join(__dirname, '../uploads/models');
    } else {
      uploadPath = path.join(__dirname, '../uploads/misc');
    }
    
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
    
    let prefix;
    if (file.fieldname === 'images') {
      prefix = 'img';
    } else if (file.fieldname === 'model_3d') {
      prefix = 'model';
    } else {
      prefix = 'file';
    }
    
    const uniqueFilename = `${prefix}_${baseName}_${uniqueSuffix}${fileExtension}`;
    console.log(`Generated unique filename: ${uniqueFilename} for original: ${file.originalname}`);
    
    cb(null, uniqueFilename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('File filter check:', file.fieldname, file.mimetype, file.originalname);
  
  if (file.fieldname === 'images') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for images field'), false);
    }
  } else if (file.fieldname === 'model_3d') {
    const allowedExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae', '.3ds'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only 3D model files (.glb, .gltf, .obj, .fbx, .dae, .3ds) are allowed'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 12 // Max 10 images + 1 model + buffer
  },
  fileFilter: fileFilter
});

module.exports = upload;