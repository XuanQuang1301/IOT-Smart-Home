import React, { useState } from 'react';
import Header from '../components/Header';
import { useData } from '../context/DataContext';
import { SENSOR_COLORS } from '../constants/colors';

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
      <div className={`inline-flex items-center space-x-1 ${
        alignRight ? 'justify-end w-full' : alignCenter ? 'justify-center w-full' : ''
      }`}>
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
 * Component SensorHistory - Trang Lịch sử Cảm biến
 * Chức năng chính:
 * 1. Hiển thị bảng lịch sử dữ liệu đo cảm biến từ Backend với phân trang.
 * 2. Lọc đa cột theo: Sensor ID, Loại Cảm Biến, Giá trị đo, Ngày & Giờ.
 * 3. Hỗ trợ bộ chọn Lịch Ngày & Giờ popover tiện lợi.
 * 4. Cho phép Sắp xếp (Sort) linh hoạt theo từng cột dữ liệu.
 */
export default function SensorHistory() {
  // Lấy dữ liệu cache lịch sử và hàm gọi API từ DataContext
  const { sensorHistoryCache, fetchSensorHistory } = useData();

  // State lưu loại lọc chọn từ dropdown: 'ALL' | 'TEMPERATURE' | 'HUMIDITY' | 'LIGHT' | 'TIME'
  const [filterType, setFilterType] = useState('ALL');
  // State lưu từ khóa tìm kiếm (Giá trị hoặc Thời gian)
  const [searchValue, setSearchValue] = useState('');

  // State điều khiển hiển thị Bộ chọn Ngày & Giờ Popover (Time Picker)
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState('');
  const [pickerTime, setPickerTime] = useState('');
  const pickerContainerRef = React.useRef(null);

  // =========================================================================
  // KHỐI 1: ĐỒNG BỘ GIỮA CHUỖI THỜI GIAN VÀ CÁC Ô NHẬP PICKER
  // =========================================================================
  React.useEffect(() => {
    if (searchValue && (filterType === 'TIME' || filterType === 'ALL')) {
      const parts = searchValue.trim().split(/\s+/);
      let datePart = '';
      let timePart = '';

      if (parts.length >= 2) {
        datePart = parts[0];
        timePart = parts[1];
      } else if (parts.length === 1) {
        if (parts[0].includes(':')) {
          timePart = parts[0];
        } else if (parts[0].includes('-') || parts[0].includes('/')) {
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
  }, [searchValue, filterType]);

  // Tự động đóng Khung chọn Lịch khi người dùng nhấp chuột ra ngoài (Click Outside)
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(e.target)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lấy các thuộc tính phân trang & dữ liệu từ Cache Context
  const limit = sensorHistoryCache.limit || 10;
  const loading = sensorHistoryCache.loading || false;
  const data = sensorHistoryCache.data || [];
  const pagination = sensorHistoryCache.pagination || { current_page: 1, total_pages: 1, total_records: 0 };
  const activeFilters = sensorHistoryCache.appliedFilters || {};

  // =========================================================================
  // KHỐI 2: CÁC HÀM XỬ LÝ SỰ KIỆN TÌM KIẾM, ĐẶT LẠI, PHÂN TRANG
  // =========================================================================
  
  // Thay đổi số lượng dòng hiển thị trên một trang (Limit: 10, 20, 40)
  const handleLimitChange = (newLimit) => {
    fetchSensorHistory(1, activeFilters, newLimit);
  };

  // Thực hiện Tìm kiếm theo Bộ lọc người dùng đã chọn
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setShowTimePicker(false);

    const inputVal = searchValue.trim();
    let queryFilters = {
      sensor_id: '',
      sensor_type: '',
      value: '',
      time: ''
    };

    if (filterType === 'TIME') {
      queryFilters.time = inputVal;
    } else if (filterType === 'TEMPERATURE') {
      queryFilters.sensor_type = 'TEMPERATURE';
      queryFilters.sensor_id = '1';
      queryFilters.value = inputVal;
    } else if (filterType === 'HUMIDITY') {
      queryFilters.sensor_type = 'HUMIDITY';
      queryFilters.sensor_id = '2';
      queryFilters.value = inputVal;
    } else if (filterType === 'LIGHT') {
      queryFilters.sensor_type = 'LIGHT';
      queryFilters.sensor_id = '3';
      queryFilters.value = inputVal;
    } else {
      // filterType === 'ALL' (Tất cả cảm biến)
      if (inputVal) {
        // Phân loại tự động: nếu nhập chứa kí tự ngày/giờ (-, /, :) thì lọc theo thời gian, ngược lại lọc theo giá trị
        const isDateTime = /[-/:]/.test(inputVal) || /^\d{4}/.test(inputVal);
        if (isDateTime) {
          queryFilters.time = inputVal;
        } else {
          queryFilters.value = inputVal;
        }
      }
    }

    fetchSensorHistory(1, queryFilters, limit);
  };

  // Xóa trắng toàn bộ Bộ lọc và tải lại danh sách ban đầu
  const handleReset = () => {
    setFilterType('ALL');
    setSearchValue('');
    setPickerDate('');
    setPickerTime('');
    setShowTimePicker(false);
    fetchSensorHistory(1, { sensor_id: '', sensor_type: '', value: '', time: '' }, limit);
  };

  // Nút chuyển Trang (Trang trước, Trang sau, bấm số trang cụ thể)
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchSensorHistory(newPage, activeFilters, limit);
    }
  };

  // =========================================================================
  // KHỐI 3: TIỆN ÍCH FORMAT ĐỊNH DẠNG VÀ RENDER BADGE ICON
  // =========================================================================
  
  // Format Timestamp hiển thị định dạng YYYY/MM/DD HH:mm:ss
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

  // Render Nhãn (Badge) màu sắc và Icon sinh động cho từng loại Cảm biến
  const renderBadge = (sensorType) => {
    switch (sensorType) {
      case 'TEMPERATURE':
      case 'Nhiệt độ':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 ${SENSOR_COLORS.temperature.bgLight} ${SENSOR_COLORS.temperature.textDarker} rounded-full text-[11px] font-semibold ${SENSOR_COLORS.temperature.border} shadow-2xs`}>
            <svg className={`w-3.5 h-3.5 mr-1 ${SENSOR_COLORS.temperature.textMain} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 14.76V5a2 2 0 10-4 0v9.76a4 4 0 104 0z" />
            </svg>
            Nhiệt độ
          </span>
        );
      case 'HUMIDITY':
      case 'Độ ẩm':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 ${SENSOR_COLORS.humidity.bgLight} ${SENSOR_COLORS.humidity.textDarker} rounded-full text-[11px] font-semibold ${SENSOR_COLORS.humidity.border} shadow-2xs`}>
            <svg className={`w-3.5 h-3.5 mr-1 ${SENSOR_COLORS.humidity.textMain} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
            </svg>
            Độ ẩm
          </span>
        );
      case 'LIGHT':
      case 'Ánh sáng':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 ${SENSOR_COLORS.light.bgLight} ${SENSOR_COLORS.light.textDarker} rounded-full text-[11px] font-semibold ${SENSOR_COLORS.light.border} shadow-2xs`}>
            <svg className={`w-3.5 h-3.5 mr-1 ${SENSOR_COLORS.light.textMain} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Ánh sáng
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-semibold">{sensorType}</span>;
    }
  };

  // =========================================================================
  // KHỐI 4: XỬ LÝ SẮP XẾP DỮ LIỆU BẢNG (CLIENT-SIDE SORTING)
  // =========================================================================
  const [sortConfig, setSortConfig] = useState({ key: '', direction: null });

  // Đảo trạng thái sắp xếp: Chưa chọn -> Giảm dần (Desc) -> Tăng dần (Asc) -> Hủy sắp xếp
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

  // Ghi nhớ và tự sắp xếp danh sách hiển thị khi sortConfig thay đổi
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
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Tính vị trí bản ghi bắt đầu và kết thúc trên trang hiện tại
  const startRecord = (pagination.current_page - 1) * limit + (data.length > 0 ? 1 : 0);
  const endRecord = (pagination.current_page - 1) * limit + data.length;

  // =========================================================================
  // KHỐI 5: GIAO DIỆN HIỂN THỊ (RENDER JSX)
  // =========================================================================
  return (
    <div className="h-full p-5 flex flex-col min-h-0 overflow-hidden">
      {/* 5.1. Header Tiêu đề trang */}
      <div className="flex-none">
        <Header title="Lịch Sử Cảm Biến" subtitle="Tra cứu dữ liệu đo đạc chi tiết của hệ thống" />
      </div>

      {/* 5.2. KHỐI THÀNH PHẦN BỘ LỌC TÌM KIẾM (SEARCH & FILTER FORM CARD) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm mb-3 flex-none">
        <form onSubmit={handleSearch}>
          <div className="flex flex-wrap items-end gap-2.5">
            
            {/* 1. Dropdown Chọn Loại cảm biến / Thời gian */}
            <div className="w-full sm:w-52 shrink-0">
              <label className="block text-xs font-bold text-slate-900 mb-1">Loại cảm biến</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all cursor-pointer"
              >
                <option value="ALL">Tất cả cảm biến</option>
                <option value="TEMPERATURE">Nhiệt độ (°C)</option>
                <option value="HUMIDITY">Độ ẩm (%)</option>
                <option value="LIGHT">Ánh sáng (lux)</option>
                <option value="TIME">Thời gian</option>
              </select>
            </div>

            {/* 2. Ô Nhập dữ liệu Tìm kiếm (Giá trị hoặc Thời gian) */}
            <div className="w-full sm:w-80 shrink-0">
              <label className="block text-xs font-bold text-slate-900 mb-1">
                {filterType === 'TIME'
                  ? 'Thời gian'
                  : filterType === 'TEMPERATURE'
                  ? 'Giá trị (Nhiệt độ)'
                  : filterType === 'HUMIDITY'
                  ? 'Giá trị (Độ ẩm)'
                  : filterType === 'LIGHT'
                  ? 'Giá trị (Ánh sáng)'
                  : 'Giá trị / Thời gian'}
              </label>

              <div className="relative flex items-center space-x-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={
                      filterType === 'TIME'
                        ? 'YYYY-MM-DD HH:mm:ss'
                        : filterType === 'ALL'
                        ? 'Nhập giá trị hoặc thời gian...'
                        : 'Nhập giá trị...'
                    }
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className={`w-full bg-white border border-slate-300 rounded-xl pl-3 pr-7 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400 transition-all ${
                      filterType === 'TIME' ? 'font-mono' : ''
                    }`}
                  />
                  {searchValue && (
                    <button
                      type="button"
                      onClick={() => setSearchValue('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs font-bold cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Nút Chọn Lịch Popover (Hiển thị khi chọn Thời gian hoặc Tất cả) */}
                {(filterType === 'TIME' || filterType === 'ALL') && (
                  <div className="relative" ref={pickerContainerRef}>
                    <button
                      type="button"
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-xl border border-blue-200 text-xs transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shadow-sm"
                      title="Chọn ngày và giờ từ lịch"
                    >
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Chọn Lịch</span>
                    </button>

                    {/* Popover Bảng chọn Ngày và Giờ 24h */}
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

                        {/* Chọn Ngày */}
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

                        {/* Chọn Giờ:Phút:Giây */}
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
                              setSearchValue('');
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

                              setSearchValue(combined);
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
                )}
              </div>
            </div>

            {/* Các nút bấm Tìm kiếm & Đặt lại */}
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

      {/* 5.3. KHỐI BẢNG DỮ LIỆU VÀ THANH PHÂN TRANG (DATA TABLE CARD) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden relative">
        
        {/* Phần Thân Bảng Dữ Liệu */}
        <div className={`flex-1 overflow-y-auto min-h-0 transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm">
              <tr className="text-[10px] font-extrabold tracking-wider text-slate-700 uppercase">
                <SortHeader title="SENSOR ID" sortKey="sensor_id" sortConfig={sortConfig} onSort={handleSort} className="w-[20%]" />
                <th className="py-2.5 px-4 text-left text-[10px] font-extrabold tracking-wider text-slate-700 uppercase select-none w-[25%]">
                  LOẠI CẢM BIẾN
                </th>
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
                  <tr key={`sensor-${row.id || idx}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 pl-11 pr-4 font-mono text-slate-600 text-xs truncate">{row.sensor_id}</td>
                    <td className="py-2.5 px-4 truncate">{renderBadge(row.sensor_type || row.name)}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 text-xs truncate">
                      {row.value} <span className="font-semibold text-slate-500 text-[11px] ml-0.5">{row.unit}</span>
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

        {/* 5.4. Chân Bảng: Chọn số dòng/trang và Các nút bấm Phân Trang */}
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

            {/* Các Nút Số Trang Động */}
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
