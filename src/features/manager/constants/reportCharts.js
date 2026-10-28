// Đang tạo reportCharts vì màu và định dạng số dùng chung cho các biểu đồ trang Báo cáo (ReportCharts, ReportsPage)

// Màu theo vai trò (bảng màu đã kiểm tra mù màu, chế độ sáng); chữ luôn dùng màu chữ, không dùng màu series
export const CHART_COLORS = {
  revenue: '#2a78d6',
  cost: '#eb6834',
  profit: '#1baf7a',
  primary: '#2a78d6',
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  ink: '#52514e',
};

/** Số gọn cho trục tiền USD: 1.2K · 3.4M (dạng quốc tế cho mọi ngôn ngữ; tiếng Việt "N / Tr" dễ đọc nhầm với đơn vị) */
export function compactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
}
