/**
 * @file dataReset.js
 * @description Tiện ích dọn dẹp toàn bộ dữ liệu mẫu (Clean Data)
 * Giúp người dùng bắt đầu nhập dữ liệu mới từ đầu theo luồng thực tế
 * GIỮ NGUYÊN tất cả các tài khoản người dùng đã có
 */

export const CLEAN_DATA_KEY = 'racehorse_clean_data_mode';

/**
 * Kiểm tra xem người dùng có đang ở chế độ dữ liệu trắng hay không
 * @returns {boolean}
 */
export function isCleanDataMode() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CLEAN_DATA_KEY) === 'true';
}

/**
 * Xóa sạch toàn bộ dữ liệu mẫu (đơn đặt, kế hoạch, hồ sơ, ngựa, chuyến đi)
 * Bảo toàn 100% tài khoản người dùng và phiên đăng nhập hiện tại
 */
export function resetToCleanData() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Đặt cờ chế độ dữ liệu trắng
    localStorage.setItem(CLEAN_DATA_KEY, 'true');

    // 2. Xóa sạch dữ liệu nghiệp vụ
    localStorage.setItem('racehorse_bookings_storage', JSON.stringify([]));
    localStorage.setItem('racehorse_route_plans_storage', JSON.stringify([]));
    localStorage.setItem('racehorse_specialist_dossiers', JSON.stringify([]));
    localStorage.setItem('racehorse_customer_dossier_submissions', JSON.stringify({}));
    localStorage.setItem('racehorse_horses_storage', JSON.stringify([]));
    localStorage.setItem('racehorse_vet_records_storage', JSON.stringify([]));
    localStorage.setItem('racehorse_reminders_storage', JSON.stringify([]));
    localStorage.setItem('racehorse_request_letters', JSON.stringify([]));
    localStorage.setItem('racehorse_driver_trips_storage', JSON.stringify([]));
    localStorage.setItem('racehorse_horse_photos', JSON.stringify({}));
    localStorage.setItem('racehorse_horse_markings', JSON.stringify({}));
    localStorage.setItem('racehorse_angle_photos', JSON.stringify({}));

    // 3. Phát sự kiện thông báo toàn hệ thống reload tức thời
    window.dispatchEvent(new CustomEvent('bookings_updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('plans_updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('dossiers_updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('horses_updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('vet_records_updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('letters_updated', { detail: [] }));
    window.dispatchEvent(new CustomEvent('plan_assigned_to_driver', { detail: null }));
    window.dispatchEvent(new Event('storage'));

    return { success: true };
  } catch (err) {
    console.error('Lỗi khi dọn dẹp dữ liệu mẫu:', err);
    return { success: false, error: err?.message };
  }
}
