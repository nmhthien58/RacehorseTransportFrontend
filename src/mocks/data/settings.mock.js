/**
 * @file settings.mock.js
 * @description Dữ liệu mẫu cấu hình cài đặt thông báo và bảo mật
 */

export const MOCK_SETTINGS = {
  notifications: {
    emailTripUpdates: true,
    smsEmergencyAlerts: true,
    quoteApprovalNotification: true,
    marketingNewsletter: false,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeoutMinutes: 30,
    loginAlerts: true,
  },
};
