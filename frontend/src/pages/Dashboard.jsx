import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { Thermometer, CloudRain, Sun, Lightbulb, Loader2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const API_BASE = 'http://localhost:5000/api/v1';

export default function Dashboard() {
  const { sensors, chartData, setChartData, devices, setDevices } = useData();
  const [controlling, setControlling] = useState({});

  useEffect(() => {
    // If chartData is empty, fetch initial 20 items
    if (chartData.length === 0) {
      axios.get(`${API_BASE}/sensors/history?deviceId=1&limit=20`)
        .then((res) => {
          if (res.data && res.data.data) {
            setChartData(res.data.data);
          }
        })
        .catch(console.error);
    }
  }, [chartData.length, setChartData]);

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
    <div className="flex-1 p-6 overflow-y-auto max-h-screen flex flex-col justify-between">
      <div>
        <Header title="Hệ Thống IoT" subtitle="Theo dõi và điều khiển thiết bị thời gian thực" />

        {/* 3 Top Sensor Widget Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Nhiệt độ */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm card-hover flex justify-between items-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nhiệt độ</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{sensors.temperature}</span>
                <span className="text-sm font-bold text-amber-500">°C</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-1"></span>
                Cập nhật: {formatTime(sensors.timestamp)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>

          {/* Độ ẩm */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm card-hover flex justify-between items-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Độ ẩm</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{sensors.humidity}</span>
                <span className="text-sm font-bold text-blue-500">%</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block mr-1"></span>
                Cập nhật: {formatTime(sensors.timestamp)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <CloudRain className="w-5 h-5" />
            </div>
          </div>

          {/* Ánh sáng */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm card-hover flex justify-between items-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ánh sáng</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{sensors.light}</span>
                <span className="text-xs font-bold text-emerald-500">lux</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>
                Cập nhật: {formatTime(sensors.timestamp)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Sensor Trend Chart Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-5">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Xu hướng Cảm biến</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px', boxShadow: '0 8px 12px -3px rgba(0,0,0,0.08)' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  iconType="line"
                />
                <Line name="Nhiệt độ (°C)" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
                <Line name="Độ ẩm (%)" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
                <Line name="Ánh sáng (Lx)" type="monotone" dataKey="light" stroke="#06b6d4" strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Control Devices Section */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 mb-3">Thiết bị điều khiển</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => {
              const isOn = device.state === 'ON';
              const isLoading = controlling[device.id];

              return (
                <div
                  key={device.id}
                  className={`p-4 rounded-2xl transition-all duration-200 flex items-center justify-between shadow-sm ${
                    isOn
                      ? 'bg-white border-2 border-blue-500 ring-2 ring-blue-500/10'
                      : 'bg-white border border-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                        isOn ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{device.name}</h3>
                      <p className={`text-[10px] font-semibold tracking-wider mt-0.5 ${isOn ? 'text-blue-500' : 'text-slate-400'}`}>
                        {isOn ? 'ĐANG HOẠT ĐỘNG' : 'ĐANG TẮT'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggleDevice(device)}
                    disabled={isLoading}
                    className={`w-12 h-7 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                      isOn ? 'bg-blue-500 justify-end' : 'bg-slate-200 justify-start'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
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
    </div>
  );
}
