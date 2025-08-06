const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

let connection;

const setupDatabase = async () => {
  try {

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS webstore_3d_test');
    await connection.end();

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'webstore_3d_test',
      multipleStatements: true
    });


    const schemaPath = path.join(__dirname, '../../../db/schema.sql');
    const seedPath = path.join(__dirname, '../../../db/seed.sql');

    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    const cleanSchemaSQL = schemaSQL
      .replace('CREATE DATABASE IF NOT EXISTS webstore_3d;', '')
      .replace('USE webstore_3d;', '');
    
    await connection.query(cleanSchemaSQL);
    console.log('Test database schema created');

    const [tables] = await connection.query("SHOW TABLES");
    if (tables.length > 0) {
      const [userCount] = await connection.query('SELECT COUNT(*) as count FROM user');
      if (userCount[0].count === 0) {
        const seedSQL = await fs.readFile(seedPath, 'utf8');
        const cleanSeedSQL = seedSQL.replace('USE webstore_3d;', '');
        await connection.query(cleanSeedSQL);
        console.log('Test database seeded with sample data');
      }
    }

    console.log('Test database setup completed');
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }
};

const teardownDatabase = async () => {
  try {
    if (connection) {
      await connection.query('DROP DATABASE IF EXISTS webstore_3d_test');
      await connection.end();
      console.log('Test database cleaned up');
    }
  } catch (error) {
    console.error('Database teardown error:', error);
  }
};

const getConnection = () => connection;

module.exports = {
  setupDatabase,
  teardownDatabase,
  getConnection
};