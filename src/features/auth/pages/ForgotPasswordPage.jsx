import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPasswordApi } from '@features/auth/services/authService';
import { ROUTES } from '@routes/routes';
import logoImg from '@/assets/logo.svg';
import styles from './AuthPages.module.css';

/**
 * Trang Quên Mật Khẩu (Forgot Password)
 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await forgotPasswordApi({ email: values.email });
      message.success(t('auth.codeSent', 'Mã xác minh OTP đã được gửi đến email của bạn!'));
      // Lưu tạm email để trang VerifyCodePage sử dụng
      sessionStorage.setItem('reset_email', values.email);
      navigate(ROUTES.VERIFY_CODE);
    } catch {
      message.error(t('auth.actionFailed', 'Không thể gửi mã xác minh. Vui lòng thử lại.'));
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
        <h1 className={styles.pageTitle}>{t('auth.forgotPasswordTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('auth.forgotPasswordSubtitle')}</p>
      </div>

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ email: 'customer@test.com' }}
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

        <Button
          type="primary"
          htmlType="submit"
          className={styles.submitBtn}
          loading={loading}
          block
        >
          {t('auth.sendCode')}
        </Button>
      </Form>

      {/* Footer link to login */}
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
