const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./config/db');
const { getRealtimeSensor, getSensorHistory } = require('./controllers/sensorController');
const { getDevicesStatus, controlDevice, getActionsHistory } = require('./controllers/deviceController');
const { initMqtt } = require('./services/mqttService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Create HTTP & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'WebSocket connected to Smart Home Server' }));

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Broadcast function to all WebSocket clients
function broadcast(messageObj) {
  const payload = JSON.stringify(messageObj);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// API Routes
app.get('/api/v1/sensor/realtime', getRealtimeSensor);
app.get('/api/v1/sensors/history', getSensorHistory);
app.get('/api/v1/sensor/history', getSensorHistory);

app.get('/api/v1/devices/status', getDevicesStatus);
app.post('/api/v1/devices/:id/control', controlDevice);
app.get('/api/v1/actions/history', getActionsHistory);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Start Server, Init DB & MQTT Service
server.listen(PORT, async () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
  await initDatabase();
  initMqtt(broadcast);
});
