import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

export default function AlertStats({ isActive = true }) {
  const { setWindThreshold } = useData();
  // 1. Quản lý tháng được chọn (Mặc định YYYY-MM hiện tại)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().substring(0, 7);
  });

  const [statsData, setStatsData] = useState({ month: '', total: 0, days: [] });
  const [loadingStats, setLoadingStats] = useState(false);

  // 2. Cài đặt ngưỡng cảnh báo (Sensor 4: Tốc độ gió)
  const [settings, setSettings] = useState([]);
  const [windThresholdInput, setWindThresholdInput] = useState('200');
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState(null);

  // Tự đóng toast sau 3s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch dữ liệu thống kê tháng
  const fetchStats = useCallback(async (month) => {
    setLoadingStats(true);
    try {
      const res = await axios.get(`${API_BASE}/alerts/stats?month=${month}`);
      if (res.data && res.data.data) {
        setStatsData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching alert stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch cấu hình ngưỡng
  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/alerts/settings`);
      if (res.data && res.data.data) {
        setSettings(res.data.data);
        const windSetting = res.data.data.find((s) => s.sensor_id === 4);
        if (windSetting) {
          setWindThresholdInput(String(windSetting.threshold));
        }
      }
    } catch (err) {
      console.error('Error fetching alert settings:', err);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      fetchStats(selectedMonth);
      fetchSettings();
    }
  }, [isActive, selectedMonth, fetchStats, fetchSettings]);

  // Lưu ngưỡng cảnh báo gió
  const handleSaveWindThreshold = async (e) => {
    e.preventDefault();
    const val = parseFloat(windThresholdInput);
    if (isNaN(val) || val < 0 || val > 500) {
      setToast({ type: 'error', message: 'Ngưỡng tốc độ gió phải từ 0 đến 500 km/h!' });
      return;
    }

    setSavingSettings(true);
    try {
      const res = await axios.put(`${API_BASE}/alerts/settings/4`, { threshold: val });
      if (res.data && res.data.status === 'success') {
        const synced = res.data.data.synced;
        setToast({
          type: 'success',
          message: synced
            ? 'Đã lưu ngưỡng và đồng bộ tức thì tới ESP8266!'
            : 'Đã lưu vào CSDL (Sẽ đồng bộ khi ESP/Broker kết nối lại).'
        });
        setWindThreshold(val);
        fetchSettings();
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Lỗi cập nhật ngưỡng: ' + (err.response?.data?.message || err.message) });
    } finally {
      setSavingSettings(false);
    }
  };

  // Điều hướng chuyển tháng trước / tháng sau
  const handleMonthChange = (offset) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    const newMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  return (
    <div className="h-full p-6 overflow-y-auto flex flex-col justify-between relative">
      {/* Toast thông báo */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center p-3.5 rounded-2xl bg-white border shadow-md space-x-3 max-w-md ${
          toast.type === 'error' ? 'text-rose-800 border-rose-200' : 'text-emerald-800 border-emerald-200'
        }`}>
          <div className="text-xs font-bold leading-relaxed">{toast.message}</div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            ✕
          </button>
        </div>
      )}

      <div>
        <Header title="Thống Kê Cảnh Báo" subtitle="Theo dõi tần suất cảnh báo LED4 theo tháng & cài đặt ngưỡng cảm biến" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* CỘT TRÁI (2 cols): BIỂU ĐỒ CẢNH BÁO THEO NGÀY TRONG THÁNG */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Tần suất Cảnh báo theo ngày ({selectedMonth})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tổng số lần cảnh báo trong tháng: <span className="font-bold text-rose-600">{statsData.total} lần</span>
                </p>
              </div>

              {/* Bộ chọn tháng */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleMonthChange(-1)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                  title="Tháng trước"
                >
                  ◀
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleMonthChange(1)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                  title="Tháng sau"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Khung Biểu đồ Cột Recharts */}
            <div className="h-64 w-full">
              {loadingStats ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                  Đang tải thống kê...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      formatter={(val) => [`${val} lần`, 'Số lần cảnh báo']}
                      labelFormatter={(label) => `Ngày ${label}/${selectedMonth}`}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                        fontSize: '12px',
                        boxShadow: '0 8px 12px -3px rgba(0,0,0,0.08)'
                      }}
                    />
                    <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* CỘT PHẢI (1 col): CÀI ĐẶT NGƯỠNG CẢNH BÁO */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Cài đặt Ngưỡng Gió</h3>
                  <p className="text-[11px] text-slate-400">Điều chỉnh mức kích hoạt LED4</p>
                </div>
              </div>

              <form onSubmit={handleSaveWindThreshold} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngưỡng tốc độ gió (km/h)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="500"
                      value={windThresholdInput}
                      onChange={(e) => setWindThresholdInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                      placeholder="Mặc định: 200"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      km/h
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Khi cảm biến gửi giá trị gió &gt; ngưỡng này, Đèn 4 (IO15) sẽ tự động nhấp nháy cảnh báo.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {savingSettings ? 'Đang lưu & Đồng bộ...' : 'Lưu ngưỡng cảnh báo'}
                </button>
              </form>
            </div>

            {/* Thông tin phần cứng Đèn cảnh báo */}
            <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>Thiết bị: Đèn cảnh báo</span>
                <span className="text-rose-600 font-mono">IO15 (D8)</span>
              </div>
              <div className="text-slate-500">Cơ chế: Tự động (Không có nút bấm tay)</div>
              <div className="text-slate-500">Đồng bộ: MQTT Retained Topic `esp8266Quang/config`</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
