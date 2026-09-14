import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/v1';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // Realtime Sensor Cache
  const [sensors, setSensors] = useState({
    temperature: 28.5,
    humidity: 65,
    light: 720,
    timestamp: new Date().toISOString()
  });

  // Chart Data Cache
  const [chartData, setChartData] = useState([]);

  // Devices Status Cache
  const [devices, setDevices] = useState([
    { id: 1, name: 'Đèn 1', state: 'ON' },
    { id: 2, name: 'Đèn 2', state: 'OFF' }
  ]);

  // Persistent Cache for Sensor History Page
  const [sensorHistoryCache, setSensorHistoryCache] = useState({
    data: [],
    pagination: { current_page: 1, total_pages: 1, total_records: 0 },
    appliedFilters: { sensor_id: '', sensor_type: '', value: '', time: '' }
  });

  // Persistent Cache for Device History Page
  const [deviceHistoryCache, setDeviceHistoryCache] = useState({
    data: [],
    pagination: { current_page: 1, total_pages: 1, total_records: 0 },
    appliedFilters: { device_id: '', action: '', status: '', time: '' }
  });

  // Persistent Single WebSocket Connection
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
      ws = new WebSocket('ws://localhost:5000');

      ws.onopen = () => {
        console.log('⚡ Monorepo Global WebSocket Connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'SENSOR_UPDATE') {
            const newData = msg.data;
            setSensors(newData);

            const timeStr = new Date(newData.timestamp).toTimeString().split(' ')[0];
            setChartData((prev) => {
              const updated = [
                ...prev,
                {
                  time: timeStr,
                  temperature: newData.temperature,
                  humidity: newData.humidity,
                  light: newData.light
                }
              ];
              return updated.slice(-20);
            });
          } else if (msg.type === 'DEVICE_UPDATE') {
            setDevices((prev) =>
              prev.map((d) => (d.id === msg.data.device_id ? { ...d, state: msg.data.state } : d))
            );
          }
        } catch (err) {
          console.error('WS Error:', err);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Fetch Sensor History (10 rows per page)
  const fetchSensorHistory = useCallback(async (page = 1, filters = {}) => {
    try {
      const params = {
        page,
        limit: 10,
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
          appliedFilters: filters
        });
      }
    } catch (err) {
      console.error('Error fetching sensor history context:', err);
    }
  }, []);

  // Fetch Device History (10 rows per page)
  const fetchDeviceHistory = useCallback(async (page = 1, filters = {}) => {
    try {
      const params = {
        page,
        limit: 10,
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
          appliedFilters: filters
        });
      }
    } catch (err) {
      console.error('Error fetching device history context:', err);
    }
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
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
