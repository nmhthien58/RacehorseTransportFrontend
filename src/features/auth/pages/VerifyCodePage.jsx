import { useState, useEffect } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyCodeApi, forgotPasswordApi } from '@features/auth/services/authService';
import { ROUTES } from '@routes/routes';
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';

/**
 * Trang Nhập Mã Xác Minh (Verify Code / OTP)
 */
export default function VerifyCodePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const email = sessionStorage.getItem('reset_email') || 'customer@test.com';

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
      await verifyCodeApi({
        email,
        code: values.code,
      });

      message.success(t('auth.codeVerified', 'Xác thực mã OTP thành công!'));
      sessionStorage.setItem('verify_code', values.code);
      navigate(ROUTES.RESET_PASSWORD);
    } catch {
      message.error(t('auth.codeInvalid', 'Mã xác minh không hợp lệ hoặc đã hết hạn.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await forgotPasswordApi({ email });
      message.success(t('auth.codeResent', 'Mã xác minh mới đã được gửi!'));
      setCountdown(45);
    } catch {
      message.error(t('auth.actionFailed', 'Không thể gửi lại mã. Vui lòng thử lại.'));
    }
  };

  return (
    <div>
      {/* Header & Logo */}
      <div className={styles.headerSection}>
        <div className={styles.logoContainer}>
          <img src={logoImg} alt="International Equine Transport" className={styles.logoImage} />
        </div>
        <h1 className={styles.pageTitle}>{t('auth.verifyCodeTitle')}</h1>
        <p className={styles.pageSubtitle}>
          {t('auth.verifyCodeSubtitle')} <br />
          <strong style={{ color: '#0F172A' }}>{email}</strong>
        </p>
      </div>

      {/* Form OTP */}
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
              style={{ fontSize: 13, padding: '4px 12px' }}
            >
              🔄 {t('auth.resendCode')}
            </button>
          )}
        </div>

        <Button
          type="primary"
          htmlType="submit"
          className={styles.submitBtn}
          loading={loading}
          block
        >
          {t('auth.verifyAndProceed')}
        </Button>
      </Form>

      {/* Footer link to sign in */}
      <div className={styles.footerSection}>
        <span
          className={styles.footerLink}
          onClick={() => navigate(ROUTES.LOGIN)}
          role="button"
          tabIndex={0}
        >
          ← {t('auth.backToSignIn')}
        </span>
      </div>
    </div>
  );
}
