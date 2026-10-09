import { useState, useEffect } from 'react';
import { useAuthStore } from '@features/auth/store/authStore';

const ROLE_METADATA = {
  Customer: {
    clubName: 'CLB Ngựa Đua Vina Equine & Ba Vì Racing Stables',
    address: 'Trang trại sinh thái Yên Bài, Ba Vì, Hà Nội, Việt Nam',
    membershipTier: 'VIP Diamond Member (FEI Registered Owner)',
    feiOwnerId: 'VN-OWN-2024-0089',
    department: 'Khách hàng cá nhân / Chủ ngựa đua',
  },
  Admin: {
    clubName: 'Racehorse Transport International HQ',
    address: 'Trụ sở Điều hành Trung tâm, Tòa nhà Landmark, TP. Hồ Chí Minh',
    membershipTier: 'System Administrator (Full Access)',
    feiOwnerId: 'ADM-SYS-2026-0001',
    department: 'Ban Giám Đốc & Quản Trị Hệ Thống',
  },
  Manager: {
    clubName: 'Racehorse Transport Operations Center',
    address: 'Trung tâm Điều phối Logistics & Trạm trung chuyển Nội Bài, Hà Nội',
    membershipTier: 'Operations Logistics Manager',
    feiOwnerId: 'MGR-OPS-2026-0012',
    department: 'Bộ phận Quản lý Điều phối Logistics & Vận chuyển Đội xe',
  },
  Specialist: {
    clubName: 'FEI Veterinary & Quarantine Division',
    address: 'Phòng Thú y Kiểm định Cảng hàng không Quốc tế Tân Sơn Nhất',
    membershipTier: 'FEI Accredited Veterinary Specialist',
    feiOwnerId: 'VET-FEI-2026-0077',
    department: 'Bộ phận Thú y & Hồ sơ Kiểm dịch Xuất Nhập Cảnh',
  },
  Coordinator: {
    clubName: 'GPS Live Dispatch Command Unit',
    address: 'Trung tâm Giám sát GPS & Hộ tống Vận chuyển Đường cao tốc',
    membershipTier: 'Fleet & Route Operations Coordinator',
    feiOwnerId: 'CRD-OPS-2026-0043',
    department: 'Bộ phận Điều phối Đội xe & Giám sát Hành trình',
  },
  Driver: {
    clubName: 'Equine Van & Heavy Hauler Fleet',
    address: 'Đội xe rơ-moóc chuyên dụng miền Nam, TP. Thủ Đức',
    membershipTier: 'Class-A Licensed Professional Equine Hauler',
    feiOwnerId: 'DRV-FEI-2026-0099',
    department: 'Đội ngũ Tài xế Vận tải Chuyên trách Đạt chuẩn FEI',
  },
};

/**
 * Hook lấy thông tin hồ sơ của tài khoản hiện tại (Customer, Admin, Manager, Specialist, Driver)
 * Tự động đồng bộ và thích ứng theo vai trò đang đăng nhập trong useAuthStore
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
        const role = user?.role || user?.Role || 'Customer';
        const meta = ROLE_METADATA[role] || ROLE_METADATA.Customer;

        const merged = {
          userId: user?.userId || user?.UserID || 5,
          fullName: user?.fullName || user?.FullName || (role === 'Admin' ? 'Alexandre Dumas' : role === 'Manager' ? 'Michael Johnson' : 'Jane Smith'),
          email: user?.email || user?.Email || (role === 'Admin' ? 'admin@test.com' : role === 'Manager' ? 'manager@test.com' : 'customer@test.com'),
          phoneNumber: user?.phoneNumber || user?.PhoneNumber || '+84988111222',
          role: role,
          isActive: true,
          createdAt: user?.createdAt || user?.CreatedAt || '2025-03-15T08:00:00Z',
          ...meta,
        };
        setData(merged);
      } catch (err) {
        console.error('Lỗi khi lấy thông tin profile:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  return { data, loading, error };
}

export default useProfile;
