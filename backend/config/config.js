require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  dbConfig: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'webstore_3d'
  },
  uploadPaths: {
    images: './uploads/images/',
    models: './uploads/models/'
  }
};