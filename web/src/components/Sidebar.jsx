import React from 'react';

export default function Sidebar({ activeTab = '/', onTabChange, ipAddress = '192.168.1.105' }) {
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/sensor-history', label: 'Lịch sử cảm biến' },
    { path: '/device-history', label: 'Lịch sử thiết bị' },
    { path: '/profile', label: 'Profile' },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-100 flex flex-col justify-between p-5 shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="mb-6 pl-1">
          <h1 className="font-bold text-slate-800 text-base leading-snug tracking-tight">Smart Home</h1>
          <p className="text-[10px] font-semibold text-blue-500 tracking-wider mt-0.5">SYSTEM V1.0</p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onTabChange && onTabChange(item.path)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs cursor-pointer font-bold select-none transition-none ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Live Status Footer */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
        <div className="flex items-center justify-between text-[11px] mb-0.5">
          <span className="text-slate-400 font-medium">Trạng thái</span>
          <span className="flex items-center text-emerald-500 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
            LIVE
          </span>
        </div>
        <div className="font-mono text-xs font-semibold text-slate-700 mt-0.5 tracking-wide">
          {ipAddress}
        </div>
      </div>
    </aside>
  );
}
