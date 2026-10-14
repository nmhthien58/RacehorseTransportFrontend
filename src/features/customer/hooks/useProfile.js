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
    staffId: 'STAFF-LM-001',
    department: 'Ban Giám Đốc Quản trị & Điều hành Hệ thống',
  },
  LogisticsManager: {
    clubName: 'Racehorse Transport Operations Center',
    address: 'Trung tâm Điều phối Logistics & Trạm trung chuyển Nội Bài, Hà Nội',
    membershipTier: 'Logistics Operations Manager',
    staffId: 'STAFF-LM-001',
    department: 'Ban Quản lý & Điều phối Vận hành Logistics',
  },
  Manager: {
    clubName: 'Racehorse Transport Operations Center',
    address: 'Trung tâm Điều phối Logistics & Trạm trung chuyển Nội Bài, Hà Nội',
    membershipTier: 'Logistics Operations Manager',
    staffId: 'STAFF-LM-001',
    department: 'Ban Quản lý & Điều phối Vận hành Logistics',
  },
  TransportSpecialist: {
    clubName: 'FEI Veterinary & Quarantine Division',
    address: 'Phòng Thú y Kiểm định Cảng hàng không Quốc tế Tân Sơn Nhất',
    membershipTier: 'FEI Accredited Veterinary Specialist',
    staffId: 'STAFF-SP-002',
    department: 'Bộ phận Thú y & Hồ sơ Kiểm dịch Xuất Nhập Cảnh',
  },
  Specialist: {
    clubName: 'FEI Veterinary & Quarantine Division',
    address: 'Phòng Thú y Kiểm định Cảng hàng không Quốc tế Tân Sơn Nhất',
    membershipTier: 'FEI Accredited Veterinary Specialist',
    staffId: 'STAFF-SP-002',
    department: 'Bộ phận Thú y & Hồ sơ Kiểm dịch Xuất Nhập Cảnh',
  },
  FleetCoordinator: {
    clubName: 'GPS Live Dispatch Command Unit',
    address: 'Trung tâm Giám sát GPS & Hộ tống Vận chuyển Đường cao tốc',
    membershipTier: 'Fleet & Route Operations Coordinator',
    staffId: 'STAFF-FC-003',
    department: 'Bộ phận Điều phối Đội xe & Giám sát Lộ trình',
  },
  Coordinator: {
    clubName: 'GPS Live Dispatch Command Unit',
    address: 'Trung tâm Giám sát GPS & Hộ tống Vận chuyển Đường cao tốc',
    membershipTier: 'Fleet & Route Operations Coordinator',
    staffId: 'STAFF-FC-003',
    department: 'Bộ phận Điều phối Đội xe & Giám sát Lộ trình',
  },
  Driver: {
    clubName: 'Equine Van & Heavy Hauler Fleet',
    address: 'Đội xe rơ-moóc chuyên dụng miền Nam, TP. Thủ Đức',
    membershipTier: 'Class-A Licensed Professional Equine Hauler',
    staffId: 'STAFF-DR-004',
    department: 'Đội ngũ Tài xế Vận tải Chuyên trách Đạt chuẩn FEI',
  },
  Escort: {
    clubName: 'International Equine Flight Escort Squad',
    address: 'Trung tâm Hộ tống Cảng Hàng không Quốc tế Nội Bài (HAN)',
    membershipTier: 'Certified International Flight Groom & Vet Escort',
    staffId: 'STAFF-ES-006',
    department: 'Đội ngũ Hộ tống & Chăm sóc Thú y Bay Quốc tế',
  },
};

/**
 * Hook lấy thông tin hồ sơ của tài khoản hiện tại (Customer, Admin, Manager, Specialist, Driver, Escort)
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
          fullName: user?.fullName || user?.FullName || (role === 'Admin' ? 'Trần Quốc Bảo' : role === 'LogisticsManager' || role === 'Manager' ? 'Trần Quốc Bảo' : role === 'Driver' ? 'Phạm Văn Đức' : role === 'Escort' ? 'Dr. Elena Rostova' : role === 'FleetCoordinator' || role === 'Coordinator' ? 'Lê Hoàng Nam' : role === 'TransportSpecialist' || role === 'Specialist' ? 'Nguyễn Thị Mai' : 'Jane Smith'),
          email: user?.email || user?.Email || (role === 'Admin' || role === 'LogisticsManager' || role === 'Manager' ? 'manager@test.com' : role === 'Driver' ? 'driver@test.com' : role === 'Escort' ? 'escort@test.com' : role === 'FleetCoordinator' || role === 'Coordinator' ? 'coordinator@test.com' : role === 'TransportSpecialist' || role === 'Specialist' ? 'specialist@test.com' : 'customer@test.com'),
          phoneNumber: user?.phoneNumber || user?.PhoneNumber || '+84988111222',
          role: role,
          isActive: true,
          createdAt: user?.createdAt || user?.CreatedAt || '2025-03-15T08:00:00Z',
          ...meta,
          // Ưu tiên dữ liệu thực từ user nếu có
          ...(user?.department ? { department: user.department } : {}),
          ...(user?.staffId ? { staffId: user.staffId } : {}),
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
