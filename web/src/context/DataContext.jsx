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
    { id: 2, name: 'Đèn 2', state: 'OFF' },
    { id: 3, name: 'Đèn 3', state: 'OFF' }
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

  // KHỐI 4: TỰ ĐỘNG GỌI HTTP API LẤY DỮ LIỆU ĐỊNH KỲ MỖI 2 GIÂY (POLLING 2S)
  useEffect(() => {
    const fetchInterval = setInterval(async () => {
      try {
        // 1. Tự động lấy chỉ số Cảm biến thời gian thực mỗi 2 giây
        const resSensor = await axios.get(`${API_BASE}/sensor/realtime`);
        if (resSensor.data && resSensor.data.data) {
          const newData = resSensor.data.data;
          setSensors(newData);
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
            return [...prev, newPoint].slice(-20);
          });
        }

        // 2. Tự động lấy trạng thái Bật/Tắt các Thiết bị mỗi 2 giây
        const resDevice = await axios.get(`${API_BASE}/devices/status`);
        if (resDevice.data && resDevice.data.data) {
          setDevices(resDevice.data.data);
        }
      } catch (err) {
        console.error('Lỗi khi tự động lấy dữ liệu định kỳ (Polling 2s):', err);
      }
    }, 2000);

    return () => clearInterval(fetchInterval);
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
