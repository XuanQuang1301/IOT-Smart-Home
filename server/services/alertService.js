const { pool } = require('../config/db');

const ALERT_DEVICE_ID = 4;
let lastAlertState = null;

// Lấy danh sách cài đặt ngưỡng
async function getSettings() {
  const [rows] = await pool.query(`
    SELECT a.sensor_id, s.name, s.sensor_type, s.unit, a.threshold, a.updated_at
    FROM alert_settings a
    JOIN sensors s ON a.sensor_id = s.id
    ORDER BY a.sensor_id ASC
  `);
  return rows;
}

// Cập nhật ngưỡng cho 1 cảm biến
async function updateThreshold(sensorId, threshold) {
  const [result] = await pool.query(
    'UPDATE alert_settings SET threshold = ?, updated_at = NOW() WHERE sensor_id = ?',
    [threshold, sensorId]
  );
  return result.affectedRows > 0;
}

// Xử lý khi cờ cảnh báo thay đổi (Edge trigger: false -> true hoặc true -> false)
async function onAlertFlag(active) {
  try {
    // Khởi tạo trạng thái lần đầu từ DB nếu cần
    if (lastAlertState === null) {
      const [devRows] = await pool.query('SELECT state FROM devices WHERE id = ?', [ALERT_DEVICE_ID]);
      if (devRows.length > 0) {
        lastAlertState = devRows[0].state === 'ALERT';
      } else {
        lastAlertState = false;
      }
    }

    // Nếu trạng thái không đổi thì không làm gì (tránh spam DB)
    if (active === lastAlertState) return;

    lastAlertState = active;

    // Lấy hàm sendMqttControl để bắn lệnh xuống ESP8266
    const { sendMqttControl } = require('./mqttService');

    if (active) {
      // Cạnh lên: Bật cảnh báo
      await pool.query('UPDATE devices SET state = "ALERT", updated_at = NOW() WHERE id = ?', [ALERT_DEVICE_ID]);
      await pool.query(
        'INSERT INTO actions_history (device_id, user_id, action, status, time) VALUES (?, NULL, "TURN_ON", "ALERT", NOW())',
        [ALERT_DEVICE_ID]
      );
      sendMqttControl('ALERT_ON');
      console.log('🚨 [ALERT SERVICE] Kích hoạt cảnh báo LED4 (status: ALERT) & Bắn lệnh ALERT_ON xuống ESP8266');
    } else {
      // Cạnh xuống: Tắt cảnh báo
      await pool.query('UPDATE devices SET state = "OFF", updated_at = NOW() WHERE id = ?', [ALERT_DEVICE_ID]);
      sendMqttControl('ALERT_OFF');
      console.log('✅ [ALERT SERVICE] Tắt cảnh báo LED4 (state: OFF) & Bắn lệnh ALERT_OFF xuống ESP8266');
    }
  } catch (err) {
    console.error('Error handling onAlertFlag:', err);
  }
}

// Thống kê cảnh báo theo ngày trong tháng YYYY-MM
async function getMonthlyStats(yearMonth) {
  // Regex YYYY-MM
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  const [rows] = await pool.query(`
    SELECT DATE_FORMAT(CONVERT_TZ(time, @@session.time_zone, '+07:00'), '%Y-%m-%d') AS day, COUNT(*) AS count
    FROM actions_history
    WHERE device_id = ? AND status = 'ALERT'
      AND DATE_FORMAT(CONVERT_TZ(time, @@session.time_zone, '+07:00'), '%Y-%m') = ?
    GROUP BY day
    ORDER BY day ASC
  `, [ALERT_DEVICE_ID, yearMonth]);

  const countMap = {};
  rows.forEach(r => {
    countMap[r.day] = parseInt(r.count);
  });

  // Bù các ngày trong tháng
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  let total = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cnt = countMap[dayStr] || 0;
    days.push({
      date: dayStr,
      day: d,
      count: cnt
    });
    total += cnt;
  }

  return {
    month: yearMonth,
    total,
    days
  };
}

module.exports = {
  ALERT_DEVICE_ID,
  getSettings,
  updateThreshold,
  onAlertFlag,
  getMonthlyStats
};
