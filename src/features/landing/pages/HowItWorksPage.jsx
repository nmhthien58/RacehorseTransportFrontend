import {
  Button,
  Card,
  Col,
  Flex,
  Row,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleFilled,
  SafetyCertificateOutlined,
  CompassOutlined,
  ThunderboltOutlined,
  HeartFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { useAuthStore } from '@features/auth/store/authStore';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

// Assets
import heroBg from '@assets/landing/hero-bg.jpg';
import how1 from '@assets/landing/how-1.jpg';
import how2 from '@assets/landing/how-2.jpg';
import how3 from '@assets/landing/how-3.jpg';
import doorHero from '@assets/landing/door-hero.jpg';

const { Title, Text, Paragraph } = Typography;

export default function HowItWorksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleStartBooking = () => {
    if (!isAuthenticated) {
      message.warning(t('landing.nav.loginRequiredBooking', 'Vui lòng đăng nhập để đặt dịch vụ vận chuyển.'));
      navigate(ROUTES.LOGIN, { state: { returnTo: ROUTES.CUSTOMER_BOOKING_NEW } });
    } else {
      navigate(ROUTES.CUSTOMER_BOOKING_NEW);
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* 1. Header dùng chung */}
      <LandingHeader activeKey="more" />

      {/* 2. Hero Section Khớp Figma More_How it works */}
      <section
        style={{
          position: 'relative',
          padding: '140px 0 110px 0',
          backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.78) 55%, rgba(15, 23, 42, 0.4) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ maxWidth: 740 }}>
            <Tag
              color="gold"
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: 9999,
                letterSpacing: '0.06em',
                marginBottom: 20,
              }}
            >
              QUY TRÌNH CHUẨN QUỐC TẾ
            </Tag>

            <Title
              level={1}
              style={{
                color: '#ffffff',
                fontSize: 'clamp(34px, 5.2vw, 56px)',
                fontWeight: 900,
                lineHeight: 1.15,
                marginBottom: 24,
                letterSpacing: '-0.02em',
              }}
            >
              Vetted horse transport, booked online — <span style={{ color: '#FBA919' }}>in about a minute.</span>
            </Title>

            <Paragraph
              style={{
                color: '#cbd5e1',
                fontSize: 18,
                lineHeight: 1.7,
                marginBottom: 36,
              }}
            >
              Nền tảng IET tinh gọn toàn bộ quy trình đặt xe, thẩm định tài xế và kiểm dịch y tế. Bạn chỉ cần chọn lịch trình, chúng tôi phụ trách mọi khâu an toàn từ chuồng đón đến chuồng giao.
            </Paragraph>

            <Button
              type="primary"
              size="large"
              onClick={handleStartBooking}
              style={{
                backgroundColor: '#FBA919',
                borderColor: '#FBA919',
                color: '#0f172a',
                fontWeight: 700,
                height: 52,
                padding: '0 36px',
                borderRadius: 9999,
                fontSize: 16,
                boxShadow: '0 8px 24px rgba(251, 169, 25, 0.35)',
              }}
            >
              Đặt chuyến ngay bây giờ →
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Section 1: How Your Horse's Journey Works (3 Bước có số thứ tự 01, 02, 03) */}
      <section style={{ padding: '90px 0', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <Text style={{ color: '#FBA919', fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              BƯỚC ĐI ĐƠN GIẢN
            </Text>
            <Title level={2} style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginTop: 8 }}>
              How Your Horse's Journey Works
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
              3 bước minh bạch, theo dõi sát sao từ khi lên xe cho đến khi bàn giao an toàn tại điểm đích.
            </Paragraph>
          </div>

          <Row gutter={[32, 40]}>
            {/* Bước 01 */}
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
                  <img
                    src={how1}
                    alt="Hassle-free online booking"
                    style={{ height: 220, objectFit: 'cover' }}
                  />
                }
              >
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 28, marginBottom: 8 }}>01</div>
                <Title level={4} style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                  Hassle-free online booking
                </Title>
                <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
                  Tell us your route, compare quotes from vetted drivers, and book the service you want. No phone tag, no spreadsheets, no guesswork.
                </Paragraph>
              </Card>
            </Col>

            {/* Bước 02 */}
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
                  <img
                    src={how2}
                    alt="Follow along the journey"
                    style={{ height: 220, objectFit: 'cover' }}
                  />
                }
              >
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 28, marginBottom: 8 }}>02</div>
                <Title level={4} style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                  Follow along the journey
                </Title>
                <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
                  From pickup, stopover, and delivery, updates keep you in the loop each step of the way. All driver communication happens inside the platform.
                </Paragraph>
              </Card>
            </Col>

            {/* Bước 03 */}
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
                  <img
                    src={how3}
                    alt="Get your horse delivered"
                    style={{ height: 220, objectFit: 'cover' }}
                  />
                }
              >
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 28, marginBottom: 8 }}>03</div>
                <Title level={4} style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                  Get your horse delivered
                </Title>
                <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
                  Receive real-time notifications right to the moment your horse walks off the van. Care from people who truly care.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* 4. Khối Vàng Cam Signature: More Than a Ride, A Journey You Can Trust */}
      <section style={{ backgroundColor: '#FBA919', padding: '80px 0', color: '#0f172a' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <Row gutter={[48, 40]} align="middle">
            <Col xs={24} md={12}>
              <img
                src={doorHero}
                alt="Safe horse care"
                style={{
                  width: '100%',
                  borderRadius: 20,
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.2)',
                  objectFit: 'cover',
                  maxHeight: 400,
                }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Tag
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 700,
                  padding: '4px 14px',
                  borderRadius: 9999,
                  border: 'none',
                  marginBottom: 16,
                }}
              >
                EQUINE SAFETY COMMITMENT
              </Tag>
              <Title level={2} style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>
                More Than a Ride, A Journey You Can Trust.
              </Title>
              <Paragraph style={{ fontSize: 16, lineHeight: 1.8, color: '#1e293b', marginBottom: 24 }}>
                Chúng tôi không chỉ vận chuyển ngựa, chúng tôi chăm sóc thành viên trong gia đình bạn. Mỗi chuyến xe đều áp dụng quy chuẩn kiểm dịch 10 điểm khắt khe và bảo hiểm toàn diện.
              </Paragraph>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircleFilled style={{ fontSize: 18, color: '#0f172a' }} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>100% tài xế được xác minh danh tính và bảo hiểm thương mại $1M+</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircleFilled style={{ fontSize: 18, color: '#0f172a' }} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Kiểm tra nước uống và thể trạng mỗi 3-4 giờ hành trình</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircleFilled style={{ fontSize: 18, color: '#0f172a' }} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Hình ảnh và video cập nhật trực tiếp cho chủ ngựa qua ứng dụng</span>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                onClick={handleStartBooking}
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 700,
                  height: 48,
                  padding: '0 32px',
                  borderRadius: 9999,
                }}
              >
                Đặt chuyến ngay
              </Button>
            </Col>
          </Row>
        </div>
      </section>

      {/* 5. Khối Cảnh Quan: True Horse-First Quality. True Peace of Mind */}
      <section
        style={{
          position: 'relative',
          padding: '100px 0',
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.88)), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <Title level={2} style={{ color: '#ffffff', fontSize: 40, fontWeight: 900, marginBottom: 16 }}>
            True Horse-First quality. True Peace of Mind.
          </Title>
          <Paragraph style={{ color: '#cbd5e1', fontSize: 18, lineHeight: 1.7, marginBottom: 40 }}>
            Hàng ngàn chủ trang trại, huấn luyện viên và vận động viên đua ngựa hàng đầu đã tin tưởng chọn International Equine Transport.
          </Paragraph>

          <Row gutter={[24, 24]}>
            <Col xs={12} sm={6}>
              <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '24px 16px' }}>
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 36 }}>99.8%</div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Đúng giờ hẹn</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '24px 16px' }}>
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 36 }}>40,000+</div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Ngựa vận chuyển</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '24px 16px' }}>
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 36 }}>4.9 ★</div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Đánh giá trung bình</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '24px 16px' }}>
                <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 36 }}>100%</div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>An toàn sinh học</div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 6. Footer dùng chung */}
      <LandingFooter />
    </div>
  );
}
