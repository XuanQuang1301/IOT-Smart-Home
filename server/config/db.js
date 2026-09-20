const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_home_iot',
  timezone: '+07:00',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Connection pool without database selected initially for DB creation check
const rootPool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  timezone: '+07:00',
  multipleStatements: true
});

// App pool with database
const pool = mysql.createPool(dbConfig);

async function initDatabase() {
  try {
    const connection = await rootPool.getConnection();
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    connection.release();

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const dbConnection = await pool.getConnection();
      await dbConnection.query(schemaSql);
      dbConnection.release();
    }

    console.log('Database initialized successfully (Real ESP8266 Mode)');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
}

module.exports = {
  pool,
  initDatabase
};
