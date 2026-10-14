import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Timeline,
  Progress,
  Tabs,
  Badge,
  Avatar,
  Table,
  Modal,
  Alert,
  Select,
  Segmented,
  Tooltip,
  Divider,
  message,
} from 'antd';
import {
  CompassOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileDoneOutlined,
  DownloadOutlined,
  StarFilled,
  AlertOutlined,
  SyncOutlined,
  TeamOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { getStoredRoutePlans } from '@utils/routePlanStorage';
import { getStoredBookings } from '@utils/bookingStorage';

const { Title, Text, Paragraph } = Typography;

// Dữ liệu mẫu các chuyến đi thực tế của khách hàng nếu chưa có dữ liệu backend
const SAMPLE_CUSTOMER_TRIPS = [
  {
    tripId: 101,
    tripCode: 'TRP-2026-0001',
    bookingCode: 'BKG-2026-0001',
    status: 'InTransit',
    origin: 'Trang trại Yên Bài, Ba Vì, Hà Nội',
    destination: 'Trường đua Quốc tế Tùng Hóa, TP. Quảng Châu',
    transportMode: 'Ground',
    vehicleName: 'Mercedes-Benz Actros Equine Van VIP #51D-8921',
    departureDate: '2026-10-14T06:00:00Z',
    deliveryDate: '2026-10-16T18:00:00Z',
    cost: 4500,
    speed: 62,
    cabinTemp: 18.2,
    humidity: 54,
    ventilationLevel: 3,
    co2Ppm: 420,
    driver: {
      name: 'Phạm Văn Đức',
      role: 'Tài xế trưởng chuyên trách FEI',
      phone: '+84 912 000 004',
      avatar: '👨‍✈️',
    },
    escort: {
      name: 'Dr. Elena Rostova',
      role: 'Bác sĩ Thú y FEI (Veterinary Escort)',
      phone: '+84 912 000 006',
      avatar: '👩‍⚕️',
      cert: 'FEI-VET-8841',
    },
    horses: [
      {
        id: 1,
        name: 'Red Flash (Tia Chớp Đỏ)',
        breed: 'Thoroughbred',
        gender: 'Stallion',
        heartRate: 38,
        bodyTemp: 37.8,
        hydration: 'Tốt (Đàn hồi da < 2s)',
        waterIntake: '18 Liters',
        stressLevel: 'Calm',
        stressText: 'Bình tĩnh / Thư giãn',
        vetNotes: 'Ngựa ăn hết khẩu phần cỏ khô Timothy, uống đủ nước điện giải tại trạm dừng Lạng Sơn. Không có biểu hiện mệt mỏi hay đau bụng (colic).',
      },
      {
        id: 2,
        name: 'Golden Pegasus (Kim Mã)',
        breed: 'Arabian',
        gender: 'Mare',
        heartRate: 40,
        bodyTemp: 38.0,
        hydration: 'Tốt (Độ ẩm niêm mạc hồng hào)',
        waterIntake: '16 Liters',
        stressLevel: 'Calm',
        stressText: 'Bình tĩnh / Thể lực tốt',
        vetNotes: 'Tâm lý ổn định, quen với nhịp rung lắc của xe rơ-moóc khí nén. Đã kiểm tra nhịp tim sau 4 giờ hành trình.',
      },
    ],
    checkpoints: [
      {
        step: 1,
        name: 'Trang trại Yên Bài, Ba Vì (ORIGIN)',
        address: 'Yên Bài, Ba Vì, Hà Nội, Việt Nam',
        status: 'Departed',
        time: 'Oct 14, 2026 • 06:15 AM',
        notes: 'Kiểm tra niêm phong khoang xe và đón ngựa lên chuồng',
      },
      {
        step: 2,
        name: 'Trạm kiểm dịch Thú y Lạng Sơn',
        address: 'TP. Lạng Sơn, Tỉnh Lạng Sơn',
        status: 'Departed',
        time: 'Oct 14, 2026 • 11:30 AM',
        notes: 'Đo thân nhiệt, bù nước điện giải và kiểm tra vi mạch',
      },
      {
        step: 3,
        name: 'Cửa khẩu Quốc tế Hữu Nghị (Customs)',
        address: 'Huyện Cao Lộc, Tỉnh Lạng Sơn',
        status: 'Departed',
        time: 'Oct 14, 2026 • 14:00 PM',
        notes: 'Hoàn tất thủ tục thông quan luồng xanh hải quan & chứng thư CVI',
      },
      {
        step: 4,
        name: 'Trạm kiểm dịch Bằng Tường (Pingxiang Quarantine)',
        address: 'TP. Bằng Tường, Sùng Tả, Quảng Tây, Trung Quốc',
        status: 'InTransit',
        time: 'Oct 15, 2026 • 08:00 AM (Dự kiến)',
        notes: 'Nghỉ đêm 90 phút và kiểm tra sinh hiệu chuyên sâu bởi bác sĩ thú y',
      },
      {
        step: 5,
        name: 'Trường đua Quốc tế Tùng Hóa (DESTINATION)',
        address: 'Quận Tùng Hóa, TP. Quảng Châu, Trung Quốc',
        status: 'Scheduled',
        time: 'Oct 16, 2026 • 18:00 PM (Dự kiến)',
        notes: 'Bàn giao ngựa cho ban quản lý trường đua và ký e-POD',
      },
    ],
  },
  {
    tripId: 102,
    tripCode: 'TRP-2026-0002',
    bookingCode: 'BKG-2026-0002',
    status: 'Completed',
    origin: 'Cảng HKQT Tân Sơn Nhất (SGN), TP.HCM',
    destination: 'Sân bay Quốc tế Changi (SIN), Singapore',
    transportMode: 'Air',
    vehicleName: 'Boeing 777F SkyCargo #TG-777F-01',
    departureDate: '2026-10-01T08:00:00Z',
    deliveryDate: '2026-10-02T16:00:00Z',
    cost: 18500,
    speed: 0,
    cabinTemp: 17.8,
    humidity: 52,
    ventilationLevel: 4,
    co2Ppm: 390,
    driver: null,
    escort: {
      name: 'Dr. Sarah Jenkins',
      role: 'Bác sĩ Thú y Chuyên cơ (In-Flight Equine Vet)',
      phone: '+84 912 000 008',
      avatar: '👩‍⚕️',
      cert: 'US-9912 (FEI Flying Vet)',
    },
    horses: [
      {
        id: 3,
        name: 'Royal Duchess (Công Nương)',
        breed: 'Thoroughbred',
        gender: 'Mare',
        heartRate: 36,
        bodyTemp: 37.6,
        hydration: 'Tối ưu',
        waterIntake: '22 Liters',
        stressLevel: 'Calm',
        stressText: 'Hoàn hảo',
        vetNotes: 'Chuyến bay êm thuận, áp suất buồng khí nén ổn định 840 hPa. Ngựa thích nghi tốt khi cất cánh và hạ cánh tại Changi.',
      },
    ],
    checkpoints: [
      {
        step: 1,
        name: 'Sân bay Tân Sơn Nhất (SGN)',
        address: 'TP. Hồ Chí Minh, Việt Nam',
        status: 'Departed',
        time: 'Oct 01, 2026 • 08:30 AM',
        notes: 'Bốc xếp thùng chuồng bay IATA lên chuyên cơ Boeing 777F',
      },
      {
        step: 2,
        name: 'Sân bay Quốc tế Changi (SIN)',
        address: 'Changi, Singapore',
        status: 'Departed',
        time: 'Oct 02, 2026 • 15:30 PM',
        notes: 'Hạ cánh an toàn, kiểm dịch thú y BCP Singapore và bàn giao chuồng',
      },
    ],
  },
  {
    tripId: 98,
    tripCode: 'TRP-2025-0089',
    bookingCode: 'BKG-2025-0089',
    status: 'Completed',
    origin: 'Trang trại Đại Nam, Bình Dương',
    destination: 'Bangkok Suvarnabhumi Airport (BKK), Thái Lan',
    transportMode: 'DoorToDoor',
    vehicleName: 'Mercedes-Benz Actros Inter-Trans #51D-3312',
    departureDate: '2026-09-10T06:00:00Z',
    deliveryDate: '2026-09-12T14:00:00Z',
    cost: 12400,
    speed: 0,
    cabinTemp: 18.0,
    humidity: 50,
    ventilationLevel: 3,
    co2Ppm: 410,
    driver: {
      name: 'Trần Văn Hoàng',
      role: 'Tài xế Quốc tế',
      phone: '+84 912 000 005',
      avatar: '👨‍✈️',
    },
    escort: {
      name: 'BS. Nguyễn Minh Trí',
      role: 'Bác sĩ Thú y Áp tải',
      phone: '+84 912 000 009',
      avatar: '👨‍⚕️',
      cert: 'VN-VET-042',
    },
    horses: [
      {
        id: 4,
        name: 'Silver Arrow (Bạch Mã)',
        breed: 'Warmblood',
        gender: 'Gelding',
        heartRate: 37,
        bodyTemp: 37.7,
        hydration: 'Tốt',
        waterIntake: '20 Liters',
        stressLevel: 'Calm',
        stressText: 'Ổn định',
        vetNotes: 'Đã hoàn tất hành trình bàn giao tại Bangkok. e-POD đã ký nhận đầy đủ.',
      },
    ],
    checkpoints: [
      {
        step: 1,
        name: 'Trang trại Đại Nam',
        address: 'Bình Dương, Việt Nam',
        status: 'Departed',
        time: 'Sep 10, 2026 • 06:00 AM',
        notes: 'Đón ngựa tại chuồng',
      },
      {
        step: 2,
        name: 'Sân bay Quốc tế Suvarnabhumi (BKK)',
        address: 'Bangkok, Thái Lan',
        status: 'Departed',
        time: 'Sep 12, 2026 • 13:45 PM',
        notes: 'Bàn giao hoàn tất e-POD cho đối tác Thái Lan',
      },
    ],
  },
];

/**
 * Màn hình Active Trips & Trip History dành cho Chủ ngựa đua (Customer)
 * Thiết kế chuẩn hóa theo Figma Screen D (Live Trip & Equine Telemetry Tracker) và Screen E (trip_history 1)
 */
export default function ActiveTripsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [activeTabKey, setActiveTabKey] = useState('live');
  const [selectedTripCode, setSelectedTripCode] = useState('TRP-2026-0001');
  const [selectedHorseId, setSelectedHorseId] = useState(1);
  const [historyFilter, setHistoryFilter] = useState('ALL');
  const [podModalOpen, setPodModalOpen] = useState(false);
  const [selectedPodTrip, setSelectedPodTrip] = useState(null);

  // Lấy các chuyến đi được giao hoặc kế hoạch gộp với mock
  const activeTrip = useMemo(() => {
    return SAMPLE_CUSTOMER_TRIPS.find((t) => t.tripCode === selectedTripCode) || SAMPLE_CUSTOMER_TRIPS[0];
  }, [selectedTripCode]);

  const activeHorse = useMemo(() => {
    const list = activeTrip.horses || [];
    return list.find((h) => h.id === Number(selectedHorseId)) || list[0] || {};
  }, [activeTrip, selectedHorseId]);

  // Cập nhật selectedHorseId khi đổi chuyến
  useEffect(() => {
    if (activeTrip.horses?.length > 0) {
      setSelectedHorseId(activeTrip.horses[0].id);
    }
  }, [activeTrip]);

  // Danh sách lịch sử chuyến đi
  const filteredHistory = useMemo(() => {
    if (historyFilter === 'ALL') return SAMPLE_CUSTOMER_TRIPS;
    return SAMPLE_CUSTOMER_TRIPS.filter((t) => t.status === historyFilter);
  }, [historyFilter]);

  const handleOpenPod = (trip) => {
    setSelectedPodTrip(trip);
    setPodModalOpen(true);
  };

  const handleCall = (name, phone) => {
    message.info(`Đang kết nối cuộc gọi thoại vệ tinh tới ${name} (${phone})...`);
  };

  const handleMessage = (name) => {
    message.info(`Đã mở kênh chat trực tiếp chuyên dụng với ${name}.`);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px' }}>
      {/* Header chính */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <Flex align="center" gap={10} style={{ marginBottom: 4 }}>
              <CompassOutlined style={{ fontSize: 24, color: '#D97706' }} />
              <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                Live Trip & Equine Telemetry Tracker
              </Title>
              <Tag color="gold" style={{ fontWeight: 800, borderRadius: 9999, padding: '2px 10px' }}>
                Chuẩn FEI
              </Tag>
            </Flex>
            <Text style={{ color: '#64748B', fontSize: 13.5 }}>
              Theo dõi GPS vệ tinh trực tuyến, vi khí hậu khoang chở ngựa và nhật ký sinh trắc học thời gian thực
            </Text>
          </div>

          <Segmented
            size="large"
            value={activeTabKey}
            onChange={setActiveTabKey}
            options={[
              { label: '📡 Giám sát Realtime (Live Tracker)', value: 'live' },
              { label: '📋 Lịch sử chuyến đi (Trip History)', value: 'history' },
            ]}
            style={{ fontWeight: 700, borderRadius: 10, padding: 4 }}
          />
        </Flex>
      </div>

      {activeTabKey === 'live' ? (
        <div>
          {/* DẢI BANNER TRẠNG THÁI CHUYẾN ĐI & BỘ CHỌN CHUYẾN ĐANG CHẠY */}
          <div
            style={{
              backgroundColor: '#FFFDF5',
              border: '2px solid #FDE68A',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 20,
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
            }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
              <Space size={12} align="center">
                <Badge status="processing" color="#10B981" />
                <div>
                  <div style={{ fontSize: 12, color: '#92400E', fontWeight: 700, textTransform: 'uppercase' }}>
                    ● LIVE TELEMETRY LINKED • 100% SIGNAL INTEGRITY
                  </div>
                  <strong style={{ fontSize: 16, color: '#0F172A' }}>
                    Chuyến đi: {activeTrip.tripCode} ({activeTrip.bookingCode}) — {activeTrip.origin.split(',')[0]} ➔ {activeTrip.destination.split(',')[0]}
                  </strong>
                </div>
              </Space>

              <Space size={10} wrap>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Chọn chuyến theo dõi:</span>
                <Select
                  value={selectedTripCode}
                  onChange={setSelectedTripCode}
                  style={{ width: 260 }}
                  size="middle"
                  options={SAMPLE_CUSTOMER_TRIPS.map((t) => ({
                    value: t.tripCode,
                    label: `${t.tripCode} (${t.status === 'InTransit' ? 'Đang chạy' : 'Đã xong'})`,
                  }))}
                />
              </Space>
            </Flex>
          </div>

          {/* NỘI DUNG 2 CỘT CHUẨN FIGMA SCREEN D */}
          <Row gutter={[20, 20]}>
            {/* CỘT TRÁI: LỘ TRÌNH, TRẠM KIỂM SOÁT & THÔNG TIN KÍP LÁI */}
            <Col xs={24} lg={13}>
              {/* Thẻ Lộ trình & Các mốc kiểm soát */}
              <Card
                bordered
                style={{
                  borderRadius: 16,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  marginBottom: 20,
                }}
                styles={{ body: { padding: 22 } }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 18 }}>
                  <div>
                    <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                      Itinerary & Milestones (Lộ trình & Trạm dừng)
                    </Title>
                    <Text style={{ fontSize: 12.5, color: '#64748B' }}>
                      Cập nhật trạng thái từng trạm theo quy trình kiểm tra thú y quốc tế
                    </Text>
                  </div>
                  <Tag
                    color={activeTrip.status === 'InTransit' ? 'orange' : 'green'}
                    style={{ fontWeight: 800, fontSize: 12, padding: '3px 10px', borderRadius: 9999 }}
                  >
                    {activeTrip.status === 'InTransit' ? '🚚 Đang trên đường' : '✓ Đã hoàn thành'}
                  </Tag>
                </Flex>

                {/* Timeline trạm kiểm soát */}
                <Timeline
                  mode="left"
                  items={activeTrip.checkpoints.map((cp) => {
                    const isDone = cp.status === 'Departed';
                    const isCurrent = cp.status === 'InTransit' || cp.status === 'Arrived';

                    return {
                      color: isDone ? '#10B981' : isCurrent ? '#F59E0B' : '#CBD5E1',
                      dot: (
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            backgroundColor: isDone ? '#10B981' : isCurrent ? '#F59E0B' : '#E2E8F0',
                            color: isDone || isCurrent ? '#FFFFFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          {cp.step}
                        </div>
                      ),
                      children: (
                        <div
                          style={{
                            backgroundColor: isCurrent ? '#FFFBEB' : '#F8FAFC',
                            border: isCurrent ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                            borderRadius: 12,
                            padding: '12px 16px',
                            marginBottom: 14,
                          }}
                        >
                          <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
                            <strong style={{ fontSize: 14, color: '#0F172A' }}>{cp.name}</strong>
                            <Tag color={isDone ? 'green' : isCurrent ? 'gold' : 'default'} style={{ fontWeight: 700 }}>
                              {isDone ? '✓ Đã hoàn thành' : isCurrent ? '● Đang di chuyển tới' : 'Dự kiến'}
                            </Tag>
                          </Flex>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} /> {cp.time}
                          </div>
                          <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
                            {cp.notes}
                          </div>
                        </div>
                      ),
                    };
                  })}
                />
              </Card>

              {/* Thẻ Kíp điều khiển & Phương tiện vận chuyển */}
              <Card
                bordered
                style={{
                  borderRadius: 16,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
                styles={{ body: { padding: 22 } }}
              >
                <Title level={4} style={{ margin: '0 0 14px', fontWeight: 800, color: '#0F172A' }}>
                  👥 Kíp điều khiển & Phương tiện (Crew & Equipment)
                </Title>

                <Row gutter={[16, 16]}>
                  {/* Bác sĩ thú y áp tải */}
                  <Col xs={24} sm={12}>
                    <div
                      style={{
                        backgroundColor: '#F0FDF4',
                        border: '1.5px solid #BBF7D0',
                        borderRadius: 14,
                        padding: '14px 16px',
                        height: '100%',
                      }}
                    >
                      <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 28 }}>{activeTrip.escort?.avatar || '👩‍⚕️'}</span>
                        <div>
                          <strong style={{ fontSize: 14, color: '#166534', display: 'block' }}>
                            {activeTrip.escort?.name || 'Dr. Elena Rostova'}
                          </strong>
                          <span style={{ fontSize: 11.5, color: '#15803D' }}>
                            {activeTrip.escort?.role || 'Bác sĩ Thú y Áp tải FEI'}
                          </span>
                        </div>
                      </Flex>
                      <div style={{ fontSize: 11.5, color: '#4B5563', marginBottom: 10 }}>
                        Chứng chỉ: <code>{activeTrip.escort?.cert || 'FEI-VET-8841'}</code>
                      </div>
                      <Space size={8}>
                        <Button
                          size="small"
                          type="primary"
                          icon={<PhoneOutlined />}
                          onClick={() => handleCall(activeTrip.escort?.name, activeTrip.escort?.phone)}
                          style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', borderRadius: 6, fontWeight: 600 }}
                        >
                          Gọi điện
                        </Button>
                        <Button
                          size="small"
                          icon={<MessageOutlined />}
                          onClick={() => handleMessage(activeTrip.escort?.name)}
                          style={{ borderRadius: 6 }}
                        >
                          Nhắn tin
                        </Button>
                      </Space>
                    </div>
                  </Col>

                  {/* Tài xế trưởng */}
                  <Col xs={24} sm={12}>
                    <div
                      style={{
                        backgroundColor: '#EFF6FF',
                        border: '1.5px solid #BFDBFE',
                        borderRadius: 14,
                        padding: '14px 16px',
                        height: '100%',
                      }}
                    >
                      <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 28 }}>{activeTrip.driver?.avatar || '👨‍✈️'}</span>
                        <div>
                          <strong style={{ fontSize: 14, color: '#1E40AF', display: 'block' }}>
                            {activeTrip.driver?.name || 'Chuyên cơ Hàng không'}
                          </strong>
                          <span style={{ fontSize: 11.5, color: '#2563EB' }}>
                            {activeTrip.driver?.role || 'Vận tải Hàng không IATA'}
                          </span>
                        </div>
                      </Flex>
                      <div style={{ fontSize: 11.5, color: '#4B5563', marginBottom: 10 }}>
                        Phương tiện: <strong>{activeTrip.vehicleName}</strong>
                      </div>
                      {activeTrip.driver ? (
                        <Space size={8}>
                          <Button
                            size="small"
                            type="primary"
                            icon={<PhoneOutlined />}
                            onClick={() => handleCall(activeTrip.driver?.name, activeTrip.driver?.phone)}
                            style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', borderRadius: 6, fontWeight: 600 }}
                          >
                            Gọi điện
                          </Button>
                          <Button
                            size="small"
                            icon={<MessageOutlined />}
                            onClick={() => handleMessage(activeTrip.driver?.name)}
                            style={{ borderRadius: 6 }}
                          >
                            Nhắn tin
                          </Button>
                        </Space>
                      ) : (
                        <Tag color="blue" style={{ fontWeight: 700 }}>
                          ✈️ Chuyến chuyên cơ do Phi hành đoàn & Vet Escort đảm trách
                        </Tag>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* CỘT PHẢI: TELEMETRY VI KHÍ HẬU & SINH TRẮC HỌC NGỰA ĐUA */}
            <Col xs={24} lg={11}>
              {/* KHỐI 1: VI KHÍ HẬU KHOANG XE / CABIN TELEMETRY */}
              <Card
                bordered
                style={{
                  borderRadius: 16,
                  borderColor: '#E2E8F0',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
                  marginBottom: 20,
                  color: '#FFFFFF',
                }}
                styles={{ body: { padding: 22 } }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                  <Space align="center" size={8}>
                    <ThunderboltOutlined style={{ fontSize: 20, color: '#F59E0B' }} />
                    <Title level={4} style={{ margin: 0, color: '#FFFFFF', fontWeight: 800 }}>
                      Cabin Telemetry (Vi khí hậu)
                    </Title>
                  </Space>
                  <Tag color="cyan" style={{ fontWeight: 800, margin: 0 }}>
                    Chuẩn FEI 16-19°C
                  </Tag>
                </Flex>

                <Row gutter={[14, 14]}>
                  {/* Gauge 1: Nhiệt độ khoang */}
                  <Col span={12}>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#94A3B8', display: 'block' }}>
                        NHIỆT ĐỘ CABIN
                      </Text>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#10B981', margin: '4px 0' }}>
                        {activeTrip.cabinTemp}°C
                      </div>
                      <Tag color="success" style={{ fontWeight: 700, margin: 0 }}>
                        ✓ Tối ưu (Chuẩn FEI)
                      </Tag>
                    </div>
                  </Col>

                  {/* Gauge 2: Độ ẩm */}
                  <Col span={12}>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#94A3B8', display: 'block' }}>
                        ĐỘ ẨM KHÔNG KHÍ
                      </Text>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#38BDF8', margin: '4px 0' }}>
                        {activeTrip.humidity}%
                      </div>
                      <Tag color="blue" style={{ fontWeight: 700, margin: 0 }}>
                        Mức lý tưởng
                      </Tag>
                    </div>
                  </Col>

                  {/* Gauge 3: Thông gió */}
                  <Col span={12}>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#94A3B8', display: 'block' }}>
                        LƯU THÔNG KHÍ TƯƠI
                      </Text>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', margin: '4px 0' }}>
                        Cấp {activeTrip.ventilationLevel}
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>Quạt tuần hoàn liên tục</span>
                    </div>
                  </Col>

                  {/* Gauge 4: CO2 nồng độ */}
                  <Col span={12}>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#94A3B8', display: 'block' }}>
                        NỒNG ĐỘ CO2
                      </Text>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#A78BFA', margin: '4px 0' }}>
                        {activeTrip.co2Ppm} <span style={{ fontSize: 14 }}>ppm</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Trong lành (&lt;800 ppm)</span>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* KHỐI 2: THỂ TRẠNG SINH TRẮC HỌC NGỰA ĐUA (EQUINE HEALTH VITALS) */}
              <Card
                bordered
                style={{
                  borderRadius: 16,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
                styles={{ body: { padding: 22 } }}
              >
                <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginBottom: 14 }}>
                  <div>
                    <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                      🩺 Equine Health Vitals (Sinh trắc học)
                    </Title>
                    <Text style={{ fontSize: 12.5, color: '#64748B' }}>
                      Theo dõi cá thể hóa cho từng ngựa trên chuyến
                    </Text>
                  </div>

                  {/* Segment chọn ngựa */}
                  {activeTrip.horses?.length > 1 && (
                    <Segmented
                      value={selectedHorseId}
                      onChange={setSelectedHorseId}
                      options={activeTrip.horses.map((h) => ({
                        label: `🐴 ${h.name.split(' ')[0]}`,
                        value: h.id,
                      }))}
                      style={{ fontWeight: 700 }}
                    />
                  )}
                </Flex>

                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 14,
                    padding: '14px 18px',
                    border: '1px solid #E2E8F0',
                    marginBottom: 16,
                  }}
                >
                  <Flex justify="space-between" align="center">
                    <div>
                      <strong style={{ fontSize: 16, color: '#0F172A' }}>🐴 {activeHorse.name}</strong>
                      <span style={{ fontSize: 12.5, color: '#64748B', display: 'block' }}>
                        {activeHorse.breed} • {activeHorse.gender}
                      </span>
                    </div>
                    <Tag color="green" style={{ fontWeight: 800, padding: '3px 10px', borderRadius: 9999 }}>
                      ✓ Sức khỏe Tối ưu
                    </Tag>
                  </Flex>
                </div>

                {/* 4 chỉ số sinh trắc học */}
                <Row gutter={[12, 12]}>
                  {/* Nhịp tim */}
                  <Col span={12}>
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 12 }}>
                      <Flex align="center" gap={6}>
                        <HeartOutlined style={{ color: '#DC2626' }} />
                        <span style={{ fontSize: 12, color: '#991B1B', fontWeight: 700 }}>NHỊP TIM (RESTING)</span>
                      </Flex>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#991B1B', margin: '4px 0' }}>
                        {activeHorse.heartRate} <span style={{ fontSize: 13, fontWeight: 600 }}>BPM</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#B91C1C' }}>Chuẩn nghỉ: 28-44 BPM</span>
                    </div>
                  </Col>

                  {/* Thân nhiệt */}
                  <Col span={12}>
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: 12 }}>
                      <Flex align="center" gap={6}>
                        <ThunderboltOutlined style={{ color: '#D97706' }} />
                        <span style={{ fontSize: 12, color: '#92400E', fontWeight: 700 }}>THÂN NHIỆT</span>
                      </Flex>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#92400E', margin: '4px 0' }}>
                        {activeHorse.bodyTemp}°C
                      </div>
                      <span style={{ fontSize: 11, color: '#B45309' }}>Ngưỡng sinh lý: 37.2-38.3°C</span>
                    </div>
                  </Col>

                  {/* Mức độ stress */}
                  <Col span={12}>
                    <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 12 }}>
                      <span style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>MỨC ĐỘ STRESS</span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#166534', margin: '6px 0 2px' }}>
                        {activeHorse.stressText}
                      </div>
                      <span style={{ fontSize: 11, color: '#15803D' }}>Cảm biến tai & hành vi</span>
                    </div>
                  </Col>

                  {/* Bù nước */}
                  <Col span={12}>
                    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 12 }}>
                      <span style={{ fontSize: 12, color: '#1E40AF', fontWeight: 700 }}>LƯỢNG NƯỚC UỐNG</span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#1E40AF', margin: '6px 0 2px' }}>
                        {activeHorse.waterIntake}
                      </div>
                      <span style={{ fontSize: 11, color: '#2563EB' }}>Đàn hồi da: &lt; 2 giây</span>
                    </div>
                  </Col>
                </Row>

                {/* Nhật ký bác sĩ thú y ghi nhận */}
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    backgroundColor: '#F1F5F9',
                    borderRadius: 10,
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <strong style={{ fontSize: 12.5, color: '#0F172A', display: 'block', marginBottom: 4 }}>
                    📝 Ghi nhận mới nhất từ Bác sĩ Thú y Áp tải:
                  </strong>
                  <Paragraph style={{ margin: 0, fontSize: 12, color: '#475569', fontStyle: 'italic', lineHeight: 1.45 }}>
                    "{activeHorse.vetNotes}"
                  </Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ) : (
        /* TAB 2: TRIP HISTORY & E-POD (LỊCH SỬ CHUYẾN ĐI CHUẨN FIGMA SCREEN E) */
        <div>
          {/* 4 THẺ THỐNG KÊ CHỈ SỐ */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, textAlign: 'center', borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>TỔNG SỐ CHUYẾN ĐI</Text>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>12</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, textAlign: 'center', borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>ĐÃ HOÀN THÀNH</Text>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', marginTop: 4 }}>10</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, textAlign: 'center', borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 13, color: '#D97706', fontWeight: 600 }}>ĐANG DI CHUYỂN</Text>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#D97706', marginTop: 4 }}>1</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, textAlign: 'center', borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 13, color: '#2563EB', fontWeight: 600 }}>ĐÁNH GIÁ DỊCH VỤ</Text>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2563EB', marginTop: 4 }}>
                  4.8 <StarFilled style={{ fontSize: 18, color: '#F59E0B' }} />
                </div>
              </Card>
            </Col>
          </Row>

          {/* DANH SÁCH BẢNG LỊCH SỬ CHUYẾN ĐI */}
          <Card
            bordered
            style={{ borderRadius: 16, borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
            styles={{ body: { padding: 22 } }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 18 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                Trip History & Delivery Proof (Biên bản bàn giao e-POD)
              </Title>

              <Segmented
                value={historyFilter}
                onChange={setHistoryFilter}
                options={[
                  { label: 'Tất cả (12)', value: 'ALL' },
                  { label: 'Đang di chuyển (1)', value: 'InTransit' },
                  { label: 'Đã hoàn thành (10)', value: 'Completed' },
                ]}
                style={{ fontWeight: 600 }}
              />
            </Flex>

            <Table
              dataSource={filteredHistory}
              rowKey="tripId"
              pagination={{ pageSize: 5 }}
              columns={[
                {
                  title: 'Mã chuyến & Đặt chỗ',
                  key: 'code',
                  render: (_, r) => (
                    <div>
                      <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>{r.tripCode}</strong>
                      <span style={{ fontSize: 12, color: '#64748B' }}>{r.bookingCode}</span>
                    </div>
                  ),
                },
                {
                  title: 'Hành lang vận chuyển',
                  key: 'route',
                  render: (_, r) => (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                        {r.origin.split(',')[0]} ➔ {r.destination.split(',')[0]}
                      </div>
                      <Tag
                        color={r.transportMode === 'Air' ? 'blue' : r.transportMode === 'DoorToDoor' ? 'purple' : 'orange'}
                        style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}
                      >
                        {r.transportMode}
                      </Tag>
                    </div>
                  ),
                },
                {
                  title: 'Ngựa đua',
                  key: 'horses',
                  render: (_, r) => (
                    <div>
                      <strong style={{ fontSize: 13 }}>{r.horses?.length || 1} con</strong>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>
                        {(r.horses || []).map((h) => h.name.split(' ')[0]).join(', ')}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Tổng cước phí',
                  key: 'cost',
                  render: (_, r) => (
                    <strong style={{ color: '#0F172A', fontSize: 14 }}>
                      ${r.cost?.toLocaleString()} USD
                    </strong>
                  ),
                },
                {
                  title: 'Trạng thái',
                  key: 'status',
                  render: (_, r) => (
                    <Tag
                      color={r.status === 'Completed' ? 'success' : 'processing'}
                      style={{ fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}
                    >
                      {r.status === 'Completed' ? '✓ Đã hoàn thành' : 'Đang di chuyển'}
                    </Tag>
                  ),
                },
                {
                  title: 'Tác vụ',
                  key: 'actions',
                  render: (_, r) => (
                    <Space size={8}>
                      <Button
                        size="small"
                        type={r.status === 'InTransit' ? 'primary' : 'default'}
                        onClick={() => {
                          setSelectedTripCode(r.tripCode);
                          setActiveTabKey('live');
                        }}
                        style={{ borderRadius: 6, fontWeight: 600 }}
                      >
                        {r.status === 'InTransit' ? 'Xem Realtime' : 'Chi tiết'}
                      </Button>
                      <Button
                        size="small"
                        icon={<FileDoneOutlined />}
                        onClick={() => handleOpenPod(r)}
                        style={{ borderRadius: 6 }}
                      >
                        e-POD
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}

      {/* MODAL BIÊN BẢN BÀN GIAO E-POD (DELIVERY CERTIFICATE) */}
      <Modal
        open={podModalOpen}
        onCancel={() => setPodModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPodModalOpen(false)} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              message.success('Đã tải chứng nhận e-POD & Hồ sơ kiểm dịch thú y về máy!');
              setPodModalOpen(false);
            }}
            style={{ backgroundColor: '#D97706', borderColor: '#D97706', borderRadius: 8, fontWeight: 700 }}
          >
            Tải chứng nhận e-POD (PDF)
          </Button>,
        ]}
        width={680}
        title={
          <Flex align="center" gap={8}>
            <FileDoneOutlined style={{ color: '#D97706', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 800 }}>
              Biên bản Nghiệm thu Bàn giao Điện tử (e-POD Certificate)
            </span>
          </Flex>
        }
      >
        {selectedPodTrip && (
          <div style={{ padding: '8px 0' }}>
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 16,
              }}
            >
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>MÃ CHUYẾN ĐI:</Text>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{selectedPodTrip.tripCode}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>MÃ ĐẶT CHỖ:</Text>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{selectedPodTrip.bookingCode}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>ĐIỂM XUẤT PHÁT:</Text>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{selectedPodTrip.origin}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>ĐIỂM BÀN GIAO ĐÍCH:</Text>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{selectedPodTrip.destination}</div>
                </Col>
              </Row>
            </div>

            {/* Chữ ký số điện tử */}
            <Title level={5} style={{ margin: '14px 0 8px', fontWeight: 700, color: '#0F172A' }}>
              Xác nhận chữ ký số & Con dấu Thú y Quốc tế:
            </Title>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ border: '1px dashed #CBD5E1', borderRadius: 10, padding: 12, textAlign: 'center', backgroundColor: '#FFFFFF' }}>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Chữ ký Tài xế / Trưởng kíp</Text>
                  <div style={{ fontFamily: 'cursive', fontSize: 22, color: '#1E40AF', margin: '8px 0' }}>
                    {selectedPodTrip.driver?.name || 'Pham Van Duc'}
                  </div>
                  <Tag color="green">✓ Đã ký số lúc bàn giao</Tag>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ border: '1px dashed #CBD5E1', borderRadius: 10, padding: 12, textAlign: 'center', backgroundColor: '#FFFFFF' }}>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Chứng nhận Bác sĩ Thú y FEI</Text>
                  <div style={{ fontFamily: 'cursive', fontSize: 22, color: '#059669', margin: '8px 0' }}>
                    {selectedPodTrip.escort?.name || 'Dr. Elena Rostova'}
                  </div>
                  <Tag color="cyan">✓ Sức khỏe hoàn hảo (Cleared)</Tag>
                </div>
              </Col>
            </Row>

            <div style={{ marginTop: 14, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
              Biên bản được bảo chứng bằng mã hash mật mã học tuân thủ IATA LAR & Tiêu chuẩn vận tải thú nuôi FEI quốc tế.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
