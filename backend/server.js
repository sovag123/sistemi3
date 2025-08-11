const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'development' ? 500 : 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
  
    return req.path.startsWith('/uploads') || req.path === '/api/health';
  }
});

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));


app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));


app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads/models', (req, res, next) => {
  console.log('3D Model request:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Cache-Control');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.header('Cache-Control', 'public, max-age=31536000');
  const ext = path.extname(req.path).toLowerCase();
  if (ext === '.glb') {
    res.header('Content-Type', 'model/gltf-binary');
  } else if (ext === '.gltf') {
    res.header('Content-Type', 'model/gltf+json');
  } else if (ext === '.obj') {
    res.header('Content-Type', 'text/plain');
  } else if (ext === '.fbx') {
    res.header('Content-Type', 'application/octet-stream');
  }
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method === 'HEAD') {
    const filePath = path.join(__dirname, 'uploads/models', req.path);
    return res.sendFile(filePath, { headers: false });
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads/models')));
app.use('/uploads/images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'public, max-age=31536000');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads/images')));
app.get('/api/model/:filename', (req, res) => {
  const filename = req.params.filename;
  const modelPath = path.join(__dirname, 'uploads', 'models', filename);
  
  console.log('API model request for:', filename);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Accept-Ranges');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('Content-Type', 'model/gltf-binary');
  
  res.sendFile(modelPath, (err) => {
    if (err) {
      console.error('Error serving model via API:', err);
      res.status(404).json({ error: 'Model not found' });
    }
  });
});
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
} catch (error) {
  console.error('Error loading auth routes:', error.message);
}

try {
  const productRoutes = require('./routes/products');
  app.use('/api/products', productRoutes);
} catch (error) {
  console.error('Error loading product routes:', error.message);
}

try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
} catch (error) {
  console.error('Error loading user routes:', error.message);
}

try {
  const orderRoutes = require('./routes/orders');
  app.use('/api/orders', orderRoutes);
} catch (error) {
  console.error('Error loading order routes:', error.message);
}

try {
  const messageRoutes = require('./routes/messages');
  app.use('/api/messages', messageRoutes);
} catch (error) {
  console.error('Error loading message routes:', error.message);
}

try {
  const favoriteRoutes = require('./routes/favorites');
  app.use('/api/favorites', favoriteRoutes);
} catch (error) {
  console.error('Error loading favorite routes:', error.message);
}

try {
  const commentRoutes = require('./routes/comments');
  app.use('/api/comments', commentRoutes);
} catch (error) {
  console.error('Error loading comment routes:', error.message);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.path
  });
});
app.use((err, req, res, next) => {
  console.error('=== ERROR OCCURRED ===');
  console.error('Time:', new Date().toISOString());
  console.error('Method:', req.method);
  console.error('Path:', req.path);
  console.error('Error Stack:', err.stack);
  console.error('Error Message:', err.message);
  console.error('=== END ERROR ===');
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: http://localhost:3000, http://localhost:3001`);
  console.log(`Static files served from: http://localhost:${PORT}/uploads`);
  console.log(`3D Models: http://localhost:${PORT}/uploads/models/`);
  console.log(`Alternative API: http://localhost:${PORT}/api/model/`);
});

module.exports = app;