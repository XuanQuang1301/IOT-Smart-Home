const { pool } = require('../config/db');
const { getLatestValues } = require('../services/mqttService');

// GET /api/v1/sensor/realtime
async function getRealtimeSensor(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT value FROM sensors_data WHERE sensor_id = 1 ORDER BY created_at DESC, id DESC LIMIT 1) as temp,
        (SELECT value FROM sensors_data WHERE sensor_id = 2 ORDER BY created_at DESC, id DESC LIMIT 1) as hum,
        (SELECT value FROM sensors_data WHERE sensor_id = 3 ORDER BY created_at DESC, id DESC LIMIT 1) as light,
        (SELECT created_at FROM sensors_data ORDER BY created_at DESC, id DESC LIMIT 1) as latest_time
    `);

    if (rows.length > 0 && rows[0].temp !== null) {
      return res.json({
        status: 'success',
        data: {
          temperature: rows[0].temp,
          humidity: rows[0].hum,
          light: rows[0].light,
          timestamp: rows[0].latest_time ? new Date(rows[0].latest_time).toISOString() : new Date().toISOString()
        }
      });
    }

    return res.json({
      status: 'success',
      data: getLatestValues()
    });
  } catch (error) {
    console.error('Error fetching realtime sensor:', error);
    return res.json({
      status: 'success',
      data: getLatestValues()
    });
  }
}

// GET /api/v1/sensor/history or /api/v1/sensors/history
async function getSensorHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sensor_id = req.query.sensor_id || req.query.deviceId;
    const sensor_type = req.query.sensor_type;
    const value = req.query.value;
    const time = req.query.time;

    // Chart dataset query
    if (req.query.deviceId || req.query.chart === 'true') {
      const [chartRows] = await pool.query(`
        SELECT 
          DATE_FORMAT(CONVERT_TZ(sd.created_at, @@session.time_zone, '+07:00'), '%H:%i:%s') as time,
          MAX(CASE WHEN s.sensor_type = 'TEMPERATURE' OR s.id = 1 THEN sd.value END) as temperature,
          MAX(CASE WHEN s.sensor_type = 'HUMIDITY' OR s.id = 2 THEN sd.value END) as humidity,
          MAX(CASE WHEN s.sensor_type = 'LIGHT' OR s.id = 3 THEN sd.value END) as light
        FROM sensors_data sd
        JOIN sensors s ON sd.sensor_id = s.id
        GROUP BY time
        ORDER BY MAX(sd.created_at) DESC
        LIMIT ?
      `, [limit]);

      const chartData = chartRows.reverse().map(r => ({
        temperature: r.temperature || 0,
        humidity: r.humidity || 0,
        light: r.light || 0,
        time: r.time
      }));

      return res.json({
        status: 'success',
        data: chartData
      });
    }

    // Standard paginated sensor history query
    let whereConditions = [];
    let queryParams = [];

    if (sensor_id) {
      whereConditions.push('sd.sensor_id = ?');
      queryParams.push(sensor_id);
    }
    if (sensor_type) {
      whereConditions.push('s.sensor_type = ?');
      queryParams.push(sensor_type);
    }
    if (value) {
      whereConditions.push('sd.value = ?');
      queryParams.push(parseFloat(value));
    }
    if (time) {
      const trimmed = time.trim();
      let normalized = trimmed.replace(/\//g, '-');

      const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/);
      if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, '0');
        const month = dmyMatch[2].padStart(2, '0');
        const year = dmyMatch[3];
        const rest = dmyMatch[4];
        normalized = `${year}-${month}-${day}${rest}`;
      }

      whereConditions.push(`(
        DATE_FORMAT(CONVERT_TZ(sd.created_at, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') LIKE ? OR
        DATE_FORMAT(CONVERT_TZ(sd.created_at, @@session.time_zone, '+07:00'), '%d/%m/%Y %H:%i:%s') LIKE ? OR
        DATE_FORMAT(CONVERT_TZ(sd.created_at, @@session.time_zone, '+07:00'), '%Y/%m/%d %H:%i:%s') LIKE ?
      )`);
      queryParams.push(`%${normalized}%`, `%${trimmed}%`, `%${normalized}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM sensors_data sd
      JOIN sensors s ON sd.sensor_id = s.id
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, queryParams);
    const totalRecords = countRows[0].total;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    // Data
    const dataSql = `
      SELECT 
        sd.id,
        sd.sensor_id,
        s.name,
        s.sensor_type,
        sd.value,
        s.unit,
        DATE_FORMAT(CONVERT_TZ(sd.created_at, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') as created_at
      FROM sensors_data sd
      JOIN sensors s ON sd.sensor_id = s.id
      ${whereClause}
      ORDER BY sd.created_at DESC, sd.id DESC
      LIMIT ? OFFSET ?
    `;
    const [dataRows] = await pool.query(dataSql, [...queryParams, limit, offset]);

    return res.json({
      status: 'success',
      message: 'Lấy dữ liệu thành công',
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_records: totalRecords
      },
      data: dataRows.map(r => ({
        id: r.id,
        sensor_id: r.sensor_id,
        name: r.name,
        sensor_type: r.sensor_type,
        value: r.value,
        unit: r.unit,
        created_at: r.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching sensor history:', error);
    return res.status(500).json({ status: 'error', message: 'Không thể tải danh sách dữ liệu cảm biến' });
  }
}

module.exports = {
  getRealtimeSensor,
  getSensorHistory
};
