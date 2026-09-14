const mqtt = require('mqtt');
const { pool } = require('../config/db');
require('dotenv').config();

const brokerUrl = `mqtt://${process.env.MQTT_BROKER || 'broker.emqx.io'}:${process.env.MQTT_PORT || 1883}`;
const topicSensorPub = process.env.MQTT_TOPIC_PUB || 'esp8266Quang/sensor/data';
const topicDeviceControl = process.env.MQTT_TOPIC_CONTROL || 'esp8266Quang/device_control';
const topicDeviceResponse = process.env.MQTT_TOPIC_RESPONSE || 'esp8266Quang/device_response';

let mqttClient = null;
let broadcastFn = null;

let latestSensorValues = {
  temperature: 28.5,
  humidity: 65.0,
  light: 720,
  timestamp: new Date().toISOString()
};

function initMqtt(broadcastHandler) {
  broadcastFn = broadcastHandler;

  console.log(`🔌 Connecting to MQTT Broker: ${brokerUrl}`);
  mqttClient = mqtt.connect(brokerUrl, {
    clientId: `NodeJS_Backend_${Math.random().toString(16).substring(2, 8)}`,
    clean: true,
    connectTimeout: 5000,
    reconnectPeriod: 2000
  });

  mqttClient.on('connect', () => {
    console.log(`MQTT Connected to ${brokerUrl}`);

    // Subscribe to Sensor Data & Device Response topics
    mqttClient.subscribe([topicSensorPub, topicDeviceResponse], (err) => {
      if (!err) {
        console.log(`📡 Subscribed to topics: ${topicSensorPub}, ${topicDeviceResponse}`);
      } else {
        console.error('❌ MQTT Subscribe Error:', err);
      }
    });
  });

  mqttClient.on('message', async (topic, message) => {
    const payloadStr = message.toString();
    console.log(`MQTT Received [${topic}]:`, payloadStr);

    try {
      if (topic === topicSensorPub) {
        // Flexible payload keys from ESP8266
        const data = JSON.parse(payloadStr);

        const temp = parseFloat(data.temp ?? data.temperature ?? data.t ?? 0);
        const hum = parseFloat(data.hum ?? data.humidity ?? data.h ?? 0);
        const light = parseInt(data.light ?? data.lux ?? data.l ?? 0);

        const nowIso = new Date().toISOString();

        latestSensorValues = {
          temperature: temp,
          humidity: hum,
          light: light,
          timestamp: nowIso
        };

        // Insert into MySQL sensors_data table using NOW() for accurate local server timestamp
        await pool.query(
          'INSERT INTO sensors_data (sensor_id, value, created_at) VALUES (1, ?, NOW()), (2, ?, NOW()), (3, ?, NOW())',
          [temp, hum, light]
        );

        // Broadcast to WebSocket frontend clients
        if (typeof broadcastFn === 'function') {
          broadcastFn({
            type: 'SENSOR_UPDATE',
            data: latestSensorValues
          });
        }
      } else if (topic === topicDeviceResponse) {
        // Payload from ESP8266: {"led1":"ON","led2":"OFF"}
        const responseData = JSON.parse(payloadStr);

        const led1State = responseData.led1 === 'ON' ? 'ON' : 'OFF';
        const led2State = responseData.led2 === 'ON' ? 'ON' : 'OFF';
        const nowIso = new Date().toISOString();

        // Update Devices table state in MySQL
        await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = 1', [led1State]);
        await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = 2', [led2State]);

        // Update PENDING actions to SUCCESS
        await pool.query("UPDATE actions_history SET status = 'SUCCESS' WHERE status = 'PENDING'");

        // Broadcast device state updates to WebSocket clients
        if (typeof broadcastFn === 'function') {
          broadcastFn({
            type: 'DEVICE_UPDATE',
            data: { device_id: 1, state: led1State, updated_at: nowIso }
          });
          broadcastFn({
            type: 'DEVICE_UPDATE',
            data: { device_id: 2, state: led2State, updated_at: nowIso }
          });
        }
      }
    } catch (error) {
      console.error('⚠️ Error processing MQTT message:', error.message);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('❌ MQTT Client Error:', err.message);
  });
}

function sendMqttControl(command) {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topicDeviceControl, command);
    console.log(`MQTT Published to [${topicDeviceControl}]: ${command}`);
    return true;
  } else {
    console.warn(`MQTT Client not connected. Cannot send command: ${command}`);
    return false;
  }
}

function getLatestValues() {
  return latestSensorValues;
}

module.exports = {
  initMqtt,
  sendMqttControl,
  getLatestValues
};
