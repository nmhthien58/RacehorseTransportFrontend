// Đang sửa constants.js vì bổ sung trạng thái đơn hàng mới theo quy trình R-10
export const ROLES = {
  CUSTOMER: 'Customer',
  MANAGER: 'LogisticsManager',
  COORDINATOR: 'FleetCoordinator',
  DRIVER: 'Driver',
  ESCORT: 'Escort',
  SPECIALIST: 'TransportSpecialist',
  ADMIN: 'LogisticsManager', // Logistics Manager và Admin là 1
};

// Vòng đời đơn đặt chuyến (st1_booking.png & Script 04)
export const BOOKING_STATUS = {
  SUBMITTED: 'Submitted',
  PRE_APPROVED: 'PreApproved',
  ROUTE_PLANNED: 'RoutePlanned',
  QUOTED: 'Quoted',
  AWAITING_DEPOSIT: 'AwaitingDeposit', // đã duyệt, chờ khách đặt cọc
  APPROVED: 'Approved',
  ASSIGNED: 'Assigned',
  AWAITING_FINAL_PAYMENT: 'AwaitingFinalPayment', // còn chi phí phát sinh chưa trả
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  QUOTE_EXPIRED: 'QuoteExpired',
  CANCELLED: 'Cancelled',
};

// Trạng thái cá thể ngựa trong đơn (st2_bookinghorse.png)
export const BOOKING_HORSE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  CANCELLED: 'Cancelled',
};

// Vòng đời chuyến đi (st5_trip.png & Script 04)
export const TRIP_STATUS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'PendingApproval',
  SCHEDULED: 'Scheduled',
  IN_TRANSIT: 'InTransit',
  EMERGENCY_REROUTING: 'EmergencyRerouting',
  ARRIVED: 'ArrivedDestination',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Vòng đời bộ hồ sơ kiểm dịch (st3_dossier.png)
export const DOSSIER_STATUS = {
  DRAFT: 'Draft',
  AWAITING_DOCS: 'AwaitingDocs',
  REVIEWING: 'Reviewing',
  SUBMITTED: 'SubmittedToAuthorities',
  CLEARED: 'Cleared',
  ISSUE: 'Issue',
};

// Trạng thái từng tài liệu trong bộ hồ sơ (st4_document.png)
export const DOSSIER_DOCUMENT_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

// Trạng thái trạm kiểm soát mốc lộ trình (st6_checkpoint.png)
export const ROUTE_CHECKPOINT_STATUS = {
  PENDING: 'Pending',
  ARRIVED: 'Arrived',
  CLEARED: 'Cleared',
  DEPARTED: 'Departed',
  CANCELLED: 'Cancelled',
};

// Trạng thái sự cố phát sinh (st7_incident.png & Script 04)
export const INCIDENT_STATUS = {
  REPORTED: 'Reported',
  PLAN_PROPOSED: 'PlanProposed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RESOLVED: 'Resolved',
};

// Loại sự cố vận chuyển (Script 04)
export const INCIDENT_TYPE = {
  MECHANICAL_BREAKDOWN: 'MechanicalBreakdown',
  BORDER_CONGESTION: 'BorderCongestion',
  EQUINE_HEALTH_ISSUE: 'EquineHealthIssue',
  WEATHER: 'Weather',
  CLIMATE_CONTROL_FAILURE: 'ClimateControlFailure',
  CUSTOMS_HOLD: 'CustomsHold',
  OTHER: 'Other',
};

// Mức độ nghiêm trọng của sự cố (Script 04)
export const INCIDENT_SEVERITY = {
  MINOR: 'Minor',
  MODERATE: 'Moderate',
  MAJOR: 'Major',
  CRITICAL: 'Critical',
};

// Trạng thái phương tiện vận tải (st8_asset.png)
export const ASSET_STATUS = {
  AVAILABLE: 'Available',
  IN_TRANSIT: 'InTransit',
  MAINTENANCE: 'Maintenance',
};

// Loại phương tiện vận tải chuyên dụng (Script 04)
export const ASSET_TYPE = {
  HORSE_TRUCK_AIR_SUSPENSION: 'HorseTruck_AirSuspension',
  HORSE_VAN: 'HorseVan',
  AIR_STALL: 'AirStall',
};

// Phương thức vận chuyển (Script 04)
export const TRANSPORT_MODE = {
  GROUND: 'Ground',
  AIR: 'Air',
};

// Hạng chuồng của ngựa trong đơn (Script 04)
export const STALL_CLASS = {
  SHARED: 'Shared',
  COMFORT: 'Comfort',
  PRIVATE: 'Private',
};

// Vai trò nhân sự tổ đội chuyến đi (TripCrew - Script 04)
export const CREW_ROLE = {
  DRIVER: 'Driver',
  ESCORT: 'Escort',
};

// Tình trạng ngựa khi nghiệm thu bàn giao e-POD (Script 02 & Script 04)
export const HANDOVER_CONDITION = {
  EXCELLENT: 'Excellent',
  NORMAL_FATIGUE: 'NormalFatigue',
  INJURED: 'Injured',
};

// Định dạng mã định danh ngựa, khớp với validate của backend (HorseRequests.cs)
// Microchip chuẩn ISO 11784/11785: đúng 15 chữ số
export const MICROCHIP_PATTERN = /^\s*[0-9]{15}\s*$/;
// Hộ chiếu UELN: 3 số mã quốc gia + 3 số mã cơ quan cấp + 9 chữ/số định danh
export const UELN_PATTERN = /^\s*[0-9]{6}[A-Za-z0-9]{9}\s*$/;
