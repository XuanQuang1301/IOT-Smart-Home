import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SENSOR_COLORS } from '../constants/colors';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

export default function WindDashboard({ onNavigateBack }) {
  const { sensors, chartData: globalChartData, devices, windThreshold, setWindThreshold } = useData();
  const threshold = windThreshold || 300;
  const [thresholdInput, setThresholdInput] = useState(String(threshold));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Lấy dữ liệu 20 điểm gió từ globalChartData của DataContext (cập nhật đều đặn mỗi 2s)
  const chartData = (globalChartData && globalChartData.length > 0)
    ? globalChartData.slice(-20).map((d) => ({
        time: d.time,
        wind: Number(d.wind ?? 0)
      }))
    : [];

  const alertDevice = devices.find((d) => d.id === 4 || d.device_type === 'ALERT_LIGHT') || {
    id: 4,
    name: 'Đèn cảnh báo',
    state: 'OFF'
  };

  const isAlerting = alertDevice.state === 'ALERT' || Number(sensors.wind || 0) > threshold;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Đồng bộ giá trị input khi windThreshold trong context thay đổi
  useEffect(() => {
    if (Number.isFinite(windThreshold)) {
      setThresholdInput(String(windThreshold));
    }
  }, [windThreshold]);

  // Cài đặt ngưỡng 
  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    const val = parseFloat(thresholdInput);
    if (isNaN(val) || val < 0 || val > 500) {
      setToast({ type: 'error', message: 'Ngưỡng từ 0 đến 500 km/h!' });
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE}/alerts/settings/4`, { threshold: val });
      if (res.data && res.data.status === 'success') {
        setWindThreshold(val);
        setToast({ type: 'success', message: `Đã lưu ngưỡng: ${val} km/h` });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Lỗi: ' + (err.response?.data?.message || err.message) });
    } finally {
      setSaving(false);
    }
  };

  const windPercent = Math.min(100, Math.max(0, (Number(sensors.wind || 0) / 500) * 100));

  return (
    <div className="h-full p-4 overflow-hidden flex flex-col justify-between relative text-slate-800">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center py-2 px-3 rounded-xl bg-white border text-xs font-bold space-x-2 shadow-md ${
          toast.type === 'error' ? 'text-rose-700 border-rose-200' : 'text-emerald-700 border-emerald-200'
        }`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Header gọn + Nút quay lại */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onNavigateBack}
          className="text-xs font-bold text-slate-500 hover:text-purple-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
        >
          ← Dashboard chính
        </button>
        <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
          Dashboard Tốc Độ Gió
        </span>
      </div>

      {/* 1. KHỐI 2 THẺ: GIÓ REALTIME & TRẠNG THÁI ĐÈN 4 */}
      <div className="grid grid-cols-2 gap-3 my-1">
        {/* Thẻ Gió */}
        <div className={`p-3 rounded-xl border transition-all shadow-xs flex flex-col justify-between ${
          isAlerting ? 'bg-rose-50/80 border-rose-400' : 'bg-white border-slate-100'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Tốc độ gió</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
              isAlerting ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-50 text-purple-600'
            }`}>
              {isAlerting ? '! CẢNH BÁO' : 'BÌNH THƯỜNG'}
            </span>
          </div>
          <div className="my-1 flex items-baseline space-x-1">
            <span className={`text-3xl font-black ${isAlerting ? 'text-rose-600' : 'text-slate-800'}`}>
              {sensors.wind !== undefined ? sensors.wind : 0}
            </span>
            <span className="text-xs font-bold text-purple-600">km/h</span>
          </div>
          <div className="w-full bg-purple-100/60 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isAlerting ? 'bg-rose-600' : 'bg-purple-500'}`} style={{ width: `${windPercent}%` }}></div>
          </div>
        </div>

        {/* Box Đèn 4 */}
        <div className={`p-3 rounded-xl border transition-all shadow-xs flex flex-col justify-between ${
          isAlerting ? 'alert-blink border-2 border-rose-500 bg-rose-50/80' : 'bg-white border border-slate-100'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Đèn 4 (IO15)</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
              isAlerting ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {isAlerting ? 'ALERT' : 'OFF'}
            </span>
          </div>
          <div className="my-1 flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${isAlerting ? 'bg-rose-600 animate-ping' : 'bg-slate-300'}`}></span>
            <span className={`text-sm font-black ${isAlerting ? 'text-rose-600' : 'text-slate-600'}`}>
              {isAlerting ? 'ĐANG NHÁY CẢNH BÁO' : 'TẮT (AN TOÀN)'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Ngưỡng: {threshold} km/h
          </div>
        </div>
      </div>

      {/* 2. ĐỒ THỊ GIÓ */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs flex-1 my-1 flex flex-col justify-between min-h-[190px] max-h-[240px]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-slate-700">Xu hướng gió</span>
          <span className="text-[10px] text-purple-600 font-bold">km/h</span>
        </div>
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="windOnlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SENSOR_COLORS.wind.hex} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={SENSOR_COLORS.wind.hex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis
                domain={[0, 500]}
                width={40}
                axisLine={false}
                tickLine={false}
                tick={{ fill: SENSOR_COLORS.wind.hex, fontSize: 10, fontWeight: 700 }}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip
                formatter={(val) => [`${val} km/h`, 'Tốc độ gió']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                  fontSize: '11px',
                  padding: '4px 8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="wind"
                name="Tốc độ gió"
                stroke={SENSOR_COLORS.wind.hex}
                strokeWidth={2.5}
                fill="url(#windOnlyGrad)"
                dot={false}
                activeDot={{ r: 5, fill: SENSOR_COLORS.wind.hex, stroke: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. CÀI ĐẶT NGƯỠNG GỌN */}
      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between my-1">
        <span className="text-xs font-bold text-slate-700">Cài đặt ngưỡng:</span>
        <form onSubmit={handleSaveThreshold} className="flex items-center space-x-2">
          <input
            type="number"
            min="0"
            max="500"
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
            className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-purple-500"
            required
          />
          <span className="text-[10px] font-bold text-slate-400">km/h</span>
          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? '...' : 'Lưu'}
          </button>
        </form>
      </div>
    </div>
  );
}
