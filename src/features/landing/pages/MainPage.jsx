import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Input,
  Row,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { useAuthStore } from '@features/auth/store/authStore';

// Header & Footer
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

// Assets
import heroBg from '@assets/landing/hero-bg.jpg';
import how1 from '@assets/landing/how-1.jpg';
import how2 from '@assets/landing/how-2.jpg';
import how3 from '@assets/landing/how-3.jpg';

import rideShortHaul from '@assets/landing/ride-short-haul.jpg';
import rideMareFoal from '@assets/landing/ride-mare-foal.jpg';
import rideCommercial from '@assets/landing/ride-commercial.jpg';
import rideMedical from '@assets/landing/ride-medical.jpg';
import rideBoxStall from '@assets/landing/ride-box-stall.jpg';

import cityWellington from '@assets/landing/city-wellington.jpg';
import cityOcala from '@assets/landing/city-ocala.jpg';
import cityLexington from '@assets/landing/city-lexington.jpg';
import cityAiken from '@assets/landing/city-aiken.jpg';
import citySaratoga from '@assets/landing/city-saratoga.jpg';
import cityScottsdale from '@assets/landing/city-scottsdale.jpg';

const { Title, Text, Paragraph } = Typography;

export default function MainPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [routeTab, setRouteTab] = useState('all');

  // Quick estimator state
  const [quickOrigin, setQuickOrigin] = useState('');
  const [quickDestination, setQuickDestination] = useState('');
  const [quickHorses, setQuickHorses] = useState(1);
  const [quickDate, setQuickDate] = useState(null);

  // Xử lý bắt buộc đăng nhập khi đặt chuyến hoặc sử dụng dịch vụ
  const handleStartBooking = (prefill = {}) => {
    if (!isAuthenticated) {
      message.warning(t('landing.nav.loginRequiredBooking', 'Vui lòng đăng nhập để đặt dịch vụ vận chuyển.'));
      navigate(ROUTES.LOGIN, {
        state: {
          returnTo: ROUTES.CUSTOMER_BOOKING_NEW,
          bookingPrefill: prefill,
        },
      });
    } else {
      navigate(ROUTES.CUSTOMER_BOOKING_NEW, { state: prefill });
    }
  };

  const handleQuickEstimateSubmit = (e) => {
    e?.preventDefault();
    handleStartBooking({
      pickupAddress: quickOrigin,
      dropoffAddress: quickDestination,
      totalHorses: quickHorses,
      departureDate: quickDate ? quickDate.format('YYYY-MM-DD') : undefined,
    });
  };

  // 5 Thẻ hình thức xe hiển thị trực tiếp trên trang chủ (Khớp Figma Frame 10-2 Main Page)
  const mainRideCards = [
    {
      title: 'Short Haul',
      desc: 'Di chuyển cự ly gần dưới 250km, đổi chuồng trại, khám chữa bệnh thú y khẩn cấp trong ngày.',
      image: rideShortHaul,
      badge: 'Local',
    },
    {
      title: 'Mare and foal',
      desc: 'Khoang rộng gấp đôi, lót rơm sạch dày, camera theo dõi sát sao ngựa mẹ và ngựa con.',
      image: rideMareFoal,
      badge: 'Breeding',
    },
    {
      title: 'Commercial Hauling',
      desc: 'Đoàn xe rơ-moóc lớn 6-9 ngựa chuẩn thi đấu quốc tế với hệ thống treo khí nén êm ái.',
      image: rideCommercial,
      badge: 'Heavy Fleet',
    },
    {
      title: 'Medical Transport',
      desc: 'Xe cấp cứu thú y trang bị oxy, đai treo nâng đỡ ngựa chấn thương tới bệnh viện.',
      image: rideMedical,
      badge: 'Veterinary',
    },
    {
      title: 'Box Stall / Show Horses',
      desc: 'Khoang VIP cách ly hoàn toàn, điều hòa kiểm soát nhiệt độ 18°C bảo toàn phong độ.',
      image: rideBoxStall,
      badge: 'Show Circuit',
    },
  ];

  // Danh sách các điểm đến phổ biến (Figma Where horses ship most)
  const popularCities = [
    {
      city: 'Wellington, FL.',
      desc: 'Thủ phủ đua ngựa mùa đông, trung tâm Lễ hội Cưỡi ngựa Mùa đông (WEF) và Global Dressage.',
      image: cityWellington,
      tag: 'Winter',
      routes: 'Từ Lexington, Ocala, Aiken',
    },
    {
      city: 'Ocala, FL.',
      desc: 'Thủ đô ngựa thế giới, trung tâm World Equestrian Center và các trại huấn luyện Thoroughbred.',
      image: cityOcala,
      tag: 'Winter',
      routes: 'Từ Wellington, Atlanta, Saratoga',
    },
    {
      city: 'Lexington, KY.',
      desc: 'Trung tâm đấu giá ngựa giống quốc tế Keeneland, các trại ngựa giống Bluegrass danh tiếng.',
      image: cityLexington,
      tag: 'Racing',
      routes: 'Từ Churchill Downs, Saratoga, Belmont',
    },
    {
      city: 'Aiken, SC.',
      desc: 'Trung tâm đua ngựa vượt rào Steeplechase, câu lạc bộ Polo và khu tập huấn mùa đông.',
      image: cityAiken,
      tag: 'Winter',
      routes: 'Từ Tryon, Ocala, Camden',
    },
    {
      city: 'Saratoga Springs, NY.',
      desc: 'Mùa giải đua hè danh tiếng, trường đua lịch sử Saratoga và phiên đấu giá yearling Fasig-Tipton.',
      image: citySaratoga,
      tag: 'Racing',
      routes: 'Từ Belmont, Belmont Park, Keeneland',
    },
    {
      city: 'Scottsdale, AZ.',
      desc: 'Giải đua Arabian Horse Show lớn nhất thế giới, giải Sun Circuit và mùa giải sa mạc Tây Nam.',
      image: cityScottsdale,
      tag: 'Racing',
      routes: 'Từ Del Mar, Santa Anita, Texas',
    },
  ];

  const filteredCities = popularCities.filter((c) => {
    if (routeTab === 'winter') return c.tag === 'Winter';
    if (routeTab === 'racing') return c.tag === 'Racing';
    return true;
  });

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* 1. Header Khớp Yêu Cầu (Chỉ có: Home, Transport, Account, More) */}
      <LandingHeader activeKey="home" />

      {/* 2. HERO SECTION - ẤN TƯỢNG, SẮC NÉT KHỚP FIGMA */}
      <section
        id="hero"
        style={{
          position: 'relative',
          minHeight: '94vh',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.76) 52%, rgba(15, 23, 42, 0.4) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
          paddingTop: 130,
          paddingBottom: 90,
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <Row gutter={[48, 40]} align="middle">
            {/* Cột trái: Thông điệp thương hiệu */}
            <Col xs={24} lg={13}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(251, 169, 25, 0.15)',
                  border: '1px solid rgba(251, 169, 25, 0.35)',
                  color: '#FBA919',
                  padding: '6px 16px',
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  marginBottom: 24,
                }}
              >
                <SafetyCertificateOutlined />
                <span>{t('landing.hero.badge')}</span>
              </div>

              <Title
                level={1}
                style={{
                  color: '#ffffff',
                  fontSize: 'clamp(36px, 5.5vw, 62px)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  marginBottom: 20,
                  letterSpacing: '-0.02em',
                }}
              >
                <span style={{ color: '#FBA919' }}>{t('landing.hero.titlePart1')}</span>{' '}
                {t('landing.hero.titlePart2')}
              </Title>

              <Paragraph
                style={{
                  color: '#cbd5e1',
                  fontSize: 19,
                  lineHeight: 1.7,
                  maxWidth: 580,
                  marginBottom: 32,
                }}
              >
                {t('landing.hero.subtitle')}
              </Paragraph>

              {/* Nút Kêu Gọi Hành Động (CTA) */}
              <Flex gap="middle" wrap="wrap" style={{ marginBottom: 40 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => handleStartBooking()}
                  className="landing-btn-shine"
                  style={{
                    backgroundColor: '#FBA919',
                    borderColor: '#FBA919',
                    color: '#0f172a',
                    fontWeight: 800,
                    height: 52,
                    padding: '0 36px',
                    borderRadius: 9999,
                    fontSize: 16,
                    boxShadow: '0 8px 24px rgba(251, 169, 25, 0.4)',
                  }}
                >
                  {t('landing.hero.bookNow')}
                </Button>

                <Button
                  ghost
                  size="large"
                  onClick={() => navigate(ROUTES.HOW_IT_WORKS)}
                  style={{
                    height: 52,
                    padding: '0 28px',
                    borderRadius: 9999,
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  {t('landing.hero.learnMore')}
                </Button>
              </Flex>

              {/* Huy hiệu tin cậy */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  paddingTop: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>Over 40,000 trips safely completed across North America</span>
              </div>
            </Col>

            {/* Cột phải: Khung Tính Phí Nhanh (Figma Quick Quote Widget) */}
            <Col xs={24} lg={11}>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.96)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 24,
                  padding: '36px 32px',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#0f172a',
                }}
              >
                <Title level={3} style={{ color: '#0f172a', fontWeight: 800, marginBottom: 6, fontSize: 22 }}>
                  {t('landing.quickQuote.title')}
                </Title>
                <Text style={{ color: '#64748b', fontSize: 14, display: 'block', marginBottom: 24 }}>
                  Nhận ước tính cước và thời gian đón xe trong 30 giây
                </Text>

                <form onSubmit={handleQuickEstimateSubmit}>
                  {/* Điểm đón */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 6 }}>
                      Điểm đón ngựa
                    </Text>
                    <Input
                      prefix={<EnvironmentOutlined style={{ color: '#FBA919' }} />}
                      placeholder={t('landing.quickQuote.pickupPlaceholder')}
                      value={quickOrigin}
                      onChange={(e) => setQuickOrigin(e.target.value)}
                      style={{ height: 44, borderRadius: 12, fontSize: 14 }}
                    />
                  </div>

                  {/* Điểm giao */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 6 }}>
                      Điểm giao đích
                    </Text>
                    <Input
                      prefix={<EnvironmentOutlined style={{ color: '#10b981' }} />}
                      placeholder={t('landing.quickQuote.dropoffPlaceholder')}
                      value={quickDestination}
                      onChange={(e) => setQuickDestination(e.target.value)}
                      style={{ height: 44, borderRadius: 12, fontSize: 14 }}
                    />
                  </div>

                  {/* Số lượng ngựa & Ngày */}
                  <Row gutter={12} style={{ marginBottom: 24 }}>
                    <Col span={10}>
                      <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 6 }}>
                        {t('landing.quickQuote.horses')}
                      </Text>
                      <Select
                        value={quickHorses}
                        onChange={setQuickHorses}
                        style={{ width: '100%', height: 44 }}
                        options={[
                          { value: 1, label: '1 con ngựa' },
                          { value: 2, label: '2 con ngựa' },
                          { value: 3, label: '3 con ngựa' },
                          { value: 4, label: '4 con ngựa' },
                          { value: 6, label: '6 con ngựa (Đoàn)' },
                        ]}
                      />
                    </Col>
                    <Col span={14}>
                      <Text strong style={{ fontSize: 13, color: '#334155', display: 'block', marginBottom: 6 }}>
                        {t('landing.quickQuote.date')}
                      </Text>
                      <DatePicker
                        value={quickDate}
                        onChange={setQuickDate}
                        placeholder="Chọn ngày đi"
                        suffixIcon={<CalendarOutlined style={{ color: '#FBA919' }} />}
                        style={{ width: '100%', height: 44, borderRadius: 12 }}
                      />
                    </Col>
                  </Row>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    icon={<ArrowRightOutlined />}
                    className="landing-btn-shine"
                    style={{
                      height: 50,
                      borderRadius: 12,
                      backgroundColor: '#0f172a',
                      borderColor: '#0f172a',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: 16,
                      boxShadow: '0 6px 20px rgba(15, 23, 42, 0.25)',
                    }}
                  >
                    Ước tính cước & Đặt ngay
                  </Button>
                </form>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 3. SECTION "HOW IET WORKS" - KHỚP TỪNG CARD FIGMA */}
      <section id="how-it-works" style={{ padding: '96px 0', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <Title level={2} style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              How IET works
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 17, maxWidth: 640, margin: '0 auto' }}>
              Quy trình 3 bước khép kín, minh bạch và an toàn chuẩn phúc lợi động vật quốc tế
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {/* Bước 1 */}
            <Col xs={24} md={8}>
              <Card
                className="landing-card-hover"
                style={{
                  height: '100%',
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
                cover={
                  <div style={{ height: 210, overflow: 'hidden' }}>
                    <img
                      src={how1}
                      alt="Hassle-free online booking"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                }
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  1
                </div>
                <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, marginBottom: 12, fontSize: 12 }}>
                  Hassle-free online booking
                </Tag>
                <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>
                  Tell us your route, compare quotes from vetted drivers, and book the service you want. No phone tag, no spreadsheets, no guesswork.
                </Paragraph>
              </Card>
            </Col>

            {/* Bước 2 */}
            <Col xs={24} md={8}>
              <Card
                className="landing-card-hover"
                style={{
                  height: '100%',
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
                cover={
                  <div style={{ height: 210, overflow: 'hidden' }}>
                    <img
                      src={how2}
                      alt="Follow along the journey"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                }
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  2
                </div>
                <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 700, marginBottom: 12, fontSize: 12 }}>
                  Follow along the journey
                </Tag>
                <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>
                  From pickup, stopover, and delivery, updates keep you in the loop each step of the way. All driver communication happens inside the platform.
                </Paragraph>
              </Card>
            </Col>

            {/* Bước 3 */}
            <Col xs={24} md={8}>
              <Card
                className="landing-card-hover"
                style={{
                  height: '100%',
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
                cover={
                  <div style={{ height: 210, overflow: 'hidden' }}>
                    <img
                      src={how3}
                      alt="Get your horse delivered"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                }
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  3
                </div>
                <Tag color="green" style={{ borderRadius: 6, fontWeight: 700, marginBottom: 12, fontSize: 12 }}>
                  Get your horse delivered
                </Tag>
                <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>
                  Receive real-time notifications right to the moment your horse walks off the van. Care from people who truly care.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* 4. SECTION "NO MATTER HOW YOU MOVE, WE HAVE THE RIGHT RIDE" (5 CARDS FIGMA) */}
      <section id="transport-types" style={{ padding: '96px 0', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Title level={2} style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              No matter how you move, we have the right ride
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 17, maxWidth: 660, margin: '0 auto' }}>
              Từ rơ-moóc cá nhân cơ động đến chuyên cơ vận tải quy mô lớn phục vụ thi đấu quốc tế
            </Paragraph>
          </div>

          {/* 5 Thẻ nằm ngang khớp chính xác Figma Frame */}
          <Row gutter={[20, 24]}>
            {mainRideCards.map((item, idx) => (
              <Col xs={24} sm={12} md={idx === 4 ? 24 : 12} lg={idx === 4 ? 24 : 6} xl={idx === 4 ? 4 : 5} key={idx}>
                <div
                  onClick={() => navigate(ROUTES.TRANSPORT_TYPES)}
                  className="landing-card-hover"
                  style={{
                    cursor: 'pointer',
                    borderRadius: 18,
                    overflow: 'hidden',
                    position: 'relative',
                    height: 300,
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="landing-img-zoom"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.3) 50%, rgba(0,0,0,0) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: 18,
                    }}
                  >
                    <Tag
                      style={{
                        alignSelf: 'flex-start',
                        marginBottom: 8,
                        fontWeight: 700,
                        backgroundColor: '#FBA919',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: 9999,
                        fontSize: 11,
                      }}
                    >
                      {item.badge}
                    </Tag>
                    <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 17, lineHeight: 1.2, marginBottom: 6 }}>
                      {item.title}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.4, opacity: 0.9 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* Nút Xem Chi Tiết Toàn Bộ 9 Phân Loại Vận Chuyển */}
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(ROUTES.TRANSPORT_TYPES)}
              style={{
                backgroundColor: '#0f172a',
                borderColor: '#0f172a',
                color: '#ffffff',
                fontWeight: 700,
                height: 48,
                borderRadius: 9999,
                padding: '0 32px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
              }}
            >
              Khám phá toàn bộ 9 phân loại xe & phương tiện →
            </Button>
          </div>
        </div>
      </section>

      {/* 5. KHỐI 4 THẺ TÍNH NĂNG (Bao gồm Thẻ Vàng Cam "Door-to-door, simplified" Signature) */}
      <section id="door-to-door" style={{ padding: '80px 0', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <Row gutter={[24, 24]}>
            {/* Card 1: Thẻ vàng cam thương hiệu Door-to-door, simplified */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                className="landing-card-hover"
                style={{
                  height: '100%',
                  borderRadius: 20,
                  backgroundColor: '#FBA919',
                  border: 'none',
                  color: '#0f172a',
                  padding: 8,
                  boxShadow: '0 8px 24px rgba(251, 169, 25, 0.3)',
                }}
              >
                <Title level={3} style={{ color: '#0f172a', fontWeight: 900, marginBottom: 14, fontSize: 22 }}>
                  Door-to-door, simplified.
                </Title>
                <Paragraph style={{ color: '#1e293b', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                  Partner with vetted drivers, receive competitive proposals, and monitor every operational milestone with complete certainty.
                </Paragraph>
                <Button
                  type="primary"
                  onClick={() => handleStartBooking()}
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 700,
                    borderRadius: 9999,
                    height: 40,
                    padding: '0 20px',
                  }}
                >
                  Nhận ước tính cước →
                </Button>
              </Card>
            </Col>

            {/* Card 2: Fully Vetted Drivers */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                className="landing-card-hover"
                style={{
                  height: '100%',
                  borderRadius: 20,
                  backgroundColor: '#1e293b',
                  border: 'none',
                  color: '#ffffff',
                  padding: 8,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#FBA919',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 16,
                    marginBottom: 16,
                  }}
                >
                  <SafetyCertificateOutlined />
                </div>
                <Title level={4} style={{ color: '#ffffff', fontWeight: 800, marginBottom: 12 }}>
                  Fully Vetted Drivers
                </Title>
                <Paragraph style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 }}>
                  Insurance, equipment, and operating history verified before a single quote hits your inbox.
                </Paragraph>
              </Card>
            </Col>

            {/* Card 3: Side-by-Side Quote Comparison */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                className="landing-card-hover"
                style={{
                  height: '100%',
                  borderRadius: 20,
                  backgroundColor: '#1e293b',
                  border: 'none',
                  color: '#ffffff',
                  padding: 8,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#FBA919',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 16,
                    marginBottom: 16,
                  }}
                >
                  <CheckCircleFilled />
                </div>
                <Title level={4} style={{ color: '#ffffff', fontWeight: 800, marginBottom: 12 }}>
                  Side-by-Side Quote Comparison
                </Title>
                <Paragraph style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 }}>
                  Unlock vetted quotes in real-time. See item breakdown, and transparent estimates.
                </Paragraph>
              </Card>
            </Col>

            {/* Card 4: Centralized Trip Documentation */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                className="landing-card-hover"
                style={{
                  height: '100%',
                  borderRadius: 20,
                  backgroundColor: '#1e293b',
                  border: 'none',
                  color: '#ffffff',
                  padding: 8,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#FBA919',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 16,
                    marginBottom: 16,
                  }}
                >
                  <InfoCircleOutlined />
                </div>
                <Title level={4} style={{ color: '#ffffff', fontWeight: 800, marginBottom: 12 }}>
                  Centralized Trip Documentation
                </Title>
                <Paragraph style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 }}>
                  Digital coggins, health certificates, and inspection records — accessible at any moment.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* 6. SECTION "WHERE HORSES SHIP MOST" (6 THÀNH PHỐ FIGMA) */}
      <section id="routes" style={{ padding: '96px 0', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Title level={2} style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>
              Where horses ship most
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 16, maxWidth: 660, margin: '0 auto' }}>
              The most traveled routes for sport horses, breeders, and equine events across North America.
            </Paragraph>
          </div>

          {/* Thanh phân loại: Top cities in USA & Filter tabs */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Top cities in USA</span>
            </div>

            <Flex gap={8}>
              <Button
                type={routeTab === 'all' ? 'primary' : 'default'}
                onClick={() => setRouteTab('all')}
                style={{
                  borderRadius: 9999,
                  backgroundColor: routeTab === 'all' ? '#0f172a' : undefined,
                  borderColor: routeTab === 'all' ? '#0f172a' : undefined,
                  fontWeight: 600,
                }}
              >
                All
              </Button>
              <Button
                type={routeTab === 'winter' ? 'primary' : 'default'}
                onClick={() => setRouteTab('winter')}
                style={{
                  borderRadius: 9999,
                  backgroundColor: routeTab === 'winter' ? '#0f172a' : undefined,
                  borderColor: routeTab === 'winter' ? '#0f172a' : undefined,
                  fontWeight: 600,
                }}
              >
                Winter
              </Button>
              <Button
                type={routeTab === 'racing' ? 'primary' : 'default'}
                onClick={() => setRouteTab('racing')}
                style={{
                  borderRadius: 9999,
                  backgroundColor: routeTab === 'racing' ? '#0f172a' : undefined,
                  borderColor: routeTab === 'racing' ? '#0f172a' : undefined,
                  fontWeight: 600,
                }}
              >
                Racing
              </Button>
            </Flex>
          </Flex>

          {/* Lưới 6 thẻ thành phố (2 hàng x 3 cột) */}
          <Row gutter={[28, 28]}>
            {filteredCities.map((item, idx) => (
              <Col xs={24} sm={12} lg={8} key={idx}>
                <div
                  className="landing-card-hover"
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: 18,
                    overflow: 'hidden',
                    color: '#ffffff',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div style={{ height: 180, overflow: 'hidden' }}>
                    <img
                      src={item.image}
                      alt={item.city}
                      className="landing-img-zoom"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#ffffff', marginBottom: 8 }}>
                      {item.city}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, flex: 1, marginBottom: 16 }}>
                      {item.desc}
                    </div>
                    <Flex justify="space-between" align="center" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 12 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.routes}</span>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => handleStartBooking({ dropoffAddress: item.city })}
                        style={{ color: '#FBA919', fontWeight: 700, padding: 0 }}
                      >
                        Đặt tuyến →
                      </Button>
                    </Flex>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 7. BANNER KÊU GỌI NHÀ XE THAM GIA ĐỐI TÁC */}
      <section
        style={{
          backgroundColor: '#0f172a',
          padding: '70px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} md={16}>
              <Title level={2} style={{ color: '#ffffff', fontWeight: 900, marginBottom: 12, fontSize: 32 }}>
                {t('landing.partner.title')}
              </Title>
              <Paragraph style={{ color: '#94a3b8', fontSize: 16, maxWidth: 640, marginBottom: 0 }}>
                {t('landing.partner.subtitle')}
              </Paragraph>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate(ROUTES.BECOME_HAULER)}
                style={{
                  backgroundColor: '#FBA919',
                  borderColor: '#FBA919',
                  color: '#0f172a',
                  fontWeight: 800,
                  height: 50,
                  padding: '0 32px',
                  borderRadius: 9999,
                  boxShadow: '0 6px 20px rgba(251, 169, 25, 0.3)',
                }}
              >
                {t('landing.partner.btnJoin')}
              </Button>
            </Col>
          </Row>
        </div>
      </section>

      {/* 8. Footer dùng chung */}
      <LandingFooter />
    </div>
  );
}
