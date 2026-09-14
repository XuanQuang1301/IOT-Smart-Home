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

    // Seed mock data if tables are empty
    await seedInitialDataIfEmpty();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
}

async function seedInitialDataIfEmpty() {
  try {
    // Check if sensors_data is empty
    const [sensorRows] = await pool.query('SELECT COUNT(*) as count FROM sensors_data');
    if (sensorRows[0].count === 0) {
      console.log('🌱 Seeding initial sensor history data...');
      const now = new Date();
      const records = [];
      // Generate past 20 records (every 10 minutes)
      for (let i = 20; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 10 * 60 * 1000);
        const formattedTime = time.toISOString().slice(0, 19).replace('T', ' ');

        // Temp: 26.5 - 29.5
        const temp = parseFloat((27.0 + Math.sin(i * 0.5) * 2 + Math.random() * 0.5).toFixed(1));
        // Humidity: 60 - 75
        const hum = parseFloat((65.0 + Math.cos(i * 0.5) * 5 + Math.random() * 1).toFixed(1));
        // Light: 600 - 850
        const light = Math.floor(700 + Math.sin(i * 0.3) * 120 + Math.random() * 20);

        records.push([1, temp, formattedTime]);
        records.push([2, hum, formattedTime]);
        records.push([3, light, formattedTime]);
      }

      for (const [sId, val, t] of records) {
        await pool.query('INSERT INTO sensors_data (sensor_id, value, created_at) VALUES (?, ?, ?)', [sId, val, t]);
      }
    }

    // Check if actions_history is empty
    const [actionRows] = await pool.query('SELECT COUNT(*) as count FROM actions_history');
    if (actionRows[0].count === 0) {
      console.log('🌱 Seeding initial action history data...');
      const now = new Date();
      const mockActions = [
        { device_id: 1, action: 'TURN_ON', status: 'SUCCESS', minsAgo: 5 },
        { device_id: 1, action: 'TURN_OFF', status: 'SUCCESS', minsAgo: 25 },
        { device_id: 2, action: 'TURN_OFF', status: 'FAILED', minsAgo: 40 },
        { device_id: 1, action: 'TURN_ON', status: 'SUCCESS', minsAgo: 60 },
        { device_id: 2, action: 'TURN_ON', status: 'SUCCESS', minsAgo: 90 },
        { device_id: 1, action: 'TURN_OFF', status: 'SUCCESS', minsAgo: 120 },
        { device_id: 2, action: 'TURN_OFF', status: 'SUCCESS', minsAgo: 180 },
        { device_id: 2, action: 'TURN_ON', status: 'SUCCESS', minsAgo: 240 }
      ];

      for (const item of mockActions) {
        const time = new Date(now.getTime() - item.minsAgo * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        await pool.query(
          'INSERT INTO actions_history (device_id, user_id, action, status, time) VALUES (?, ?, ?, ?, ?)',
          [item.device_id, 1, item.action, item.status, time]
        );
      }
    }
  } catch (err) {
    console.error('⚠️ Error seeding initial data:', err.message);
  }
}

module.exports = {
  pool,
  initDatabase
};
