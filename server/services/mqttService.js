const mqtt = require('mqtt');
const EventEmitter = require('events');
const { pool } = require('../config/db');
require('dotenv').config();

const brokerHost = process.env.MQTT_BROKER || 'localhost';
const brokerPort = process.env.MQTT_PORT || 6868;
const brokerUrl = `mqtt://${brokerHost}:${brokerPort}`;
const topicSensorPub = process.env.MQTT_TOPIC_PUB || 'esp8266Quang/sensor/data';
const topicDeviceControl = process.env.MQTT_TOPIC_CONTROL || 'esp8266Quang/device_control';
const topicDeviceResponse = process.env.MQTT_TOPIC_RESPONSE || 'esp8266Quang/device_response';

let mqttClient = null;
const mqttEvents = new EventEmitter();

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

function initMqtt() {
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

    // Subscribe to unique Sensor Data & Device Response topics (avoid wildcard overlap)
    const rawTopics = [
      topicSensorPub,
      topicDeviceResponse,
      'sensor/data',
      'device_response'
    ];
    const topicsToSubscribe = [...new Set(rawTopics.filter(Boolean))];

    mqttClient.subscribe(topicsToSubscribe, (err) => {
      if (!err) {
        console.log(`Subscribed to MQTT topics:`, topicsToSubscribe);
      } else {
        console.error('MQTT Subscribe Error:', err);
      }
    });
  });

  let lastSensorPayloadStr = '';
  let lastSensorReceivedAt = 0;

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
        // Prevent duplicate processing of the same MQTT message within 1.5s
        const now = Date.now();
        if (payloadStr === lastSensorPayloadStr && (now - lastSensorReceivedAt) < 1500) {
          console.log('Duplicate sensor message ignored within 1.5s window');
          return;
        }
        lastSensorReceivedAt = now;
        lastSensorPayloadStr = payloadStr;

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
      } else if (isDeviceResponseTopic) {
        // Payload from ESP8266: {"status":"success","LED1":"on","LED2":"off"} or {"led1":"ON","led2":"OFF"}
        const responseData = safeParseJson(payloadStr);
        mqttEvents.emit('device_response', responseData);

        const hasLed1 = responseData.LED1 !== undefined || responseData.led1 !== undefined || responseData.l1 !== undefined;
        const hasLed2 = responseData.LED2 !== undefined || responseData.led2 !== undefined || responseData.l2 !== undefined;
        const hasLed3 = responseData.LED3 !== undefined || responseData.led3 !== undefined || responseData.l3 !== undefined;

        const val1 = String(responseData.LED1 ?? responseData.led1 ?? responseData.l1 ?? '').toUpperCase();
        const val2 = String(responseData.LED2 ?? responseData.led2 ?? responseData.l2 ?? '').toUpperCase();
        const val3 = String(responseData.LED3 ?? responseData.led3 ?? responseData.l3 ?? '').toUpperCase();

        const led1State = (val1 === 'ON' || val1 === '1' || val1 === 'TRUE') ? 'ON' : 'OFF';
        const led2State = (val2 === 'ON' || val2 === '1' || val2 === 'TRUE') ? 'ON' : 'OFF';
        const led3State = (val3 === 'ON' || val3 === '1' || val3 === 'TRUE') ? 'ON' : 'OFF';

        if (hasLed1) {
          await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = 1', [led1State]);
        }

        if (hasLed2) {
          await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = 2', [led2State]);
        }

        if (hasLed3) {
          await pool.query('UPDATE devices SET state = ?, updated_at = NOW() WHERE id = 3', [led3State]);
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

function waitForMqttDeviceResponse(deviceId, timeoutMs = 4500) {
  return new Promise((resolve) => {
    let timer = null;

    const listener = (data) => {
      const val1 = data.LED1 ?? data.led1 ?? data.l1 ?? (data.deviceId === 1 ? data.state : undefined);
      const val2 = data.LED2 ?? data.led2 ?? data.l2 ?? (data.deviceId === 2 ? data.state : undefined);
      const val3 = data.LED3 ?? data.led3 ?? data.l3 ?? (data.deviceId === 3 ? data.state : undefined);

      const targetVal = deviceId === 1 ? val1 : deviceId === 2 ? val2 : deviceId === 3 ? val3 : (data.state ?? data.status);

      if (targetVal !== undefined) {
        if (timer) clearTimeout(timer);
        mqttEvents.removeListener('device_response', listener);
        const strVal = String(targetVal).toUpperCase();
        const resState = (strVal === 'ON' || strVal === '1' || strVal === 'TRUE' || strVal === 'SUCCESS') ? 'ON' : 'OFF';
        resolve(resState);
      }
    };

    timer = setTimeout(() => {
      mqttEvents.removeListener('device_response', listener);
      resolve(null);
    }, timeoutMs);

    mqttEvents.on('device_response', listener);
  });
}

function getLatestValues() {
  return latestSensorValues;
}

module.exports = {
  initMqtt,
  sendMqttControl,
  waitForMqttDeviceResponse,
  getLatestValues
};

