import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { SENSOR_COLORS } from '../constants/colors';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

export default function Dashboard({ onNavigateToWind }) {
  const { sensors, chartData, setChartData, devices, setDevices, windThreshold } = useData();
  const [controlling, setControlling] = useState({});
  const [toast, setToast] = useState(null);

  // Tìm thiết bị Đèn 4 (Đèn cảnh báo)
  const alertDevice = devices.find((d) => d.id === 4 || d.device_type === 'ALERT_LIGHT') || {
    id: 4,
    name: 'Đèn cảnh báo',
    state: 'OFF'
  };
  const threshold = windThreshold || 300;
  const isAlerting = alertDevice.state === 'ALERT' || Number(sensors.wind || 0) > threshold;

  // Tự động đóng thông báo lỗi sau 4 giây
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Lấy lịch sử cảm biến 
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

  // HÀM XỬ LÝ ĐIỀU KHIỂN BẬT / TẮT THIẾT BỊ (hỗ trợ trạng thái trung gian LOADING)
  const handleToggleDevice = async (device) => {
    // Nếu thiết bị đang ở trạng thái LOADING hoặc đang gửi lệnh, không cho click lặp lại
    if (device.state === 'LOADING' || controlling[device.id]) return;

    // Lưu lại trạng thái ban đầu để rollback nếu thất bại
    const prevState = device.state === 'ON' ? 'ON' : 'OFF';
    const nextAction = prevState === 'ON' ? 'TURN_OFF' : 'TURN_ON';
    const startTime = Date.now();
    
    // Đánh dấu thiết bị đang điều khiển và cập nhật ngay state = 'LOADING'
    setControlling((prev) => ({ ...prev, [device.id]: true }));
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, state: 'LOADING' } : d))
    );

    try {
      // Gửi request POST tới Backend để điều khiển thiết bị (timeout 5000ms = 5s)
      const res = await axios.post(
        `${API_BASE}/devices/${device.id}/control`,
        { action: nextAction },
        { timeout: 5000 }
      );
      
      // Tạo độ trễ tối thiểu 500ms giữa các trạng thái để hiển thị rõ trạng thái LOADING
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }

      // Khi Backend trả về kết quả thành công, cập nhật ngay trạng thái thiết bị trong State
      if (res.data && res.data.data) {
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, state: res.data.data.state } : d))
        );
      } else {
        throw new Error('Không nhận được dữ liệu phản hồi từ thiết bị');
      }
    } catch (err) {
      console.error('Lỗi khi điều khiển thiết bị:', err);
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }

      // Khôi phục lại trạng thái cũ của thiết bị (Rollback)
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, state: prevState } : d))
      );

      const isTimeout = err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout')) || elapsed >= 5000;
      const errorMsg = isTimeout
        ? `Điều khiển ${device.name} thất bại! Quá thời gian 5s không có phản hồi từ thiết bị.`
        : `Thao tác bật/tắt ${device.name} thất bại! Vui lòng thử lại sau.`;

      setToast({ type: 'error', message: errorMsg });
    } finally {
      // Mở khóa nút bấm thiết bị sau khi xử lý xong
      setControlling((prev) => ({ ...prev, [device.id]: false }));
    }
  };

  //  HÀM ĐỊNH DẠNG THỜI GIAN
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

  // KHỐI 4: TÍNH TOÁN KHOẢNG GIÁ TRỊ TRỤC Y TỰ ĐỘNG CHO ĐỒ THỊ
  const { tempDomain, humDomain, lightDomain } = React.useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        tempDomain: [25, 35],
        humDomain: [60, 80],
        lightDomain: [0, 1000]
      };
    }

    // Trích xuất danh sách giá trị hợp lệ
    const temps = chartData.map((d) => Number(d.temperature)).filter((v) => !isNaN(v));
    const hums = chartData.map((d) => Number(d.humidity)).filter((v) => !isNaN(v));
    const lights = chartData.map((d) => Number(d.light)).filter((v) => !isNaN(v));

    // Khoảng trục Y cho Nhiệt độ (°C)
    let minT = temps.length ? Math.min(...temps) : 30;
    let maxT = temps.length ? Math.max(...temps) : 30;
    const tempLow = Math.floor(minT - 2);
    const tempHigh = Math.ceil(maxT + 3);

    // Khoảng trục Y cho Độ ẩm (%)
    let minH = hums.length ? Math.min(...hums) : 75;
    let maxH = hums.length ? Math.max(...hums) : 75;
    const humLow = Math.floor(minH - 3);
    const humHigh = Math.ceil(maxH + 2);

    // Khoảng trục Y cho Ánh sáng (Lux)
    let minL = lights.length ? Math.min(...lights) : 0;
    let maxL = lights.length ? Math.max(...lights) : 1000;
    const lightLow = Math.max(0, Math.floor(minL - 30));
    const lightHigh = Math.ceil(maxL + 30);

    return {
      tempDomain: [tempLow, tempHigh],
      humDomain: [humLow, humHigh],
      lightDomain: [lightLow, lightHigh]
    };
  }, [chartData]);

  // KHỐI 5: TÍNH TOÁN HIỆU ỨNG THẺ CẢM BIẾN
  // Phần trăm độ dài thanh tiến trình cho Nhiệt độ  Độ ẩm
  const tempPercent = Math.min(100, Math.max(0, (Number(sensors.temperature || 0) / 50) * 100));
  const humPercent = Math.min(100, Math.max(0, Number(sensors.humidity || 0)));

  // Tính toán phần trăm thanh tiến trình cho Ánh sáng
  const lightVal = Number(sensors.light || 0);
  const lightPercent = Math.min(100, Math.max(0, (lightVal / 1000) * 100));

  // KHỐI 6: GIAO DIỆN HIỂN THỊ 
  return (
    <div className="h-full p-6 overflow-y-auto flex flex-col justify-between relative">
      {/* Toast Thông báo Thất bại / Lỗi (Khung tĩnh, đơn giản, không biểu tượng X đỏ phía trước) */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center p-3.5 text-rose-800 rounded-2xl bg-white border border-rose-200 shadow-md space-x-3 max-w-md">
          <div className="text-xs font-bold leading-relaxed">{toast.message}</div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto -mx-1.5 -my-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 inline-flex items-center justify-center h-7 w-7 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div>
        {/* 6.1. Header Tiêu đề trang */}
        <Header title="Hệ Thống IoT" subtitle="Theo dõi và điều khiển thiết bị thời gian thực" />

        {/* 6.2. KHỐI 4 THẺ CẢM BIẾN TRÊN CÙNG (SENSOR WIDGET CARDS - ĐỀ LẺ) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          
          {/* THẺ 1: NHIỆT ĐỘ (°C) */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm card-hover flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhiệt độ</span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md">°C</span>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{sensors.temperature}</span>
                <span className="text-sm font-bold text-amber-500">°C</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full bg-amber-100/60 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                  style={{ width: `${tempPercent}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mr-1"></span>
                  Cập nhật: {formatTime(sensors.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* THẺ 2: ĐỘ ẨM (%) */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm card-hover flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ ẩm</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">%</span>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{sensors.humidity}</span>
                <span className="text-sm font-bold text-blue-500">%</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full bg-blue-100/60 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                  style={{ width: `${humPercent}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block mr-1"></span>
                  Cập nhật: {formatTime(sensors.timestamp)}
                </span>
                <span className="font-mono font-bold text-blue-600/80">{Math.round(humPercent)}%</span>
              </div>
            </div>
          </div>

          {/* THẺ 3: ÁNH SÁNG (Lux) */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm card-hover flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ánh sáng</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">lux</span>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{sensors.light}</span>
                <span className="text-xs font-bold text-emerald-500">lux</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full bg-emerald-100/60 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                  style={{ width: `${lightPercent}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>
                  Cập nhật: {formatTime(sensors.timestamp)}
                </span>
                <span className="font-mono font-bold text-emerald-600/80">{Math.round(lightPercent)}%</span>
              </div>
            </div>
          </div>

          {/* THẺ 4: TỐC ĐỘ GIÓ (km/h) - CÓ NÚT BẤM CHUYỂN QUA PAGE DASHBOARD GIÓ RIÊNG BIỆT */}
          <div
            onClick={() => onNavigateToWind && onNavigateToWind()}
            className={`p-4.5 rounded-2xl border transition-all duration-300 shadow-sm card-hover flex flex-col justify-between cursor-pointer group hover:ring-2 hover:ring-purple-400/40 ${
              isAlerting
                ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/30'
                : 'bg-white border-slate-100'
            }`}
            title="Nhấn để mở Trang Dashboard Tốc Độ Gió Riêng Biệt"
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
                  Tốc độ gió ↗
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                  isAlerting ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-50 text-purple-600'
                }`}>
                  {isAlerting ? `CẢNH BÁO (>${threshold})` : 'km/h'}
                </span>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className={`text-3xl font-extrabold tracking-tight ${
                  isAlerting ? 'text-rose-600' : 'text-slate-800'
                }`}>
                  {sensors.wind !== undefined ? sensors.wind : 0}
                </span>
                <span className="text-xs font-bold text-purple-600">km/h</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full bg-purple-100/60 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out shadow-xs ${
                    Number(sensors.wind || 0) > threshold
                      ? 'bg-gradient-to-r from-purple-500 to-rose-600'
                      : 'bg-gradient-to-r from-purple-400 to-purple-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (Number(sensors.wind || 0) / 500) * 100))}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center text-purple-600 font-semibold group-hover:underline">
                  Xem Dashboard Gió ➜
                </span>
                <span className="font-mono font-bold text-purple-600/80">{sensors.wind || 0} km/h</span>
              </div>
            </div>
          </div>

        </div>

        {/* 6.3. KHỐI ĐỒ THỊ XU HƯỚNG CẢM BIẾN (3 ĐƯỜNG TRUYỀN THỐNG NHIỆT ĐỘ - ĐỘ ẨM - ÁNH SÁNG) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-5">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Xu hướng Cảm biến (Nhiệt độ - Độ ẩm - Ánh sáng)</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 25, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENSOR_COLORS.temperature.hex} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={SENSOR_COLORS.temperature.hex} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENSOR_COLORS.humidity.hex} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={SENSOR_COLORS.humidity.hex} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENSOR_COLORS.light.hex} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={SENSOR_COLORS.light.hex} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} minTickGap={15} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                
                <YAxis
                  yAxisId="temp"
                  type="number"
                  orientation="left"
                  width={36}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: SENSOR_COLORS.temperature.hex, fontSize: 10, fontWeight: 700, dx: 45 }}
                  domain={[(dataMin) => Math.floor(dataMin - 2), (dataMax) => Math.ceil(dataMax + 2)]}
                  tickFormatter={(val) => `${Number(val).toFixed(0)}°C`}
                />

                <YAxis
                  yAxisId="hum"
                  type="number"
                  orientation="right"
                  width={35}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: SENSOR_COLORS.humidity.hex, fontSize: 10, fontWeight: 700 }}
                  domain={[(dataMin) => Math.floor(dataMin - 3), (dataMax) => Math.ceil(dataMax + 2)]}
                  tickFormatter={(val) => `${Number(val).toFixed(0)}%`}
                />

                <YAxis
                  yAxisId="light"
                  hide={true}
                  domain={lightDomain}
                />

                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    border: '1px solid #f1f5f9', 
                    fontSize: '12px', 
                    boxShadow: '0 8px 12px -3px rgba(0,0,0,0.08)' }}
                />
                
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  iconType="line"
                />

                <Area
                  yAxisId="hum"
                  name="Độ ẩm (%)"
                  type="natural"
                  dataKey="humidity"
                  stroke={SENSOR_COLORS.humidity.hex}
                  strokeWidth={2.5}
                  fill="url(#humGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: SENSOR_COLORS.humidity.hex, stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
                <Area
                  yAxisId="temp"
                  name="Nhiệt độ (°C)"
                  type="natural"
                  dataKey="temperature"
                  stroke={SENSOR_COLORS.temperature.hex}
                  strokeWidth={2.5}
                  fill="url(#tempGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: SENSOR_COLORS.temperature.hex, stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
                <Area
                  yAxisId="light"
                  name="Ánh sáng (Lx)"
                  type="natural"
                  dataKey="light"
                  stroke={SENSOR_COLORS.light.hex}
                  strokeWidth={2.5}
                  fill="url(#lightGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: SENSOR_COLORS.light.hex, stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6.4. KHỐI THIẾT BỊ ĐIỀU KHIỂN & ĐÈN CẢNH BÁO (4 CỘT NẰM CÙNG NHAU) */}
        <div className="mb-2">
          <h2 className="text-sm font-bold text-slate-800 mb-2">Thiết bị & Cảnh báo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 3 ĐÈN ĐIỀU KHIỂN */}
            {devices.filter((d) => d.id !== 4 && d.device_type !== 'ALERT_LIGHT').map((device) => {
              const isOn = device.state === 'ON';
              const isLoading = device.state === 'LOADING' || controlling[device.id];

              return (
                <div
                  key={device.id}
                  className={`p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-between shadow-xs ${
                    isLoading
                      ? 'bg-amber-50/70 border border-amber-300'
                      : isOn
                      ? 'bg-white border-2 border-blue-500'
                      : 'bg-white border border-slate-100'
                  }`}
                >
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{device.name}</h3>
                    <p className={`text-[11px] font-bold mt-0.5 ${isLoading ? 'text-amber-600' : isOn ? 'text-blue-500' : 'text-slate-400'}`}>
                      {isLoading ? 'ĐANG TẢI...' : isOn ? 'BẬT' : 'TẮT'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleDevice(device)}
                    disabled={isLoading}
                    title={isLoading ? 'Đang chuyển đổi trạng thái...' : (isOn ? 'Tắt' : 'Bật')}
                    className={`w-13 h-7 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                      isLoading ? 'bg-amber-400 justify-center' : isOn ? 'bg-blue-500 justify-end' : 'bg-slate-200 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-xs"></div>
                  </button>
                </div>
              );
            })}

            {/* THẺ ĐÈN 4 CẢNH BÁO NẰM CÙNG HÀNG VỚI 3 ĐÈN TRÊN */}
            <div
              className={`p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-between shadow-xs ${
                isAlerting
                  ? 'alert-blink border-2 border-rose-500 bg-rose-50/80 shadow-rose-200'
                  : 'bg-white border border-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-slate-800 text-sm">Đèn 4</h3>
                  <span className="text-[10px] text-slate-400 font-mono">(IO15)</span>
                </div>
                <p className={`text-[11px] font-bold mt-0.5 flex items-center ${isAlerting ? 'text-rose-600' : 'text-slate-400'}`}>
                  {isAlerting ? (
                    <>
                      <span className="relative flex h-2.5 w-2.5 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                      </span>
                      <span className="font-extrabold animate-pulse">ĐANG NHÁY CẢNH BÁO</span>
                    </>
                  ) : (
                    <span>TẮT</span>
                  )}
                </p>
              </div>

              <div className="flex flex-col items-end">
                <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                  isAlerting ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                }`}>
                  {isAlerting ? 'ALERT' : 'TỰ ĐỘNG'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

