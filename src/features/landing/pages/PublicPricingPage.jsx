import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Card,
  Flex,
  Input,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  SearchOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { useAuthStore } from '@features/auth/store/authStore';
import countryService from '@services/countryService';
import { unwrapList } from '@utils/apiHelpers';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

// Assets
import heroBg from '@assets/landing/hero-bg.jpg';

const { Title, Text, Paragraph } = Typography;

export default function PublicPricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleBookNow = (routeDetails = {}) => {
    if (!isAuthenticated) {
      message.warning(t('landing.nav.loginRequiredBooking', 'Vui lòng đăng nhập để đặt dịch vụ vận chuyển.'));
      navigate(ROUTES.LOGIN, {
        state: {
          returnTo: ROUTES.CUSTOMER_BOOKING_NEW,
          bookingPrefill: routeDetails,
        },
      });
    } else {
      navigate(ROUTES.CUSTOMER_BOOKING_NEW, { state: routeDetails });
    }
  };

  // Phạm vi dịch vụ thật: nước đang nhận và phương thức có giá cước (GET /api/countries/catalog, không cần đăng nhập)
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  useEffect(() => {
    countryService
      .getCatalog()
      .then((res) => setCountries(unwrapList(res)))
      .catch(() => setCountries([]))
      .finally(() => setLoadingCountries(false));
  }, []);

  const filteredCountries = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return countries.filter((c) => {
      const matchSearch =
        !q ||
        c.nameVi?.toLowerCase().includes(q) ||
        c.nameEn?.toLowerCase().includes(q) ||
        c.countryCode?.toLowerCase().includes(q) ||
        (c.airports || []).some((a) => a.iataCode?.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q));
      if (activeTab === 'air') return matchSearch && c.airAvailable;
      if (activeTab === 'road') return matchSearch && c.groundAvailable;
      return matchSearch;
    });
  }, [countries, searchText, activeTab]);

  const activeAirports = (c) => (c.airports || []).filter((a) => a.isActive !== false);

  const countryColumns = [
    {
      title: 'QUỐC GIA',
      key: 'country',
      render: (_, c) => (
        <div>
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{c.nameVi || c.nameEn}</span>
          <span style={{ color: '#64748b', marginLeft: 8 }}>({c.countryCode})</span>
        </div>
      ),
    },
    {
      title: 'ĐƯỜNG BỘ',
      key: 'ground',
      render: (_, c) =>
        c.groundAvailable ? <Tag color="green" style={{ fontWeight: 700 }}>Có</Tag> : <Tag>Không</Tag>,
    },
    {
      title: 'ĐƯỜNG BAY',
      key: 'air',
      render: (_, c) =>
        c.airAvailable ? <Tag color="blue" style={{ fontWeight: 700 }}>Có</Tag> : <Tag>Không</Tag>,
    },
    {
      title: 'SÂN BAY',
      key: 'airports',
      render: (_, c) =>
        activeAirports(c).length > 0 ? (
          <span style={{ color: '#475569' }}>
            {activeAirports(c)
              .map((a) => `${a.iataCode}${a.city ? ` (${a.city})` : ''}`)
              .join(', ')}
          </span>
        ) : (
          <span style={{ color: '#94a3b8' }}>---</span>
        ),
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_, c) => (
        <Button
          type="primary"
          size="small"
          onClick={() =>
            handleBookNow({
              destinationCountryCode: c.countryCode,
              transportMode: c.groundAvailable ? 'Ground' : 'Air',
            })
          }
          style={{
            backgroundColor: '#FBA919',
            borderColor: '#FBA919',
            color: '#0f172a',
            fontWeight: 700,
            borderRadius: 9999,
          }}
        >
          Nhận báo giá →
        </Button>
      ),
    },
  ];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* 1. Header dùng chung */}
      <LandingHeader activeKey="pricing" />

      {/* 2. Hero Section Phủ Tràn Sau Header */}
      <section
        style={{
          position: 'relative',
          padding: '140px 0 70px 0',
          backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.84) 50%, rgba(15, 23, 42, 0.5) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <Tag
            color="gold"
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: 9999,
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}
          >
            PHẠM VI DỊCH VỤ & CÁCH TÍNH GIÁ
          </Tag>

          <Title
            level={1}
            style={{
              color: '#ffffff',
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Transport <span style={{ color: '#FBA919' }}>Pricing</span>
          </Title>

          <Paragraph
            style={{
              color: '#cbd5e1',
              fontSize: 17,
              lineHeight: 1.7,
              maxWidth: 720,
              marginBottom: 32,
            }}
          >
            Xem các nước công ty đang nhận vận chuyển và phương thức (đường bộ / đường bay). Giá được tính riêng cho từng chuyến theo quãng đường, số ngựa, hạng chuồng và giấy tờ của tuyến.
          </Paragraph>

          {/* Ô Tìm Kiếm Điểm Đến & Bộ Lọc Nhanh */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: 16,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
              maxWidth: 820,
            }}
          >
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 18 }} />}
              placeholder="Tìm quốc gia, mã nước hoặc sân bay (VD: Thái Lan, TH, BKK...)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                height: 50,
                fontSize: 15,
                marginBottom: 12,
              }}
            />

            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <Flex gap={8} wrap="wrap">
                <Button
                  type={activeTab === 'all' ? 'primary' : 'default'}
                  onClick={() => setActiveTab('all')}
                  style={{
                    borderRadius: 9999,
                    backgroundColor: activeTab === 'all' ? '#0f172a' : undefined,
                    fontWeight: 600,
                  }}
                >
                  Tất cả quốc gia
                </Button>
                <Button
                  type={activeTab === 'air' ? 'primary' : 'default'}
                  onClick={() => setActiveTab('air')}
                  style={{
                    borderRadius: 9999,
                    backgroundColor: activeTab === 'air' ? '#0f172a' : undefined,
                    fontWeight: 600,
                  }}
                >
                  Hàng không (Air)
                </Button>
                <Button
                  type={activeTab === 'road' ? 'primary' : 'default'}
                  onClick={() => setActiveTab('road')}
                  style={{
                    borderRadius: 9999,
                    backgroundColor: activeTab === 'road' ? '#0f172a' : undefined,
                    fontWeight: 600,
                  }}
                >
                  Đường bộ (Road)
                </Button>
              </Flex>

              <Text style={{ color: '#64748b', fontSize: 13 }}>
                Hiển thị {filteredCountries.length} quốc gia
              </Text>
            </Flex>
          </div>
        </div>
      </section>

      {/* 3. Khung Thông Báo Bảng Giá Tham Khảo */}
      <div style={{ maxWidth: 1240, margin: '24px auto 0 auto', padding: '0 24px' }}>
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: 16,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#92400e',
            fontSize: 14,
          }}
        >
          <InfoCircleOutlined style={{ fontSize: 20, color: '#d97706' }} />
          <span>
            <strong>Lưu ý:</strong> Khi gửi yêu cầu bạn nhận khoảng giá ước tính; báo giá chốt kèm hợp đồng được gửi sau khi công ty duyệt đơn (và duyệt lộ trình với đường bộ). Cước tính theo quãng đường thật × số ngựa (đường bộ) hoặc theo con theo vùng nước đến (đường bay), nhân hệ số hạng chuồng, cộng phụ phí và phí thủ tục của các nước trên tuyến.
          </span>
        </div>
      </div>

      {/* 4. Bảng Cước Phí Tuyến Quốc Tế */}
      <section style={{ padding: '32px 0 48px 0' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
          <Card
            style={{
              borderRadius: 20,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                Quốc gia & phương thức đang phục vụ
              </Title>
              <Text style={{ color: '#64748b', fontSize: 13 }}>
                Đường bộ / đường bay có ở một nước khi công ty đã có giá cước cho tuyến đó
              </Text>
            </div>
            <Table
              columns={countryColumns}
              dataSource={filteredCountries}
              loading={loadingCountries}
              pagination={false}
              rowKey="countryCode"
              scroll={{ x: 700 }}
            />
          </Card>
        </div>
      </section>

      {/* 5. Khối Kêu Gọi Đăng Ký Tài Khoản Để Tính Giá Riêng */}
      <section style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '60px 0' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <Title level={2} style={{ color: '#ffffff', fontWeight: 900, marginBottom: 12 }}>
            Bạn muốn nhận bảng dự toán chính xác cho cá nhân hoặc trang trại?
          </Title>
          <Paragraph style={{ color: '#94a3b8', fontSize: 16, maxWidth: 640, margin: '0 auto 28px auto' }}>
            Đăng nhập tài khoản để sử dụng công cụ <strong>Quote Calculator</strong> chuyên sâu, tính toán chi phí theo số lượng ngựa, bảo hiểm và dịch vụ chăm sóc đi kèm.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={() => handleBookNow()}
            style={{
              backgroundColor: '#FBA919',
              borderColor: '#FBA919',
              color: '#0f172a',
              fontWeight: 800,
              height: 48,
              padding: '0 32px',
              borderRadius: 9999,
              boxShadow: '0 6px 20px rgba(251, 169, 25, 0.35)',
            }}
          >
            Đăng nhập & Tính chi phí chi tiết →
          </Button>
        </div>
      </section>

      {/* 6. Footer dùng chung */}
      <LandingFooter />
    </div>
  );
}
