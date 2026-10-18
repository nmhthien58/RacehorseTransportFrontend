/**
 * @file bookingRoute.js
 * @description Hiển thị tuyến của đơn gồm cả nước quá cảnh, ví dụ "VN → CN → RU".
 */

/**
 * Lấy danh sách mã nước quá cảnh của đơn (chấp nhận cả camelCase và PascalCase).
 * @param {Object} booking
 * @returns {string[]}
 */
export function getTransitCountryCodes(booking) {
  return booking?.transitCountryCodes || booking?.TransitCountryCodes || [];
}

/**
 * Chuỗi tuyến theo mã nước: nước đi → các nước quá cảnh → nước đến.
 * @param {Object} booking
 * @returns {string}
 */
export function formatCountryRoute(booking) {
  const origin = booking?.pickupCountryCode || booking?.PickupCountryCode || '?';
  const destination = booking?.dropoffCountryCode || booking?.DropoffCountryCode || '?';
  return [origin, ...getTransitCountryCodes(booking), destination].join(' → ');
}
