import { useState, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Flex,
  Input,
  Row,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  SearchOutlined,
  DollarCircleOutlined,
  CompassOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import { useAuthStore } from '@features/auth/store/authStore';
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

  // Dữ liệu bảng cước phí tham khảo từ Figma
  const internationalRates = [
    {
      key: '1',
      id: 1,
      destination: 'China (Guangzhou, Shanghai)',
      modes: 'Road / Air',
      duration: '2 - 5 days',
      refPrice: '$2,150 - $4,200',
      quarantine: '14 Days',
      totalEstimated: '$3,650 - $5,350',
      category: 'road',
    },
    {
      key: '2',
      id: 2,
      destination: 'Hong Kong (SAR)',
      modes: 'Air Freight',
      duration: '1 - 3 days',
      refPrice: '$3,200 - $4,800',
      quarantine: '7 Days',
      totalEstimated: '$4,600 - $6,400',
      category: 'air',
    },
    {
      key: '3',
      id: 3,
      destination: 'Japan (Tokyo, Osaka)',
      modes: 'Air Freight',
      duration: '2 - 4 days',
      refPrice: '$5,500 - $7,200',
      quarantine: '10 Days',
      totalEstimated: '$7,800 - $10,100',
      category: 'air',
    },
    {
      key: '4',
      id: 4,
      destination: 'Australia (Sydney, Melbourne)',
      modes: 'Air Freight',
      duration: '3 - 5 days',
      refPrice: '$7,800 - $11,500',
      quarantine: '14 Days',
      totalEstimated: '$11,500 - $15,200',
      category: 'air',
    },
    {
      key: '5',
      id: 5,
      destination: 'Europe (France, Germany, Netherlands)',
      modes: 'Air Freight',
      duration: '4 - 6 days',
      refPrice: '$9,200 - $14,000',
      quarantine: '21 Days',
      totalEstimated: '$14,000 - $19,500',
      category: 'all-inclusive',
    },
    {
      key: '6',
      id: 6,
      destination: 'United Kingdom (London, Newmarket)',
      modes: 'Air Freight',
      duration: '4 - 6 days',
      refPrice: '$9,500 - $14,500',
      quarantine: '21 Days',
      totalEstimated: '$14,500 - $20,000',
      category: 'all-inclusive',
    },
    {
      key: '7',
      id: 7,
      destination: 'United States (Lexington, Ocala, LA)',
      modes: 'Air Freight',
      duration: '5 - 7 days',
      refPrice: '$10,500 - $16,000',
      quarantine: '30 Days',
      totalEstimated: '$16,000 - $22,500',
      category: 'all-inclusive',
    },
  ];

  const roadRates = [
    {
      key: 'r1',
      id: 1,
      destination: 'Baotou (Inner Mongolia)',
      transit: '1 - 2 days',
      equipment: 'Dedicated Van',
      sharedRate: '$1,500 - $2,200',
      boxStallRate: '$2,100 - $3,100',
    },
    {
      key: 'r2',
      id: 2,
      destination: 'Guangzhou (Guangdong)',
      transit: '2 - 3 days',
      equipment: 'Commercial Carrier',
      sharedRate: '$2,500 - $3,500',
      boxStallRate: '$3,500 - $4,900',
    },
    {
      key: 'r3',
      id: 3,
      destination: 'Shenzhen (Guangdong)',
      transit: '2 - 3 days',
      equipment: 'Air-ride Van',
      sharedRate: '$2,600 - $3,600',
      boxStallRate: '$3,650 - $5,100',
    },
    {
      key: 'r4',
      id: 4,
      destination: 'Kunming (Yunnan China)',
      transit: '3 - 4 days',
      equipment: 'Air-ride Van',
      sharedRate: '$2,900 - $4,100',
      boxStallRate: '$4,100 - $5,800',
    },
    {
      key: 'r5',
      id: 5,
      destination: 'Vientiane (Laos PDR)',
      transit: '3 - 5 days',
      equipment: 'Cross-border Truck',
      sharedRate: '$1,500 - $2,100',
      boxStallRate: '$2,100 - $2,950',
    },
    {
      key: 'r6',
      id: 6,
      destination: 'Phnom Penh (Cambodia)',
      transit: '1 - 2 days',
      equipment: 'Cross-border Van',
      sharedRate: '$1,200 - $1,700',
      boxStallRate: '$1,700 - $2,400',
    },
  ];

  // Lọc tìm kiếm theo từ khóa
  const filteredInternational = useMemo(() => {
    return internationalRates.filter((item) => {
      const matchSearch =
        item.destination.toLowerCase().includes(searchText.toLowerCase()) ||
        item.modes.toLowerCase().includes(searchText.toLowerCase());
      if (activeTab === 'air') return matchSearch && item.category === 'air';
      if (activeTab === 'road') return matchSearch && item.category === 'road';
      if (activeTab === 'inclusive') return matchSearch && item.category === 'all-inclusive';
      return matchSearch;
    });
  }, [searchText, activeTab]);

  const filteredRoad = useMemo(() => {
    return roadRates.filter((item) =>
      item.destination.toLowerCase().includes(searchText.toLowerCase()) ||
      item.equipment.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText]);

  const intlColumns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
      width: 50,
      render: (v) => <span style={{ fontWeight: 700, color: '#64748b' }}>{v}</span>,
    },
    {
      title: 'ĐIỂM ĐẾN (DESTINATION)',
      dataIndex: 'destination',
      key: 'destination',
      render: (text) => (
        <div>
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{text}</span>
        </div>
      ),
    },
    {
      title: 'HÌNH THỨC',
      dataIndex: 'modes',
      key: 'modes',
      render: (modes) => (
        <Tag color={modes.includes('Air') ? 'blue' : 'green'} style={{ fontWeight: 700 }}>
          {modes}
        </Tag>
      ),
    },
    {
      title: 'THỜI GIAN',
      dataIndex: 'duration',
      key: 'duration',
      render: (t) => <span style={{ color: '#475569' }}>{t}</span>,
    },
    {
      title: 'CƯỚC CƠ SỞ (REFERENCE)',
      dataIndex: 'refPrice',
      key: 'refPrice',
      render: (price) => <span style={{ fontWeight: 700, color: '#334155' }}>{price}</span>,
    },
    {
      title: 'CÁCH LY (QUARANTINE)',
      dataIndex: 'quarantine',
      key: 'quarantine',
      render: (q) => (
        <Tag color="orange" style={{ fontWeight: 600 }}>
          {q}
        </Tag>
      ),
    },
    {
      title: 'TỔNG DỰ TÍNH (ESTIMATED)',
      dataIndex: 'totalEstimated',
      key: 'totalEstimated',
      render: (total) => (
        <span style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>{total}</span>
      ),
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() =>
            handleBookNow({
              destination: record.destination,
              dropoffAddress: record.destination,
              transportMode: record.modes?.toLowerCase().includes('air') ? 'Air' : 'Ground',
              totalHorses: 1,
              stallClass: 'Comfort',
              duration: record.duration,
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
          Đặt tuyến →
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
            BẢNG GIÁ DỰ TÍNH THAM KHẢO
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
            Transport <span style={{ color: '#FBA919' }}>Pricing & Rate Card</span>
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
            Tra cứu mức cước tham khảo theo tuyến đường quốc tế và nội địa. Dữ liệu công khai, minh bạch, giúp bạn dự trù ngân sách di chuyển cho ngựa đua chuẩn xác nhất.
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
              placeholder="Tìm kiếm điểm đến, quốc gia hoặc hình thức (VD: Hong Kong, Japan, Paris, Road, Air...)"
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
                  Tất cả tuyến đường
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
                <Button
                  type={activeTab === 'inclusive' ? 'primary' : 'default'}
                  onClick={() => setActiveTab('inclusive')}
                  style={{
                    borderRadius: 9999,
                    backgroundColor: activeTab === 'inclusive' ? '#0f172a' : undefined,
                    fontWeight: 600,
                  }}
                >
                  Trọn gói chuồng - chuồng
                </Button>
              </Flex>

              <Text style={{ color: '#64748b', fontSize: 13 }}>
                Hiển thị {filteredInternational.length} tuyến
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
            <strong>Lưu ý:</strong> Bảng cước phí mang tính chất tham khảo (Reference Rate Card). Giá chính xác sẽ được tính toán chi tiết dựa trên thể trọng của ngựa, loại chuồng (Shared / Comfort / Private), bảo hiểm và yêu cầu kiểm dịch thú y cụ thể của từng chuyến đi.
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
              marginBottom: 40,
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                International Shipping Rate Card
              </Title>
              <Text style={{ color: '#64748b', fontSize: 13 }}>
                Cước phí ước tính cho các tuyến bay quốc tế và liên vận xuất phát từ Việt Nam / Đông Nam Á
              </Text>
            </div>
            <Table
              columns={intlColumns}
              dataSource={filteredInternational}
              pagination={false}
              rowKey="key"
              scroll={{ x: 800 }}
            />
          </Card>

          {/* Bảng Cước Đường Bộ (Road Transport) */}
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
                Road Transport Rate Card (Đường Bộ & Xuyên Biên Giới)
              </Title>
              <Text style={{ color: '#64748b', fontSize: 13 }}>
                Tuyến đường bộ nội địa và kết nối qua cửa khẩu quốc tế
              </Text>
            </div>
            <Table
              dataSource={filteredRoad}
              pagination={false}
              rowKey="key"
              scroll={{ x: 700 }}
              columns={[
                {
                  title: '#',
                  dataIndex: 'id',
                  key: 'id',
                  width: 50,
                  render: (v) => <span style={{ fontWeight: 700, color: '#64748b' }}>{v}</span>,
                },
                {
                  title: 'ĐIỂM ĐẾN',
                  dataIndex: 'destination',
                  key: 'destination',
                  render: (text) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{text}</span>,
                },
                {
                  title: 'THỜI GIAN',
                  dataIndex: 'transit',
                  key: 'transit',
                  render: (t) => <span style={{ color: '#64748b' }}>{t}</span>,
                },
                {
                  title: 'LOẠI XE & TRANG BỊ',
                  dataIndex: 'equipment',
                  key: 'equipment',
                  render: (eq) => <Tag color="blue">{eq}</Tag>,
                },
                {
                  title: 'CHUỒNG GHÉP (SHARED)',
                  dataIndex: 'sharedRate',
                  key: 'sharedRate',
                  render: (r) => <span style={{ fontWeight: 700, color: '#059669' }}>{r}</span>,
                },
                {
                  title: 'CHUỒNG RIÊNG 1.5X',
                  dataIndex: 'boxStallRate',
                  key: 'boxStallRate',
                  render: (r) => <span style={{ fontWeight: 700, color: '#2563eb' }}>{r}</span>,
                },
                {
                  title: 'ĐẶT XE',
                  key: 'action',
                  render: (_, rec) => (
                    <Button
                      type="default"
                      size="small"
                      onClick={() =>
                        handleBookNow({
                          destination: rec.destination,
                          dropoffAddress: rec.destination,
                          transportMode: 'Ground',
                          totalHorses: 1,
                          stallClass: 'Comfort',
                          duration: rec.duration,
                        })
                      }
                      style={{ fontWeight: 700, borderRadius: 9999 }}
                    >
                      Báo giá →
                    </Button>
                  ),
                },
              ]}
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
