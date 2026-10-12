import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';
import { ROLES } from '@utils/constants';

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
      : rawRole;

    const normalizedAllowed = allowedRoles.map((r) =>
      (r === 'Admin' || r === 'LogisticsManager') ? 'LogisticsManager' : r
    );

    if (!normalizedRole || !normalizedAllowed.includes(normalizedRole)) {
      return <Navigate to={ROUTES.FORBIDDEN} replace />;
    }
  }

  return <Outlet />;
}
