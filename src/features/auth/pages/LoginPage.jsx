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
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';

const TEST_ACCOUNTS = [
  { label: 'Customer', email: 'customer@test.com', role: ROLES.CUSTOMER },
  { label: 'Manager', email: 'manager@test.com', role: ROLES.MANAGER },
  { label: 'Specialist', email: 'specialist@test.com', role: ROLES.SPECIALIST },
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
      const res = await loginApi({
        email: values.email,
        password: values.password,
      });

      const user = res.user || res.data?.user;
      const token = res.token || res.data?.accessToken || `mock-token-${user?.UserID}`;
      const refreshToken = res.refreshToken || res.data?.refreshToken || null;
      login(user, token, refreshToken);

      message.success(t('auth.loginSuccess', 'Đăng nhập thành công!'));

      // Chuyển hướng theo role của người dùng
      const dashboardMap = {
        [ROLES.CUSTOMER]: ROUTES.CUSTOMER_DASHBOARD,
        [ROLES.MANAGER]: ROUTES.MANAGER_DASHBOARD,
        [ROLES.SPECIALIST]: ROUTES.SPECIALIST_DASHBOARD,
        [ROLES.COORDINATOR]: ROUTES.COORDINATOR_DASHBOARD,
        [ROLES.DRIVER]: ROUTES.DRIVER_DASHBOARD,
      };

      const targetRoute = dashboardMap[user.Role] || ROUTES.CUSTOMER_DASHBOARD;
      navigate(targetRoute, { replace: true });
    } catch {
      message.error(t('auth.loginFailed', 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Điền nhanh thông tin tài khoản thử nghiệm
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

      {/* Thanh điền nhanh các role phục vụ test quy trình */}
      <div className={styles.testAccountsCard}>
        <div className={styles.testAccountsTitle}>⚡ {t('auth.testAccounts')}:</div>
        <div className={styles.testAccountsBadges}>
          {TEST_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className={styles.badgeBtn}
              onClick={() => handleQuickFill(acc.email)}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
