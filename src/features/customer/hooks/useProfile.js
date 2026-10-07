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
          FullName: user?.FullName || MOCK_PROFILE.FullName,
          Email: user?.Email || MOCK_PROFILE.Email,
          PhoneNumber: user?.PhoneNumber || MOCK_PROFILE.PhoneNumber,
          Role: user?.Role || MOCK_PROFILE.Role,
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
