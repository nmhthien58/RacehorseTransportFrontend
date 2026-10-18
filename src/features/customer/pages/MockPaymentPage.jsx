import { useState } from 'react';
import { Alert, Button, Card, Flex, Typography, message } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import paymentService from '@services/paymentService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';
import { ROUTES } from '@routes/routes';

const { Title, Text } = Typography;

/**
 * Cổng thanh toán giả lập, chỉ dùng khi backend chạy Payment:Provider = Mock (demo không cần VNPay).
 * Query: txnRef = mã giao dịch gửi cổng, amountVnd = số tiền VND.
 * @returns {JSX.Element}
 */
export default function MockPaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const txnRef = searchParams.get('txnRef');
  const amountVnd = Number(searchParams.get('amountVnd') || 0);
  const [loading, setLoading] = useState(null);

  const complete = async (success) => {
    setLoading(success ? 'success' : 'failed');
    try {
      const res = unwrapData(await paymentService.completeMockPayment(txnRef, success));
      const params = new URLSearchParams({
        status: res?.success ? 'success' : 'failed',
        code: res?.payment?.paymentCode || txnRef,
      });
      if (res?.payment?.bookingId) params.set('bookingId', res.payment.bookingId);
      navigate(`${ROUTES.CUSTOMER_PAYMENT_RESULT}?${params.toString()}`, { replace: true });
    } catch (err) {
      message.error(getErrorMessage(err, t('payments.mock.failed')));
      setLoading(null);
    }
  };

  return (
    <Card style={{ maxWidth: 520, margin: '40px auto', borderRadius: 12 }}>
      <Flex vertical gap={16} align="center">
        <CreditCardOutlined style={{ fontSize: 40, color: '#F59E0B' }} />
        <Title level={4} style={{ margin: 0 }}>
          {t('payments.mock.title')}
        </Title>
        <Alert type="info" showIcon message={t('payments.mock.hint')} style={{ width: '100%' }} />
        <Text>
          {t('payments.result.code')}: <Text strong>{txnRef || '—'}</Text>
        </Text>
        <Title level={3} style={{ margin: 0 }}>
          {amountVnd.toLocaleString('vi-VN')} ₫
        </Title>
        <Flex gap={12}>
          <Button danger loading={loading === 'failed'} disabled={!txnRef || !!loading} onClick={() => complete(false)}>
            {t('payments.mock.fail')}
          </Button>
          <Button type="primary" loading={loading === 'success'} disabled={!txnRef || !!loading} onClick={() => complete(true)}>
            {t('payments.mock.pay')}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
