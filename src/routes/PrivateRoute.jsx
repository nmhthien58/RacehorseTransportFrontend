import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from './routes';

export default function PrivateRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Chưa login → redirect về login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Không đủ quyền → 403
  if (allowedRoles && !allowedRoles.includes(user?.Role)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return <Outlet />;
}
