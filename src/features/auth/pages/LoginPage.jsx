import { useState } from 'react';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { loginApi } from '@features/auth/services/authService';
import { useGoogleAuth } from '@features/auth/hooks/useGoogleAuth';
import GoogleIcon from '@features/auth/components/GoogleIcon';
import { ROUTES } from '@routes/routes';
import { ROLES } from '@utils/constants';
import usersData from '@/mocks/data/users.json';
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';

const TEST_ACCOUNTS = [
  { label: 'Customer (Khách hàng)', email: 'customer@test.com', role: ROLES.CUSTOMER },
  { label: 'Admin (Quản trị viên)', email: 'admin@test.com', role: ROLES.ADMIN },
  { label: 'Manager (Điều phối)', email: 'manager@test.com', role: ROLES.MANAGER },
  { label: 'Specialist (Kiểm dịch)', email: 'specialist@test.com', role: ROLES.SPECIALIST },
  { label: 'Coordinator', email: 'coordinator@test.com', role: ROLES.COORDINATOR },
  { label: 'Driver', email: 'driver@test.com', role: ROLES.DRIVER },
];

/**
 * Trang Đăng nhập (Sign In) khớp thiết kế Figma node 94:1089.
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { loginWithGoogle, isGoogleLoading } = useGoogleAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      let user = null;
      let token = null;
      let refreshToken = null;

      try {
        const res = await loginApi({
          email: values.email,
          password: values.password,
        });

        user = res.user || res.data?.user;
        token = res.token || res.data?.accessToken || `mock-token-${user?.userId}`;
        refreshToken = res.refreshToken || res.data?.refreshToken || null;
      } catch (apiErr) {
        // Fallback tự động tìm trong mock data nếu API mạng lỗi
        console.warn('API login failed, checking mock users fallback:', apiErr);
        const localUser = usersData.find(
          (u) => u.email.toLowerCase() === (values.email || '').toLowerCase(),
        );
        if (localUser) {
          user = localUser;
          token = `mock-token-${localUser.userId}`;
          refreshToken = `mock-refresh-token-${localUser.userId}`;
        } else {
          throw apiErr;
        }
      }

      if (!user) {
        throw new Error('User not found');
      }

      login(user, token, refreshToken);
      message.success(t('auth.loginSuccess', 'Đăng nhập thành công!'));

      // Chuyển hướng theo role của người dùng (tách biệt rõ ràng quyền hạn)
      const dashboardMap = {
        [ROLES.CUSTOMER]: ROUTES.CUSTOMER_DASHBOARD,
        [ROLES.MANAGER]: ROUTES.MANAGER_DASHBOARD,
        [ROLES.ADMIN]: ROUTES.MANAGER_DASHBOARD,
        [ROLES.SPECIALIST]: ROUTES.SPECIALIST_DASHBOARD,
        [ROLES.COORDINATOR]: ROUTES.COORDINATOR_DASHBOARD,
        [ROLES.DRIVER]: ROUTES.DRIVER_DASHBOARD,
      };

      const userRole = user?.role || user?.Role;
      const targetRoute = dashboardMap[userRole] || ROUTES.CUSTOMER_DASHBOARD;
      navigate(targetRoute, { replace: true });
    } catch {
      message.error(t('auth.loginFailed', 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng nhập nhanh 1-click cho môi trường thử nghiệm
   * @param {string} email
   */
  const handleQuickLogin = async (email) => {
    form.setFieldsValue({
      email,
      password: 'password123',
    });
    await handleLogin({ email, password: 'password123' });
  };

  /**
   * Điền nhanh thông tin tài khoản thử nghiệm vào form
   * @param {string} email
   */
  const handleQuickFill = (email) => {
    form.setFieldsValue({
      email,
      password: 'password123',
    });
  };

  return (
    <div>
      {/* Header & Logo */}
      <div className={styles.headerSection}>
        <div className={styles.logoContainer}>
          <img src={logoImg} alt="International Equine Transport" className={styles.logoImage} />
        </div>
        <h1 className={styles.pageTitle}>{t('auth.signInTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('auth.signInSubtitle')}</p>
      </div>

      {/* Sign in with Google button */}
      <button
        type="button"
        className={styles.googleBtn}
        onClick={loginWithGoogle}
        disabled={isGoogleLoading}
        aria-label="Sign in with Google"
      >
        <GoogleIcon size={18} />
        <span>{t('auth.signInWithGoogle')}</span>
      </button>

      {/* Divider "or" */}
      <div className={styles.divider}>
        <span className={styles.dividerText}>{t('auth.or')}</span>
      </div>

      {/* Form đăng nhập */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleLogin}
        initialValues={{
          email: 'customer@test.com',
          password: 'password123',
          keepLoggedIn: true,
        }}
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label={t('auth.email')}
          className={styles.formItem}
          rules={[
            { required: true, message: t('auth.enterEmail') },
            { type: 'email', message: t('auth.enterEmail') },
          ]}
        >
          <Input
            placeholder="jonas_kahnwald@gmail.com"
            className={styles.inputField}
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={t('auth.password')}
          className={styles.formItem}
          rules={[{ required: true, message: t('auth.enterPassword') }]}
        >
          <Input.Password
            placeholder="••••••••••••"
            className={styles.inputField}
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item name="keepLoggedIn" valuePropName="checked" style={{ marginBottom: 16 }}>
          <Checkbox>{t('auth.keepMeLoggedIn')}</Checkbox>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          className={styles.submitBtn}
          loading={loading}
          block
        >
          {t('auth.signInButton')}
        </Button>

        <span
          className={styles.forgotLink}
          onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          role="button"
          tabIndex={0}
        >
          {t('auth.forgotPassword')}
        </span>
      </Form>

      {/* Footer link to register */}
      <div className={styles.footerSection}>
        <span>{t('auth.needAccount')}</span>
        <span
          className={styles.footerLink}
          onClick={() => navigate(ROUTES.REGISTER)}
          role="button"
          tabIndex={0}
        >
          {t('auth.createOne')}
        </span>
      </div>

      {/* Thanh tài khoản thử nghiệm phục vụ kiểm thử nhanh */}
      <div className={styles.testAccountsCard}>
        <div className={styles.testAccountsTitle} style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
          ⚡ {t('auth.testAccounts', 'Tài khoản kiểm thử')} (Click để đăng nhập 1-chạm):
        </div>
        <div className={styles.testAccountsBadges} style={{ marginBottom: 12 }}>
          {TEST_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className={styles.badgeBtn}
              onClick={() => handleQuickLogin(acc.email)}
              title={`Đăng nhập trực tiếp với ${acc.label}`}
              style={{
                cursor: 'pointer',
                fontWeight: acc.role === ROLES.CUSTOMER || acc.role === ROLES.ADMIN ? 700 : 500,
                backgroundColor: acc.role === ROLES.ADMIN ? '#FEF3C7' : acc.role === ROLES.CUSTOMER ? '#EFF6FF' : '#F1F5F9',
                color: acc.role === ROLES.ADMIN ? '#B45309' : acc.role === ROLES.CUSTOMER ? '#1D4ED8' : '#334155',
                borderColor: acc.role === ROLES.ADMIN ? '#FDE68A' : acc.role === ROLES.CUSTOMER ? '#BFDBFE' : '#CBD5E1',
                padding: '4px 10px',
                borderRadius: 6,
              }}
            >
              {acc.label}
            </button>
          ))}
        </div>

        {/* Bảng ghi chú tài khoản cụ thể cho người dùng */}
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.6,
            background: '#ffffff',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            color: '#475569',
          }}
        >
          <div style={{ marginBottom: 4 }}>
            👤 <b>Customer (Khách hàng):</b> <code>customer@test.com</code> | Mật khẩu: <code>password123</code>
          </div>
          <div>
            🛡️ <b>Admin (Quản trị viên):</b> <code>admin@test.com</code> | Mật khẩu: <code>password123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
