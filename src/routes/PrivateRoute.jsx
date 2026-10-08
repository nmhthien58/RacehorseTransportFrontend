import { Outlet } from 'react-router-dom';

/**
 * Route bảo vệ: Cho phép truy cập trực tiếp không bắt buộc đăng nhập
 */
export default function PrivateRoute() {
  return <Outlet />;
}
