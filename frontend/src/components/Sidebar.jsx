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
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6 shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-8 pl-1">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-snug tracking-tight">CONTRA IoT</h1>
            <p className="text-[11px] font-semibold text-blue-500 tracking-wider">SYSTEM V1.0</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-600 font-semibold border border-blue-100 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Live Status Footer */}
      <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400 font-medium">Trạng thái</span>
          <span className="flex items-center text-emerald-500 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            LIVE
          </span>
        </div>
        <div className="font-mono text-xs font-semibold text-slate-700 mt-1 tracking-wide">
          {ipAddress}
        </div>
      </div>
    </aside>
  );
}
