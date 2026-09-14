const { pool } = require('../config/db');

// Broadcast function holder (will be injected by server.js)
let broadcastFn = null;
function setBroadcastFn(fn) {
  broadcastFn = fn;
}

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
    const targetState = (action === 'TURN_ON' || action === 'ON') ? 'ON' : 'OFF';
    const actionStr = action.startsWith('TURN_') ? action : `TURN_${action}`;

    // 1. Insert PENDING action
    const [insertResult] = await pool.query(
      'INSERT INTO actions_history (device_id, user_id, action, status, time) VALUES (?, ?, ?, ?, NOW())',
      [deviceId, 1, actionStr, 'PENDING']
    );
    const actionId = insertResult.insertId;

    // Simulate Hardware ACK
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 2. Update Device state & action status to SUCCESS
    await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = ?', [targetState, deviceId]);
    await pool.query('UPDATE actions_history SET status = ? WHERE id = ?', ['SUCCESS', actionId]);

    const nowIso = new Date().toISOString();

    // 3. Broadcast real-time update
    if (typeof broadcastFn === 'function') {
      broadcastFn({
        type: 'DEVICE_UPDATE',
        data: {
          device_id: deviceId,
          device_name: device.name,
          state: targetState,
          action_id: actionId,
          updated_at: nowIso
        }
      });
    }

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
      whereConditions.push('ah.time LIKE ?');
      queryParams.push(`%${time}%`);
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
        ah.time as created_at
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
  getActionsHistory,
  setBroadcastFn
};
