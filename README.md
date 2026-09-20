# HỆ THỐNG GIÁM SÁT VÀ ĐIỀU KHIỂN SMART HOME IOT

Dự án Smart Home IoT là hệ thống theo dõi dữ liệu cảm biến (nhiệt độ, độ ẩm, ánh sáng) và điều khiển thiết bị điện (đèn) theo thời gian thực (Real-time). Hệ thống sử dụng vi điều khiển ESP8266, giao thức truyền tin MQTT, giao thức thời gian thực WebSocket, Node.js Backend, cơ sở dữ liệu MySQL và giao diện web React.

---

## 1. KIẾN TRÚC HỆ THỐNG

Hệ thống bao gồm 5 thành phần chính:

1. Vi điều khiển ESP8266: Lấy dữ liệu từ các cảm biến (DHT11/DHT22, LDR), đóng gói dữ liệu dạng JSON và gửi lên MQTT Broker. Nhận lệnh điều khiển từ MQTT Broker để bật/tắt thiết bị.
2. Mosquitto MQTT Broker: Trạm trung gian chuyển tiếp tin nhắn giữa vi điều khiển ESP8266 và Server Backend qua giao thức MQTT.
3. Node.js Backend: Xử lý logic hệ thống, kết nối MySQL để lưu trữ lịch sử dữ liệu, kết nối MQTT Broker để truyền nhận tin nhắn, đồng thời duy trì kết nối WebSocket để phát dữ liệu tức thì xuống Web Frontend.
4. Cơ sở dữ liệu MySQL: Lưu trữ danh sách người dùng, thiết bị, lịch sử cảm biến và nhật ký thao tác điều khiển thiết bị.
5. React Web Frontend: Giao diện điều khiển và hiển thị dữ liệu dạng biểu đồ thời gian thực, bảng tra cứu lịch sử cảm biến và lịch sử điều khiển.

---

## 2. CẤU TRÚC DỰ ÁN

Dự án được tổ chức theo mô hình Monorepo quản lý bởi Turborepo:

```text
Smart_home/
├── package.json               # File cấu hình root của Monorepo
├── turbo.json                 # Cấu hình Turborepo
├── mosquitto.conf             # File cấu hình Mosquitto MQTT Broker
├── server/                    # Thư mục Server Backend (Node.js/Express)
│   ├── package.json
│   ├── .env                   # Cấu hình biến môi trường server
│   ├── server.js              # File khởi chạy server HTTP & WebSocket
│   ├── config/
│   │   └── db.js              # Cấu hình kết nối MySQL pool
│   ├── controllers/
│   │   ├── sensorController.js# Xử lý API lịch sử và dữ liệu cảm biến
│   │   └── deviceController.js# Xử lý API điều khiển và trạng thái thiết bị
│   ├── database/
│   │   └── schema.sql         # Script tạo cơ sở dữ liệu và dữ liệu mẫu
│   └── services/
│       ├── mqttService.js     # Dịch vụ kết nối và xử lý MQTT
│       └── sensorSimulator.js # Dịch vụ giả lập dữ liệu cảm biến (khi không có phần cứng)
└── web/                       # Thư mục Web Frontend (React + Vite)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx           # Điểm đầu vào chính của ứng dụng React
        ├── App.jsx            # Điều hướng trang chính
        ├── context/
        │   └── DataContext.jsx# Quản lý state toàn cục và kết nối WebSocket
        ├── pages/
        │   ├── Dashboard.jsx  # Trang tổng quan thời gian thực và điều khiển
        │   ├── SensorHistory.jsx# Trang lịch sử dữ liệu cảm biến
        │   └── DeviceHistory.jsx# Trang nhật ký điều khiển thiết bị
        └── components/        # Các thành phần giao diện dùng chung
```

---

## 3. YÊU CẦU MÔI TRƯỜNG

Để chạy hệ thống trên máy tính local, bạn cần cài đặt sẵn các công cụ sau:

- Node.js: Phiên bản >= 18.x
- npm: Phiên bản >= 9.x
- MySQL Server: Phiên bản >= 8.0 (hoặc MariaDB)
- Mosquitto MQTT Broker: Đã cài đặt trên máy hoặc chạy file `mosquitto.conf`
- Arduino IDE: Nếu nạp code cho phần cứng thật ESP8266

---

## 4. CẤU HÌNH BIẾN MÔI TRƯỜNG

Tạo hoặc kiểm tra file `server/.env` tại thư mục `server/` với các thông số như sau:

```env
# Cấu hình cổng Server Backend
PORT=5000

# Cấu hình kết nối MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_home_iot

# Cấu hình kết nối Mosquitto MQTT Broker
MQTT_BROKER=localhost
MQTT_PORT=6868
MQTT_USER=DangXuanQuang
MQTT_PASS=B23DCCN686
MQTT_TOPIC_PUB=esp8266Quang/sensor/data
MQTT_TOPIC_CONTROL=esp8266Quang/device_control
MQTT_TOPIC_RESPONSE=esp8266Quang/device_response
```

---

## 5. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG

### Bước 1: Khởi tạo Cơ sở dữ liệu MySQL
1. Khởi động dịch vụ MySQL Server.
2. Mở công cụ quản lý cơ sở dữ liệu (MySQL Workbench, phpMyAdmin, DBeaver hoặc SQL Command Line).
3. Chạy toàn bộ file script tại đường dẫn: `server/database/schema.sql` để tạo cơ sở dữ liệu `smart_home_iot` cùng các bảng và dữ liệu khởi tạo ban đầu.

### Bước 2: Khởi động Mosquitto MQTT Broker
Chạy dịch vụ Mosquitto trên máy tính với file cấu hình của dự án bằng lệnh:

```powershell
mosquitto -c mosquitto.conf -v
```

Lưu ý: Đảm bảo Mosquitto đang lắng nghe ở cổng `6868`.

### Bước 3: Cài đặt các gói phụ thuộc (Dependencies)
Mở terminal tại thư mục gốc của dự án (`Smart_home`) và chạy lệnh:

```powershell
npm install
```

### Bước 4: Chạy dự án ở chế độ Phát triển (Development)
Tại thư mục gốc dự án, khởi chạy đồng thời cả Server và Web bằng Turborepo:

```powershell
npm run dev
```

Sau khi chạy thành công:
- Backend Server sẽ lắng nghe tại: `http://localhost:5000`
- Web Frontend sẽ truy cập được tại: `http://localhost:5173`

---

## 6. CẤU HÌNH VÀ NẠP CODE CHO VI ĐIỀU KHIỂN ESP8266

Trong code Arduino nạp cho ESP8266, hãy đảm bảo các thông số mạng và MQTT được thiết lập chính xác:

```cpp
// Thông tin kết nối WiFi
const char* ssid     = "Ten_Wifi_Cua_Ban";
const char* password = "Mat_Khau_Wifi";

// Thông tin kết nối MQTT Broker (Địa chỉ IP máy tính chạy Server/Mosquitto)
const char* mqtt_server = "192.168.1.53"; // Thay bằng IP local máy tính của bạn
const int mqtt_port     = 6868;
const char* mqtt_user   = "DangXuanQuang";
const char* mqtt_pass   = "B23DCCN686";

// Cấu hình tên Topic truyền nhận
const char* mqtt_topic_pub      = "esp8266Quang/sensor/data";
const char* mqtt_topic_control  = "esp8266Quang/device_control";
const char* mqtt_topic_response = "esp8266Quang/device_response";
```

Định dạng gói tin JSON dữ liệu cảm biến ESP8266 gửi lên MQTT Topic `esp8266Quang/sensor/data`:

```json
{
  "temp": 28.5,
  "hum": 65.0,
  "light": 720,
  "is_bright": true
}
```

---

## 7. DANH SÁCH REST API ENDPOINTS

### Dữ liệu Cảm biến (Sensors API)
- `GET /api/v1/sensor/realtime`: Lấy dữ liệu cảm biến mới nhất từ cơ sở dữ liệu.
- `GET /api/v1/sensors/history`: Lấy lịch sử dữ liệu cảm biến (hỗ trợ phân trang, lọc theo loại cảm biến, giá trị, thời gian).

### Thiết bị và Điều khiển (Devices API)
- `GET /api/v1/devices/status`: Lấy trạng thái hiện tại của tất cả các thiết bị.
- `POST /api/v1/devices/:id/control`: Gửi lệnh bật/tắt thiết bị (Body: `{"action": "ON"}` hoặc `{"action": "OFF"}`).
- `GET /api/v1/actions/history`: Lấy nhật ký các thao tác điều khiển thiết bị (hỗ trợ phân trang và lọc).

---

## 8. KẾT NỐI REAL-TIME WEBSOCKET

- Địa chỉ kết nối WebSocket: `ws://localhost:5000`
- Sự kiện nhận `SENSOR_UPDATE`: Server chủ động phát dữ liệu cảm biến mới tới Frontend mỗi khi nhận được tin nhắn từ ESP8266 qua MQTT.
- Sự kiện nhận `DEVICE_UPDATE`: Server phát thông báo cập nhật trạng thái thiết bị mỗi khi có thao tác bật/tắt hoặc có phản hồi từ ESP8266.
