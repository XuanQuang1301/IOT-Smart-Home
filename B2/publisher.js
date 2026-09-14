const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.hivemq.com:1883');

const TOPIC_SENSOR = 'esp8266Quang/sensor/data';

client.on('connect', () => {
  console.log('[Publisher] Da ket noi Broker HiveMQ');
  
  // Bắn dữ liệu định kỳ mỗi 2 giây
  setInterval(() => {
    const temp = +(28 + Math.random() * 5).toFixed(1);
    const hum = +(65 + Math.random() * 15).toFixed(1);
    const light = Math.floor(Math.random() * 100);
    const isBright = light > 40;

    const payload = JSON.stringify({
      temp: temp,
      hum: hum,
      light: light,
      is_bright: isBright
    });

    client.publish(TOPIC_SENSOR, payload);
    console.log(`[Sensor PUB] -> ${payload}`);
  }, 2000);
});

client.on('error', (err) => {
  console.error('[Publisher] Loi ket noi MQTT:', err.message);
});