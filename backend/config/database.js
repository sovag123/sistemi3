const mysql = require('mysql2');
require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';
const dbName = isTest ? 'webstore_3d_test' : (process.env.DB_NAME || 'webstore_3d');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

module.exports = promisePool;