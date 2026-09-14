import React, { useState } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';

function SortHeader({ title, sortKey, sortConfig, onSort, alignRight = false, className = '' }) {
  const isActive = sortConfig.key === sortKey;
  const isAsc = isActive && sortConfig.direction === 'asc';
  const isDesc = isActive && sortConfig.direction === 'desc';

  return (
    <th
      onClick={(e) => {
        e.preventDefault();
        onSort(sortKey);
      }}
      className={`py-2 px-4 cursor-pointer select-none hover:bg-slate-100/70 transition-colors group ${
        alignRight ? 'text-right' : 'text-left'
      } ${className}`}
      title={`Sắp xếp theo ${title}`}
    >
      <div className={`inline-flex items-center space-x-1 ${alignRight ? 'justify-end w-full' : ''}`}>
        <span className={`transition-colors ${isActive ? 'text-blue-600 font-extrabold' : 'group-hover:text-slate-700'}`}>
          {title}
        </span>
        <div className="flex flex-col items-center justify-center space-y-[-3px] ml-1">
          <svg
            className={`w-2.5 h-2.5 ${
              isAsc ? 'text-blue-600 font-extrabold scale-110' : 'text-slate-300 group-hover:text-slate-400'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
          <svg
            className={`w-2.5 h-2.5 ${
              isDesc ? 'text-blue-600 font-extrabold scale-110' : 'text-slate-300 group-hover:text-slate-400'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </th>
  );
}

export default function DeviceHistory() {
  const { deviceHistoryCache, fetchDeviceHistory } = useData();

  const [filters, setFilters] = useState({
    device_id: '',
    action: '',
    status: '',
    time: ''
  });

  const PAGE_LIMIT = 10;
  const data = deviceHistoryCache.data;
  const pagination = deviceHistoryCache.pagination;

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDeviceHistory(1, filters);
  };

  const handleReset = () => {
    const empty = { device_id: '', action: '', status: '', time: '' };
    setFilters(empty);
    fetchDeviceHistory(1, empty);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchDeviceHistory(newPage, filters);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${dateStr} ${timeStr}`;
    } catch {
      return ts;
    }
  };

  const renderActionBadge = (actionStr) => {
    const isON = actionStr === 'TURN_ON' || actionStr === 'ON';
    return (
      <span
        className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider ${
          isON
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-800 text-white'
        }`}
      >
        {isON ? 'ON' : 'OFF'}
      </span>
    );
  };

  const renderStatusBadge = (statusStr) => {
    const isSuccess = statusStr === 'SUCCESS' || statusStr === 'SUCCESSFUL';
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          isSuccess
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-rose-50 text-rose-600'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
        {isSuccess ? 'Thành công' : 'Thất bại'}
      </span>
    );
  };

  const [sortConfig, setSortConfig] = useState({ key: '', direction: null });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'desc') return { key, direction: 'asc' };
        if (prev.direction === 'asc') return { key: '', direction: null };
        return { key, direction: 'desc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'device_id') {
        aVal = parseInt(aVal, 10) || 0;
        bVal = parseInt(bVal, 10) || 0;
      } else if (sortConfig.key === 'device_name') {
        aVal = (a.device_name || `Thiết bị ${a.device_id}`).toLowerCase();
        bVal = (b.device_name || `Thiết bị ${b.device_id}`).toLowerCase();
      } else if (sortConfig.key === 'created_at') {
        aVal = new Date(aVal).getTime() || 0;
        bVal = new Date(bVal).getTime() || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const startRecord = (pagination.current_page - 1) * PAGE_LIMIT + (data.length > 0 ? 1 : 0);
  const endRecord = (pagination.current_page - 1) * PAGE_LIMIT + data.length;

  return (
    <div className="h-full p-5 overflow-y-auto flex flex-col justify-between">
      <div>
        <Header title="Lịch Sử Thiết Bị" subtitle="Bản ghi chi tiết các hành động bật/tắt thiết bị" />

        {/* Compact Search & Filter Form Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">ID</label>
                <input
                  type="text"
                  placeholder="Nhập ID"
                  value={filters.device_id}
                  onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Thiết bị</label>
                <select
                  value={filters.device_id}
                  onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
                >
                  <option value="">Chọn thiết bị</option>
                  <option value="1">Đèn 1</option>
                  <option value="2">Đèn 2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Hành động</label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
                >
                  <option value="">Chọn hành động</option>
                  <option value="TURN_ON">TURN_ON</option>
                  <option value="TURN_OFF">TURN_OFF</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Trạng thái</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="FAILED">Thất bại</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Thời gian</label>
                <input
                  type="text"
                  placeholder="yyyy/mm/dd hh:mm:ss"
                  value={filters.time}
                  onChange={(e) => setFilters({ ...filters, time: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400 transition-all font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 justify-end">
                <button
                  type="submit"
                  className="flex-1 md:flex-none bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-1.5 rounded-xl shadow-sm text-xs transition-all cursor-pointer"
                >
                  Tìm kiếm
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 10-Row Table Card (No Icons) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-50/50">
                  <SortHeader title="Device ID" sortKey="device_id" sortConfig={sortConfig} onSort={handleSort} className="w-[15%]" />
                  <SortHeader title="Tên Thiết bị" sortKey="device_name" sortConfig={sortConfig} onSort={handleSort} className="w-[25%]" />
                  <SortHeader title="Hành động" sortKey="action" sortConfig={sortConfig} onSort={handleSort} className="w-[20%]" />
                  <SortHeader title="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} className="w-[20%]" />
                  <SortHeader title="Thời gian" sortKey="created_at" sortConfig={sortConfig} onSort={handleSort} alignRight={true} className="w-[20%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400">
                      Không có lịch sử thao tác nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/70">
                      <td className="py-[7px] px-4 font-mono text-slate-600 truncate">{row.device_id}</td>
                      <td className="py-[7px] px-4 font-bold text-slate-800 truncate">{row.device_name || `Thiết bị ${row.device_id}`}</td>
                      <td className="py-[7px] px-4 truncate">{renderActionBadge(row.action)}</td>
                      <td className="py-[7px] px-4 truncate">{renderStatusBadge(row.status)}</td>
                      <td className="py-[7px] px-4 text-right font-mono text-[11px] text-slate-500 truncate">
                        {formatTimestamp(row.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination (Text Buttons) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 p-2 px-4 border-t border-slate-100 text-[11px] text-slate-500">
            <div>
              Hiển thị <span className="font-semibold text-slate-700">{startRecord}-{endRecord}</span> trong số <span className="font-semibold text-slate-700">{pagination.total_records}</span> dòng
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className="px-2 py-0.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-semibold text-[11px]"
              >
                Trước
              </button>

              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-6 h-6 rounded-md font-semibold text-[11px] transition-all ${
                      pagination.current_page === p
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages}
                className="px-2 py-0.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-semibold text-[11px]"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
