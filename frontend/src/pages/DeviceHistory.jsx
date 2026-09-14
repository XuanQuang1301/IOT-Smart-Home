import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/v1';

export default function DeviceHistory() {
  const [filters, setFilters] = useState({
    device_id: '',
    action: '',
    status: '',
    time: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    device_id: '',
    action: '',
    status: '',
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
        ...(appliedFilters.device_id && { device_id: appliedFilters.device_id }),
        ...(appliedFilters.action && { action: appliedFilters.action }),
        ...(appliedFilters.status && { status: appliedFilters.status }),
        ...(appliedFilters.time && { time: appliedFilters.time })
      };

      const res = await axios.get(`${API_BASE}/actions/history`, { params });
      if (res.data) {
        setData(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching action history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    const empty = { device_id: '', action: '', status: '', time: '' };
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

  const renderActionBadge = (actionStr) => {
    const isON = actionStr === 'TURN_ON' || actionStr === 'ON';
    return (
      <span
        className={`px-3 py-1 rounded-md text-xs font-bold font-mono tracking-wider ${
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
          isSuccess
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-rose-50 text-rose-600'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
        {isSuccess ? 'Thành công' : 'Thất bại'}
      </span>
    );
  };

  const startRecord = (pagination.current_page - 1) * 8 + (data.length > 0 ? 1 : 0);
  const endRecord = (pagination.current_page - 1) * 8 + data.length;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <Header title="Lịch Sử Thiết Bị" subtitle="Bản ghi chi tiết các hành động bật/tắt thiết bị" />

      {/* Search & Filter Form Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">ID</label>
              <input
                type="text"
                placeholder="Nhập ID"
                value={filters.device_id}
                onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Thiết bị</label>
              <select
                value={filters.device_id}
                onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Chọn thiết bị</option>
                <option value="1">Đèn 1</option>
                <option value="2">Đèn 2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hành động</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Chọn hành động</option>
                <option value="TURN_ON">TURN_ON</option>
                <option value="TURN_OFF">TURN_OFF</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Chọn trạng thái</option>
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Thất bại</option>
              </select>
            </div>

            <div>
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
                <th className="py-4 px-6">Device ID</th>
                <th className="py-4 px-6">Tên Thiết bị</th>
                <th className="py-4 px-6">Hành động</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Đang tải danh sách lịch sử...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Không có lịch sử thao tác nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-600">{row.device_id}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{row.device_name || `Thiết bị ${row.device_id}`}</td>
                    <td className="py-4 px-6">{renderActionBadge(row.action)}</td>
                    <td className="py-4 px-6">{renderStatusBadge(row.status)}</td>
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
