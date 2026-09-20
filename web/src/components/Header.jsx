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
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3 self-end md:self-auto">
        {/* Realtime Clock Pill */}
        <div className="bg-white px-3.5 py-1.5 rounded-full border border-slate-100 shadow-sm text-xs font-mono text-slate-600 font-semibold flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
          <span>{timeStr || 'Đang tải...'}</span>
        </div>

        {/* User Pill */}
        <div className="bg-white px-3.5 py-1.5 rounded-full border border-slate-100 shadow-sm text-xs font-semibold text-slate-700">
          Xuân Quang
        </div>
      </div>
    </header>
  );
}
