import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const API_BASE = '/api/v1';

export default function Dashboard() {
  const { sensors, chartData, setChartData, devices, setDevices } = useData();
  const [controlling, setControlling] = useState({});

  useEffect(() => {
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
    if (!ts) return new Date().toLocaleTimeString('vi-VN', { hour12: false });
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return new Date().toLocaleTimeString('vi-VN', { hour12: false });
      return d.toLocaleTimeString('vi-VN', { hour12: false });
    } catch {
      return new Date().toLocaleTimeString('vi-VN', { hour12: false });
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto flex flex-col justify-between">
      <div>
        <Header title="Hệ Thống IoT" subtitle="Theo dõi và điều khiển thiết bị thời gian thực" />

        {/* 3 Top Sensor Widget Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Nhiệt độ */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm card-hover">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhiệt độ</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md">°C</span>
            </div>
            <div className="flex items-baseline space-x-1 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{sensors.temperature}</span>
              <span className="text-sm font-bold text-amber-500">°C</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-1"></span>
              Cập nhật: {formatTime(sensors.timestamp)}
            </div>
          </div>

          {/* Độ ẩm */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm card-hover">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ ẩm</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">%</span>
            </div>
            <div className="flex items-baseline space-x-1 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{sensors.humidity}</span>
              <span className="text-sm font-bold text-blue-500">%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block mr-1"></span>
              Cập nhật: {formatTime(sensors.timestamp)}
            </div>
          </div>

          {/* Ánh sáng */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm card-hover">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ánh sáng</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">lux</span>
            </div>
            <div className="flex items-baseline space-x-1 mt-2">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{sensors.light}</span>
              <span className="text-xs font-bold text-emerald-500">lux</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>
              Cập nhật: {formatTime(sensors.timestamp)}
            </div>
          </div>
        </div>

        {/* Sensor Trend Chart Section with Ultra-Smooth Natural Waves */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-5">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Xu hướng Cảm biến</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} minTickGap={15} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                
                {/* Y-Axis for Temperature (°C) with focused auto-scale domain */}
                <YAxis
                  yAxisId="temp"
                  orientation="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#f59e0b', fontSize: 10 }}
                  domain={[(min) => (isNaN(min) ? 20 : Math.floor(min - 0.5)), (max) => (isNaN(max) ? 40 : Math.ceil(max + 0.5))]}
                />

                {/* Y-Axis for Humidity (%) with focused auto-scale domain */}
                <YAxis
                  yAxisId="hum"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#3b82f6', fontSize: 10 }}
                  domain={[(min) => (isNaN(min) ? 50 : Math.floor(min - 1)), (max) => (isNaN(max) ? 90 : Math.ceil(max + 1))]}
                />

                {/* Hidden Y-Axis for Light (Lx) with focused auto-scale domain */}
                <YAxis
                  yAxisId="light"
                  hide={true}
                  domain={[(min) => (isNaN(min) ? 0 : Math.max(0, Math.floor(min - 4))), (max) => (isNaN(max) ? 100 : Math.ceil(max + 4))]}
                />

                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px', boxShadow: '0 8px 12px -3px rgba(0,0,0,0.08)' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  iconType="line"
                />

                {/* Natural Waving Lines with Focused Magnified Oscillation */}
                <Area
                  yAxisId="hum"
                  name="Độ ẩm (%)"
                  type="natural"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#humGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
                <Area
                  yAxisId="temp"
                  name="Nhiệt độ (°C)"
                  type="natural"
                  dataKey="temperature"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#tempGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
                <Area
                  yAxisId="light"
                  name="Ánh sáng (Lx)"
                  type="natural"
                  dataKey="light"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#lightGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
              </AreaChart>
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
                  className={`p-4.5 rounded-2xl transition-all duration-200 flex items-center justify-between shadow-sm ${
                    isOn
                      ? 'bg-white border-2 border-blue-500 ring-2 ring-blue-500/10'
                      : 'bg-white border border-slate-100'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{device.name}</h3>
                    <p className={`text-[11px] font-bold tracking-wider mt-1 ${isOn ? 'text-blue-500' : 'text-slate-400'}`}>
                      {isOn ? 'ĐANG HOẠT ĐỘNG' : 'ĐANG TẮT'}
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggleDevice(device)}
                    disabled={isLoading}
                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                      isOn ? 'bg-blue-500 justify-end' : 'bg-slate-200 justify-start'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300"></div>
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
