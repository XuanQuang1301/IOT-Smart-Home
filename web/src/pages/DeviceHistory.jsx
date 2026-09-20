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
      className={`py-2 px-4 cursor-pointer select-none hover:bg-slate-100/80 group ${
        alignRight ? 'text-right' : 'text-left'
      } ${className}`}
      title={`Sắp xếp theo ${title}`}
    >
      <div className={`inline-flex items-center space-x-1 ${alignRight ? 'justify-end w-full' : ''}`}>
        <span className={`${isActive ? 'text-blue-600 font-extrabold' : 'group-hover:text-slate-700'}`}>
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

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState('');
  const [pickerTime, setPickerTime] = useState('');
  const pickerContainerRef = React.useRef(null);

  // Sync picker inputs with filters.time
  React.useEffect(() => {
    if (filters.time) {
      const parts = filters.time.trim().split(' ');
      if (parts[0] && parts[0].includes('-')) {
        setPickerDate(parts[0]);
        setPickerTime(parts[1] || '');
      } else if (parts[0] && parts[0].includes(':')) {
        setPickerDate('');
        setPickerTime(parts[0]);
      } else {
        setPickerDate(parts[0] || '');
        setPickerTime('');
      }
    } else {
      setPickerDate('');
      setPickerTime('');
    }
  }, [filters.time]);

  // Close popover on click outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(e.target)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const limit = deviceHistoryCache.limit || 10;
  const loading = deviceHistoryCache.loading || false;
  const data = deviceHistoryCache.data || [];
  const pagination = deviceHistoryCache.pagination || { current_page: 1, total_pages: 1, total_records: 0 };
  const activeFilters = deviceHistoryCache.appliedFilters || filters;

  const handleLimitChange = (newLimit) => {
    fetchDeviceHistory(1, activeFilters, newLimit);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowTimePicker(false);

    let searchTime = filters.time;
    if (pickerDate || pickerTime) {
      if (pickerDate && pickerTime) {
        searchTime = `${pickerDate} ${pickerTime}`;
      } else if (pickerDate) {
        searchTime = pickerDate;
      } else if (pickerTime) {
        searchTime = pickerTime;
      }
    }

    const updatedFilters = { ...filters, time: searchTime };
    setFilters(updatedFilters);
    fetchDeviceHistory(1, updatedFilters, limit);
  };

  const handleReset = () => {
    const empty = { device_id: '', action: '', status: '', time: '' };
    setFilters(empty);
    setPickerDate('');
    setPickerTime('');
    setShowTimePicker(false);
    fetchDeviceHistory(1, empty, limit);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchDeviceHistory(newPage, activeFilters, limit);
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

  const onCount = React.useMemo(() => {
    return data.filter((d) => d.action === 'TURN_ON').length;
  }, [data]);

  const offCount = React.useMemo(() => {
    return data.filter((d) => d.action === 'TURN_OFF').length;
  }, [data]);

  const startRecord = (pagination.current_page - 1) * limit + (data.length > 0 ? 1 : 0);
  const endRecord = (pagination.current_page - 1) * limit + data.length;

  return (
    <div className="h-full p-5 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-none">
        <Header title="Lịch Sử Thiết Bị" subtitle="Bản ghi chi tiết các hành động bật/tắt thiết bị" />
      </div>

      {/* Compact Search & Filter Form Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm mb-3 flex-none">
        <form onSubmit={handleSearch}>
          {/* Single Row Layout: ID (w-28) | Thiết bị (w-32) | Hành động (w-32) | Trạng thái (w-32) | Thời gian (flex-1) | Counters & Buttons */}
          <div className="flex flex-wrap items-end gap-2.5">
            {/* ID */}
            <div className="w-full sm:w-28 shrink-0">
              <label className="block text-xs font-bold text-slate-900 mb-1">ID</label>
              <input
                type="text"
                placeholder="Nhập ID"
                value={filters.device_id}
                onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400 transition-all font-mono"
              />
            </div>

            {/* Thiết bị */}
            <div className="w-full sm:w-32 shrink-0">
              <label className="block text-xs font-bold text-slate-900 mb-1">Thiết bị</label>
              <select
                value={filters.device_id}
                onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all cursor-pointer"
              >
                <option value="">Chọn thiết bị</option>
                <option value="1">Đèn 1</option>
                <option value="2">Đèn 2</option>
              </select>
            </div>

            {/* Hành động */}
            <div className="w-full sm:w-32 shrink-0">
              <label className="block text-xs font-bold text-slate-900 mb-1">Hành động</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all cursor-pointer"
              >
                <option value="">Chọn hành động</option>
                <option value="TURN_ON">TURN_ON</option>
                <option value="TURN_OFF">TURN_OFF</option>
              </select>
            </div>

            {/* Trạng thái */}
            <div className="w-full sm:w-32 shrink-0">
              <label className="block text-xs font-bold text-slate-900 mb-1">Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all cursor-pointer"
              >
                <option value="">Chọn trạng thái</option>
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Thất bại</option>
              </select>
            </div>

            {/* Thời gian */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-900 mb-1">Thời gian</label>
              <div className="relative flex items-center space-x-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD HH:mm:ss"
                    value={filters.time}
                    onChange={(e) => setFilters({ ...filters, time: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-7 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400 transition-all font-mono"
                  />
                  {filters.time && (
                    <button
                      type="button"
                      onClick={() => setFilters({ ...filters, time: '' })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs font-bold cursor-pointer"
                      title="Xóa thời gian"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Single Calendar Dropdown Button */}
                <div className="relative" ref={pickerContainerRef}>
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-xl border border-blue-200 text-xs transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shadow-sm"
                    title="Chọn ngày và giờ"
                  >
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Chọn Lịch</span>
                  </button>

                  {/* Popover Panel Stacked Vertically with Compact Max-Height & Scroll */}
                  {showTimePicker && (
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 flex flex-col space-y-3 max-h-60 overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-800">Chọn Ngày & Giờ</span>
                        <button
                          type="button"
                          onClick={() => setShowTimePicker(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* 1. Date Input on Top */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          1. Ngày <span className="text-slate-400 font-normal">(Bắt buộc)</span>
                        </label>
                        <input
                          type="date"
                          value={pickerDate}
                          onChange={(e) => setPickerDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                        />
                      </div>

                      {/* 2. Single 24h Time Input (HH:mm:ss) Underneath */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          2. Giờ phút giây (24h) <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
                        </label>
                        <input
                          type="time"
                          step="1"
                          lang="en-GB"
                          value={pickerTime}
                          onChange={(e) => setPickerTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white font-mono cursor-pointer"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setPickerDate('');
                            setPickerTime('');
                            setFilters({ ...filters, time: '' });
                            setShowTimePicker(false);
                          }}
                          className="text-xs text-rose-500 font-semibold hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            let combined = '';
                            if (pickerDate && pickerTime) {
                              combined = `${pickerDate} ${pickerTime}`;
                            } else if (pickerDate) {
                              combined = pickerDate;
                            } else if (pickerTime) {
                              combined = pickerTime;
                            }

                            setFilters({ ...filters, time: combined });
                            setShowTimePicker(false);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                        >
                          Áp dụng
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column on Right: Counters on top of Search & Reset buttons */}
            <div className="flex flex-col justify-end space-y-1 shrink-0 ml-auto">
              <div className="flex items-center space-x-1.5 justify-end">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg text-[10px] font-bold shadow-2xs whitespace-nowrap">
                  Số lần bật: <span className="font-black text-emerald-800 text-xs ml-0.5">{onCount}</span>
                </span>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-lg text-[10px] font-bold shadow-2xs whitespace-nowrap">
                  Số lần tắt: <span className="font-black text-rose-800 text-xs ml-0.5">{offCount}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2 justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-4 py-1 rounded-xl shadow-sm text-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Tìm kiếm
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 font-bold px-3 py-1 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Đặt lại
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Table Card with Scrollable Body & Instant Reorder */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className={`flex-1 overflow-y-auto min-h-0 transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100 shadow-sm">
              <tr className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                <SortHeader title="Device ID" sortKey="device_id" sortConfig={sortConfig} onSort={handleSort} className="w-[15%]" />
                <th className="py-2 px-4 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none w-[25%]">
                  TÊN THIẾT BỊ
                </th>
                <th className="py-2 px-4 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none w-[20%]">
                  HÀNH ĐỘNG
                </th>
                <th className="py-2 px-4 text-left text-[10px] font-bold tracking-wider text-slate-400 uppercase select-none w-[20%]">
                  TRẠNG THÁI
                </th>
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
                  <tr key={row.id ? `device-${row.id}` : `dev-idx-${idx}`} className="hover:bg-slate-50/70">
                    <td className="py-2 px-4 font-mono text-slate-600 truncate">{row.device_id}</td>
                    <td className="py-2 px-4 font-bold text-slate-800 truncate">{row.device_name || `Thiết bị ${row.device_id}`}</td>
                    <td className="py-2 px-4 truncate">{renderActionBadge(row.action)}</td>
                    <td className="py-2 px-4 truncate">{renderStatusBadge(row.status)}</td>
                    <td className="py-2 px-4 text-right font-mono text-[11px] text-slate-500 truncate">
                      {formatTimestamp(row.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Page Limit Selector and Pagination */}
        <div className="flex-none p-2.5 px-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 bg-white">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-slate-500">Hiển thị</span>
            <select
              value={limit}
              disabled={loading}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 font-bold rounded-lg px-2 py-0.5 text-[11px] focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={40}>40</option>
            </select>
            <span className="font-medium text-slate-500">
              dòng/trang <span className="text-slate-400">({startRecord}-{endRecord} trong số <strong className="text-slate-700 font-semibold">{pagination.total_records}</strong> dòng)</span>
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={loading || pagination.current_page <= 1}
              className="px-2 py-0.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-semibold text-[11px]"
            >
              Trước
            </button>

            {(() => {
              const current = pagination.current_page;
              const total = pagination.total_pages;
              let start = Math.max(1, current - 2);
              let end = Math.min(total, start + 4);
              if (end - start < 4) {
                start = Math.max(1, end - 4);
              }
              const pages = [];
              for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= total) pages.push(i);
              }
              return pages.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  disabled={loading}
                  className={`w-6 h-6 rounded-md font-semibold text-[11px] transition-all disabled:opacity-50 ${
                    pagination.current_page === p
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ));
            })()}

            <button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={loading || pagination.current_page >= pagination.total_pages}
              className="px-2 py-0.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-semibold text-[11px]"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
