/**
 * @file incidents.js
 * @description Giá trị hợp lệ của Flow 5 (sự cố) và Flow 6 (bàn giao) theo backend, kèm màu Tag.
 * Nhãn hiển thị lấy qua i18n: incidents.type.*, incidents.severity.*, incidents.status.*, incidents.action.*, handover.condition.*
 */
import { toIsoString } from '@utils/apiHelpers';

/** Loại sự cố backend chấp nhận (incidentType) */
export const INCIDENT_TYPES = [
  'MechanicalBreakdown',
  'BorderCongestion',
  'EquineHealthIssue',
  'Weather',
  'ClimateControlFailure',
  'CustomsHold',
  // R-14 (BE-14b): cửa khẩu từ chối, biên giới đóng, tài xế / áp tải không thể tiếp tục, người nhận vắng mặt
  'BorderRejected',
  'BorderClosed',
  'CrewUnavailable',
  'RecipientUnavailable',
  'Other',
];

/** Loại hành động của phương án xử lý (responseAction); Reroute bắt buộc kèm thay đổi tuyến */
// R-14 (BE-14b): ReturnToOrigin (cả đoàn quay về, hệ thống tự dựng tuyến), HoldAtStable (chuồng tạm, tính phí khi đóng)
// R-14 (BE-14a): ReplaceVehicle (đổi xe cùng loại), ReplaceCrew (đổi tài xế / áp tải); chi tiết nằm ở actionPayload
export const RESPONSE_ACTIONS = [
  'WaitAndContinue',
  'RepairAndContinue',
  'Reroute',
  'VeterinaryCare',
  'OffloadHorse',
  'ReplaceVehicle',
  'ReplaceCrew',
  'ReturnToOrigin',
  'HoldAtStable',
  'Other',
];

/** Phương án kèm actionPayload: đổi xe (replacementVehicleId) / đổi người (removeUserId, addUserId, crewRole) */
export const REPLACEMENT_ACTIONS = ['ReplaceVehicle', 'ReplaceCrew'];

export const RESPONSE_ACTION_COLOR = {
  WaitAndContinue: 'default',
  RepairAndContinue: 'gold',
  Reroute: 'purple',
  VeterinaryCare: 'magenta',
  OffloadHorse: 'red',
  ReturnToOrigin: 'volcano',
  HoldAtStable: 'cyan',
  ReplaceVehicle: 'geekblue',
  ReplaceCrew: 'lime',
  Other: 'default',
};

/**
 * Bảng tra tên để hiển thị actionPayload (đổi xe / đổi người) từ dữ liệu đang có trên màn hình.
 * Nguồn sau ghi đè nguồn trước; thiếu tên thì màn hình hiện mã số.
 * @param {{ trip?: Object|null, assets?: Array<Object>, users?: Array<Object> }} sources
 *   trip: GET /trips/{id} (xe + đoàn xe hiện tại); assets: GET /transport-assets hoặc /trips/available-vehicles; users: GET /users/staff hoặc /trips/available-crew
 * @returns {{ vehicles: Record<number, { assetCode: string, assetType?: string }>, users: Record<number, string> }}
 */
export function buildIncidentLookup({ trip, assets = [], users = [] }) {
  const lookup = { vehicles: {}, users: {} };
  assets.forEach((a) => {
    lookup.vehicles[a.assetId] = { assetCode: a.assetCode, assetType: a.assetType };
  });
  users.forEach((u) => {
    lookup.users[u.userId] = u.fullName;
  });
  if (trip?.vehicleId) lookup.vehicles[trip.vehicleId] = { assetCode: trip.vehicleCode, assetType: trip.vehicleType };
  (trip?.crew || []).forEach((c) => {
    lookup.users[c.userId] = c.fullName;
  });
  return lookup;
}

/** Hướng xử lý tiếp của ngựa rời chuyến (phương án OffloadHorse, R-12); Deceased chỉ ở sự cố Critical, bắt buộc biên bản thú y */
export const OFFLOAD_OUTCOMES = ['WaitRecover', 'ReturnToOrigin', 'HandOverHere', 'Deceased'];

/** Nguyên nhân khi đóng sự cố (Chính sách 9.1) quyết định ai chịu chi phí */
export const FAULT_PARTIES = ['Company', 'Customer', 'ForceMajeure'];

export const FAULT_PARTY_COLOR = { Company: 'blue', Customer: 'orange', ForceMajeure: 'purple' };

/**
 * Chuyển giá trị các ô sửa tuyến (RouteChangeFields) sang body backend; không có thay đổi nào thì trả null.
 * @param {{ deactivateCheckpointIds?: number[], insertAfterCheckpointId?: number, newCheckpoints?: Array<Object> }} [values]
 * @returns {{ deactivateCheckpointIds: number[], newCheckpoints: Array<Object>, insertAfterCheckpointId?: number } | null}
 */
export function toRouteChangePayload(values) {
  const deactivateCheckpointIds = values?.deactivateCheckpointIds || [];
  const newCheckpoints = (values?.newCheckpoints || []).map((c) => ({
    checkpointName: c.checkpointName.trim(),
    checkpointType: c.checkpointType,
    address: c.address?.trim() || '',
    plannedTime: toIsoString(c.plannedTime),
    mandatoryRestMinutes: c.mandatoryRestMinutes || 0,
  }));
  if (deactivateCheckpointIds.length === 0 && newCheckpoints.length === 0) return null;
  return { deactivateCheckpointIds, newCheckpoints, insertAfterCheckpointId: values.insertAfterCheckpointId || undefined };
}

/** Mức độ sự cố, từ nhẹ tới nặng */
export const INCIDENT_SEVERITIES = ['Minor', 'Moderate', 'Major', 'Critical'];

export const SEVERITY_COLOR = { Minor: 'default', Moderate: 'gold', Major: 'orange', Critical: 'red' };

/** Trạng thái sự cố: Reported -> PlanProposed -> Approved -> Resolved (hoặc Rejected rồi đề xuất lại) */
// AwaitingConsent: phương án đi vòng có phí đã duyệt, chờ mọi khách có ngựa trên xe đồng ý (R-14)
export const INCIDENT_STATUSES = ['Reported', 'PlanProposed', 'AwaitingConsent', 'Approved', 'Rejected', 'Resolved'];

export const INCIDENT_STATUS_COLOR = {
  Reported: 'red',
  PlanProposed: 'gold',
  AwaitingConsent: 'purple',
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

/**
 * Tọa độ GPS dạng chuỗi lưu vào trường location của sự cố.
 * @param {number} lat
 * @param {number} lng
 * @param {number} [accuracy] - mét
 * @returns {string}
 */
export function formatCoordinates(lat, lng, accuracy) {
  const base = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  return accuracy ? `${base} (±${Math.round(accuracy)} m)` : base;
}

/**
 * Link Google Maps cho một vị trí (tọa độ hoặc địa chỉ chữ).
 * @param {string} location
 * @returns {string}
 */
export function mapLinkOf(location) {
  const match = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/.exec(location || '');
  const query = match ? `${match[1]},${match[2]}` : location || '';
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
}
