import { useState, useEffect } from 'react';
import { MOCK_PROFILE } from '@mocks/data/profile.mock';
import { useAuthStore } from '@features/auth/store/authStore';

/**
 * Hook lấy thông tin hồ sơ của khách hàng hiện tại.
 * Kết hợp thông tin phiên đăng nhập từ useAuthStore và dữ liệu hồ sơ chi tiết.
 *
 * @returns {{ data: any|null, loading: boolean, error: Error|null }}
 */
export function useProfile() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const merged = {
          ...MOCK_PROFILE,
          fullName: user?.fullName || MOCK_PROFILE.fullName,
          email: user?.email || MOCK_PROFILE.email,
          phoneNumber: user?.phoneNumber || MOCK_PROFILE.phoneNumber,
          role: user?.role || MOCK_PROFILE.role,
        };
        setData(merged);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [user]);

  return { data, loading, error };
}

export default useProfile;
