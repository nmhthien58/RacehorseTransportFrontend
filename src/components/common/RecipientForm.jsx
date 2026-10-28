import { Checkbox, Col, Form, Input, Row, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { PHONE_REGEX } from '@utils/recipient';

const { Text } = Typography;

// Đang sửa RecipientForm vì tách hàm tiện ích sang @utils/recipient theo quy tắc Fast Refresh
export default function RecipientForm({
  value = { isCustomer: true, name: '', phone: '', email: '', idNumber: '' },
  onChange,
  disabled = false,
}) {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const handleChange = (patch) => {
    const updated = { ...value, ...patch };
    onChange?.(updated);
  };

  const handleToggleCustomer = (checked) => {
    if (checked) {
      handleChange({
        isCustomer: true,
        name: user?.fullName || '',
        phone: user?.phoneNumber || user?.phone || '',
        email: user?.email || '',
        idNumber: user?.idNumber || user?.identityNumber || '',
      });
    } else {
      handleChange({ isCustomer: false });
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <Checkbox
        checked={Boolean(value.isCustomer)}
        disabled={disabled}
        onChange={(e) => handleToggleCustomer(e.target.checked)}
        style={{ marginBottom: 12, fontWeight: 500 }}
      >
        {t('bookingForm.recipient.self', 'Tôi tự nhận ngựa tại điểm giao')}
      </Checkbox>

      {value.isCustomer ? (
        <div
          style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, marginBottom: 8 }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t(
              'bookingForm.recipient.selfNote',
              'Ngựa sẽ được bàn giao trực tiếp cho bạn theo thông tin tài khoản:',
            )}
          </Text>
          <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 4 }}>
            {user?.fullName || t('common.customer', 'Khách hàng')}{' '}
            {user?.phoneNumber ? `· ${user.phoneNumber}` : ''}
          </div>
        </div>
      ) : (
        // Form riêng (không sinh thẻ <form>) để nhãn luôn nằm trên ô nhập, kể cả khi trang cha dùng layout ngang
        <Form layout="vertical" component={false}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('bookingForm.recipient.name', 'Họ tên người nhận thay')}
                required
                style={{ marginBottom: 0 }}
              >
                <Input
                  value={value.name}
                  maxLength={100}
                  disabled={disabled}
                  placeholder={t('bookingForm.recipient.namePlaceholder', 'Nguyễn Văn A')}
                  onChange={(e) => handleChange({ name: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('bookingForm.recipient.phone', 'Số điện thoại')}
                required
                validateStatus={
                  value.phone && !PHONE_REGEX.test(value.phone.trim()) ? 'error' : undefined
                }
                help={
                  value.phone && !PHONE_REGEX.test(value.phone.trim())
                    ? t('bookingForm.recipient.phoneInvalid', 'Số điện thoại không hợp lệ')
                    : undefined
                }
                style={{ marginBottom: 0 }}
              >
                <Input
                  value={value.phone}
                  maxLength={20}
                  disabled={disabled}
                  placeholder="+84 988 123 456"
                  onChange={(e) => handleChange({ phone: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('bookingForm.recipient.email', 'Email')}
                style={{ marginBottom: 0 }}
              >
                <Input
                  value={value.email}
                  maxLength={255}
                  disabled={disabled}
                  placeholder="recipient@example.com"
                  onChange={(e) => handleChange({ email: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('bookingForm.recipient.idNumber', 'Số CMND / CCCD / Hộ chiếu')}
                style={{ marginBottom: 0 }}
              >
                <Input
                  value={value.idNumber}
                  maxLength={50}
                  disabled={disabled}
                  placeholder="001200001234"
                  onChange={(e) => handleChange({ idNumber: e.target.value })}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}

      <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 8 }}>
        {t(
          'bookingForm.recipient.hint',
          'Người nhận sẽ đối chiếu thông tin và ký biên bản giao nhận e-POD với tài xế khi nhận ngựa.',
        )}
      </Text>
    </div>
  );
}
