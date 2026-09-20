const { pool } = require('../config/db');
const { sendMqttControl } = require('../services/mqttService');

// GET /api/v1/devices/status
async function getDevicesStatus(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, name, device_type, pin, state, updated_at FROM devices ORDER BY id ASC');
    return res.json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Error getting devices status:', error);
    return res.status(500).json({ status: 'error', message: 'Không thể lấy trạng thái thiết bị' });
  }
}

// POST /api/v1/devices/:id/control
async function controlDevice(req, res) {
  try {
    const deviceId = parseInt(req.params.id);
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ status: 'error', message: 'Hành động không hợp lệ' });
    }

    // Check device exists
    const [deviceRows] = await pool.query('SELECT * FROM devices WHERE id = ?', [deviceId]);
    if (deviceRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy thiết bị' });
    }

    const device = deviceRows[0];
    const isTurningOn = (action === 'TURN_ON' || action === 'ON');
    const targetState = isTurningOn ? 'ON' : 'OFF';
    const actionStr = action.startsWith('TURN_') ? action : `TURN_${action}`;

    // Map device ID to ESP8266 MQTT command
    let mqttCmd = '';
    if (deviceId === 1) {
      mqttCmd = isTurningOn ? 'LED1_ON' : 'LED1_OFF';
    } else if (deviceId === 2) {
      mqttCmd = isTurningOn ? 'LED2_ON' : 'LED2_OFF';
    }

    // 1. Insert PENDING action into DB
    const [insertResult] = await pool.query(
      'INSERT INTO actions_history (device_id, user_id, action, status, time) VALUES (?, ?, ?, ?, NOW())',
      [deviceId, 1, actionStr, 'PENDING']
    );
    const actionId = insertResult.insertId;

    // 2. Publish MQTT Command to ESP8266
    if (mqttCmd) {
      sendMqttControl(mqttCmd);
    }

    // 3. Optimistically update local database state
    await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = ?', [targetState, deviceId]);
    await pool.query('UPDATE actions_history SET status = ? WHERE id = ?', ['SUCCESS', actionId]);

    const nowIso = new Date().toISOString();

    return res.json({
      status: 'success',
      message: 'Điều khiển thiết bị thành công',
      data: {
        action_id: actionId,
        device_id: deviceId,
        device_name: device.name,
        state: targetState,
        updated_at: nowIso
      }
    });
  } catch (error) {
    console.error('Error controlling device:', error);
    return res.status(500).json({ status: 'error', message: 'Điều khiển thiết bị thất bại' });
  }
}

// GET /api/v1/actions/history
async function getActionsHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const device_id = req.query.device_id;
    const status = req.query.status;
    const action = req.query.action;
    const time = req.query.time;

    let whereConditions = [];
    let queryParams = [];

    if (device_id) {
      whereConditions.push('ah.device_id = ?');
      queryParams.push(device_id);
    }
    if (status) {
      whereConditions.push('ah.status = ?');
      queryParams.push(status);
    }
    if (action) {
      whereConditions.push('ah.action = ?');
      queryParams.push(action);
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
        DATE_FORMAT(CONVERT_TZ(ah.time, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') LIKE ? OR
        DATE_FORMAT(CONVERT_TZ(ah.time, @@session.time_zone, '+07:00'), '%d/%m/%Y %H:%i:%s') LIKE ? OR
        DATE_FORMAT(CONVERT_TZ(ah.time, @@session.time_zone, '+07:00'), '%Y/%m/%d %H:%i:%s') LIKE ?
      )`);
      queryParams.push(`%${normalized}%`, `%${trimmed}%`, `%${normalized}%`);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Count
    const countSql = `
      SELECT COUNT(*) as total
      FROM actions_history ah
      JOIN devices d ON ah.device_id = d.id
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, queryParams);
    const totalRecords = countRows[0].total;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    // Data
    const dataSql = `
      SELECT 
        ah.id,
        ah.device_id,
        d.name as device_name,
        ah.action,
        COALESCE(u.username, 'admin') as user_name,
        ah.status,
        DATE_FORMAT(CONVERT_TZ(ah.time, @@session.time_zone, '+07:00'), '%Y-%m-%d %H:%i:%s') as created_at
      FROM actions_history ah
      JOIN devices d ON ah.device_id = d.id
      LEFT JOIN users u ON ah.user_id = u.id
      ${whereClause}
      ORDER BY ah.time DESC, ah.id DESC
      LIMIT ? OFFSET ?
    `;
    const [dataRows] = await pool.query(dataSql, [...queryParams, limit, offset]);

    return res.json({
      status: 'success',
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_records: totalRecords
      },
      data: dataRows
    });
  } catch (error) {
    console.error('Error fetching actions history:', error);
    return res.status(500).json({ status: 'error', message: 'Không thể tải danh sách nhật ký thiết bị' });
  }
}

module.exports = {
  getDevicesStatus,
  controlDevice,
  getActionsHistory
};
