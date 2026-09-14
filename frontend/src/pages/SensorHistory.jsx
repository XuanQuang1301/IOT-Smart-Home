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

export default function SensorHistory() {
  const { sensorHistoryCache, fetchSensorHistory } = useData();

  const [filters, setFilters] = useState({
    sensor_id: '',
    sensor_type: '',
    value: '',
    time: ''
  });

  const PAGE_LIMIT = 10;
  const data = sensorHistoryCache.data;
  const pagination = sensorHistoryCache.pagination;

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSensorHistory(1, filters);
  };

  const handleReset = () => {
    const empty = { sensor_id: '', sensor_type: '', value: '', time: '' };
    setFilters(empty);
    fetchSensorHistory(1, empty);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchSensorHistory(newPage, filters);
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

  const renderBadge = (sensorType) => {
    switch (sensorType) {
      case 'TEMPERATURE':
      case 'Nhiệt độ':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[11px] font-semibold">Nhiệt độ</span>;
      case 'HUMIDITY':
      case 'Độ ẩm':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-semibold">Độ ẩm</span>;
      case 'LIGHT':
      case 'Ánh sáng':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-semibold">Ánh sáng</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-semibold">{sensorType}</span>;
    }
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

      if (sortConfig.key === 'value') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (sortConfig.key === 'created_at') {
        aVal = new Date(aVal).getTime() || 0;
        bVal = new Date(bVal).getTime() || 0;
      } else if (sortConfig.key === 'sensor_type') {
        aVal = (a.sensor_type || a.name || '').toString().toLowerCase();
        bVal = (b.sensor_type || b.name || '').toString().toLowerCase();
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
        <Header title="Lịch Sử Cảm Biến" subtitle="Tra cứu dữ liệu đo đạc chi tiết của hệ thống" />

        {/* Compact Search & Filter Form Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">SensorID</label>
                <input
                  type="text"
                  placeholder="Nhập SensorID"
                  value={filters.sensor_id}
                  onChange={(e) => setFilters({ ...filters, sensor_id: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Loại cảm biến</label>
                <select
                  value={filters.sensor_type}
                  onChange={(e) => setFilters({ ...filters, sensor_type: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
                >
                  <option value="">Chọn loại cảm biến</option>
                  <option value="TEMPERATURE">Nhiệt độ</option>
                  <option value="HUMIDITY">Độ ẩm</option>
                  <option value="LIGHT">Ánh sáng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Giá trị</label>
                <input
                  type="text"
                  placeholder="Nhập giá trị"
                  value={filters.value}
                  onChange={(e) => setFilters({ ...filters, value: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2">
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
                  <SortHeader title="SENSOR ID" sortKey="sensor_id" sortConfig={sortConfig} onSort={handleSort} className="w-[20%]" />
                  <SortHeader title="Loại cảm biến" sortKey="sensor_type" sortConfig={sortConfig} onSort={handleSort} className="w-[25%]" />
                  <SortHeader title="Giá trị" sortKey="value" sortConfig={sortConfig} onSort={handleSort} className="w-[25%]" />
                  <SortHeader title="Thời gian" sortKey="created_at" sortConfig={sortConfig} onSort={handleSort} alignRight={true} className="w-[30%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      Không có lịch sử cảm biến nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/70">
                      <td className="py-[7px] px-4 font-mono text-slate-600 truncate">{row.sensor_id}</td>
                      <td className="py-[7px] px-4 truncate">{renderBadge(row.sensor_type || row.name)}</td>
                      <td className="py-[7px] px-4 font-bold text-slate-800 truncate">
                        {row.value} <span className="font-normal text-slate-500 text-[10px]">{row.unit}</span>
                      </td>
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
