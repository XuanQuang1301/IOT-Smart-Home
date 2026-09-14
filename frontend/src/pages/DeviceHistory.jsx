import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { Search, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

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
  const [fetching, setFetching] = useState(false);

  const PAGE_LIMIT = 8;

  useEffect(() => {
    fetchHistory(1);
  }, [appliedFilters]);

  const fetchHistory = async (page = 1) => {
    setFetching(true);
    try {
      const params = {
        page,
        limit: PAGE_LIMIT,
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
      setFetching(false);
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
        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-wider ${
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
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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

  const startRecord = (pagination.current_page - 1) * PAGE_LIMIT + (data.length > 0 ? 1 : 0);
  const endRecord = (pagination.current_page - 1) * PAGE_LIMIT + data.length;

  return (
    <div className="flex-1 p-5 overflow-y-auto max-h-screen flex flex-col justify-between animate-fade-in">
      <div>
        <Header title="Lịch Sử Thiết Bị" subtitle="Bản ghi chi tiết các hành động bật/tắt thiết bị" />

        {/* Compact Search & Filter Form Card */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm mb-3">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">ID</label>
                <input
                  type="text"
                  placeholder="Nhập ID"
                  value={filters.device_id}
                  onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Thiết bị</label>
                <select
                  value={filters.device_id}
                  onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Chọn thiết bị</option>
                  <option value="1">Đèn 1</option>
                  <option value="2">Đèn 2</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Hành động</label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Chọn hành động</option>
                  <option value="TURN_ON">TURN_ON</option>
                  <option value="TURN_OFF">TURN_OFF</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-end">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Trạng thái</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="FAILED">Thất bại</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Thời gian</label>
                <input
                  type="text"
                  placeholder="dd/mm/yyyy hh:mm:ss"
                  value={filters.time}
                  onChange={(e) => setFilters({ ...filters, time: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 justify-end">
                <button
                  type="submit"
                  className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1.5 rounded-xl shadow-sm text-xs transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tìm kiếm</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center space-x-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold px-3 py-1.5 rounded-xl text-xs transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* History Data Table Card (8 records per page - fits 100% inside viewport) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
          {fetching && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500 animate-pulse z-10"></div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-50/50">
                  <th className="py-2 px-4">Device ID</th>
                  <th className="py-2 px-4">Tên Thiết bị</th>
                  <th className="py-2 px-4">Hành động</th>
                  <th className="py-2 px-4">Trạng thái</th>
                  <th className="py-2 px-4 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-100 text-xs font-medium text-slate-700 transition-opacity duration-200 ${fetching ? 'opacity-60' : 'opacity-100'}`}>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      {fetching ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          <span>Đang tải danh sách lịch sử...</span>
                        </div>
                      ) : (
                        'Không có lịch sử thao tác nào phù hợp với bộ lọc.'
                      )}
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-4 font-mono text-slate-600">{row.device_id}</td>
                      <td className="py-2 px-4 font-bold text-slate-800">{row.device_name || `Thiết bị ${row.device_id}`}</td>
                      <td className="py-2 px-4">{renderActionBadge(row.action)}</td>
                      <td className="py-2 px-4">{renderStatusBadge(row.status)}</td>
                      <td className="py-2 px-4 text-right font-mono text-[11px] text-slate-500">
                        {formatTimestamp(row.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 px-4 border-t border-slate-100 text-[11px] text-slate-500">
            <div>
              Hiển thị <span className="font-semibold text-slate-700">{startRecord}-{endRecord}</span> trong số <span className="font-semibold text-slate-700">{pagination.total_records}</span> dòng
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1 || fetching}
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
                    className={`w-6.5 h-6.5 rounded-md font-semibold text-[11px] transition-all ${
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
                disabled={pagination.current_page >= pagination.total_pages || fetching}
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
