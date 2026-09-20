import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = '/api/v1';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // Realtime Sensor State
  const [sensors, setSensors] = useState({
    temperature: 28.5,
    humidity: 65,
    light: 720,
    timestamp: new Date().toISOString()
  });

  // Chart Data State
  const [chartData, setChartData] = useState([]);

  // Devices Status State
  const [devices, setDevices] = useState([
    { id: 1, name: 'Đèn 1', state: 'ON' },
    { id: 2, name: 'Đèn 2', state: 'OFF' }
  ]);

  // Sensor History State
  const [sensorHistoryCache, setSensorHistoryCache] = useState({
    data: [],
    pagination: { current_page: 1, total_pages: 1, total_records: 0 },
    appliedFilters: { sensor_id: '', sensor_type: '', value: '', time: '' },
    limit: 10,
    loading: false
  });

  // Device History State
  const [deviceHistoryCache, setDeviceHistoryCache] = useState({
    data: [],
    pagination: { current_page: 1, total_pages: 1, total_records: 0 },
    appliedFilters: { device_id: '', action: '', status: '', time: '' },
    limit: 10,
    loading: false
  });

  // Silent Background Fetch for Sensor History
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
      console.error('Error fetching sensor history context:', err);
      setSensorHistoryCache((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Silent Background Fetch for Device History
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
      console.error('Error fetching device history context:', err);
      setDeviceHistoryCache((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Pre-fetch Page 1 Data and Realtime status on App Startup
  useEffect(() => {
    axios.get(`${API_BASE}/sensor/realtime`)
      .then((res) => {
        if (res.data && res.data.data) {
          setSensors(res.data.data);
        }
      })
      .catch(console.error);

    axios.get(`${API_BASE}/devices/status`)
      .then((res) => {
        if (res.data && res.data.data) {
          setDevices(res.data.data);
        }
      })
      .catch(console.error);

    fetchSensorHistory(1, {}, 10);
    fetchDeviceHistory(1, {}, 10);
  }, [fetchSensorHistory, fetchDeviceHistory]);

  // Persistent Single WebSocket Connection
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'ws://localhost:5000'
        : `${wsProtocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'SENSOR_UPDATE') {
            const newData = msg.data;
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
              const updated = [...prev, newPoint];
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
