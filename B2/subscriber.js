const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

const TOPIC_CONTROL = 'esp8266Quang/device/control';
const TOPIC_RESPONSE = 'esp8266Quang/device/response';

let led1Status = 'OFF';
let led2Status = 'OFF';

function sendResponse() {
  const res = JSON.stringify({ led1: led1Status, led2: led2Status });
  client.publish(TOPIC_RESPONSE, res);
  console.log(`[Device State Response] -> ${res}`);
}

client.on('connect', () => {
  console.log('[Subscriber] Da ket noi Broker HiveMQ, dang doi lenh...');
  client.subscribe(TOPIC_CONTROL);
});

client.on('message', (topic, message) => {
  const cmd = message.toString().trim();
  console.log(`[Device SUB] Nhan lenh: ${cmd}`);

  if (cmd === 'LED1_ON') led1Status = 'ON';
  else if (cmd === 'LED1_OFF') led1Status = 'OFF';
  else if (cmd === 'LED2_ON') led2Status = 'ON';
  else if (cmd === 'LED2_OFF') led2Status = 'OFF';

  sendResponse();
});

client.on('error', (err) => {
  console.error('[Subscriber] Loi ket noi MQTT:', err.message);
});