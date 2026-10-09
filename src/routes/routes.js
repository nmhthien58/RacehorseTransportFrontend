export const ROUTES = {
  // Public
  HOME: '/',
  TRANSPORT_TYPES: '/transport',
  PRICING: '/pricing',
  HOW_IT_WORKS: '/how-it-works',
  BECOME_HAULER: '/become-a-hauler',
  DOOR_TO_DOOR: '/door-to-door',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_CODE: '/verify-code',
  RESET_PASSWORD: '/reset-password',
  FORBIDDEN: '/403',
  NOT_FOUND: '/404',

  // Customer
  CUSTOMER_DASHBOARD: '/customer/dashboard',
  CUSTOMER_HORSES: '/customer/horses',
  CUSTOMER_HORSE_NEW: '/customer/horses/new',
  CUSTOMER_HORSE_DETAIL: '/customer/horses/:id',
  CUSTOMER_VET_RECORDS: '/customer/vet-records',
  CUSTOMER_BOOKINGS: '/customer/bookings',
  CUSTOMER_BOOKING_NEW: '/customer/bookings/new',
  CUSTOMER_BOOKING_DETAIL: '/customer/bookings/:id',
  CUSTOMER_PRICING: '/customer/pricing',
  CUSTOMER_TRIPS: '/customer/trips',
  CUSTOMER_MESSAGES: '/customer/messages',
  CUSTOMER_PROFILE: '/customer/profile',
  CUSTOMER_BILLING: '/customer/billing',
  CUSTOMER_SETTINGS: '/customer/settings',

  // Manager
  MANAGER_DASHBOARD: '/manager/dashboard',
  MANAGER_BOOKINGS: '/manager/bookings',
  MANAGER_BOOKING_DETAIL: '/manager/bookings/:id',
  MANAGER_PENDING_REQUESTS: '/manager/pending-requests',
  MANAGER_TRIPS: '/manager/trips',
  MANAGER_REPORTS: '/manager/reports',
  MANAGER_PROFILE: '/manager/profile',

  // Specialist
  SPECIALIST_DASHBOARD: '/specialist/dashboard',
  SPECIALIST_DOSSIERS: '/specialist/dossiers',
  SPECIALIST_DOSSIER_DETAIL: '/specialist/dossiers/:id',
  SPECIALIST_DOCUMENTS: '/specialist/documents',

  // Coordinator
  COORDINATOR_DASHBOARD: '/coordinator/dashboard',
  COORDINATOR_FLEET: '/coordinator/fleet',
  COORDINATOR_TRIPS: '/coordinator/trips',
  COORDINATOR_TRIP_DETAIL: '/coordinator/trips/:id',
  COORDINATOR_INCIDENTS: '/coordinator/incidents',

  // Driver
  DRIVER_DASHBOARD: '/driver/dashboard',
  DRIVER_TRIPS: '/driver/trips',
  DRIVER_TRIP_DETAIL: '/driver/trips/:id',
  DRIVER_WELFARE_LOG: '/driver/trips/:id/welfare-log',

  // Shared
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
};
