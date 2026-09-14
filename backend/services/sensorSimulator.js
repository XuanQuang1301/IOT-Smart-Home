const { pool } = require('../config/db');

let simulatorInterval = null;
let currentTemp = 28.5;
let currentHum = 65.0;
let currentLight = 720;

function startSensorSimulator(broadcastFn) {
  if (simulatorInterval) return;

  console.log('🚀 Sensor Simulator started (generating readings every 2.5s)...');

  simulatorInterval = setInterval(async () => {
    try {
      // Small fluctuation logic
      const tempDelta = (Math.random() - 0.5) * 0.4;
      const humDelta = (Math.random() - 0.5) * 1.0;
      const lightDelta = Math.floor((Math.random() - 0.5) * 15);

      currentTemp = Math.min(38.0, Math.max(18.0, parseFloat((currentTemp + tempDelta).toFixed(1))));
      currentHum = Math.min(95.0, Math.max(30.0, parseFloat((currentHum + humDelta).toFixed(1))));
      currentLight = Math.min(1500, Math.max(100, Math.round(currentLight + lightDelta)));

      const now = new Date();
      const timestampIso = now.toISOString();
      const dbTimestamp = now.toISOString().slice(0, 19).replace('T', ' ');

      // Insert data into sensors_data
      await pool.query(
        'INSERT INTO sensors_data (sensor_id, value, created_at) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
        [
          1, currentTemp, dbTimestamp,
          2, currentHum, dbTimestamp,
          3, currentLight, dbTimestamp
        ]
      );

      // Prepare realtime payload matching SRS 3.1.1.3 format
      const realtimeData = {
        temperature: currentTemp,
        humidity: currentHum,
        light: currentLight,
        timestamp: timestampIso
      };

      // Broadcast to WebSocket clients
      if (typeof broadcastFn === 'function') {
        broadcastFn({
          type: 'SENSOR_UPDATE',
          data: realtimeData
        });
      }
    } catch (error) {
      console.error('⚠️ Error in sensor simulator:', error.message);
    }
  }, 2500);
}

function stopSensorSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
}

function getCurrentValues() {
  return {
    temperature: currentTemp,
    humidity: currentHum,
    light: currentLight,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  startSensorSimulator,
  stopSensorSimulator,
  getCurrentValues
};
