const mqtt = require('mqtt');
const readline = require('readline');
const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

const TOPIC_SENSOR = 'esp8266Quang/sensor/data';
const TOPIC_CONTROL = 'esp8266Quang/device/control';
const TOPIC_RESPONSE = 'esp8266Quang/device/response';

client.on('connect', () => {
  console.log('==============================================');
  console.log('[MAIN CONTROLLER] Da ket noi Broker HiveMQ');
  console.log('Lenh hop le: LED1_ON, LED1_OFF, LED2_ON, LED2_OFF, GET_STATUS');
  console.log('==============================================');
  
  client.subscribe([TOPIC_SENSOR, TOPIC_RESPONSE]);
});

client.on('message', (topic, message) => {
  const data = message.toString();
  if (topic === TOPIC_SENSOR) {
    console.log(`\n[LOG CAM BIEN]: ${data}`);
  } else if (topic === TOPIC_RESPONSE) {
    console.log(`\n[LOG PHAN HOI THIET BI]: ${data}`);
  }
  process.stdout.write('> Nhap lenh dieu khien: ');
});

client.on('error', (err) => {
  console.error('[MAIN CONTROLLER] Loi ket noi MQTT:', err.message);
});

// Doc lenh tu ban phim terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  const cmd = input.trim();
  if (cmd) {
    client.publish(TOPIC_CONTROL, cmd);
    console.log(`[SENT COMMAND] -> ${cmd}`);
  }
});