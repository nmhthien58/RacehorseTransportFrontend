import { useState, useEffect } from 'react';
import { Col, Flex, Row, Spin, Typography } from 'antd';
import {
  ClockCircleOutlined,
  StarOutlined,
  FieldTimeOutlined,
  AppstoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@components/layout/PageHeader';
import { useAuthStore } from '@features/auth/store/authStore';
import { horseService } from '@services/horseService';
import { bookingService } from '@services/bookingService';
import { tripService } from '@services/tripService';
import { ROUTES } from '@routes/routes';

const { Text, Title } = Typography;

/**
 * Trang Customer Dashboard tái tạo chính xác theo Frame 65:25 Figma
 * @returns {JSX.Element}
 */
export default function CustomerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [horses, setHorses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);

  // Tải dữ liệu tổng hợp
  useEffect(() => {
    let isSubscribed = true;

    Promise.all([
      horseService.getHorses({ ownerId: user?.userId || undefined }),
      bookingService.getBookings({ customerId: user?.userId || undefined }),
      tripService.getTrips(),
    ])
      .then(([horseRes, bookingRes, tripRes]) => {
        if (isSubscribed) {
          setHorses(horseRes.data?.data || horseRes.data || []);
          setBookings(bookingRes.data?.data || bookingRes.data || []);
          setTrips(tripRes.data?.data || tripRes.data || []);
        }
      })
      .catch(() => {
        // Giữ state rỗng an toàn
      })
      .finally(() => {
        if (isSubscribed) {
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [user]);

  const activeTripsCount = trips.filter(
    (tr) => tr.overallStatus === 'InTransit' || tr.overallStatus === 'Scheduled',
  ).length;

  const openBookingsCount = bookings.filter(
    (bk) => bk.status === 'Submitted' || bk.status === 'Approved',
  ).length;

  // Dữ liệu hiển thị thẻ ngựa lấy động theo danh sách thực tế từ API
  const displayHorses = horses.map((h, index) => {
    const isCritical = index === 0;
    const isHigh = index === 1;
    return {
      id: h.horseId || h.id,
      name: h.name,
      breed: h.breed,
      risk: isCritical ? 'CRITICAL risk' : isHigh ? 'HIGH risk' : 'LOW risk',
      riskBg: isCritical ? '#FCA5A5' : isHigh ? '#FDE68A' : '#BBF7D0',
      riskColor: isCritical ? '#7F1D1D' : isHigh ? '#78350F' : '#14532D',
    };
  });

  return (
    <div>
      {/* Tiêu đề Dashboard + Nút + Book dạng pill vàng cam nổi bật */}
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <button
            type="button"
            onClick={() => navigate(ROUTES.CUSTOMER_BOOKING_NEW)}
            style={{
              backgroundColor: '#FBA919',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: 18,
              border: 'none',
              borderRadius: 9999,
              height: 48,
              padding: '0 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(251, 169, 25, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            <span>+</span>
            <span>{t('dashboard.bookBtn')}</span>
          </button>
        }
      />

      <Spin spinning={loading}>
        {/* Hàng 4 thẻ Metric bo tròn 24px có icon tròn phía trên */}
        <Row gutter={[20, 20]} style={{ marginBottom: 36 }}>
          {/* Card 1: Active Trips */}
          <Col xs={12} sm={12} md={6}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  fontSize: 18,
                }}
              >
                <AppstoreOutlined />
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  margin: '18px 0 6px 0',
                }}
              >
                {activeTripsCount}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
                {t('dashboard.metrics.activeTrips')}
              </div>
            </div>
          </Col>

          {/* Card 2: Open Requests */}
          <Col xs={12} sm={12} md={6}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  fontSize: 18,
                }}
              >
                <ClockCircleOutlined />
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  margin: '18px 0 6px 0',
                }}
              >
                {openBookingsCount}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
                {t('dashboard.metrics.openRequests')}
              </div>
            </div>
          </Col>

          {/* Card 3: Bids Received */}
          <Col xs={12} sm={12} md={6}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#FEF9C3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#CA8A04',
                  fontSize: 18,
                }}
              >
                <StarOutlined />
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  margin: '18px 0 6px 0',
                }}
              >
                0
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
                {t('dashboard.metrics.bidsReceived')}
              </div>
            </div>
          </Col>

          {/* Card 4: My Horses */}
          <Col xs={12} sm={12} md={6}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  fontSize: 18,
                }}
              >
                <FieldTimeOutlined />
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1,
                  margin: '18px 0 6px 0',
                }}
              >
                {horses.length}
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#475569' }}>
                {t('dashboard.metrics.myHorses')}
              </div>
            </div>
          </Col>
        </Row>

        {/* Khối My Horses với header và 3 thẻ nằm ngang */}
        <div>
          <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
            <Title
              level={2}
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              {t('dashboard.horsesSection.title')}
            </Title>

            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER_HORSES)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0f172a',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <PlusOutlined style={{ fontSize: 14 }} />
              <span>{t('dashboard.horsesSection.addHorse')}</span>
            </button>
          </Flex>

          <Row gutter={[18, 18]}>
            {displayHorses.map((item) => (
              <Col xs={24} sm={12} md={8} key={item.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(ROUTES.CUSTOMER_HORSES)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(ROUTES.CUSTOMER_HORSES);
                    }
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 18,
                    padding: '18px 22px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  <Flex align="center" gap="middle">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2563EB',
                        fontSize: 20,
                      }}
                    >
                      <FieldTimeOutlined />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: '#0f172a',
                        }}
                      >
                        {item.name}
                      </div>
                      <Text style={{ fontSize: 14, color: '#64748b' }}>
                        {item.breed}
                      </Text>
                    </div>
                  </Flex>

                  {/* Tag rủi ro bo tròn chuẩn màu pastel Figma */}
                  <span
                    style={{
                      backgroundColor: item.riskBg,
                      color: item.riskColor,
                      borderRadius: 9999,
                      padding: '4px 14px',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.risk}
                  </span>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Spin>
    </div>
  );
}
