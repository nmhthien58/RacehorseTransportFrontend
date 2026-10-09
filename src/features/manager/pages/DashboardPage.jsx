import ManagerBookings from './BookingsPage';

/**
 * Trang Dashboard của Logistics Manager & Admin
 * Hiển thị thống kê tổng quan và bảng danh sách toàn bộ các yêu cầu vận chuyển
 *
 * @returns {JSX.Element}
 */
export default function ManagerDashboard() {
  return <ManagerBookings isDashboardView={true} />;
}
