import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { SENSOR_COLORS } from '../constants/colors';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

export default function Dashboard() {
  const { sensors, chartData, setChartData, devices, setDevices } = useData();
  const [controlling, setControlling] = useState({});
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

  // HÀM XỬ LÝ ĐIỀU KHIỂN BẬT / TẮT THIẾT BỊ (có thêm trạng thái khi đang nghỉ chuyển khoảng)
  const handleToggleDevice = async (device) => {
    const nextAction = device.state === 'ON' ? 'TURN_OFF' : 'TURN_ON';
    
    // Đánh dấu thiết bị này đang được điều khiển 
    setControlling((prev) => ({ ...prev, [device.id]: true }));

    try {
      // Gửi request POST tới Backend để điều khiển thiết bị
      const res = await axios.post(`${API_BASE}/devices/${device.id}/control`, { action: nextAction });
      
      // Khi Backend trả về kết quả thành công, cập nhật ngay trạng thái thiết bị trong State
      if (res.data && res.data.data) {
        setDevices((prev) =>
          prev.map((d) => (d.id === device.id ? { ...d, state: res.data.data.state } : d))
        );
      }
    } catch (err) {
      console.error('Lỗi khi điều khiển thiết bị:', err);
      alert('Không thể điều khiển thiết bị! Vui lòng thử lại.');
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
        lightDomain: [0, 100]
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
    let minL = lights.length ? Math.min(...lights) : 10;
    let maxL = lights.length ? Math.max(...lights) : 50;
    const lightLow = Math.max(0, Math.floor(minL - 5));
    const lightHigh = Math.ceil(maxL + 15);

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
  const lightPercent = Math.min(100, Math.max(0, (lightVal / 100) * 100));

  // KHỐI 6: GIAO DIỆN HIỂN THỊ 
  return (
    <div className="h-full p-6 overflow-y-auto flex flex-col justify-between">
      <div>
        {/* 6.1. Header Tiêu đề trang */}
        <Header title="Hệ Thống IoT" subtitle="Theo dõi và điều khiển thiết bị thời gian thực" />

        {/* 6.2. KHỐI 3 THẺ CẢM BIẾN TRÊN CÙNG (SENSOR WIDGET CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          
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
              {/* Thanh tiến trình nhiệt độ */}
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
                {/* <span className="font-mono font-bold text-amber-600/80">Max 50°C</span> */}
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
              {/* Thanh tiến trình độ ẩm */}
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
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Ánh sáng
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">
                  lux
                </span>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  {sensors.light}
                </span>
                <span className="text-xs font-bold text-emerald-500">
                  lux
                </span>
              </div>
            </div>

            <div className="mt-3">
              {/* Thanh tiến trình ánh sáng */}
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
        </div>

        {/* 6.3. KHỐI ĐỒ THỊ XU HƯỚNG CẢM BIẾN (SENSOR TREND CHART) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-5">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Xu hướng Cảm biến</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 25, left: 10, bottom: 0 }}>
                {/* Định nghĩa Gradient chuyển màu bóng mờ đổ dưới chân các đường đồ thị */}
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
                
                {/* Lưới đồ thị nét đứt */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                {/* Trục X hiển thị Mốc thời gian */}
                <XAxis dataKey="time" axisLine={false} tickLine={false} minTickGap={15} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                
                {/* Trục Y cho Nhiệt độ (°C) nằm bên TẬP TRÁI */}
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

                {/* Trục Y cho Độ ẩm (%) nằm bên TẬP PHẢI */}
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

                {/* Trục Y ẩn cho Ánh sáng (Lx) */}
                <YAxis
                  yAxisId="light"
                  hide={true}
                  domain={lightDomain}
                />

                {/* Khung chú thích thông số khi di chuột vào */}
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    border: '1px solid #f1f5f9', 
                    fontSize: '12px', 
                    boxShadow: '0 8px 12px -3px rgba(0,0,0,0.08)' }}
                />
                
                {/* Chú thích màu sắc tên đường đồ thị (Legend) */}
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  iconType="line"
                />

                {/* 3 Đường Sóng */}
                <Area
                  yAxisId="hum"
                  name="Độ ẩm (%)"
                  type="natural"
                  dataKey="humidity"
                  // Màu sắc đường đồ thị
                  stroke={SENSOR_COLORS.humidity.hex}
                  strokeWidth={2.5}
                  fill="url(#humGradient)"
                  dot={false}
                  // Tạo chấm tròn khi di chuột vào 
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
                  // Tạo chấm tròn khi di chuột vào 
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

        {/* 6.4. KHỐI NÚT ĐIỀU KHIỂN THIẾT BỊ (CONTROL DEVICES SECTION) */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 mb-3">Thiết bị điều khiển</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => {
              const isOn = device.state === 'ON';
              const isLoading = controlling[device.id];

              return (
                <div
                  key={device.id}
                  className={`p-4.5 rounded-2xl transition-all duration-300 flex items-center justify-between shadow-sm ${
                    isLoading
                      ? 'bg-amber-50/60 border-2 border-amber-300 ring-2 ring-amber-300/20 animate-pulse'
                      : isOn
                      ? 'bg-white border-2 border-blue-500 ring-2 ring-blue-500/10'
                      : 'bg-white border border-slate-100'
                  }`}
                >
                  {/* Tên và Trạng thái thiết bị */}
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{device.name}</h3>
                    <p
                      className={`text-[11px] font-bold tracking-wider mt-1 flex items-center ${
                        isLoading
                          ? 'text-amber-600'
                          : isOn
                          ? 'text-blue-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin mr-1 h-3 w-3 text-amber-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{isOn ? 'ĐANG TẮT...' : 'ĐANG BẬT...'}</span>
                        </>
                      ) : isOn ? (
                        'ĐANG HOẠT ĐỘNG'
                      ) : (
                        'ĐANG TẮT'
                      )}
                    </p>
                  </div>

                  {/* Nút bấm Công tắc Gạt (Toggle Switch Button) */}
                  <button
                    onClick={() => handleToggleDevice(device)}
                    disabled={isLoading}
                    className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                      isLoading
                        ? 'bg-amber-300 justify-center cursor-wait'
                        : isOn
                        ? 'bg-blue-500 justify-end cursor-pointer'
                        : 'bg-slate-200 justify-start cursor-pointer'
                    }`}
                  >
                    <div className="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center">
                      {isLoading && (
                        <svg className="animate-spin h-3.5 w-3.5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                    </div>
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
