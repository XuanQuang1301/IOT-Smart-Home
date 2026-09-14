import React, { useState } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

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

  const startRecord = (pagination.current_page - 1) * PAGE_LIMIT + (data.length > 0 ? 1 : 0);
  const endRecord = (pagination.current_page - 1) * PAGE_LIMIT + data.length;

  return (
    <div className="flex-1 p-5 overflow-y-auto max-h-screen flex flex-col justify-between">
      <div>
        <Header title="Lịch Sử Cảm Biến" subtitle="Tra cứu dữ liệu đo đạc chi tiết của hệ thống" />

        {/* Compact Search & Filter Form Card */}
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mb-3">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">SensorID</label>
                <input
                  type="text"
                  placeholder="Nhập SensorID"
                  value={filters.sensor_id}
                  onChange={(e) => setFilters({ ...filters, sensor_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Loại cảm biến</label>
                <select
                  value={filters.sensor_type}
                  onChange={(e) => setFilters({ ...filters, sensor_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Chọn loại cảm biến</option>
                  <option value="TEMPERATURE">Nhiệt độ</option>
                  <option value="HUMIDITY">Độ ẩm</option>
                  <option value="LIGHT">Ánh sáng</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Giá trị</label>
                <input
                  type="text"
                  placeholder="Nhập giá trị"
                  value={filters.value}
                  onChange={(e) => setFilters({ ...filters, value: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Thời gian</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy hh:mm:ss"
                  value={filters.time}
                  onChange={(e) => setFilters({ ...filters, time: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 justify-end">
                <button
                  type="submit"
                  className="flex-1 md:flex-none flex items-center justify-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1 rounded-lg shadow-sm text-xs transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tìm kiếm</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center space-x-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold px-3 py-1 rounded-lg text-xs transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 10-Row Table Card (Zero-flicker static rendering) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-50/50">
                  <th className="py-1.5 px-4">SENSOR ID</th>
                  <th className="py-1.5 px-4">Loại cảm biến</th>
                  <th className="py-1.5 px-4">Giá trị</th>
                  <th className="py-1.5 px-4 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      Không có lịch sử cảm biến nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-[7px] px-4 font-mono text-slate-600">{row.sensor_id}</td>
                      <td className="py-[7px] px-4">{renderBadge(row.sensor_type || row.name)}</td>
                      <td className="py-[7px] px-4 font-bold text-slate-800">
                        {row.value} <span className="font-normal text-slate-500 text-[10px]">{row.unit}</span>
                      </td>
                      <td className="py-[7px] px-4 text-right font-mono text-[11px] text-slate-500">
                        {formatTimestamp(row.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 p-2 px-4 border-t border-slate-100 text-[11px] text-slate-500">
            <div>
              Hiển thị <span className="font-semibold text-slate-700">{startRecord}-{endRecord}</span> trong số <span className="font-semibold text-slate-700">{pagination.total_records}</span> dòng
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className="p-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
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
                className="p-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
