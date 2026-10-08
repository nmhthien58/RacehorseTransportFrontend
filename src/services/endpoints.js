/**
 * @file endpoints.js
 * @description Danh mục đường dẫn (endpoints) API đồng bộ 100% với tài liệu backend (doc/API_Huong_dan_Frontend.md)
 */

export const ENDPOINTS = {
  // 1. Auth & Hồ sơ cá nhân
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    GOOGLE_LOGIN: '/auth/google',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    // Giữ tương thích luồng cũ
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_OTP: '/auth/resend-otp',
    VERIFY_CODE: '/auth/verify-code',
  },

  // 2. Quản lý người dùng & Dropdown nhân sự
  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    SET_ACTIVE: (id) => `/users/${id}/active`,
    RESET_PASSWORD: (id) => `/users/${id}/password`,
    STAFF: '/users/staff',
  },

  // 3. Quản lý hồ sơ ngựa (Horses)
  HORSES: {
    LIST: '/horses',
    DETAIL: (id) => `/horses/${id}`,
    CREATE: '/horses',
    UPDATE: (id) => `/horses/${id}`,
    DELETE: (id) => `/horses/${id}`,
  },

  // 4. Đặt chuyến (Bookings - Flow 1)
  BOOKINGS: {
    LIST: '/bookings',
    DETAIL: (id) => `/bookings/${id}`,
    CREATE: '/bookings',
    QUOTE_PREVIEW: '/bookings/quote-preview',
    CANCEL: (id) => `/bookings/${id}/cancel`,
    APPROVE: (id) => `/bookings/${id}/approve`,
    REJECT: (id) => `/bookings/${id}/reject`,
    REASSIGN_SPECIALIST: (id) => `/bookings/${id}/reassign-specialist`,
    // Bí danh tương thích ngược
    ASSIGN: (id) => `/bookings/${id}/reassign-specialist`,
    CALCULATE_QUOTE: (id) => (id ? `/bookings/${id}/calculate-quote` : '/bookings/quote-preview'),
  },

  // 5. Hồ sơ kiểm dịch & giấy tờ (Dossiers - Flow 2)
  DOSSIERS: {
    LIST: '/dossiers',
    DETAIL: (id) => `/dossiers/${id}`,
    REQUEST_DOCUMENTS: (id) => `/dossiers/${id}/request-documents`,
    UPLOAD_DOCUMENT: (id) => `/dossiers/${id}/documents`,
    APPROVE_DOCUMENT: (docId) => `/documents/${docId}/approve`,
    REJECT_DOCUMENT: (docId) => `/documents/${docId}/reject`,
    SUBMIT_TO_AUTHORITIES: (id) => `/dossiers/${id}/submit-to-authorities`,
    CLEAR: (id) => `/dossiers/${id}/clear`,
    ISSUE: (id) => `/dossiers/${id}/issue`,
    // Bí danh tương thích ngược
    DOCUMENTS: (id) => `/dossiers/${id}/documents`,
    DOCUMENT_DETAIL: (dossierId, docId) => `/dossiers/${dossierId}/documents/${docId}`,
    APPROVE: (id) => `/dossiers/${id}/clear`,
    REJECT: (id) => `/dossiers/${id}/issue`,
    REQUIREMENTS: '/clearance/requirements',
  },

  // 6. Xếp chuyến & Điều phối (Trips - Flow 3)
  TRIPS: {
    LIST: '/trips',
    DETAIL: (id) => `/trips/${id}`,
    CREATE: '/trips',
    UPDATE: (id) => `/trips/${id}`,
    UNPLANNED_HORSES: '/trips/unplanned-horses',
    AVAILABLE_VEHICLES: '/trips/available-vehicles',
    AVAILABLE_CREW: '/trips/available-crew',
    ADD_CHECKPOINT: (id) => `/trips/${id}/checkpoints`,
    UPDATE_CHECKPOINT: (tripId, checkpointId) => `/trips/${tripId}/checkpoints/${checkpointId}`,
    DELETE_CHECKPOINT: (tripId, checkpointId) => `/trips/${tripId}/checkpoints/${checkpointId}`,
    REORDER_CHECKPOINTS: (id) => `/trips/${id}/checkpoints/order`,
    SUBMIT_PLAN: (id) => `/trips/${id}/submit`,
    APPROVE_PLAN: (id) => `/trips/${id}/approve`,
    REJECT_PLAN: (id) => `/trips/${id}/reject`,
    CANCEL: (id) => `/trips/${id}/cancel`,
    START: (id) => `/trips/${id}/start`,
    WELFARE_LOGS: (id) => `/trips/${id}/welfare-logs`,
    CREATE_WELFARE_LOG: (id) => `/trips/${id}/welfare-logs`,
    CLOSE: (id) => `/trips/${id}/close`,
    // Bí danh tương thích ngược
    UPDATE_STATUS: (id) => `/trips/${id}/status`,
    CREW: (id) => `/trips/${id}/crew`,
  },

  // 7. Vận hành trạm kiểm soát (Checkpoints - Flow 4)
  CHECKPOINTS: {
    ARRIVE: (id) => `/checkpoints/${id}/arrive`,
    CLEAR: (id) => `/checkpoints/${id}/clear`,
    DEPART: (id) => `/checkpoints/${id}/depart`,
  },

  // 8. Theo dõi hành trình (Tracking)
  TRACKING: {
    TRIPS: '/tracking/trips',
    BOOKING: (bookingId) => `/tracking/bookings/${bookingId}`,
    // Bí danh tương thích ngược
    CHECKPOINTS: (tripId) => `/trips/${tripId}/checkpoints`,
    UPDATE_CHECKPOINT: (tripId, cpId) => `/trips/${tripId}/checkpoints/${cpId}`,
    WELFARE_LOGS: (tripId) => `/trips/${tripId}/welfare-logs`,
  },

  // 9. Quản lý sự cố phát sinh (Incidents - Flow 5)
  INCIDENTS: {
    LIST: '/incidents',
    DETAIL: (id) => `/incidents/${id}`,
    CREATE_FOR_TRIP: (tripId) => `/trips/${tripId}/incidents`,
    LIST_BY_TRIP: (tripId) => `/trips/${tripId}/incidents`,
    PROPOSE_PLAN: (id) => `/incidents/${id}/propose`,
    APPROVE_PLAN: (id) => `/incidents/${id}/approve`,
    REJECT_PLAN: (id) => `/incidents/${id}/reject`,
    APPLY_REROUTE: (id) => `/incidents/${id}/apply-reroute`,
    RESOLVE: (id) => `/incidents/${id}/resolve`,
    // Bí danh tương thích ngược
    CREATE: '/incidents',
    APPROVE: (id) => `/incidents/${id}/approve`,
    REJECT: (id) => `/incidents/${id}/reject`,
  },

  // 10. Nghiệm thu bàn giao e-POD & Đóng chuyến (Handover - Flow 6)
  HANDOVER: {
    CREATE_FOR_TRIP: (tripId) => `/trips/${tripId}/handover`,
    BY_TRIP: (tripId) => `/trips/${tripId}/handovers`,
    BY_BOOKING: (bookingId) => `/bookings/${bookingId}/handovers`,
    CLOSE_TRIP: (tripId) => `/trips/${tripId}/close`,
    // Bí danh tương thích ngược
    CREATE: '/handovers',
    DETAIL: (tripId) => `/trips/${tripId}/handover`,
  },

  // 11. Báo cáo tổng hợp
  REPORTS: {
    SUMMARY: '/reports/summary',
  },

  // 12. Danh mục loại giấy tờ (Document Types)
  DOCUMENT_TYPES: {
    LOOKUP: '/document-types/lookup',
    LIST: '/document-types',
    DETAIL: (id) => `/document-types/${id}`,
    CREATE: '/document-types',
    UPDATE: (id) => `/document-types/${id}`,
    DELETE: (id) => `/document-types/${id}`,
  },

  // 13. Phương tiện (Assets), Bảng giá (Pricing) & Thông báo (Notifications)
  ASSETS: {
    LIST: '/assets',
    DETAIL: (id) => `/assets/${id}`,
  },
  PRICING: {
    ITEMS: '/pricing/items',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
  },
};

export default ENDPOINTS;
