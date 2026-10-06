import { useState } from 'react';
import { Layout } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';
import AppSidebar from '@components/layout/AppSidebar';
import AppHeader from '@components/layout/AppHeader';
import ContentWrapper from '@components/layout/ContentWrapper';

/**
 * Layout tổng thể của ứng dụng, kết nối Sidebar, Header và ContentWrapper
 * @returns {JSX.Element}
 */
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  /**
   * Xử lý đăng xuất và điều hướng về trang đăng nhập
   */
  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar collapsed={collapsed} user={user} />
      <Layout>
        <AppHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          user={user}
          onLogout={handleLogout}
        />
        <ContentWrapper>
          <Outlet />
        </ContentWrapper>
      </Layout>
    </Layout>
  );
}
