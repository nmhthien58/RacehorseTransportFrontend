import { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
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

/**
 * Hook lấy và lưu trữ tùy chọn cài đặt thông báo & bảo mật của Customer.
 *
 * @returns {{
 *   data: any|null,
 *   loading: boolean,
 *   error: Error|null,
 *   updateSettings: (partial: any) => void
 * }}
 */
export function useSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(DEFAULT_SETTINGS);
      } catch (err) {
        console.error('Lỗi khi tải cấu hình settings:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const updateSettings = (partial) => {
    setData((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  return { data, loading, error, updateSettings };
}

export default useSettings;
