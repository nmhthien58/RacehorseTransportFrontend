import { useState } from 'react';
import { Button, Checkbox, Col, Form, Input, Row, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { registerApi } from '@features/auth/services/authService';
import { useGoogleAuth } from '@features/auth/hooks/useGoogleAuth';
import GoogleIcon from '@features/auth/components/GoogleIcon';
import { ROUTES } from '@routes/routes';
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';

/**
 * Trang Đăng ký (Sign Up) khớp thiết kế Figma node 94:1240.
 */
export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { loginWithGoogle, isGoogleLoading } = useGoogleAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error(t('auth.passwordMismatch'));
      return;
    }

    try {
      setLoading(true);
      const fullName = `${values.firstName || ''} ${values.lastName || ''}`.trim();
      const res = await registerApi({
        fullName: fullName || 'New Customer',
        email: values.email,
        password: values.password,
      });

      // Backend không còn xác minh email: đăng ký xong trả luôn token nên đăng nhập ngay
      const authData = res.data || res;
      login(authData.user, authData.accessToken, authData.refreshToken);
      message.success(t('auth.registerSuccess'));
      navigate(ROUTES.CUSTOMER_DASHBOARD, { replace: true });
    } catch (err) {
      message.error(err?.userMessage || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header & Logo */}
      <div className={styles.headerSection}>
        <div className={styles.logoContainer}>
          <img src={logoImg} alt="International Equine Transport" className={styles.logoImage} />
        </div>
        <h1 className={styles.pageTitle}>{t('auth.signUpTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('auth.signUpSubtitle')}</p>
      </div>

      {/* Form đăng ký */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleRegister}
        initialValues={{
          keepLoggedIn: true,
        }}
        requiredMark={false}
      >
        {/* Hàng 2 cột: First name & Last name */}
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label={t('auth.firstName')}
              className={styles.formItem}
              rules={[{ required: true, message: t('auth.firstName') }]}
            >
              <Input placeholder="Jane" className={styles.inputField} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label={t('auth.lastName')}
              className={styles.formItem}
              rules={[{ required: true, message: t('auth.lastName') }]}
            >
              <Input placeholder="Smith" className={styles.inputField} />
            </Form.Item>
          </Col>
        </Row>

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
          rules={[
            { required: true, message: t('auth.enterPassword') },
            // Khớp ràng buộc backend: mật khẩu 8-64 ký tự
            { min: 8, max: 64, message: t('auth.passwordLength') },
          ]}
        >
          <Input.Password
            placeholder="••••••••••••"
            className={styles.inputField}
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={t('auth.confirmPassword')}
          className={styles.formItem}
          rules={[
            { required: true, message: t('auth.confirmPassword') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('auth.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="••••••••••••"
            className={styles.inputField}
            autoComplete="new-password"
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
          {t('auth.signUpButton')}
        </Button>
      </Form>

      {/* Divider "or" */}
      <div className={styles.divider}>
        <span className={styles.dividerText}>{t('auth.or')}</span>
      </div>

      {/* Sign up with Google button */}
      <button
        type="button"
        className={styles.googleBtn}
        onClick={loginWithGoogle}
        disabled={isGoogleLoading}
        aria-label="Sign up with Google"
      >
        <GoogleIcon size={18} />
        <span>{t('auth.signUpWithGoogle')}</span>
      </button>

      {/* Footer link to sign in */}
      <div className={styles.footerSection}>
        <span>{t('auth.alreadyHaveAccount')}</span>
        <span
          className={styles.footerLink}
          onClick={() => navigate(ROUTES.LOGIN)}
          role="button"
          tabIndex={0}
        >
          {t('auth.signInButton')}
        </span>
      </div>
    </div>
  );
}
