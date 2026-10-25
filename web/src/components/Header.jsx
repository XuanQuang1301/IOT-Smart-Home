import React, { useState, useEffect } from 'react';

export default function Header({ title = 'Hệ Thống IoT', subtitle = 'Theo dõi và điều khiển thiết bị thời gian thực' }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('vi-VN', { hour12: false });
      const date = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      setTimeStr(`${time} - ${date}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex flex-row items-center justify-between gap-2 mb-2">
      <div>
        <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-2">
        {/* Realtime Clock Pill */}
        <div className="bg-white px-3 py-1 rounded-full border border-slate-100 shadow-xs text-[11px] font-mono text-slate-600 font-semibold flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
          <span>{timeStr || 'Đang tải...'}</span>
        </div>
      </div>
    </header>
  );
}
