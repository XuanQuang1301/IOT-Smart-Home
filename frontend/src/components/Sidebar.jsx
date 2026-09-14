import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Clock, ListFilter, User, Cpu } from 'lucide-react';

export default function Sidebar({ isLive = true, ipAddress = '192.168.1.105' }) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/sensor-history', label: 'Lịch sử cảm biến', icon: Clock },
    { path: '/device-history', label: 'Lịch sử thiết bị', icon: ListFilter },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-100 flex flex-col justify-between p-5 shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6 pl-1">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base leading-snug tracking-tight">CONTRA IoT</h1>
            <p className="text-[10px] font-semibold text-blue-500 tracking-wider">SYSTEM V1.0</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-600 font-semibold border border-blue-100 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Live Status Footer */}
      <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
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
