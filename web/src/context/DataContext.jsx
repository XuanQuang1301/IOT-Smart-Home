import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
const DataContext = createContext(null);

export function DataProvider({ children }) {

  // 1.1. State lưu thông số Cảm biến thời gian thực hiện tại (Nhiệt độ, Độ ẩm, Ánh sáng, Timestamp)
  const [sensors, setSensors] = useState({
    temperature: 28.5,
    humidity: 65,
    light: 720,
    timestamp: new Date().toISOString()
  });

  // 1.2. State lưu mảng dữ liệu mốc thời gian để vẽ Đồ thị xu hướng (Tối đa 20 điểm mới nhất)
  const [chartData, setChartData] = useState([]);

  // 1.3. State lưu danh sách và trạng thái Bật/Tắt các thiết bị thông minh
  const [devices, setDevices] = useState([
    { id: 1, name: 'Đèn 1', state: 'ON' },
    { id: 2, name: 'Đèn 2', state: 'OFF' }
  ]);

  // 1.4. Cache lưu dữ liệu Lịch sử Cảm biến (Dữ liệu bảng, Phân trang, Bộ lọc đang chọn, Trạng thái loading)
  const [sensorHistoryCache, setSensorHistoryCache] = useState({
    data: [],
    pagination: { current_page: 1, total_pages: 1, total_records: 0 },
    appliedFilters: { sensor_id: '', sensor_type: '', value: '', time: '' },
    limit: 10,
    loading: false
  });

  // 1.5. Cache lưu dữ liệu Lịch sử Bật/Tắt Thiết bị
  const [deviceHistoryCache, setDeviceHistoryCache] = useState({
    data: [],
    pagination: { current_page: 1, total_pages: 1, total_records: 0 },
    appliedFilters: { device_id: '', action: '', status: '', time: '' },
    limit: 10,
    loading: false
  });


  // 2.1. Hàm gọi API lấy dữ liệu Lịch sử Cảm biến theo Trang & Bộ lọc
  const fetchSensorHistory = useCallback(async (page = 1, filters = {}, limit = 10) => {
    setSensorHistoryCache((prev) => ({ ...prev, loading: true }));
    try {
      const params = {
        page,
        limit,
        ...(filters.sensor_id && { sensor_id: filters.sensor_id }),
        ...(filters.sensor_type && { sensor_type: filters.sensor_type }),
        ...(filters.value && { value: filters.value }),
        ...(filters.time && { time: filters.time })
      };

      const res = await axios.get(`${API_BASE}/sensor/history`, { params });
      if (res.data) {
        setSensorHistoryCache({
          data: res.data.data || [],
          pagination: res.data.pagination || { current_page: 1, total_pages: 1, total_records: 0 },
          appliedFilters: filters,
          limit,
          loading: false
        });
      } else {
        setSensorHistoryCache((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('Lỗi khi tải lịch sử cảm biến từ Context:', err);
      setSensorHistoryCache((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // 2.2. Hàm gọi API lấy dữ liệu Lịch sử Thao tác Thiết bị theo Trang & Bộ lọc
  const fetchDeviceHistory = useCallback(async (page = 1, filters = {}, limit = 10) => {
    setDeviceHistoryCache((prev) => ({ ...prev, loading: true }));
    try {
      const params = {
        page,
        limit,
        ...(filters.device_id && { device_id: filters.device_id }),
        ...(filters.action && { action: filters.action }),
        ...(filters.status && { status: filters.status }),
        ...(filters.time && { time: filters.time })
      };

      const res = await axios.get(`${API_BASE}/actions/history`, { params });
      if (res.data) {
        setDeviceHistoryCache({
          data: res.data.data || [],
          pagination: res.data.pagination || { current_page: 1, total_pages: 1, total_records: 0 },
          appliedFilters: filters,
          limit,
          loading: false
        });
      } else {
        setDeviceHistoryCache((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('Lỗi khi tải lịch sử thiết bị từ Context:', err);
      setDeviceHistoryCache((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // =========================================================================
  // KHỐI 3: KHỞI TẠO VÀ TẢI DỮ LIỆU SẴN KHI VỪA MỞ TRANG (PRE-FETCH EFFECT)
  // =========================================================================
  useEffect(() => {
    // 3.1. Lấy chỉ số Cảm biến thời gian thực hiện tại
    axios.get(`${API_BASE}/sensor/realtime`)
      .then((res) => {
        if (res.data && res.data.data) {
          setSensors(res.data.data);
        }
      })
      .catch(console.error);

    // 3.2. Lấy danh sách và trạng thái các thiết bị
    axios.get(`${API_BASE}/devices/status`)
      .then((res) => {
        if (res.data && res.data.data) {
          setDevices(res.data.data);
        }
      })
      .catch(console.error);

    // 3.3. Tải trước Trang 1 dữ liệu Lịch sử Cảm biến và Lịch sử Thiết bị
    fetchSensorHistory(1, {}, 10);
    fetchDeviceHistory(1, {}, 10);
  }, [fetchSensorHistory, fetchDeviceHistory]);

  // =========================================================================
  // KHỐI 4: KẾT NỐI WEBSOCKET REALTIME & TỰ ĐỘNG KẾT NỐI LẠI (WEBSOCKET LISTENER)
  // =========================================================================
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    // Hàm thiết lập kết nối WebSocket tới Server Node.js
    const connect = () => {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'ws://localhost:5000'
        : `${wsProtocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);

      // Lắng nghe các bản tin Realtime từ Server bắn về
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          // CASE 1: Nhận cập nhật dữ liệu Cảm biến thời gian thực
          if (msg.type === 'SENSOR_UPDATE') {
            const newData = msg.data;
            setSensors(newData);

            // Tự động thêm mốc điểm mới vào Đồ thị (giữ tối đa 20 điểm mới nhất)
            const timeStr = new Date(newData.timestamp).toLocaleTimeString('vi-VN', { hour12: false });
            setChartData((prev) => {
              const newPoint = {
                time: timeStr,
                temperature: newData.temperature,
                humidity: newData.humidity,
                light: newData.light
              };
              if (prev.length > 0 && prev[prev.length - 1].time === timeStr) {
                const updated = [...prev];
                updated[updated.length - 1] = newPoint;
                return updated;
              }
              const updated = [...prev, newPoint];
              return updated.slice(-20);
            });
          } 
          // CASE 2: Nhận cập nhật trạng thái Bật/Tắt Thiết bị
          else if (msg.type === 'DEVICE_UPDATE') {
            setDevices((prev) =>
              prev.map((d) => (d.id === msg.data.device_id ? { ...d, state: msg.data.state } : d))
            );
          }
        } catch (err) {
          console.error('Lỗi khi xử lý dữ liệu WebSocket:', err);
        }
      };

      // Tự động kết nối lại (Auto Reconnect) sau 3 giây nếu bị đứt kết nối WebSocket
      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    // Dọn dẹp kết nối khi Component bị unmount
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <DataContext.Provider
      value={{
        sensors,
        chartData,
        setChartData,
        devices,
        setDevices,
        sensorHistoryCache,
        fetchSensorHistory,
        deviceHistoryCache,
        fetchDeviceHistory
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData phải được sử dụng bên trong DataProvider');
  return ctx;
}
