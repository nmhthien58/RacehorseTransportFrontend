import { Button, Card, Result } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';

const RESULT_STATUS = {
  success: 'success',
  failed: 'error',
  invalid: 'warning',
};

/**
 * Trang kết quả thanh toán: backend chuyển khách về đây sau khi VNPay (hoặc cổng giả lập) xử lý xong.
 * Query: status=success|failed|invalid, code=mã giao dịch, bookingId=đơn liên quan.
 * Trạng thái thật của đơn do IPN/return cập nhật ở backend, trang này chỉ hiển thị.
 * @returns {JSX.Element}
 */
export default function PaymentResultPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'invalid';
  const code = searchParams.get('code');
  const bookingId = searchParams.get('bookingId');

  const goToBooking = () => {
    if (bookingId) navigate(`${ROUTES.CUSTOMER_BOOKING_DETAIL.replace(':id', bookingId)}?tab=payment`);
    else navigate(ROUTES.CUSTOMER_BOOKINGS);
  };

  return (
    <Card style={{ maxWidth: 640, margin: '40px auto', borderRadius: 12 }}>
      <Result
        status={RESULT_STATUS[status] || 'warning'}
        title={t(`payments.result.${RESULT_STATUS[status] ? status : 'invalid'}Title`)}
        subTitle={
          <>
            {t(`payments.result.${RESULT_STATUS[status] ? status : 'invalid'}Description`)}
            {code && (
              <div style={{ marginTop: 8 }}>
                {t('payments.result.code')}: <strong>{code}</strong>
              </div>
            )}
          </>
        }
        extra={[
          <Button type="primary" key="booking" onClick={goToBooking}>
            {t('payments.result.viewBooking')}
          </Button>,
          <Button key="list" onClick={() => navigate(ROUTES.CUSTOMER_BOOKINGS)}>
            {t('payments.result.backToList')}
          </Button>,
        ]}
      />
    </Card>
  );
}
