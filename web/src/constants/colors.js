
export const SENSOR_COLORS = {
  // Cảm biến Nhiệt độ 
  temperature: {
    hex: '#f59e0b', // Mã màu Hex dùng cho đồ thị Recharts
    bgLight: 'bg-amber-50', // Màu nền nhãn Badge nhẹ
    textMain: 'text-amber-500', // Màu chữ chính
    textDark: 'text-amber-600', // Màu chữ đậm
    textDarker: 'text-amber-700', // Màu chữ rất đậm
    border: 'border-amber-200/60', // Viền nhãn mỏng
    progressBar: 'bg-gradient-to-r from-amber-400 to-amber-500', // Gradient thanh tiến trình
    progressTrack: 'bg-amber-100/60', // Màu nền thanh tiến trình
    dotBg: 'bg-amber-400' // Dấu chấm trạng thái
  },
  // Cảm biến Độ ẩm 
  humidity: {
    hex: '#3b82f6', // Mã màu Hex đồ thị
    bgLight: 'bg-blue-50', // Màu nền nhãn Badge
    textMain: 'text-blue-500', // Màu chữ chính
    textDark: 'text-blue-600', // Màu chữ đậm
    textDarker: 'text-blue-700', // Màu chữ rất đậm
    border: 'border-blue-200/60', // Viền nhãn mỏng
    progressBar: 'bg-gradient-to-r from-blue-400 to-blue-500', // Gradient thanh tiến trình
    progressTrack: 'bg-blue-100/60', // Màu nền thanh tiến trình
    dotBg: 'bg-blue-400' // Dấu chấm trạng thái
  },
  // Cảm biến Ánh sáng
  light: {
    hex: '#06b6d4', // Mã màu Hex đồ thị
    bgLight: 'bg-emerald-50', // Màu nền nhãn Badge
    textMain: 'text-emerald-500', // Màu chữ chính
    textDark: 'text-emerald-600', // Màu chữ đậm
    textDarker: 'text-emerald-700', // Màu chữ rất đậm
    border: 'border-emerald-200/60', // Viền nhãn mỏng
    progressBar: 'bg-gradient-to-r from-emerald-400 to-emerald-500', // Gradient thanh tiến trình
    progressTrack: 'bg-emerald-100/60', // Màu nền thanh tiến trình
    dotBg: 'bg-emerald-400' // Dấu chấm trạng thái
  }
};

// 2. Mã màu Trạng thái Thiết bị
export const DEVICE_COLORS = {
  // Trạng thái Bật (ON)
  on: {
    main: '#3b82f6', // Mã màu chính Hex
    text: 'text-blue-500', // Màu chữ trạng thái ON
    bgBtn: 'bg-blue-500', // Màu nền công tắc bật
    cardBorder: 'border-2 border-blue-500 ring-2 ring-blue-500/10' // Khung thẻ phát sáng
  },
  // Trạng thái Tắt (OFF)
  off: {
    main: '#e2e8f0', // Mã màu chính Hex
    text: 'text-slate-400', // Màu chữ trạng thái OFF
    bgBtn: 'bg-slate-200', // Màu nền công tắc tắt
    cardBorder: 'border border-slate-100' // Khung thẻ viền xám mỏng
  }
};

// 3. Mã màu Kết quả thực thi trong Bảng Nhật ký (Thành công / Thất bại)
export const STATUS_COLORS = {
  // Thực thi Thành công (SUCCESS)
  success: {
    bg: 'bg-emerald-50', // Màu nền nhãn
    text: 'text-emerald-600', // Màu chữ
    border: 'border-emerald-200/60', // Viền mỏng
    dot: 'bg-emerald-500' // Dấu chấm xanh nhấp nháy
  },
  // Thực thi Thất bại (FAILED)
  failed: {
    bg: 'bg-rose-50', // Màu nền nhãn
    text: 'text-rose-600', // Màu chữ
    border: 'border-rose-200/60', // Viền mỏng
    dot: 'bg-rose-500' // Dấu chấm đỏ cảnh báo
  }
};
