import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function SensorHistory() {
  const [filters, setFilters] = useState({
    sensor_id: '',
    sensor_type: '',
    value: '',
    time: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    sensor_id: '',
    sensor_type: '',
    value: '',
    time: ''
  });

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_records: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory(1);
  }, [appliedFilters]);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        ...(appliedFilters.sensor_id && { sensor_id: appliedFilters.sensor_id }),
        ...(appliedFilters.sensor_type && { sensor_type: appliedFilters.sensor_type }),
        ...(appliedFilters.value && { value: appliedFilters.value }),
        ...(appliedFilters.time && { time: appliedFilters.time })
      };

      const res = await axios.get(`${API_BASE}/sensor/history`, { params });
      if (res.data) {
        setData(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching sensor history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    const empty = { sensor_id: '', sensor_type: '', value: '', time: '' };
    setFilters(empty);
    setAppliedFilters(empty);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchHistory(newPage);
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
        return <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-semibold">Nhiệt độ</span>;
      case 'HUMIDITY':
      case 'Độ ẩm':
        return <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">Độ ẩm</span>;
      case 'LIGHT':
      case 'Ánh sáng':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">Ánh sáng</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">{sensorType}</span>;
    }
  };

  const startRecord = (pagination.current_page - 1) * 8 + (data.length > 0 ? 1 : 0);
  const endRecord = (pagination.current_page - 1) * 8 + data.length;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <Header title="Lịch Sử Cảm Biến" subtitle="Tra cứu dữ liệu đo đạc chi tiết của hệ thống" />

      {/* Search & Filter Form Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">SensorID</label>
              <input
                type="text"
                placeholder="Nhập SensorID"
                value={filters.sensor_id}
                onChange={(e) => setFilters({ ...filters, sensor_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Loại cảm biến</label>
              <select
                value={filters.sensor_type}
                onChange={(e) => setFilters({ ...filters, sensor_type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Chọn loại cảm biến</option>
                <option value="TEMPERATURE">Nhiệt độ</option>
                <option value="HUMIDITY">Độ ẩm</option>
                <option value="LIGHT">Ánh sáng</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Giá trị</label>
              <input
                type="text"
                placeholder="Nhập giá trị"
                value={filters.value}
                onChange={(e) => setFilters({ ...filters, value: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Thời gian</label>
              <input
                type="text"
                placeholder="dd/mm/yyyy hh:mm:ss"
                value={filters.time}
                onChange={(e) => setFilters({ ...filters, time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex items-center space-x-3 justify-end">
              <button
                type="submit"
                className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 text-sm transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Tìm kiếm</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center space-x-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* History Data Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold tracking-wider text-slate-400 uppercase bg-slate-50/50">
                <th className="py-4 px-6">SENSOR ID</th>
                <th className="py-4 px-6">Loại cảm biến</th>
                <th className="py-4 px-6">Giá trị</th>
                <th className="py-4 px-6 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400">
                    Không có lịch sử cảm biến nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-600">{row.sensor_id}</td>
                    <td className="py-4 px-6">{renderBadge(row.sensor_type || row.name)}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {row.value} <span className="font-normal text-slate-500 text-xs">{row.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-xs text-slate-500">
                      {formatTimestamp(row.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 px-6 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-700">{startRecord}-{endRecord}</span> trong số <span className="font-semibold text-slate-700">{pagination.total_records}</span> dòng
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg font-semibold transition-all ${
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
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
