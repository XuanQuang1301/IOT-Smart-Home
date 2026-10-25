const { pool } = require('../config/db');
const { sendMqttControl, waitForMqttDeviceResponse } = require('../services/mqttService');

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
    if (device.device_type === 'ALERT_LIGHT' || deviceId === 4) {
      return res.status(400).json({ status: 'error', message: 'Đèn cảnh báo hoạt động tự động, không thể điều khiển thủ công' });
    }

    const prevState = device.state || 'OFF';
    const isTurningOn = (action === 'TURN_ON' || action === 'ON');
    const targetState = isTurningOn ? 'ON' : 'OFF';
    const actionStr = action.startsWith('TURN_') ? action : `TURN_${action}`;

    // Map device ID to ESP8266 MQTT command
    let mqttCmd = '';
    if (deviceId === 1) {
      mqttCmd = isTurningOn ? 'LED1_ON' : 'LED1_OFF';
    } else if (deviceId === 2) {
      mqttCmd = isTurningOn ? 'LED2_ON' : 'LED2_OFF';
    } else if (deviceId === 3) {
      mqttCmd = isTurningOn ? 'LED3_ON' : 'LED3_OFF';
    }

    // 1. Cập nhật trạng thái thiết bị sang LOADING trong DB ngay khi tiếp nhận lệnh
    await pool.query("UPDATE devices SET state = 'LOADING', updated_at = NOW() WHERE id = ?", [deviceId]);

    // 2. Ghi nhận trạng thái trung gian LOADING vào lịch sử thao tác thiết bị
    await pool.query(
      'INSERT INTO actions_history (device_id, user_id, action, status, time) VALUES (?, ?, ?, ?, NOW())',
      [deviceId, 1, 'LOADING', 'SUCCESS']
    );

    // 3. Publish MQTT Command to ESP8266
    const sent = mqttCmd ? sendMqttControl(mqttCmd) : false;
    if (!sent) {
      // Rollback trạng thái cũ nếu không gửi được MQTT và ghi nhận FAILED
      await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = ?', [prevState, deviceId]);
      await pool.query(
        'INSERT INTO actions_history (device_id, user_id, action, status, time) VALUES (?, ?, ?, ?, NOW())',
        [deviceId, 1, actionStr, 'FAILED']
      );
      return res.status(500).json({ status: 'error', message: 'Không thể kết nối đến MQTT Broker' });
    }

    // 4. Chờ phản hồi thực tế từ phần cứng ESP8266 qua MQTT (tối đa 4.5s)
    const espState = await waitForMqttDeviceResponse(deviceId, 4500);

    if (espState !== null) {
      // Phần cứng đã phản hồi thành công qua topic device_response!
      const actualState = espState || targetState;
      await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = ?', [actualState, deviceId]);

      // Ghi nhận hành động hoàn tất (TURN_ON / TURN_OFF) vào lịch sử với status = 'SUCCESS'
      const [insertResult] = await pool.query(
        'INSERT INTO actions_history (device_id, user_id, action, status, time) VALUES (?, ?, ?, ?, NOW())',
        [deviceId, 1, actionStr, 'SUCCESS']
      );
      const actionId = insertResult.insertId;

      const nowIso = new Date().toISOString();

      return res.json({
        status: 'success',
        message: 'Điều khiển thiết bị thành công',
        data: {
          action_id: actionId,
          device_id: deviceId,
          device_name: device.name,
          state: actualState,
          updated_at: nowIso
        }
      });
    } else {
      // Quá thời gian 4.5s mà ESP8266 KHÔNG phản hồi trên MQTT -> Rollback trạng thái cũ và ghi FAILED
      await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = ?', [prevState, deviceId]);
      await pool.query(
        'INSERT INTO actions_history (device_id, user_id, action, status, time) VALUES (?, ?, ?, ?, NOW())',
        [deviceId, 1, actionStr, 'FAILED']
      );

      return res.status(504).json({
        status: 'error',
        message: 'Thiết bị ESP8266 không phản hồi sau 5s! Thao tác thất bại.'
      });
    }
  } catch (error) {
    console.error('Error controlling device:', error);
    try {
      if (req.params && req.params.id) {
        // Cố gắng rollback trạng thái nếu có lỗi ngoại lệ
        const devId = parseInt(req.params.id);
        const [devRows] = await pool.query('SELECT state FROM devices WHERE id = ?', [devId]);
        if (devRows.length > 0 && devRows[0].state === 'LOADING') {
          await pool.query("UPDATE devices SET state = 'OFF', updated_at = NOW() WHERE id = ?", [devId]);
        }
      }
    } catch (e) {
      console.error('Error rolling back state:', e);
    }
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
      if (status === 'SUCCESS' || status === 'SUCCESSFUL') {
        whereConditions.push('(ah.status = "SUCCESS" OR ah.status = "SUCCESSFUL")');
      } else if (status === 'PENDING' || status === 'LOADING') {
        whereConditions.push('(ah.status = "PENDING" OR ah.action = "LOADING")');
      } else {
        whereConditions.push('ah.status = ?');
        queryParams.push(status);
      }
    }
    if (action) {
      if (action === 'TURN_ON' || action === 'ON') {
        whereConditions.push('(ah.action = "TURN_ON" OR ah.action = "ON")');
      } else if (action === 'TURN_OFF' || action === 'OFF') {
        whereConditions.push('(ah.action = "TURN_OFF" OR ah.action = "OFF")');
      } else if (action === 'LOADING') {
        whereConditions.push('(ah.action = "LOADING" OR ah.status = "PENDING")');
      } else {
        whereConditions.push('ah.action = ?');
        queryParams.push(action);
      }
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
        CASE WHEN ah.user_id IS NULL THEN 'Hệ thống' ELSE COALESCE(u.username, 'admin') END as user_name,
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
