import { useMemo } from 'react';
import { Button, Spin, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { useCustomerTrips } from '@features/customer/hooks/useCustomerTrips';
import TripJourney from '@features/customer/components/TripJourney';

// Backend giữ kết quả theo dõi 30 giây, làm mới cùng nhịp
const POLL_MS = 30000;

/**
 * Màn hình theo dõi chi tiết một chuyến của khách (giữ cho các liên kết cũ / thông báo).
 * Từ R-07 khách xem hành trình ở tab "Hành trình" của chi tiết đơn; nút quay lại dẫn về đơn đó.
 */
export default function TripTrackingDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tripId } = useParams();
  const { trips, loading, lastLoadedAt, refetch } = useCustomerTrips({ pollMs: POLL_MS });

  const trip = useMemo(() => trips.find((item) => String(item.tripId) === String(tripId)), [trips, tripId]);

  const backToBooking = () =>
    navigate(
      trip?.bookingId
        ? `${ROUTES.CUSTOMER_BOOKING_DETAIL.replace(':id', trip.bookingId)}?tab=journey`
        : ROUTES.CUSTOMER_BOOKINGS,
    );

  if (loading && !trip) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!trip) {
    return (
      <Result
        status="404"
        title={t('customerTrips.notFound')}
        extra={<Button onClick={backToBooking}>{t('customerOrders.backToOrders')}</Button>}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 16px 40px' }}>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={backToBooking} style={{ paddingLeft: 0, marginBottom: 8 }}>
        {t('customerOrders.backToOrder', { code: trip.bookingCode })}
      </Button>
      <TripJourney trip={trip} lastLoadedAt={lastLoadedAt} onRefresh={refetch} />
    </div>
  );
}
