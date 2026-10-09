import { Row, Col, Typography, Button, Space } from 'antd';
import { UpOutlined, PhoneOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';

const { Title, Text, Paragraph } = Typography;

export default function LandingFooter() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        backgroundColor: '#0a1122',
        color: '#94a3b8',
        padding: '72px 0 36px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
        <Row gutter={[40, 48]}>
          {/* Cột 1: Thông tin thương hiệu IET */}
          <Col xs={24} sm={12} md={6}>
            <div
              onClick={scrollToTop}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: '#FBA919',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                🐴
              </div>
              <div>
                <span
                  style={{
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: 15,
                    display: 'block',
                    lineHeight: 1.1,
                  }}
                >
                  INTERNATIONAL
                </span>
                <span
                  style={{
                    color: '#FBA919',
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.12em',
                  }}
                >
                  EQUINE TRANSPORT
                </span>
              </div>
            </div>
            <Paragraph style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
              {t('landing.footer.aboutDesc')}
            </Paragraph>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(251, 169, 25, 0.1)',
                border: '1px solid rgba(251, 169, 25, 0.25)',
                padding: '6px 14px',
                borderRadius: 9999,
                color: '#FBA919',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <SafetyCertificateOutlined />
              <span>FEI & IATA LAR Certified</span>
            </div>
          </Col>

          {/* Cột 2: Khám phá (Discover) */}
          <Col xs={12} sm={12} md={4}>
            <Title level={5} style={{ color: '#ffffff', fontSize: 15, marginBottom: 20, fontWeight: 700 }}>
              {t('landing.footer.colDiscover')}
            </Title>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li>
                <a
                  onClick={() => navigate(ROUTES.HOW_IT_WORKS)}
                  style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  {t('landing.nav.howItWorks')}
                </a>
              </li>
              <li>
                <a
                  onClick={() => navigate(ROUTES.BECOME_HAULER)}
                  style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  {t('landing.nav.becomeHauler')}
                </a>
              </li>
              <li>
                <a
                  onClick={() => navigate(ROUTES.TRANSPORT_TYPES)}
                  style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  {t('landing.features.doorToDoorTitle')}
                </a>
              </li>
            </ul>
          </Col>

          {/* Cột 3: Hạng mục xe (Transport Types) */}
          <Col xs={12} sm={12} md={5}>
            <Title level={5} style={{ color: '#ffffff', fontSize: 15, marginBottom: 20, fontWeight: 700 }}>
              {t('landing.footer.colTypes')}
            </Title>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li>
                <a
                  onClick={() => navigate(ROUTES.TRANSPORT_TYPES)}
                  style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Local / Short Haul
                </a>
              </li>
              <li>
                <a
                  onClick={() => navigate(ROUTES.TRANSPORT_TYPES)}
                  style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Regional & Long Haul
                </a>
              </li>
              <li>
                <a
                  onClick={() => navigate(ROUTES.TRANSPORT_TYPES)}
                  style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Air Charter Ground Transfer
                </a>
              </li>
              <li>
                <a
                  onClick={() => navigate(ROUTES.TRANSPORT_TYPES)}
                  style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Mare & Foal / Stallion VIP
                </a>
              </li>
              <li>
                <a
                  onClick={() => navigate(ROUTES.TRANSPORT_TYPES)}
                  style={{ color: '#94a3b8', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FBA919')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Emergency Medical ICU
                </a>
              </li>
            </ul>
          </Col>

          {/* Cột 4: Điểm đến phổ biến (Locations) */}
          <Col xs={12} sm={12} md={4}>
            <Title level={5} style={{ color: '#ffffff', fontSize: 15, marginBottom: 20, fontWeight: 700 }}>
              {t('landing.footer.colLocations')}
            </Title>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ fontSize: 14 }}>Wellington, FL</li>
              <li style={{ fontSize: 14 }}>Ocala, FL</li>
              <li style={{ fontSize: 14 }}>Lexington, KY</li>
              <li style={{ fontSize: 14 }}>Aiken, SC</li>
              <li style={{ fontSize: 14 }}>Saratoga Springs, NY</li>
              <li style={{ fontSize: 14 }}>Scottsdale, AZ</li>
            </ul>
          </Col>

          {/* Cột 5: Hỗ trợ 24/7 (Support) */}
          <Col xs={12} sm={12} md={5}>
            <Title level={5} style={{ color: '#ffffff', fontSize: 15, marginBottom: 20, fontWeight: 700 }}>
              {t('landing.footer.colSupport')}
            </Title>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: '#cbd5e1', fontSize: 12, display: 'block', marginBottom: 4 }}>
                {t('landing.footer.emergencyCall')}
              </Text>
              <a
                href="tel:+18005553784"
                style={{
                  color: '#FBA919',
                  fontSize: 16,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <PhoneOutlined /> 1-800-555-EQUINE
              </a>
            </div>
            <Paragraph style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
              24/7 GPS Tracking & Equine Veterinarian On-Call dispatch available nationwide.
            </Paragraph>
            <Button
              ghost
              size="small"
              icon={<UpOutlined />}
              onClick={scrollToTop}
              style={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#cbd5e1',
                borderRadius: 9999,
                fontSize: 12,
              }}
            >
              {t('landing.footer.backToTop')}
            </Button>
          </Col>
        </Row>

        {/* Bản quyền và chính sách */}
        <div
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            {t('landing.footer.copyright')}
          </Text>
          <Space size="large">
            <span style={{ color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
              {t('landing.footer.terms')}
            </span>
            <span style={{ color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
              {t('landing.footer.privacy')}
            </span>
            <span style={{ color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
              Security & Compliance
            </span>
          </Space>
        </div>
      </div>
    </footer>
  );
}
