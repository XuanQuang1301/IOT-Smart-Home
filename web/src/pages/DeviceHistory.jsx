import React, { useState } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { STATUS_COLORS } from '../constants/colors';

/**
 * Component Sub-header hiển thị Tiêu đề Cột Bảng hỗ trợ Sắp xếp (Sort Header)
 * Chức năng: Render ô <th> kèm 2 mũi tên sắp xếp (tăng dần / giảm dần). Khi người dùng click vào tiêu đề cột sẽ kích hoạt hàm onSort.
 */
function SortHeader({ title, sortKey, sortConfig, onSort, alignRight = false, alignCenter = false, className = '' }) {
  const isActive = sortConfig.key === sortKey;
  const isAsc = isActive && sortConfig.direction === 'asc';
  const isDesc = isActive && sortConfig.direction === 'desc';

  return (
    <th
      tabIndex="-1"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        onSort(sortKey);
      }}
      className={`py-2.5 px-4 cursor-pointer select-none outline-none focus:outline-none focus:ring-0 hover:bg-slate-100/80 group ${
        alignRight ? 'text-right' : alignCenter ? 'text-center' : 'text-left'
      } ${className}`}
      title={`Sắp xếp theo ${title}`}
    >
      <div className={`inline-flex items-center space-x-1 ${alignRight ? 'justify-end w-full' : ''}`}>
        <span className={`${isActive ? 'text-blue-600 font-extrabold' : 'text-slate-700 font-extrabold group-hover:text-blue-600'}`}>
          {title}
        </span>
        <div className="flex flex-col items-center justify-center space-y-[-3px] ml-1">
          {/* Mũi tên Sắp xếp Tăng dần (Ascending) */}
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
          {/* Mũi tên Sắp xếp Giảm dần (Descending) */}
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

/**
 * Component DeviceHistory - Trang Lịch sử Thao tác Thiết bị
 * Chức năng chính:
 * 1. Tra cứu danh sách nhật ký điều khiển bật/tắt thiết bị thông minh từ Backend.
 * 2. Lọc đa cột theo: ID Thiết bị, Hành động (TURN_ON / TURN_OFF), Trạng thái (Thành công / Thất bại), Ngày & Giờ.
 * 3. Tích hợp bộ chọn Ngày & Giờ dạng lịch popover.
 * 4. Phân trang dữ liệu linh hoạt (Hiển thị 10, 20, 40 dòng/trang).
 */
export default function DeviceHistory() {
  // Lấy cache dữ liệu lịch sử thiết bị, hàm fetch và danh sách thiết bị từ DataContext
  const { deviceHistoryCache, fetchDeviceHistory, devices } = useData();

  // State lưu các giá trị lọc (Filter State)
  const [filters, setFilters] = useState({
    device_id: '',
    action: '',
    status: '',
    time: ''
  });

  // State quản lý hiển thị Bộ chọn Ngày & Giờ dạng Lịch (Time Picker Popover)
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState('');
  const [pickerTime, setPickerTime] = useState('');
  const pickerContainerRef = React.useRef(null);

  // KHỐI 1: ĐỒNG BỘ GIỮA CHUỖI THỜI GIAN FILTER VÀ CÁC Ô NHẬP PICKER
  React.useEffect(() => {
    if (filters.time) {
      const parts = filters.time.trim().split(/\s+/);
      let datePart = '';
      let timePart = '';

      if (parts.length >= 2) {
        datePart = parts[0];
        timePart = parts[1];
      } else if (parts.length === 1) {
        if (parts[0].includes(':')) {
          timePart = parts[0];
        } else {
          datePart = parts[0];
        }
      }

      // Chuẩn hóa DD/MM/YYYY về YYYY-MM-DD cho input date của trình duyệt
      if (datePart && datePart.includes('/')) {
        const dParts = datePart.split('/');
        if (dParts.length === 3) {
          datePart = `${dParts[2]}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
        }
      }

      setPickerDate(datePart);
      setPickerTime(timePart);
    } else {
      setPickerDate('');
      setPickerTime('');
    }
  }, [filters.time]);

  // Đóng popover chọn lịch khi nhấp chuột ra ngoài
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(e.target)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trích xuất dữ liệu phân trang và bộ lọc từ DataContext Cache
  const limit = deviceHistoryCache.limit || 10;
  const loading = deviceHistoryCache.loading || false;
  const data = deviceHistoryCache.data || [];
  const pagination = deviceHistoryCache.pagination || { current_page: 1, total_pages: 1, total_records: 0 };
  const activeFilters = deviceHistoryCache.appliedFilters || filters;

  // =========================================================================
  // KHỐI 2: HÀM XỬ LÝ TÌM KIẾM, ĐẶT LẠI VÀ CHUYỂN TRANG
  // =========================================================================
  
  // Đổi số dòng hiển thị / trang (Limit: 10, 20, 40)
  const handleLimitChange = (newLimit) => {
    fetchDeviceHistory(1, activeFilters, newLimit);
  };

  // Thực thi Tìm kiếm dữ liệu theo Bộ lọc
  const handleSearch = (e) => {
    e.preventDefault();
    setShowTimePicker(false);
    fetchDeviceHistory(1, filters, limit);
  };

  // Đặt lại (Reset) toàn bộ Bộ lọc về trạng thái rỗng
  const handleReset = () => {
    const empty = { device_id: '', action: '', status: '', time: '' };
    setFilters(empty);
    setPickerDate('');
    setPickerTime('');
    setShowTimePicker(false);
    fetchDeviceHistory(1, empty, limit);
  };

  // Xử lý chuyển trang dữ liệu
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchDeviceHistory(newPage, activeFilters, limit);
    }
  };

  // =========================================================================
  // KHỐI 3: TIỆN ÍCH FORMAT ĐỊNH DẠNG VÀ RENDER BADGE TRẠNG THÁI
  // =========================================================================

  // Format timestamp hiển thị định dạng YYYY/MM/DD HH:mm:ss
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');

      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return ts;
    }
  };

  // Render Nhãn (Badge) Hành động (ON: Xanh lục, OFF: Đen/Xám)
  const renderActionBadge = (actionStr) => {
    const isON = actionStr === 'TURN_ON' || actionStr === 'ON';
    return (
      <span
        className={`inline-block w-14 text-center py-1 rounded-lg text-xs font-extrabold font-mono tracking-wider shadow-2xs ${
          isON
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/60'
            : 'bg-slate-800 text-white'
        }`}
      >
        {isON ? 'ON' : 'OFF'}
      </span>
    );
  };

  // Render Nhãn (Badge) Trạng thái thực thi (Thành công / Thất bại)
  const renderStatusBadge = (statusStr) => {
    const isSuccess = statusStr === 'SUCCESS' || statusStr === 'SUCCESSFUL';
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
          isSuccess
            ? STATUS_COLORS.success.bg + ' ' + STATUS_COLORS.success.text
            : STATUS_COLORS.failed.bg + ' ' + STATUS_COLORS.failed.text
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isSuccess ? STATUS_COLORS.success.dot : STATUS_COLORS.failed.dot}`}></span>
        {isSuccess ? 'Thành công' : 'Thất bại'}
      </span>
    );
  };

  // KHỐI 4: SẮP XẾP DỮ LIỆU CỘT BẢNG 
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

  // Tự động sắp xếp mảng hiển thị theo cột được chọn
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
      } else if (sortConfig.key === 'user') {
        aVal = (a.user || a.username || a.created_by || a.user_name || 'Xuân Quang').toLowerCase();
        bVal = (b.user || b.username || b.created_by || b.user_name || 'Xuân Quang').toLowerCase();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Vị trí bản ghi đang xem
  const startRecord = (pagination.current_page - 1) * limit + (data.length > 0 ? 1 : 0);
  const endRecord = (pagination.current_page - 1) * limit + data.length;

  // =========================================================================
  // KHỐI 5: GIAO DIỆN HIỂN THỊ (RENDER JSX)
  // =========================================================================
  return (
    <div className="h-full p-5 flex flex-col min-h-0 overflow-hidden">
      {/* 5.1. Header tiêu đề trang */}
      <div className="flex-none">
        <Header title="Lịch Sử Thiết Bị" subtitle="Bản ghi chi tiết các hành động bật/tắt thiết bị" />
      </div>

      {/* 5.2. KHỐI FORM THÀNH PHẦN BỘ LỌC TÌM KIẾM (SEARCH & FILTER FORM CARD) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm mb-3 flex-none">
        <form onSubmit={handleSearch}>
          <div className="flex flex-wrap items-end gap-2.5">
            
            {/* Chọn Thiết bị */}
            <div className="w-full sm:w-36 shrink-0">
              <label className="block text-xs font-bold text-slate-900 mb-1">Thiết bị</label>
              <select
                value={filters.device_id}
                onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all cursor-pointer"
              >
                <option value="">Tất cả thiết bị</option>
                {devices && devices.length > 0 ? (
                  devices.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name || `Thiết bị ${dev.id}`}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Đèn 1</option>
                    <option value="2">Đèn 2</option>
                  </>
                )}
              </select>
            </div>

            {/* Hành động (TURN_ON / TURN_OFF) */}
            <div className="w-full sm:w-32 shrink-0">
              <label className="block text-xs font-bold text-slate-900 mb-1">Hành động</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all cursor-pointer"
              >
                <option value="">Tất cả</option>
                <option value="TURN_ON">Bật (ON)</option>
                <option value="TURN_OFF">Tắt (OFF)</option>
              </select>
            </div>

            {/* Trạng thái thực thi */}
            <div className="w-full sm:w-32 shrink-0">
              <label className="block text-xs font-bold text-slate-900 mb-1">Trạng thái</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all cursor-pointer"
              >
                <option value="">Tất cả</option>
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Thất bại</option>
              </select>
            </div>

            {/* Bộ chọn Ngày & Giờ */}
            <div className="w-full sm:w-80 shrink-0">
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

                {/* Nút bật Popover chọn Lịch */}
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

                  {/* Popover Bảng chọn Ngày & Giờ */}
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

                      {/* Input Chọn Ngày */}
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

                      {/* Input Chọn Giờ:Phút:Giây 24h */}
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

                      {/* Nút Áp dụng / Xóa */}
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

            {/* Các nút bấm hành động */}
            <div className="flex items-center space-x-2.5 shrink-0 ml-auto">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 active:scale-95 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl shadow-md hover:shadow-lg text-xs transition-all cursor-pointer whitespace-nowrap"
              >
                Tìm kiếm
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-50 font-bold px-5 py-2 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap shadow-xs"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 5.3. KHỐI BẢNG HỂN THỊ DỮ LIỆU LỊCH SỬ THIẾT BỊ (DATA TABLE CARD) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className={`flex-1 overflow-y-auto min-h-0 transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm">
              <tr className="text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                <SortHeader title="ID THIẾT BỊ" sortKey="device_id" sortConfig={sortConfig} onSort={handleSort} className="w-[18%]" />
                <th className="py-2.5 px-4 text-left text-[10px] font-extrabold tracking-wider text-slate-700 uppercase select-none w-[20%]">
                  HÀNH ĐỘNG
                </th>
                <th className="py-2.5 px-4 text-left text-[10px] font-extrabold tracking-wider text-slate-700 uppercase select-none w-[20%]">
                  TRẠNG THÁI
                </th>
                <SortHeader title="NGƯỜI THỰC HIỆN" sortKey="user" sortConfig={sortConfig} onSort={handleSort} className="w-[20%]" />
                <SortHeader title="Thời gian" sortKey="created_at" sortConfig={sortConfig} onSort={handleSort} alignRight={true} className="w-[22%]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400">
                    Không có lịch sử thiết bị nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                sortedData.map((row, idx) => (
                  <tr key={`device-${row.id || idx}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 pl-11 pr-4 font-mono text-slate-600 text-xs truncate">{row.device_id || row.id}</td>
                    <td className="py-2.5 px-4 truncate">{renderActionBadge(row.action)}</td>
                    <td className="py-2.5 px-4 truncate">{renderStatusBadge(row.status)}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700 text-xs truncate">
                      {'Đặng Xuân Quang'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-500 truncate">
                      {formatTimestamp(row.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5.4. Chân Bảng: Chọn Limit dòng và Phân Trang */}
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
            {/* Nút Trang Trước */}
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={loading || pagination.current_page <= 1}
              className="px-2 py-0.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 font-semibold text-[11px]"
            >
              Trước
            </button>

            {/* Các Nút Số Trang */}
            {(() => {
              const current = pagination.current_page;
              const total = pagination.total_pages;
              const maxVisible = 5;

              let start = 1;
              let end = total;

              if (total > maxVisible) {
                start = Math.max(1, current - 2);
                end = start + maxVisible - 1;

                if (end > total) {
                  end = total;
                  start = Math.max(1, end - maxVisible + 1);
                }
              }

              const pages = [];
              for (let i = start; i <= end; i++) {
                pages.push(i);
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

            {/* Nút Trang Sau */}
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
