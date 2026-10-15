/**
 * @file incidents.js
 * @description Giá trị hợp lệ của Flow 5 (sự cố) và Flow 6 (bàn giao) theo backend, kèm màu Tag.
 * Nhãn hiển thị lấy qua i18n: incidents.type.*, incidents.severity.*, incidents.status.*, handover.condition.*
 */

/** Loại sự cố backend chấp nhận (incidentType) */
export const INCIDENT_TYPES = [
  'MechanicalBreakdown',
  'BorderCongestion',
  'EquineHealthIssue',
  'Weather',
  'ClimateControlFailure',
  'CustomsHold',
  'Other',
];

/** Mức độ sự cố, từ nhẹ tới nặng */
export const INCIDENT_SEVERITIES = ['Minor', 'Moderate', 'Major', 'Critical'];

export const SEVERITY_COLOR = { Minor: 'default', Moderate: 'gold', Major: 'orange', Critical: 'red' };

/** Trạng thái sự cố: Reported -> PlanProposed -> Approved -> Resolved (hoặc Rejected rồi đề xuất lại) */
export const INCIDENT_STATUSES = ['Reported', 'PlanProposed', 'Approved', 'Rejected', 'Resolved'];

export const INCIDENT_STATUS_COLOR = {
  Reported: 'red',
  PlanProposed: 'gold',
  Approved: 'blue',
  Rejected: 'volcano',
  Resolved: 'green',
};

/** Tình trạng ngựa khi bàn giao (overallCondition) */
export const HANDOVER_CONDITIONS = ['Excellent', 'NormalFatigue', 'Injured'];

export const HANDOVER_CONDITION_COLOR = { Excellent: 'green', NormalFatigue: 'gold', Injured: 'red' };

/** Kết quả đúng giờ khi đóng chuyến (onTimeStatus) */
export const ON_TIME_COLOR = {
  OnTime: 'green',
  Delayed_AcceptableForceMajeure: 'gold',
  Delayed_OperationalFault: 'red',
};

/**
 * Định dạng số tiền USD gọn (backend tính giá theo USD).
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatUsd(value) {
  if (value === null || value === undefined) return '—';
  return `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
