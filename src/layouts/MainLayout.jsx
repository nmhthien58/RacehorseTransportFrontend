// Đang sửa MainLayout vì trên điện thoại sidebar cố định 250px che gần hết nội dung: dưới md dùng Drawer
import { useState } from 'react';
import { Drawer, Grid, Layout } from 'antd';
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
  // Điện thoại / máy tính bảng dọc (< 768px): sidebar ẩn, mở bằng nút menu ở header thành Drawer
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  /**
   * Xử lý đăng xuất và điều hướng về trang đăng nhập
   */
  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const currentUser = user || { FullName: 'Kaze Lee', Role: 'Customer' };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          closable={false}
          size={250}
          styles={{ body: { padding: 0 } }}
        >
          <AppSidebar collapsed={false} user={currentUser} onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      ) : (
        <AppSidebar collapsed={collapsed} user={currentUser} />
      )}
      <Layout style={{ minWidth: 0 }}>
        <AppHeader
          collapsed={isMobile ? !drawerOpen : collapsed}
          onToggleCollapse={() => (isMobile ? setDrawerOpen((open) => !open) : setCollapsed(!collapsed))}
          user={currentUser}
          onLogout={handleLogout}
        />
        <ContentWrapper>
          <Outlet />
        </ContentWrapper>
      </Layout>
    </Layout>
  );
}
