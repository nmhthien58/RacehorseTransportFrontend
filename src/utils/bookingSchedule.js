import dayjs from 'dayjs';

/**
 * @file bookingSchedule.js
 * @description Tiện ích cho lịch của đơn: khoảng ngày ngựa sẵn sàng được đón (pickup window) và hạn giao trễ nhất.
 * Khách không chọn ngày khởi hành; ngày chạy thật do điều phối viên chốt khi lập chuyến.
 */

/**
 * Lấy ngày đầu khoảng pickup của đơn (chấp nhận cả camelCase và PascalCase).
 * @param {Object} booking
 * @returns {string|null}
 */
export function getPickupWindowStart(booking) {
  return booking?.pickupWindowStart || booking?.PickupWindowStart || null;
}

/**
 * Lấy ngày cuối khoảng pickup của đơn.
 * @param {Object} booking
 * @returns {string|null}
 */
export function getPickupWindowEnd(booking) {
  return booking?.pickupWindowEnd || booking?.PickupWindowEnd || null;
}

/**
 * Lấy hạn giao trễ nhất của đơn.
 * @param {Object} booking
 * @returns {string|null}
 */
export function getDeliveryDeadline(booking) {
  return booking?.deliveryDeadline || booking?.DeliveryDeadline || null;
}

/**
 * Định dạng khoảng pickup, ví dụ "20/11 → 25/11/2026"; cùng một ngày thì chỉ hiện một ngày.
 * @param {Object} booking
 * @param {string} [fallback] - Chuỗi hiển thị khi đơn chưa có lịch
 * @returns {string}
 */
export function formatPickupWindow(booking, fallback = '—') {
  const start = getPickupWindowStart(booking);
  const end = getPickupWindowEnd(booking);
  if (!start) return fallback;
  const startDay = dayjs(start);
  const endDay = end ? dayjs(end) : startDay;
  if (endDay.isSame(startDay, 'day')) return startDay.format('DD/MM/YYYY');
  const startFormat = startDay.isSame(endDay, 'year') ? 'DD/MM' : 'DD/MM/YYYY';
  return `${startDay.format(startFormat)} → ${endDay.format('DD/MM/YYYY')}`;
}

/**
 * Định dạng hạn giao trễ nhất.
 * @param {Object} booking
 * @param {string} [fallback]
 * @returns {string}
 */
export function formatDeliveryDeadline(booking, fallback = '—') {
  const deadline = getDeliveryDeadline(booking);
  return deadline ? dayjs(deadline).format('DD/MM/YYYY') : fallback;
}

/**
 * Chuỗi ngày giờ giữ nguyên múi giờ của người dùng (backend so ngày theo múi giờ gửi lên,
 * nên không đổi sang UTC như toISOString để ngày không bị lùi một ngày).
 * @param {import('dayjs').Dayjs|string|null} value
 * @returns {string|null}
 */
export function toLocalDateTimeString(value) {
  if (!value) return null;
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DDTHH:mm:ssZ') : null;
}
