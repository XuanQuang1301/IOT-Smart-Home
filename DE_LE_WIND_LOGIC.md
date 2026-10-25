# TÀI LIỆU LOGIC VÀ KIẾN TRÚC HỆ THỐNG - ĐỀ LẺ (CẢM BIẾN TỐC ĐỘ GIÓ & ĐÈN CẢNH BÁO)

---

## 1. TỔNG QUAN YÊU CẦU ĐỀ BÀI (ĐỀ LẺ)

Hệ thống được mở rộng từ bài toán Smart Home cơ bản với các yêu cầu cụ thể sau:
1. **Thêm cảm biến tốc độ gió:** Giá trị tốc độ gió do phần cứng vi điều khiển ESP8266 tự động sinh ngẫu nhiên (dải $0 - 500\text{ km/h}$) và định kỳ bắn lên MQTT Broker, sau đó Backend lưu trữ vào cơ sở dữ liệu (`sensors_data`).
2. **Thêm đèn LED 4 cảnh báo tại chân IO15 (D8):** 
   - Đèn chỉ đóng vai trò cảnh báo, **không có nút công tắc bật/tắt thủ công** trên giao diện.
   - Có chức năng **cài đặt ngưỡng gió (Settings)** ngay trên giao diện Web (mặc định 200 hoặc 300, dải hợp lệ $0 - 500\text{ km/h}$). Ngưỡng được lưu vào CSDL và tự động đồng bộ tức thì xuống vi điều khiển qua MQTT Topic retained.
   - Khi tốc độ gió vượt quá ngưỡng cấu hình:
     - **Phần cứng:** Đèn LED 4 vật lý nhấp nháy trực tiếp độc lập bằng bộ đếm thời gian (chu kỳ 500ms: 250ms sáng, 250ms tắt).
     - **Web Dashboard:** Ô thẻ đèn 4 và thẻ thông số tốc độ gió tự động đổi màu đỏ và kích hoạt hiệu ứng nhấp nháy viền (`alert-blink`).
     - **CSDL:** Ghi nhận 1 bản ghi vào lịch sử thao tác (`actions_history`) với `action = 'TURN_ON'`, `status = 'ALERT'`, `user_id = NULL` (Người thực hiện: "Hệ thống"). Chỉ bắt sự kiện tại cạnh lên (khi bắt đầu vượt ngưỡng), không spam bản ghi mỗi 2 giây.
3. **Màn hình thống kê cảnh báo dạng biểu đồ tháng:** Thống kê tổng số lượt kích hoạt cảnh báo theo từng ngày trong tháng được chọn (dạng cột BarChart từ ngày 01 đến ngày cuối tháng).
4. **Màn hình Dashboard Gió chuyên biệt:** Theo dõi chi tiết xu hướng gió thời gian thực, trạng thái đèn 4 và form lưu cài đặt ngưỡng gió.
5. **Tra cứu lịch sử:** Hỗ trợ lọc theo loại cảm biến "Tốc độ gió" trong Lịch sử cảm biến và lọc theo trạng thái "Cảnh báo" trong Lịch sử thiết bị.

---

## 2. KIẾN TRÚC VÀ LUỒNG DỮ LIỆU TỔNG THỂ

```
+-----------------------------------------------------------------------------------+
|                            PHẦN CỨNG (ESP8266)                                    |
| - Random gió: windSpeed = random(0, 501)                                          |
| - So ngưỡng: alert_active = (windSpeed > wind_threshold)                          |
| - Nháy LED4 (IO15): millis() % 500 < 250                                          |
+--------------------------+--------------------------------▲-----------------------+
                           | MQTT Publish                   | MQTT Subscribe
                           | (esp8266Quang/sensor/data)     | (esp8266Quang/config)
                           ▼                                |
+-----------------------------------------------------------+-----------------------+
|                        MOSQUITTO MQTT BROKER (Port 6868)                          |
+--------------------------+--------------------------------▲-----------------------+
                           | MQTT on('message')             | MQTT publish(retain)
                           ▼                                |
+-----------------------------------------------------------+-----------------------+
|                        BACKEND SERVICE (Node.js/Express)                          |
| - mqttService.js   : Nhận gói tin, ghi sensors_data, đẩy alert config            |
| - alertService.js  : Bắt cạnh (Edge Trigger), ghi actions_history, thống kê tháng |
| - alertController  : REST API (/api/v1/alerts/*)                                  |
| - sensorController : Trả realtime & chart gồm cột wind                            |
| - deviceController : Chặn control LED 4 thủ công                                 |
+--------------------------+--------------------------------▲-----------------------+
                           | SQL Query / Insert             | REST API Call
                           ▼                                | (Axios)
+------------------------------------+    +-----------------+-----------------------+
|         MYSQL DATABASE             |    |          FRONTEND (React + Vite)        |
| - sensors (id=4: Tốc độ gió)       |    | - DataContext: windThreshold toàn cục   |
| - devices (id=4: Đèn cảnh báo)     |    | - Dashboard.jsx: Thẻ gió & LED 4 nháy   |
| - alert_settings (Ngưỡng gió)      |    | - WindDashboard: Đồ thị gió & Form set  |
| - sensors_data (Lịch sử đo gió)    |    | - AlertStats.jsx: Biểu đồ cột tháng     |
| - actions_history (status: ALERT)  |    | - DeviceHistory: Lọc theo Cảnh báo      |
+------------------------------------+    +-----------------------------------------+
```

---

## 3. CHI TIẾT LOGIC TRÊN TỪNG FILE

### 3.1. Firmware Vi điều khiển ESP8266 (Arduino Sketch)

- **Vị trí code:** Nạp trực tiếp vào ESP8266 qua Arduino IDE.
- **Khai báo chân phần cứng:**
  - `LED_ALERT 15`: Chân IO15 (D8) nối với LED 4 cảnh báo (Anode qua trở $220\Omega - 330\Omega$ vào IO15, Cathode xuống GND).
- **Hàm `callback(char* topic, byte* payload, unsigned int length)`:**
  - **Logic:** Phân luồng tin nhắn theo `topic`.
  - Nếu `String(topic) == mqtt_topic_config` (`esp8266Quang/config`):
    - Đọc chuỗi JSON cấu hình từ server, trích xuất giá trị `"wind_threshold":` và cập nhật biến `wind_threshold = message.substring(idx + 16).toFloat()`.
    - Lập tức in log Serial để kiểm tra và thoát sớm (`return`), **không** kích hoạt phản hồi của đèn thường.
- **Hàm `loop()`:**
  - **Logic 1 - Nhấp nháy đèn LED 4 không chặn (Non-blocking):**
    ```cpp
    if (alert_active) {
      setDevice(LED_ALERT, (millis() / 250) % 2 == 0); // Đổi trạng thái mỗi 250ms (chu kỳ 500ms)
    } else {
      setDevice(LED_ALERT, false);
    }
    ```
  - **Logic 2 - Đọc cảm biến và sinh dữ liệu gió ngẫu nhiên định kỳ 2 giây:**
    ```cpp
    int windSpeed = random(0, 501);                      // Random tốc độ gió từ 0 đến 500 km/h
    bool wind_alert = (windSpeed > (int)wind_threshold); // So sánh ngưỡng
    alert_active = wind_alert;                           // Kích hoạt nhấp nháy đèn 4
    ```
  - **Logic 3 - Đóng gói JSON gửi lên Broker:**
    Bổ sung `"wind"` và cờ `"wind_alert"` vào gói tin gửi tới topic `esp8266Quang/sensor/data`:
    `{"temp":28.5,"hum":70.0,"light":720,"is_bright":true,"wind":220,"wind_alert":false}`.

---

### 3.2. Cơ sở dữ liệu MySQL (`server/database/schema.sql`)

1. **Bảng mới `alert_settings`:**
   - Dùng để lưu trữ ngưỡng cài đặt cho từng cảm biến, sống độc lập qua các lần restart server:
   ```sql
   CREATE TABLE IF NOT EXISTS `alert_settings` (
     `sensor_id` INT PRIMARY KEY,
     `threshold` DOUBLE NOT NULL,
     `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     CONSTRAINT `fk_alert_settings_sensor` FOREIGN KEY (`sensor_id`) REFERENCES `sensors` (`id`) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```
2. **Khởi tạo dữ liệu mẫu (Seed Data) an toàn:**
   - Cảm biến gió:
     ```sql
     INSERT INTO `sensors` (`id`, `name`, `sensor_type`, `unit`, `pin`, `status`) 
     VALUES (4, 'Tốc độ gió', 'WIND', 'km/h', 'SIM', 'ACTIVE')
     ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
     ```
   - Thiết bị Đèn 4 Cảnh báo:
     ```sql
     INSERT INTO `devices` (`id`, `name`, `device_type`, `pin`, `state`) 
     VALUES (4, 'Đèn cảnh báo', 'ALERT_LIGHT', 'IO15', 'OFF')
     ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
     ```
   - Ngưỡng gió ban đầu (300 km/h):
     ```sql
     INSERT INTO `alert_settings` (`sensor_id`, `threshold`) VALUES (4, 300)
     ON DUPLICATE KEY UPDATE `sensor_id` = `sensor_id`;
     ```

---

### 3.3. Tầng Dịch vụ Backend (Backend Services)

#### File 1: `server/services/mqttService.js`
- **Hàm `initMqtt()`:**
  - Khởi tạo kết nối tới Mosquitto Broker. Khi `connect` thành công, tự động gọi `publishAlertConfig()` để đẩy ngưỡng retained mới nhất xuống cho ESP8266.
  - Xử lý tin nhắn nhận được trên topic `esp8266Quang/sensor/data`:
    - Parse trường `wind` từ JSON payload.
    - Lưu dữ liệu vào MySQL đồng thời 4 cảm biến trong cùng 1 câu lệnh SQL:
      ```javascript
      await pool.query(
        'INSERT INTO sensors_data (sensor_id, value, created_at) VALUES (1, ?, NOW()), (2, ?, NOW()), (3, ?, NOW()), (4, ?, NOW())',
        [temp, hum, light, wind]
      );
      ```
    - Đọc ngưỡng cấu hình từ `alertService.getSettings()`, kiểm tra điều kiện `wind > threshold`, và chuyển giao cờ cho `alertService.onAlertFlag(isAlert)`.
- **Hàm `publishAlertConfig()`:**
  - Đọc ngưỡng gió hiện tại từ bảng `alert_settings` (`sensor_id = 4`).
  - Đóng gói JSON: `{"wind_threshold": 300}`.
  - Publish tới topic `esp8266Quang/config` với cờ `{ retain: true, qos: 1 }`. Nhờ cờ `retain`, kể cả khi ESP8266 mất mạng hoặc khởi động lại, Broker sẽ ngay lập tức gửi ngay cấu hình này cho ESP ngay khi vừa subscribe.

#### File 2: `server/services/alertService.js`
- **Hàm `getSettings()`:**
  - Truy vấn `SELECT s.id as sensor_id, s.name, s.sensor_type, s.unit, COALESCE(a.threshold, 300) as threshold FROM sensors s LEFT JOIN alert_settings a ON s.id = a.sensor_id`.
- **Hàm `updateThreshold(sensorId, threshold)`:**
  - Thực hiện `INSERT ... ON DUPLICATE KEY UPDATE threshold = ?` vào bảng `alert_settings`.
- **Hàm `onAlertFlag(active)` (Cơ chế Bắt cạnh - Edge Triggering):**
  - Quản lý biến nhớ `lastAlertState` (ban đầu đọc từ `devices.state` của thiết bị 4 trong DB).
  - **Chống spam bản ghi:** Nếu `active === lastAlertState` (ví dụ gió vẫn đang vượt ngưỡng liên tục trong 10 phút), hàm `return` ngay lập tức, không ghi thêm bản ghi nào.
  - **Khi có Cạnh lên (`false -> true`):**
    1. Cập nhật trạng thái đèn: `UPDATE devices SET state = 'ALERT' WHERE id = 4`.
    2. Ghi 1 bản ghi vào lịch sử: 
       `INSERT INTO actions_history (device_id, user_id, action, status, time) VALUES (4, NULL, 'TURN_ON', 'ALERT', NOW())`.
    3. Gửi lệnh MQTT dự phòng: `sendMqttControl('ALERT_ON')`.
  - **Khi có Cạnh xuống (`true -> false`):**
    1. Trả trạng thái thiết bị về an toàn: `UPDATE devices SET state = 'OFF' WHERE id = 4`.
    2. Gửi lệnh MQTT: `sendMqttControl('ALERT_OFF')`.
- **Hàm `getMonthlyStats(yearMonth)`:**
  - Thực thi truy vấn tổng hợp theo ngày:
    ```sql
    SELECT DATE_FORMAT(CONVERT_TZ(time, @@session.time_zone, '+07:00'), '%Y-%m-%d') AS day, COUNT(*) AS count
    FROM actions_history
    WHERE device_id = 4 AND status = 'ALERT'
      AND DATE_FORMAT(CONVERT_TZ(time, @@session.time_zone, '+07:00'), '%Y-%m') = ?
    GROUP BY day
    ```
  - Tính toán số ngày trong tháng (ví dụ 31 ngày của tháng 10) và tự động lấp đầy (fill) mảng các ngày thiếu với `count = 0`. Kết quả trả về danh sách đầy đủ `[{"date": "2026-10-01", "count": 0}, ..., {"date": "2026-10-23", "count": 8}]`.

---

### 3.4. Tầng Điều khiển Backend (Controllers & Routes)

#### File 1: `server/controllers/alertController.js`
- `getAlertSettings(req, res)`: Xử lý `GET /api/v1/alerts/settings`.
- `updateAlertSetting(req, res)`: Xử lý `PUT /api/v1/alerts/settings/:sensorId`.
  - Validate giá trị ngưỡng ($0 \le \text{threshold} \le 500$).
  - Lưu vào CSDL qua `alertService.updateThreshold`.
  - Kích hoạt `publishAlertConfig()` để đồng bộ tức thì xuống ESP8266.
- `getAlertStats(req, res)`: Xử lý `GET /api/v1/alerts/stats?month=YYYY-MM`.

#### File 2: `server/controllers/deviceController.js`
- `controlDevice(req, res)`:
  - Thêm logic bảo vệ đầu hàm:
    ```javascript
    if (device.device_type === 'ALERT_LIGHT') {
      return res.status(400).json({ status: 'error', message: 'Đèn cảnh báo không thể điều khiển thủ công' });
    }
    ```
  - Ngăn chặn mọi hành động click nhầm gây sinh bản ghi `FAILED` rác trong lịch sử.
- `getActionsHistory(req, res)`:
  - Sửa cột người thực hiện: `COALESCE(u.username, CASE WHEN ah.user_id IS NULL THEN 'system' ELSE 'admin' END) as user_name`.

#### File 3: `server/controllers/sensorController.js`
- `getRealtimeSensor(req, res)`: Bổ sung subquery lấy thông số gió thời gian thực:
  `(SELECT value FROM sensors_data WHERE sensor_id = 4 ORDER BY created_at DESC, id DESC LIMIT 1) as wind`.
- `getSensorHistory(req, res)`: Bổ sung nhánh `MAX(CASE WHEN s.sensor_type = 'WIND' OR s.id = 4 THEN sd.value END) as wind` cho dữ liệu đồ thị xu hướng.

#### File 4: `server/server.js`
- Đăng ký các API Endpoint:
  - `app.get('/api/v1/alerts/settings', getAlertSettings);`
  - `app.put('/api/v1/alerts/settings/:sensorId', updateAlertSetting);`
  - `app.get('/api/v1/alerts/stats', getAlertStats);`

---

### 3.5. Tầng Giao diện Web Frontend (React + Vite + TailwindCSS)

#### File 1: `web/src/context/DataContext.jsx` (Trọng tâm đồng bộ trạng thái)
- **State bổ sung:**
  - `windThreshold`: Biến state lưu ngưỡng gió chung cho toàn bộ ứng dụng.
- **Hàm `fetchAlertSettings()`:**
  - Gọi API `GET /api/v1/alerts/settings` để lấy ngưỡng gió từ CSDL.
  - Được kích hoạt tự động lúc khởi tạo ứng dụng và trong vòng lặp Polling mỗi 2 giây.
- **Cung cấp trong Provider:** Xuất `windThreshold`, `setWindThreshold`, `fetchAlertSettings` cho tất cả các trang con.

#### File 2: `web/src/pages/Dashboard.jsx` (Màn hình chính)
- Lấy `windThreshold` trực tiếp từ `useData()`.
- **Thẻ cảm biến Tốc độ gió:**
  - Nằm ở cột thứ 4 trong lưới `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
  - Hiển thị giá trị `sensors.wind km/h`.
  - Nếu `isAlerting = true` (`wind > threshold` hoặc `alertDevice.state === 'ALERT'`):
    - Thẻ tự đổi sang nền đỏ nhạt, viền đỏ `border-rose-400`.
    - Badge chuyển thành nhãn đỏ nhấp nháy `CẢNH BÁO (> {threshold})`.
    - Giá trị số đổi sang màu đỏ `text-rose-600`.
  - Nhấp chuột vào thẻ sẽ tự động chuyển sang trang `/wind-dashboard`.
- **Thẻ Đèn 4 (IO15) trong Khối Thiết bị:**
  - Nằm ở cột thứ 4 cùng hàng với 3 đèn thường.
  - **Không có nút bấm công tắc:** Thay bằng nhãn trạng thái tĩnh.
  - Khi không cảnh báo: Hiển thị chữ `TẮT`, khung viền xám mỏng.
  - Khi cảnh báo (`isAlerting == true`): Kích hoạt class CSS `.alert-blink`, viền đỏ rực nhấp nháy kèm chữ đỏ `ĐANG NHÁY CẢNH BÁO` và badge `ALERT`.

#### File 3: `web/src/pages/WindDashboard.jsx` (Màn hình Dashboard Gió)
- Hiển thị bảng điều khiển chuyên sâu cho cảm biến gió:
  - Thẻ thông số gió lớn, thẻ trạng thái Đèn 4 (IO15).
  - Đồ thị diện tích Recharts (`AreaChart`) thể hiện xu hướng biến thiên 20 điểm đo gió gần nhất.
  - **Form Cài đặt ngưỡng:**
    - Input nhập ngưỡng $0 - 500\text{ km/h}$.
    - Khi bấm nút **"Lưu"**: Gửi `PUT /api/v1/alerts/settings/4`, sau khi server phản hồi thành công lập tức gọi `setWindThreshold(val)` của `DataContext` $\rightarrow$ Ngưỡng được cập nhật đồng bộ sang Dashboard chính và ESP8266 ngay lập tức.

#### File 4: `web/src/pages/AlertStats.jsx` (Thống kê cảnh báo tháng)
- Bộ chọn tháng: `<input type="month" value={selectedMonth} onChange={...} />` kèm nút chuyển tháng trước / tháng sau.
- Biểu đồ cột Recharts (`BarChart`):
  - Trục hoành (X-Axis): Các ngày trong tháng (từ `01` đến `31`).
  - Trục tung (Y-Axis): Số lượt cảnh báo trong ngày (`allowDecimals={false}`).
  - Cột Bar màu đỏ tím (`#f43f5e`) hiển thị số lần vượt ngưỡng theo từng ngày.
  - Phía trên hiển thị thẻ tổng kết: Tổng số lượt cảnh báo trong tháng.

#### File 5: `web/src/pages/DeviceHistory.jsx` (Lịch sử thao tác thiết bị)
- `renderStatusBadge`: Bổ sung nhánh `status === 'ALERT'` $\rightarrow$ Hiển thị badge màu đỏ "Cảnh báo" kèm chấm tròn phát xung `animate-ping`.
- Dropdown bộ lọc Trạng thái: Bổ sung `<option value="ALERT">Cảnh báo</option>`.
- Cột Người thực hiện: Tự động hiển thị `Hệ thống` khi bản ghi có `status === 'ALERT'`.

#### File 6: `web/src/pages/SensorHistory.jsx` (Lịch sử cảm biến)
- Dropdown bộ lọc Loại cảm biến: Bổ sung `<option value="WIND">Tốc độ gió (km/h)</option>`.
- Hiển thị badge loại cảm biến màu tím cho các dòng đo tốc độ gió.

#### File 7: `web/src/index.css` (Hiệu ứng nhấp nháy giao diện)
```css
@keyframes alert-blink {
  0%, 100% {
    border-color: #ef4444;
    background-color: #fef2f2;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25);
  }
  50% {
    border-color: #fecaca;
    background-color: #ffffff;
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}
.alert-blink {
  animation: alert-blink 0.5s ease-in-out infinite;
}
```

---

## 4. BẢNG TRA CỨU FILE - HÀM - LOGIC CHÍNH

| STT | Thành phần | Tên File | Tên Hàm / Khối Logic | Chức năng chính |
|---|---|---|---|---|
| 1 | Firmware | `sketch.ino` (ESP8266) | `callback()` | Nhận tin topic `config`, parse `wind_threshold` |
| 2 | Firmware | `sketch.ino` (ESP8266) | `loop()` | Random gió 0-500, nháy LED4 bằng `millis() % 500 < 250` |
| 3 | Database | `server/database/schema.sql` | `CREATE TABLE alert_settings` | Bảng lưu trữ ngưỡng cảnh báo theo sensor |
| 4 | Database | `server/database/schema.sql` | `INSERT INTO sensors/devices` | Tạo sensor gió (id=4) và thiết bị Đèn 4 (id=4) |
| 5 | Backend | `server/services/mqttService.js` | `initMqtt()` | Lắng nghe sensor data, parse `wind`, lưu DB |
| 6 | Backend | `server/services/mqttService.js` | `publishAlertConfig()` | Publish ngưỡng gió `retain: true` tới ESP8266 |
| 7 | Backend | `server/services/alertService.js` | `onAlertFlag()` | Bắt cạnh (Edge Trigger), ghi lịch sử `ALERT`, đổi state |
| 8 | Backend | `server/services/alertService.js` | `getMonthlyStats()` | Query `COUNT(*)` theo ngày trong tháng, bù ngày 0 |
| 9 | Backend | `server/controllers/alertController.js` | `updateAlertSetting()` | REST API `PUT` đổi ngưỡng và kích hoạt MQTT sync |
| 10 | Backend | `server/controllers/alertController.js` | `getAlertStats()` | REST API `GET` lấy dữ liệu vẽ biểu đồ tháng |
| 11 | Backend | `server/controllers/deviceController.js`| `controlDevice()` | Chặn không cho bật/tắt thủ công Đèn 4 |
| 12 | Frontend | `web/src/context/DataContext.jsx` | `fetchAlertSettings()` | Đồng bộ `windThreshold` toàn cục cho tất cả các trang |
| 13 | Frontend | `web/src/pages/Dashboard.jsx` | Thẻ Gió & Thẻ Đèn 4 | Giao diện hiển thị thời gian thực, nhấp nháy `.alert-blink` |
| 14 | Frontend | `web/src/pages/WindDashboard.jsx` | `handleSaveThreshold()` | Giao diện đồ thị gió và form lưu cài đặt ngưỡng |
| 15 | Frontend | `web/src/pages/AlertStats.jsx` | `BarChart` Component | Biểu đồ cột thống kê số cảnh báo/ngày dạng tháng |
| 16 | Frontend | `web/src/pages/DeviceHistory.jsx` | `renderStatusBadge()` | Hiển thị badge màu đỏ "Cảnh báo" & lọc trạng thái |

---

## 5. KỊCH BẢN HOẠT ĐỘNG THỰC TẾ (STEP-BY-STEP)

1. **Khởi động:**
   - ESP8266 bật nguồn $\rightarrow$ Kết nối WiFi $\rightarrow$ Kết nối MQTT Broker $\rightarrow$ Subscribe `esp8266Quang/config`.
   - Broker gửi ngay gói tin retained chứa `{"wind_threshold": 300}` $\rightarrow$ ESP cập nhật `wind_threshold = 300`.
2. **Chu kỳ bình thường (Gió $\le 300\text{ km/h}$):**
   - ESP8266 random `windSpeed = 180` $\rightarrow$ `alert_active = false` $\rightarrow$ LED 4 tắt.
   - ESP publish gói tin lên `sensor/data` với `"wind": 180, "wind_alert": false`.
   - Backend nhận tin $\rightarrow$ Ghi vào `sensors_data` $\rightarrow$ Cờ an toàn $\rightarrow$ `devices.state` giữ nguyên `'OFF'`.
   - Web Dashboard hiển thị gió 180 km/h (màu tím), đèn 4 trạng thái TẮT.
3. **Khi gió vượt ngưỡng (Gió $> 300\text{ km/h}$, ví dụ $360\text{ km/h}$):**
   - ESP8266 random `windSpeed = 360` $\rightarrow$ `alert_active = true`.
   - Ngay lập tức, LED 4 vật lý tại chân IO15 nhấp nháy 250ms bật / 250ms tắt liên tục.
   - ESP publish gói tin với `"wind": 360, "wind_alert": true`.
   - Backend nhận tin $\rightarrow$ `alertService.onAlertFlag(true)` phát hiện Cạnh lên:
     - Cập nhật `devices.state = 'ALERT'`.
     - Chèn 1 dòng vào `actions_history`: `device_id=4, action='TURN_ON', status='ALERT', user_id=NULL`.
   - Web Dashboard sau nhịp polling 2s nhận được dữ liệu mới:
     - Thẻ tốc độ gió chuyển sang màu đỏ, hiện nhãn `CẢNH BÁO (>300)`.
     - Ô Đèn 4 nhấp nháy viền đỏ `.alert-blink` và hiện `ĐANG NHÁY CẢNH BÁO`.
4. **Khi người dùng đổi ngưỡng trên Web:**
   - Người dùng vào Dashboard Gió, nhập ngưỡng mới là `400` rồi bấm **"Lưu"**.
   - Frontend gửi `PUT /api/v1/alerts/settings/4` với `{ threshold: 400 }`.
   - Backend lưu CSDL $\rightarrow$ Gọi `publishAlertConfig()` bắn retained message `{"wind_threshold": 400}` xuống Broker.
   - ESP8266 nhận được tin nhắn trên topic `config` $\rightarrow$ Cập nhật ngay biến `wind_threshold = 400`.
   - Toàn bộ các màn hình Web (Dashboard chính, Dashboard Gió, Thống kê) tự động đồng bộ sang ngưỡng mới `400` ngay tức thì thông qua `DataContext`.
