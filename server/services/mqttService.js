const mqtt = require('mqtt');
const { pool } = require('../config/db');
require('dotenv').config();

const brokerHost = process.env.MQTT_BROKER || 'localhost';
const brokerPort = process.env.MQTT_PORT || 6868;
const brokerUrl = `mqtt://${brokerHost}:${brokerPort}`;
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

function safeParseJson(str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    // Attempt auto-repairing common ESP8266 C-sprintf formatting errors (e.g. extra quote in "is_bright":true"})
    const fixedStr = str.replace(/"(true|false)"}/gi, '$1}').replace(/:\s*(true|false)"}/gi, ':$1}').replace(/(true|false)"/gi, '$1');
    try {
      return JSON.parse(fixedStr);
    } catch (e2) {
      throw err;
    }
  }
}

function initMqtt(broadcastHandler) {
  broadcastFn = broadcastHandler;

  console.log(`Connecting to Local MQTT Broker: ${brokerUrl}`);

  const mqttOptions = {
    clientId: `NodeJS_Backend_${Math.random().toString(16).substring(2, 8)}`,
    clean: true,
    connectTimeout: 5000,
    reconnectPeriod: 2000
  };

  if (process.env.MQTT_USER) mqttOptions.username = process.env.MQTT_USER;
  if (process.env.MQTT_PASS) mqttOptions.password = process.env.MQTT_PASS;

  mqttClient = mqtt.connect(brokerUrl, mqttOptions);

  mqttClient.on('connect', () => {
    console.log(`MQTT Connected to ${brokerUrl}`);

    // Subscribe flexibly to Sensor Data & Device Response topics
    const topicsToSubscribe = [
      topicSensorPub,
      topicDeviceResponse,
      'sensor/data',
      'device_response',
      '+/sensor/data',
      '+/device_response',
      'esp8266Quang/sensor/data',
      'esp8266Quang/device_response'
    ];

    mqttClient.subscribe(topicsToSubscribe, (err) => {
      if (!err) {
        console.log(`Subscribed to MQTT topics:`, topicsToSubscribe);
      } else {
        console.error('MQTT Subscribe Error:', err);
      }
    });
  });

  mqttClient.on('message', async (topic, message) => {
    const payloadStr = message.toString();
    console.log(`MQTT Received [${topic}]:`, payloadStr);

    try {
      const isSensorTopic = topic === topicSensorPub || 
                            topic === 'sensor/data' || 
                            topic.endsWith('/sensor/data');

      const isDeviceResponseTopic = topic === topicDeviceResponse || 
                                    topic === 'device_response' || 
                                    topic.endsWith('/device_response');

      if (isSensorTopic) {
        // Flexible payload keys from ESP8266
        const data = safeParseJson(payloadStr);

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
      } else if (isDeviceResponseTopic) {
        // Payload from ESP8266: {"status":"success","LED1":"on","LED2":"off"} or {"led1":"ON","led2":"OFF"}
        const responseData = safeParseJson(payloadStr);

        const hasLed1 = responseData.LED1 !== undefined || responseData.led1 !== undefined || responseData.l1 !== undefined;
        const hasLed2 = responseData.LED2 !== undefined || responseData.led2 !== undefined || responseData.l2 !== undefined;

        const val1 = String(responseData.LED1 ?? responseData.led1 ?? responseData.l1 ?? '').toUpperCase();
        const val2 = String(responseData.LED2 ?? responseData.led2 ?? responseData.l2 ?? '').toUpperCase();

        const led1State = (val1 === 'ON' || val1 === '1' || val1 === 'TRUE') ? 'ON' : 'OFF';
        const led2State = (val2 === 'ON' || val2 === '1' || val2 === 'TRUE') ? 'ON' : 'OFF';
        const nowIso = new Date().toISOString();

        if (hasLed1) {
          await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = 1', [led1State]);
          if (typeof broadcastFn === 'function') {
            broadcastFn({
              type: 'DEVICE_UPDATE',
              data: { device_id: 1, state: led1State, updated_at: nowIso }
            });
          }
        }

        if (hasLed2) {
          await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = 2', [led2State]);
          if (typeof broadcastFn === 'function') {
            broadcastFn({
              type: 'DEVICE_UPDATE',
              data: { device_id: 2, state: led2State, updated_at: nowIso }
            });
          }
        }

        // Update PENDING actions to SUCCESS
        await pool.query("UPDATE actions_history SET status = 'SUCCESS' WHERE status = 'PENDING'");
      }
    } catch (error) {
      console.error('Error processing MQTT message:', error.message);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('MQTT Client Error:', err.message);
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
