import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, InputNumber, Row, Spin, Typography, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import paymentService from '@services/paymentService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;

/**
 * Trang cấu hình thanh toán (Manager & Admin): % đặt cọc, % hoàn cọc khi hủy, tỉ giá USD→VND, hạn thanh toán.
 * Giá trị mới chỉ áp dụng cho đơn được duyệt sau khi lưu (đơn cũ giữ % cọc đã chốt).
 * @returns {JSX.Element}
 */
export default function PaymentSettingsPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    paymentService
      .getSettings()
      .then((res) => {
        const data = unwrapData(res);
        setSettings(data);
        form.setFieldsValue(data);
      })
      .catch((err) => message.error(getErrorMessage(err, t('payments.loadFailed'))))
      .finally(() => setLoading(false));
  }, [form, t]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const data = unwrapData(await paymentService.updateSettings(values));
      setSettings(data);
      form.setFieldsValue(data);
      message.success(t('payments.settings.saved'));
    } catch (err) {
      message.error(getErrorMessage(err, t('payments.settings.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: 'depositPercent', min: 0, max: 100, suffix: '%' },
    { name: 'cancelRefundPercent', min: 0, max: 100, suffix: '%' },
    { name: 'usdVndRate', min: 1, max: 1000000, suffix: '₫ / USD' },
    { name: 'balanceDueDaysBeforeDeparture', min: 0, max: 30, suffix: t('payments.settings.days'), integer: true },
    { name: 'extraPaymentDueDays', min: 1, max: 90, suffix: t('payments.settings.days'), integer: true },
  ];

  return (
    <div>
      <PageHeader title={t('payments.settings.title')} subtitle={t('payments.settings.subtitle')} />
      <Card style={{ borderRadius: 12, maxWidth: 860 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : (
          <>
            <Alert type="info" showIcon message={t('payments.settings.hint')} style={{ marginBottom: 20 }} />
            <Form form={form} layout="vertical">
              <Row gutter={[20, 0]}>
                {fields.map((field) => (
                  <Col xs={24} md={12} key={field.name}>
                    <Form.Item
                      name={field.name}
                      label={t(`payments.settings.fields.${field.name}`)}
                      extra={t(`payments.settings.help.${field.name}`)}
                      rules={[{ required: true, message: t('payments.settings.required') }]}
                    >
                      <InputNumber
                        min={field.min}
                        max={field.max}
                        precision={field.integer ? 0 : 2}
                        suffix={field.suffix}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </Form>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              {t('common.save')}
            </Button>
            {settings?.updatedAt && (
              <Text type="secondary" style={{ marginLeft: 16 }}>
                {t('payments.settings.updated', {
                  date: dayjs(settings.updatedAt).format('DD/MM/YYYY HH:mm'),
                  name: settings.updatedByName || '—',
                })}
              </Text>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
