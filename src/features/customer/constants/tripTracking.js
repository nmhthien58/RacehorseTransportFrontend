/**
 * @file tripTracking.js
 * @description Hằng số dùng chung cho màn hình theo dõi chuyến đi của khách
 */

/** Màu Tag AntD theo trạng thái chuyến (overallStatus) */
export const TRIP_STATUS_COLOR = {
  Scheduled: 'default',
  InTransit: 'processing',
  EmergencyRerouting: 'red',
  ArrivedDestination: 'cyan',
  Completed: 'green',
  Cancelled: 'default',
};

/** Màu Tag theo tình trạng ăn / mức căng thẳng trong nhật ký thể trạng */
export const FEED_COLOR = { Normal: 'green', Reduced: 'gold', Refused: 'red' };
export const STRESS_COLOR = { Calm: 'green', MildStress: 'gold', Agitated: 'red' };

/**
 * Đổi giá trị trạng thái PascalCase sang key i18n trong nhóm `status` (InTransit -> inTransit).
 * @param {string} [status]
 * @returns {string}
 */
export function tripStatusKey(status) {
  if (!status) return 'pending';
  return status.charAt(0).toLowerCase() + status.slice(1);
}
