const alertService = require('../services/alertService');
const { publishAlertConfig } = require('../services/mqttService');

// GET /api/v1/alerts/settings
async function getAlertSettings(req, res) {
  try {
    const settings = await alertService.getSettings();
    return res.json({
      status: 'success',
      data: settings
    });
  } catch (error) {
    console.error('Error getting alert settings:', error);
    return res.status(500).json({ status: 'error', message: 'Không thể lấy cài đặt cảnh báo' });
  }
}

// PUT /api/v1/alerts/settings/:sensorId
async function updateAlertSetting(req, res) {
  try {
    const sensorId = parseInt(req.params.sensorId);
    const { threshold } = req.body;

    const val = parseFloat(threshold);
    if (!Number.isFinite(val) || val < 0) {
      return res.status(400).json({ status: 'error', message: 'Ngưỡng cảnh báo không hợp lệ' });
    }

    if (sensorId === 4 && val > 500) {
      return res.status(400).json({ status: 'error', message: 'Ngưỡng tốc độ gió tối đa là 500 km/h' });
    }

    const updated = await alertService.updateThreshold(sensorId, val);
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy cài đặt cho cảm biến này' });
    }

    // Đẩy cấu hình cập nhật xuống ESP8266 qua MQTT topic retained
    let synced = false;
    try {
      synced = await publishAlertConfig();
    } catch (mqttErr) {
      console.warn('Could not immediately sync alert config to MQTT:', mqttErr.message);
    }

    return res.json({
      status: 'success',
      message: 'Cập nhật ngưỡng cảnh báo thành công',
      data: {
        sensor_id: sensorId,
        threshold: val,
        synced
      }
    });
  } catch (error) {
    console.error('Error updating alert setting:', error);
    return res.status(500).json({ status: 'error', message: 'Không thể cập nhật ngưỡng cảnh báo' });
  }
}

// GET /api/v1/alerts/stats?month=YYYY-MM
async function getAlertStats(req, res) {
  try {
    let month = req.query.month;
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      // Mặc định lấy tháng hiện tại theo giờ GMT+7
      const now = new Date();
      const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      month = vnTime.toISOString().substring(0, 7);
    }

    const stats = await alertService.getMonthlyStats(month);
    return res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Error getting alert stats:', error);
    return res.status(500).json({ status: 'error', message: 'Không thể lấy thống kê cảnh báo' });
  }
}

module.exports = {
  getAlertSettings,
  updateAlertSetting,
  getAlertStats
};
