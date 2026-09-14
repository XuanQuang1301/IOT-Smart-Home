import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { Thermometer, CloudRain, Sun, Lightbulb, Loader2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const API_BASE = 'http://localhost:5000/api/v1';

export default function Dashboard() {
  const [sensors, setSensors] = useState({
    temperature: 28.5,
    humidity: 65,
    light: 720,
    timestamp: new Date().toISOString()
  });

  const [chartData, setChartData] = useState([]);
  const [devices, setDevices] = useState([
    { id: 1, name: 'Đèn 1', state: 'ON' },
    { id: 2, name: 'Đèn 2', state: 'OFF' }
  ]);
  const [controlling, setControlling] = useState({});

  // Fetch Initial Data & Setup WebSocket
  useEffect(() => {
    fetchRealtimeData();
    fetchChartData();
    fetchDevicesStatus();

    // WebSocket Real-time listener
    const ws = new WebSocket('ws://localhost:5000');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'SENSOR_UPDATE') {
          const newData = msg.data;
          setSensors(newData);

          // Update chart dataset in real-time
          const timeStr = new Date(newData.timestamp).toTimeString().split(' ')[0];
          setChartData((prev) => {
            const updated = [...prev, {
              time: timeStr,
              temperature: newData.temperature,
              humidity: newData.humidity,
              light: newData.light
            }];
            return updated.slice(-20); // keep last 20 points
          });
        } else if (msg.type === 'DEVICE_UPDATE') {
          setDevices((prev) =>
            prev.map((d) => (d.id === msg.data.device_id ? { ...d, state: msg.data.state } : d))
          );
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const fetchRealtimeData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sensor/realtime`);
      if (res.data && res.data.data) {
        setSensors(res.data.data);
      }
    } catch (err) {
      console.error('Error loading realtime sensor:', err);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sensors/history?deviceId=1&limit=20`);
      if (res.data && res.data.data) {
        setChartData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading chart data:', err);
    }
  };

  const fetchDevicesStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/devices/status`);
      if (res.data && res.data.data) {
        setDevices(res.data.data);
      }
    } catch (err) {
      console.error('Error loading devices status:', err);
    }
  };

  // Toggle Device handler
  const handleToggleDevice = async (device) => {
    const nextAction = device.state === 'ON' ? 'TURN_OFF' : 'TURN_ON';
    setControlling((prev) => ({ ...prev, [device.id]: true }));

    try {
      const res = await axios.post(`${API_BASE}/devices/${device.id}/control`, { action: nextAction });
      if (res.data && res.data.data) {
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, state: res.data.data.state } : d))
        );
      }
    } catch (err) {
      console.error('Failed to control device:', err);
      alert('Không thể điều khiển thiết bị! Vui lòng thử lại.');
    } finally {
      setControlling((prev) => ({ ...prev, [device.id]: false }));
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '14:31:42';
    try {
      return new Date(ts).toTimeString().split(' ')[0];
    } catch {
      return '14:31:42';
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <Header title="Hệ Thống IoT" subtitle="Theo dõi và điều khiển thiết bị thời gian thực" />

      {/* 3 Top Sensor Widget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Nhiệt độ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm card-hover flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold text-slate-400">Nhiệt độ</span>
            <div className="flex items-baseline space-x-1 mt-3">
              <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{sensors.temperature}</span>
              <span className="text-lg font-bold text-amber-500">°C</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-1.5"></span>
              Cập nhật: {formatTime(sensors.timestamp)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Thermometer className="w-6 h-6" />
          </div>
        </div>

        {/* Độ ẩm */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm card-hover flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold text-slate-400">Độ ẩm</span>
            <div className="flex items-baseline space-x-1 mt-3">
              <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{sensors.humidity}</span>
              <span className="text-lg font-bold text-blue-500">%</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block mr-1.5"></span>
              Cập nhật: {formatTime(sensors.timestamp)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <CloudRain className="w-6 h-6" />
          </div>
        </div>

        {/* Ánh sáng */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm card-hover flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold text-slate-400">Ánh sáng</span>
            <div className="flex items-baseline space-x-1 mt-3">
              <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{sensors.light}</span>
              <span className="text-sm font-bold text-emerald-500">lux</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5"></span>
              Cập nhật: {formatTime(sensors.timestamp)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Sun className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sensor Trend Chart Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
        <h2 className="text-base font-bold text-slate-800 mb-6">Xu hướng Cảm biến</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                iconType="line"
              />
              <Line name="Nhiệt độ (°C)" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line name="Độ ẩm (%)" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line name="Ánh sáng (Lx)" type="monotone" dataKey="light" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Control Devices Section */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4">Thiết bị điều khiển</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {devices.map((device) => {
            const isOn = device.state === 'ON';
            const isLoading = controlling[device.id];

            return (
              <div
                key={device.id}
                className={`p-6 rounded-3xl transition-all duration-200 flex items-center justify-between shadow-sm ${
                  isOn
                    ? 'bg-white border-2 border-blue-500 ring-4 ring-blue-500/10'
                    : 'bg-white border border-slate-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      isOn ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{device.name}</h3>
                    <p className={`text-xs font-semibold tracking-wider mt-0.5 ${isOn ? 'text-blue-500' : 'text-slate-400'}`}>
                      {isOn ? 'ĐANG HOẠT ĐỘNG' : 'ĐANG TẮT'}
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => handleToggleDevice(device)}
                  disabled={isLoading}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    isOn ? 'bg-blue-500 justify-end' : 'bg-slate-200 justify-start'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300"></div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
