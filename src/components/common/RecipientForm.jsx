import { Form, Input, Checkbox, Row, Col, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';

const { Text } = Typography;

/**
 * Component form nhập thông tin người nhận ngựa (FE-13 / R-16).
 * Dùng chung trong form tạo đơn (FE-02), modal sửa người nhận (Customer BookingDetailPage)
 * và màn hình xử lý khi không giao được (FE-14).
 *
 * @param {Object} props
 * @param {import('antd').FormInstance} [props.form] - Instance của Ant Design Form (nếu có)
 * @param {string} [props.fieldPrefix=''] - Tiền tố trường nếu lồng form (ví dụ: 'recipient')
 * @param {boolean} [props.disabled=false] - Trạng thái khóa các ô nhập
 * @param {boolean} [props.showSelfReceive=true] - Hiển thị ô tích "Tôi tự nhận ngựa"
 * @param {Function} [props.onSelfReceiveChange] - Callback khi trạng thái tự nhận thay đổi
 * @returns {JSX.Element}
 */
export default function RecipientForm({
  form,
  fieldPrefix = '',
  disabled = false,
  showSelfReceive = true,
  onSelfReceiveChange,
}) {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const getName = (fieldName) => (fieldPrefix ? [fieldPrefix, fieldName] : fieldName);

  // Xử lý khi bấm tick "Tôi tự nhận ngựa"
  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    if (form) {
      if (checked && user) {
        const fullName = user.fullName || user.FullName || '';
        const phone = user.phone || user.Phone || '';
        const email = user.email || user.Email || '';
        const idNumber =
          user.idCardNumber ||
          user.identityNumber ||
          user.IdentityCardNumber ||
          user.idNumber ||
          '';

        form.setFieldsValue({
          ...(fieldPrefix
            ? {
                [fieldPrefix]: {
                  recipientIsCustomer: true,
                  recipientName: fullName,
                  recipientPhone: phone,
                  recipientEmail: email,
                  recipientIdNumber: idNumber,
                },
              }
            : {
                recipientIsCustomer: true,
                recipientName: fullName,
                recipientPhone: phone,
                recipientEmail: email,
                recipientIdNumber: idNumber,
              }),
        });
      } else {
        form.setFieldValue(getName('recipientIsCustomer'), false);
      }
    }
    onSelfReceiveChange?.(checked);
  };

  return (
    <div>
      {showSelfReceive && (
        <div style={{ marginBottom: 16 }}>
          <Form.Item
            name={getName('recipientIsCustomer')}
            valuePropName="checked"
            noStyle
          >
            <Checkbox disabled={disabled} onChange={handleCheckboxChange}>
              <Text strong>{t('recipient.isCustomer')}</Text>
            </Checkbox>
          </Form.Item>
        </div>
      )}

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name={getName('recipientName')}
            label={t('recipient.name')}
            rules={[
              { required: true, whitespace: true, message: t('recipient.nameRequired') },
              { max: 100 },
            ]}
          >
            <Input disabled={disabled} placeholder={t('recipient.namePlaceholder')} />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name={getName('recipientPhone')}
            label={t('recipient.phone')}
            rules={[
              { required: true, whitespace: true, message: t('recipient.phoneRequired') },
              { max: 20 },
            ]}
          >
            <Input
              disabled={disabled}
              inputMode="tel"
              placeholder={t('recipient.phonePlaceholder')}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name={getName('recipientEmail')}
            label={t('recipient.email')}
            rules={[
              { type: 'email', message: t('recipient.emailInvalid') },
              { max: 100 },
            ]}
          >
            <Input
              disabled={disabled}
              type="email"
              placeholder={t('recipient.emailPlaceholder')}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name={getName('recipientIdNumber')}
            label={t('recipient.idNumber')}
            rules={[{ max: 50 }]}
          >
            <Input disabled={disabled} placeholder={t('recipient.idNumberPlaceholder')} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}
