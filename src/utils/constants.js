export const ROLES = {
  CUSTOMER: 'Customer',
  MANAGER: 'LogisticsManager',
  SPECIALIST: 'TransportSpecialist',
  COORDINATOR: 'FleetCoordinator',
  DRIVER: 'DriverEscort',
  ADMIN: 'Admin',
};

// Vòng đời đơn đặt chuyến (st1_booking.png & Script 04)
export const BOOKING_STATUS = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  ASSIGNED: 'Assigned',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
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
