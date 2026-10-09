import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';

/**
 * Route bảo vệ: Bắt buộc đăng nhập trước khi truy cập tài khoản và dịch vụ
 */
export default function PrivateRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
