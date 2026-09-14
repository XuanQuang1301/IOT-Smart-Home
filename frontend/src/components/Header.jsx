import React, { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';

export default function Header({ title = 'Hệ Thống IoT', subtitle = 'Theo dõi và điều khiển thiết bị thời gian thực' }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3 self-end md:self-auto">
        {/* Clock Pill */}
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm text-xs font-mono text-slate-600">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>{timeStr || '14:32:05'}</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm text-xs font-semibold text-slate-700">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
            <User className="w-3 h-3" />
          </div>
          <span>Xuân Quang</span>
        </div>
      </div>
    </header>
  );
}
