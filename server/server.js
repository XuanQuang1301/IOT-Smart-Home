const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./config/db');
const { getRealtimeSensor, getSensorHistory } = require('./controllers/sensorController');
const { getDevicesStatus, controlDevice, getActionsHistory } = require('./controllers/deviceController');
const { getUserProfile, updateUserProfile } = require('./controllers/userController');
const { initMqtt } = require('./services/mqttService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/v1/sensor/realtime', getRealtimeSensor);
app.get('/api/v1/sensors/history', getSensorHistory);
app.get('/api/v1/sensor/history', getSensorHistory);

app.get('/api/v1/devices/status', getDevicesStatus);
app.post('/api/v1/devices/:id/control', controlDevice);
app.get('/api/v1/actions/history', getActionsHistory);

// Profile Endpoints
app.get('/api/v1/user/profile', getUserProfile);
app.put('/api/v1/user/profile', updateUserProfile);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Start Server, Init DB & MQTT Service
app.listen(PORT, async () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
  await initDatabase();
  initMqtt();
});

