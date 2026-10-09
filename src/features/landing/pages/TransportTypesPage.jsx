import { useState } from 'react';
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
  ArrowRightOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { useAuthStore } from '@features/auth/store/authStore';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

// Assets
import heroBg from '@assets/landing/hero-bg.jpg';
import typeLocal from '@assets/landing/type-local.jpg';
import typeRegional from '@assets/landing/type-regional.jpg';
import typeLongHaul from '@assets/landing/type-long-haul.jpg';
import typeAirCharter from '@assets/landing/type-air-charter.jpg';
import typeBreeding from '@assets/landing/type-breeding.jpg';
import typeStallion from '@assets/landing/type-stallion.jpg';
import typeShowCircuit from '@assets/landing/type-show-circuit.jpg';
import typeEmergency from '@assets/landing/type-emergency.jpg';
import typeQuarantine from '@assets/landing/type-quarantine.jpg';
import horseWatermark from '@assets/horse-watermark.svg';

const { Title, Text, Paragraph } = Typography;

export default function TransportTypesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleBookType = (typeTitle) => {
    const isAir =
      typeTitle?.toLowerCase().includes('air') ||
      typeTitle?.toLowerCase().includes('charter') ||
      typeTitle?.toLowerCase().includes('bay');
    const payload = {
      transportType: typeTitle,
      transportMode: isAir ? 'Air' : 'Ground',
      totalHorses: 1,
      stallClass: 'Comfort',
    };
    if (!isAuthenticated) {
      message.warning(t('landing.nav.loginRequiredBooking', 'Vui lòng đăng nhập để đặt dịch vụ vận chuyển.'));
      navigate(ROUTES.LOGIN, { state: { returnTo: ROUTES.CUSTOMER_BOOKING_NEW, bookingPrefill: payload } });
    } else {
      navigate(ROUTES.CUSTOMER_BOOKING_NEW, { state: payload });
    }
  };

  const transportTypesList = [
    {
      id: 1,
      title: 'Local / Short Haul',
      badge: 'Local',
      badgeColor: '#10b981',
      desc: 'Khoảng cách dưới 250km, chuyên chở phục vụ khám chữa bệnh thú y, đổi chuồng trại hoặc các giải đấu địa phương.',
      features: ['Thời gian di chuyển dưới 4h', 'Phí cước tối ưu theo giờ/km', 'Xe van 2-3 ngựa cơ động'],
      image: typeLocal,
    },
    {
      id: 2,
      title: 'Regional Transport',
      badge: 'Regional',
      badgeColor: '#3b82f6',
      desc: 'Tuyến liên tỉnh 250km - 800km. Xe van trang bị đệm mút giảm chấn chuyên dụng, hệ thống thông gió chủ động và trạm dừng nghỉ.',
      features: ['Trạm dừng kiểm tra mỗi 3 giờ', 'Đệm sàn cao su chống trơn', 'Báo cáo GPS & nhiệt độ trực tiếp'],
      image: typeRegional,
    },
    {
      id: 3,
      title: 'Long Haul / Cross-Country',
      badge: 'Interstate',
      badgeColor: '#8b5cf6',
      desc: 'Hành trình xuyên quốc gia trên 800km. Đội ngũ 2 tài xế thay phiên lái liên tục kết hợp chuồng nghỉ qua đêm an toàn.',
      features: ['Lái xe 2 người luân phiên', 'Nghỉ đêm chuồng tiêu chuẩn 5 sao', 'Cảm biến nhịp tim & camera 24/7'],
      image: typeLongHaul,
    },
    {
      id: 4,
      title: 'Air Charter Ground Transfer',
      badge: 'Airport Ramp',
      badgeColor: '#ec4899',
      desc: 'Đưa đón ngựa chuyên biệt kết nối thẳng giữa các sân bay quốc tế (IATA LAR) và trung tâm cách ly kiểm dịch quốc gia.',
      features: ['Tiếp cận sát cầu thang máy bay', 'Chứng nhận an toàn hàng không IATA', 'Thủ tục hải quan & kiểm dịch ưu tiên'],
      image: typeAirCharter,
    },
    {
      id: 5,
      title: 'Mare & Foal / Breeding Transport',
      badge: 'Breeding',
      badgeColor: '#f59e0b',
      desc: 'Thiết kế chuồng mở rộng không gian gấp đôi dành cho ngựa mẹ và ngựa con sơ sinh di chuyển tới các trang trại nhân giống.',
      features: ['Khoang đôi không vách ngăn', 'Rơm lót sạch khử khuẩn dày 30cm', 'Cửa nâng thấp dốc chỉ 12 độ'],
      image: typeBreeding,
    },
    {
      id: 6,
      title: 'Stallion VIP Box',
      badge: 'Stallion',
      badgeColor: '#ef4444',
      desc: 'Khoang riêng biệt cách âm và chống nhìn cách ly hoàn toàn dành cho ngựa giống đực nhạy cảm hoặc giá trị cao.',
      features: ['Vách ngăn kín bằng thép bọc đệm', 'Không tiếp xúc tầm mắt ngựa khác', 'Tài xế chuyên gia kiểm soát ngựa đực'],
      image: typeStallion,
    },
    {
      id: 7,
      title: 'Show Circuit & Race Day Express',
      badge: 'Show Circuit',
      badgeColor: '#06b6d4',
      desc: 'Chuyên tuyến đến trường đua và hội chợ triển lãm ngựa. Có khoang riêng biệt chứa tủ yên cương, trang phục và đồ ăn.',
      features: ['Đúng giờ cam kết trước giờ thi 3h', 'Khoang hành lý dụng cụ rộng rãi', 'Điều hòa giữ thể lực 18-20°C'],
      image: typeShowCircuit,
    },
    {
      id: 8,
      title: 'Medical & Emergency Equine Transport',
      badge: 'Emergency ICU',
      badgeColor: '#dc2626',
      desc: 'Xe cấp cứu thú y lưu động đưa ngựa chấn thương khẩn cấp tới bệnh viện đại học thú y với trang thiết bị nâng đỡ đặc biệt.',
      features: ['Đai treo nâng đỡ ngựa gãy chân/đau', 'Hệ thống oxy & dịch truyền trên xe', 'Bác sĩ thú y trực cấp cứu theo xe'],
      image: typeEmergency,
    },
    {
      id: 9,
      title: 'Quarantine & Bio-Secure Haul',
      badge: 'Bio-Secure',
      badgeColor: '#14b8a6',
      desc: 'Xe vận chuyển khử trùng áp lực âm đạt chuẩn y tế sinh học quốc tế phục vụ các đợt cách ly phòng dịch CEM & AIE.',
      features: ['Khử khuẩn toàn diện trước khi đón', 'Lọc khí HEPA kháng khuẩn vi sinh', 'Niêm phong chì cửa khoang vận chuyển'],
      image: typeQuarantine,
    },
  ];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* 1. Header dùng chung */}
      <LandingHeader activeKey="transport" />

      {/* 2. Hero Banner Khớp Thiết Kế Figma Transport Types */}
      <section
        style={{
          position: 'relative',
          padding: '140px 0 100px 0',
          backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.82) 48%, rgba(15, 23, 42, 0.45) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} md={14}>
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
                  marginBottom: 20,
                }}
              >
                <SafetyCertificateOutlined />
                <span>CERTIFIED PROFESSIONAL EQUINE FLEET</span>
              </div>

              <Title
                level={1}
                style={{
                  color: '#ffffff',
                  fontSize: 'clamp(32px, 5vw, 54px)',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  marginBottom: 20,
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                }}
              >
                THE PERFECT <span style={{ color: '#FBA919' }}>TRAILER</span> FOR EVERY JOURNEY.
              </Title>

              <Paragraph
                style={{
                  color: '#cbd5e1',
                  fontSize: 18,
                  lineHeight: 1.7,
                  maxWidth: 620,
                  marginBottom: 32,
                }}
              >
                Giải pháp vận tải ngựa chuyên nghiệp từ chặng ngắn cục bộ đến vận tải xuyên quốc gia và hàng không. Tất cả phương tiện đều đạt chuẩn phúc lợi động vật FEI và giám sát y tế liên tục.
              </Paragraph>

              <Flex gap="middle" wrap="wrap">
                <Button
                  type="primary"
                  size="large"
                  onClick={() => handleBookType('Regional Transport')}
                  style={{
                    backgroundColor: '#FBA919',
                    borderColor: '#FBA919',
                    color: '#0f172a',
                    fontWeight: 700,
                    height: 50,
                    padding: '0 32px',
                    borderRadius: 9999,
                    boxShadow: '0 8px 24px rgba(251, 169, 25, 0.3)',
                  }}
                >
                  {t('landing.hero.bookNow')}
                </Button>
                <Button
                  ghost
                  size="large"
                  onClick={() => {
                    const el = document.getElementById('grid-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    height: 50,
                    padding: '0 28px',
                    borderRadius: 9999,
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                    color: '#ffffff',
                    fontWeight: 600,
                  }}
                >
                  Khám phá 9 phân loại ↓
                </Button>
              </Flex>
            </Col>

            <Col xs={24} md={10} style={{ textAlign: 'center' }}>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 24,
                  padding: '36px 32px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                <img
                  src={horseWatermark}
                  alt="IET Watermark"
                  style={{ width: 100, height: 100, marginBottom: 16, opacity: 0.9 }}
                />
                <Title level={3} style={{ color: '#ffffff', marginBottom: 8, fontWeight: 800 }}>
                  INTERNATIONAL EQUINE TRANSPORT
                </Title>
                <Text style={{ color: '#FBA919', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em' }}>
                  AN TOÀN • PHÚC LỢI • TẬN TÂM
                </Text>
                <div style={{ marginTop: 24, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 20 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 24 }}>40k+</div>
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>Chuyến an toàn</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 24 }}>100%</div>
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>Thẩm định xe</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#FBA919', fontWeight: 900, fontSize: 24 }}>24/7</div>
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>GPS & Bác sĩ</div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 3. Lưới 9 Phân Loại Vận Chuyển Chi Tiết Khớp Figma Node Transport Types */}
      <section id="grid-section" style={{ padding: '80px 0', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Tag
              color="gold"
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '4px 16px',
                borderRadius: 9999,
                marginBottom: 12,
              }}
            >
              CHỦNG LOẠI PHƯƠNG TIỆN
            </Tag>
            <Title level={2} style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
              Transport Types
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 17, maxWidth: 640, margin: '0 auto' }}>
              Mỗi giống ngựa và mục đích di chuyển đều đòi hỏi tiêu chuẩn chuồng và chăm sóc riêng biệt. Lựa chọn phân loại phù hợp dưới đây để bắt đầu.
            </Paragraph>
          </div>

          <Row gutter={[28, 36]}>
            {transportTypesList.map((item) => (
              <Col xs={24} sm={12} lg={8} key={item.id}>
                <Card
                  hoverable
                  className="landing-card-hover"
                  style={{
                    height: '100%',
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  bodyStyle={{
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}
                  cover={
                    <div style={{ position: 'relative', height: 210, overflow: 'hidden' }}>
                      <img
                        src={item.image}
                        alt={item.title}
                        className="landing-img-zoom"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <Tag
                        style={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          fontWeight: 700,
                          fontSize: 12,
                          borderRadius: 9999,
                          border: 'none',
                          padding: '4px 12px',
                          backgroundColor: item.badgeColor,
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        {item.badge}
                      </Tag>
                    </div>
                  }
                >
                  <Title level={4} style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                    {item.title}
                  </Title>
                  <Paragraph style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, flex: 1, marginBottom: 16 }}>
                    {item.desc}
                  </Paragraph>

                  {/* Danh sách đặc điểm nổi bật */}
                  <div style={{ marginBottom: 20, backgroundColor: '#f1f5f9', borderRadius: 12, padding: '12px 14px' }}>
                    {item.features.map((feat, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          color: '#334155',
                          marginBottom: idx === item.features.length - 1 ? 0 : 6,
                        }}
                      >
                        <CheckCircleFilled style={{ color: '#FBA919', fontSize: 13 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="primary"
                    block
                    icon={<ArrowRightOutlined />}
                    onClick={() => handleBookType(item.title)}
                    style={{
                      backgroundColor: '#0f172a',
                      borderColor: '#0f172a',
                      fontWeight: 700,
                      height: 42,
                      borderRadius: 12,
                    }}
                  >
                    Đặt gói {item.badge}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 4. Footer dùng chung */}
      <LandingFooter />
    </div>
  );
}
