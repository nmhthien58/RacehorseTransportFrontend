import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';

/**
 * Route bảo vệ: Bắt buộc đăng nhập và kiểm tra quyền hạn vai trò (Role-based access control)
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - Danh sách các vai trò được phép truy cập
 * @returns {JSX.Element}
 */
export default function PrivateRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Nếu có giới hạn role, kiểm tra chính xác vai trò được cấp phép (Logistic Manager & Admin là 1)
  if (allowedRoles && allowedRoles.length > 0) {
    const rawRole = user?.role || user?.Role;
    const normalizedRole = (rawRole === 'Admin' || rawRole === 'LogisticsManager')
      ? 'LogisticsManager'
      : (rawRole === 'DriverEscort')
      ? 'Driver'
      : (rawRole === 'Coordinator' || rawRole === 'FleetCoordinator')
      ? 'FleetCoordinator'
      : (rawRole === 'Specialist' || rawRole === 'TransportSpecialist')
      ? 'TransportSpecialist'
      : rawRole;

    const normalizedAllowed = allowedRoles.map((r) =>
      (r === 'Admin' || r === 'LogisticsManager') ? 'LogisticsManager' :
      (r === 'Coordinator' || r === 'FleetCoordinator') ? 'FleetCoordinator' :
      (r === 'Specialist' || r === 'TransportSpecialist') ? 'TransportSpecialist' : r
    );

    if (!normalizedRole || !normalizedAllowed.includes(normalizedRole)) {
      return <Navigate to={ROUTES.FORBIDDEN} replace />;
    }
  }

  return <Outlet />;
}
