import { useState, useEffect } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyEmailApi, resendOtpApi } from '@features/auth/services/authService';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';

/**
 * Trang Xác Minh Email Tài Khoản Mới Đăng Ký (Verify Email with OTP)
 */
export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Lấy thông tin đăng ký chờ xác thực từ sessionStorage
  const pendingData = (() => {
    try {
      const raw = sessionStorage.getItem('pending_register');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const email = pendingData?.email || 'jane.smith@example.com';
  const fullName = pendingData?.fullName || 'Jane Smith';

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (values) => {
    try {
      setLoading(true);
      const res = await verifyEmailApi({
        email,
        code: values.code,
        fullName,
      });

      message.success(t('auth.accountActivated'));

      // Tự động lưu thông tin user vào Zustand authStore
      const user = res.user || {
        userId: Date.now(),
        fullName,
        email,
        role: 'Customer',
        isActive: true,
      };
      const token = res.token || `mock-token-${user.userId}`;
      login(user, token);

      // Xóa bộ nhớ tạm sau khi kích hoạt thành công
      sessionStorage.removeItem('pending_register');

      // Chuyển thẳng vào Customer Dashboard
      navigate(ROUTES.CUSTOMER_DASHBOARD, { replace: true });
    } catch {
      message.error(t('auth.codeInvalid', 'Mã xác minh không chính xác hoặc đã hết hạn.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await resendOtpApi({ email });
      message.success(t('auth.resendOtpSuccess'));
      setCountdown(60);
    } catch {
      message.error(t('auth.actionFailed', 'Không thể gửi lại mã xác minh.'));
    }
  };

  return (
    <div>
      {/* Header & Logo */}
      <div className={styles.headerSection}>
        <div className={styles.logoContainer}>
          <img src={logoImg} alt="International Equine Transport" className={styles.logoImage} />
        </div>
        <h1 className={styles.pageTitle}>{t('auth.verifyEmailTitle')}</h1>
        <p className={styles.pageSubtitle}>
          {t('auth.verifyEmailSubtitle')}:
          <br />
          <span style={{ fontWeight: 600, color: '#11223F', fontSize: 15 }}>{email}</span>
          <button
            type="button"
            onClick={() => navigate(ROUTES.REGISTER)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563EB',
              fontSize: 12,
              marginLeft: 8,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            ({t('auth.changeEmail')})
          </button>
        </p>
      </div>

      {/* Form OTP 6 chữ số */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleVerify}
        requiredMark={false}
        initialValues={{ code: '123456' }}
      >
        <Form.Item
          name="code"
          className={styles.formItem}
          rules={[{ required: true, message: t('auth.enterCode') }]}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <Input.OTP length={6} size="large" autoFocus />
        </Form.Item>

        {/* Thanh đếm ngược gửi lại mã */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {countdown > 0 ? (
            <span style={{ color: '#64748B', fontSize: 13 }}>
              {t('auth.resendIn', { seconds: countdown })}
            </span>
          ) : (
            <button
              type="button"
              className={styles.badgeBtn}
              onClick={handleResend}
              style={{ fontSize: 13, padding: '4px 14px' }}
            >
              🔄 {t('auth.resendCode')}
            </button>
          )}
        </div>

        {/* Gợi ý mã test nhanh cho người dùng/giảng viên */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 20,
            fontSize: 12,
            color: '#64748B',
            background: '#F8FAFC',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px dashed #CBD5E1',
          }}
        >
          💡 {t('auth.testOtpHint')}
        </div>

        <Button
          type="primary"
          htmlType="submit"
          className={styles.submitBtn}
          loading={loading}
          block
        >
          {t('auth.verifyAndActivate')}
        </Button>
      </Form>

      {/* Footer link to register */}
      <div className={styles.footerSection}>
        <span
          className={styles.footerLink}
          onClick={() => navigate(ROUTES.REGISTER)}
          role="button"
          tabIndex={0}
        >
          ← {t('auth.backToRegister')}
        </span>
      </div>
    </div>
  );
}
