export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    GOOGLE_LOGIN: '/auth/google',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_OTP: '/auth/resend-otp',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_CODE: '/auth/verify-code',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Horses
  HORSES: {
    LIST: '/horses',
    DETAIL: (id) => `/horses/${id}`,
    CREATE: '/horses',
    UPDATE: (id) => `/horses/${id}`,
    DELETE: (id) => `/horses/${id}`,
  },

  // Bookings (Flow 1 & Pricing)
  BOOKINGS: {
    LIST: '/bookings',
    DETAIL: (id) => `/bookings/${id}`,
    CREATE: '/bookings',
    APPROVE: (id) => `/bookings/${id}/approve`,
    REJECT: (id) => `/bookings/${id}/reject`,
    ASSIGN: (id) => `/bookings/${id}/assign`,
    CANCEL: (id) => `/bookings/${id}/cancel`,
    CALCULATE_QUOTE: (id) => `/bookings/${id}/calculate-quote`,
  },

  // Dossiers & Clearance (Flow 2)
  DOSSIERS: {
    LIST: '/dossiers',
    DETAIL: (id) => `/dossiers/${id}`,
    APPROVE: (id) => `/dossiers/${id}/approve`,
    REJECT: (id) => `/dossiers/${id}/reject`,
    DOCUMENTS: (id) => `/dossiers/${id}/documents`,
    DOCUMENT_DETAIL: (dossierId, docId) => `/dossiers/${dossierId}/documents/${docId}`,
    REQUIREMENTS: '/clearance/requirements',
  },

  // Fleet & Trips (Flow 3)
  ASSETS: {
    LIST: '/assets',
    DETAIL: (id) => `/assets/${id}`,
  },
  TRIPS: {
    LIST: '/trips',
    DETAIL: (id) => `/trips/${id}`,
    CREATE: '/trips',
    UPDATE_STATUS: (id) => `/trips/${id}/status`,
    SUBMIT_PLAN: (id) => `/trips/${id}/submit-plan`,
    APPROVE_PLAN: (id) => `/trips/${id}/approve-plan`,
    REJECT_PLAN: (id) => `/trips/${id}/reject-plan`,
    CREW: (id) => `/trips/${id}/crew`,
    CLOSE: (id) => `/trips/${id}/close`,
  },

  // Tracking (Flow 4)
  TRACKING: {
    CHECKPOINTS: (tripId) => `/trips/${tripId}/checkpoints`,
    UPDATE_CHECKPOINT: (tripId, cpId) => `/trips/${tripId}/checkpoints/${cpId}`,
    WELFARE_LOGS: (tripId) => `/trips/${tripId}/welfare-logs`,
  },

  // Incidents (Flow 5)
  INCIDENTS: {
    LIST: '/incidents',
    DETAIL: (id) => `/incidents/${id}`,
    CREATE: '/incidents',
    PROPOSE_PLAN: (id) => `/incidents/${id}/plan`,
    APPROVE: (id) => `/incidents/${id}/approve`,
    REJECT: (id) => `/incidents/${id}/reject`,
    RESOLVE: (id) => `/incidents/${id}/resolve`,
  },

  // Handover & e-POD (Flow 6)
  HANDOVER: {
    CREATE: '/handovers',
    DETAIL: (tripId) => `/trips/${tripId}/handover`,
  },

  // Pricing (Script 04)
  PRICING: {
    ITEMS: '/pricing/items',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
  },
};
