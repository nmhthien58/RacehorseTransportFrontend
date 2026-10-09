import { useState, useEffect } from 'react';
import { useAuthStore } from '@features/auth/store/authStore';

const DEFAULT_PROFILE = {
  userId: 5,
  fullName: 'Jane Smith',
  email: 'customer@test.com',
  phoneNumber: '+84988111222',
  clubName: 'CLB Ngựa Đua Vina Equine & Ba Vì Racing Stables',
  role: 'Customer',
  address: 'Trang trại sinh thái Yên Bài, Ba Vì, Hà Nội, Việt Nam',
  membershipTier: 'VIP Diamond Member (FEI Registered Owner)',
  feiOwnerId: 'VN-OWN-2024-0089',
  isActive: true,
  createdAt: '2025-03-15T08:00:00Z',
};

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
          ...DEFAULT_PROFILE,
          fullName: user?.fullName || user?.FullName || DEFAULT_PROFILE.fullName,
          email: user?.email || user?.Email || DEFAULT_PROFILE.email,
          phoneNumber: user?.phoneNumber || user?.PhoneNumber || DEFAULT_PROFILE.phoneNumber,
          role: user?.role || user?.Role || DEFAULT_PROFILE.role,
        };
        setData(merged);
      } catch (err) {
        console.error('Lỗi khi lấy thông tin profile:', err);
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
