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
  Badge,
  Table,
  Modal,
  Select,
  Segmented,
  message,
  Flex,
  Empty,
  Spin,
} from 'antd';
import {
  CompassOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  PhoneOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import bookingService from '@services/bookingService';
import trackingService from '@services/trackingService';
import { unwrapData, unwrapList } from '@utils/apiHelpers';


const { Title, Text, Paragraph } = Typography;

const FEED_TEXT = { Normal: 'Ăn uống bình thường', Reduced: 'Ăn ít', Refused: 'Bỏ ăn' };
const STRESS_TEXT = { Calm: 'Bình tĩnh', MildStress: 'Hơi căng thẳng', Agitated: 'Kích động' };
// Làm mới định kỳ theo khuyến nghị của backend (server giữ kết quả 30 giây)
const POLL_MS = 30000;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

/**
 * Chuyển một chuyến trong GET /tracking/bookings/{id} sang dạng dữ liệu màn hình theo dõi.
 * @param {Object} tracking - Dữ liệu theo dõi của một đơn
 * @param {Object} trip - Một phần tử trong tracking.trips
 * @param {Object} [booking] - Đơn tương ứng (lấy giá)
 * @returns {Object}
 */
function toTripView(tracking, trip, booking) {
  const logs = (trip.horses || []).map((h) => h.latestLog).filter(Boolean);
  const newestLog = [...logs].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))[0];
  const checkpoints = [...(trip.checkpoints || [])].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const nextCp = checkpoints.find((c) => !c.actualArrivalTime && c.status !== 'Cancelled');
  return {
    tripId: trip.tripId,
    tripCode: trip.tripCode,
    bookingCode: tracking.bookingCode,
    status: trip.overallStatus,
    origin: tracking.pickupAddress || '',
    destination: tracking.dropoffAddress || '',
    transportMode: booking?.transportMode || '',
    vehicleName: trip.vehicleCode,
    cost: booking?.estimatedCost,
    handoverCompleted: trip.handoverCompleted,
    cabinTemp: newestLog ? newestLog.cabinTemp : null,
    lastLogAt: newestLog?.loggedAt,
    delayMinutes: trip.delayMinutes || 0,
    checkpointsTotal: checkpoints.filter((c) => c.status !== 'Cancelled').length,
    checkpointsReached: checkpoints.filter((c) => c.actualArrivalTime).length,
    nextCheckpointName: nextCp?.checkpointName,
    nextCheckpointTime: nextCp?.plannedTime,
    driver: trip.leadDriverName ? { name: trip.leadDriverName, role: 'Tài xế trưởng', phone: '' } : null,
    escort: null,
    horses: (trip.horses || []).map((h) => ({
      id: h.horseId,
      name: h.horseName,
      breed: `Ô chuồng ${h.stallSlotNumber}`,
      gender: trip.vehicleCode,
      feedText: h.latestLog ? FEED_TEXT[h.latestLog.feedStatus] || h.latestLog.feedStatus : '—',
      lastLogAt: h.latestLog?.loggedAt,
      stressLevel: h.latestLog?.stressLevel,
      stressText: h.latestLog ? STRESS_TEXT[h.latestLog.stressLevel] || h.latestLog.stressLevel : '—',
      waterIntake: h.latestLog ? `${h.latestLog.waterIntakeLiters} L` : '—',
      needsAttention: h.latestLog?.needsAttention,
      vetNotes: h.latestLog?.notes || 'Chưa có nhật ký thể trạng cho chuyến này.',
    })),
    checkpoints: checkpoints.map((c, _, all) => {
      const isDone = c.status === 'Departed' || (c.checkpointType === 'Destination' && c.actualArrivalTime);
      const isHere = c.status === 'Arrived' || c.status === 'Cleared';
      // Đang dừng tại một mốc thì không đánh dấu mốc kế tiếp là "đang tới"
      const stoppedSomewhere = all.some((x) => x.status === 'Arrived' || x.status === 'Cleared');
      const isHeading = !stoppedSomewhere && nextCp && c.checkpointId === nextCp.checkpointId && trip.overallStatus === 'InTransit';
      return {
        step: c.sequenceOrder,
        name: c.checkpointName,
        address: c.address,
        // Màn hình dùng: Departed = xong, Arrived/InTransit = đang ở / đang tới, còn lại = dự kiến
        status: isDone ? 'Departed' : isHere ? 'Arrived' : isHeading ? 'InTransit' : 'Scheduled',
        time: c.actualArrivalTime ? formatTime(c.actualArrivalTime) : `${formatTime(c.plannedTime)} (Dự kiến)`,
        notes: [c.address, c.delayMinutes ? `Trễ ${c.delayMinutes} phút` : null, c.status === 'Cancelled' ? 'Mốc đã bị bỏ khi nắn tuyến' : null]
          .filter(Boolean)
          .join(' · '),
      };
    }),
  };
}

/**
 * Màn hình Active Trips/**
 * Màn hình Active Trips & Trip History dành cho Chủ ngựa đua (Customer)
 * Thiết kế chuẩn hóa theo Figma Screen D (Live Trip & Equine Telemetry Tracker) và Screen E (trip_history 1)
 */
export default function ActiveTripsPage() {
  const [activeTabKey, setActiveTabKey] = useState('live');
  const [selectedTripCode, setSelectedTripCode] = useState(null);
  const [trips, setTrips] = useState([]);
  const [awaitingPlanning, setAwaitingPlanning] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chuyến của khách: GET /bookings rồi GET /tracking/bookings/{id} cho các đơn đã duyệt / đã xong
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const bookings = unwrapList(await bookingService.getBookings({ size: 100, sort: '-createdAt' }));
        const tracked = bookings.filter((b) => b.status === 'Approved' || b.status === 'Completed');
        const results = await Promise.all(
          tracked.map((b) =>
            trackingService
              .getBookingTracking(b.bookingId)
              .then((res) => ({ booking: b, tracking: unwrapData(res) }))
              .catch(() => null),
          ),
        );
        if (!active) return;
        const views = [];
        const waiting = [];
        results.filter(Boolean).forEach(({ booking, tracking }) => {
          (tracking.trips || []).forEach((trip) => views.push(toTripView(tracking, trip, booking)));
          (tracking.horsesAwaitingPlanning || []).forEach((name) => waiting.push(`${name} (${tracking.bookingCode})`));
        });
        setTrips(views);
        setAwaitingPlanning(waiting);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  const [selectedHorseId, setSelectedHorseId] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('ALL');
  const [podModalOpen, setPodModalOpen] = useState(false);
  const [selectedPodTrip, setSelectedPodTrip] = useState(null);

  // Mặc định theo dõi chuyến đang chạy, nếu không có thì chuyến mới nhất
  const activeTrip = useMemo(() => {
    return (
      trips.find((t) => t.tripCode === selectedTripCode) ||
      trips.find((t) => ['InTransit', 'EmergencyRerouting', 'ArrivedDestination'].includes(t.status)) ||
      trips[0] ||
      null
    );
  }, [trips, selectedTripCode]);

  const effectiveHorseId = selectedHorseId || activeTrip?.horses?.[0]?.id || 1;

  const activeHorse = useMemo(() => {
    const list = activeTrip?.horses || [];
    return list.find((h) => h.id === Number(effectiveHorseId)) || list[0] || {};
  }, [activeTrip, effectiveHorseId]);


  // Danh sách lịch sử chuyến đi
  const filteredHistory = useMemo(() => {
    if (historyFilter === 'ALL') return trips;
    return trips.filter((t) => t.status === historyFilter);
  }, [trips, historyFilter]);
  const countByStatus = (status) => trips.filter((t) => t.status === status).length;

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

  if (loading || !activeTrip) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px' }}>
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: 40 }}>
          {loading ? (
            <Spin />
          ) : (
            <Empty
              description={
                awaitingPlanning.length > 0
                  ? `Ngựa đang chờ điều phối xếp chuyến: ${awaitingPlanning.join(', ')}`
                  : 'Chưa có chuyến nào đang chở ngựa của bạn. Chuyến xuất hiện sau khi đơn được duyệt và điều phối viên xếp chuyến.'
              }
            />
          )}
        </Card>
      </div>
    );
  }

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
              border: '1.5px solid #FDE68A',
              borderRadius: 12,
              padding: '10px 16px',
              marginBottom: 16,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.06)',
            }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
              <Space size={10} align="center">
                <Badge status="processing" color="#10B981" />
                <div>
                  <div style={{ fontSize: 11, color: '#92400E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    ● CẬP NHẬT TỪ ĐOÀN XE • Làm mới mỗi 30 giây
                  </div>
                  <strong style={{ fontSize: 14.5, color: '#0F172A' }}>
                    Chuyến đi: {activeTrip.tripCode} ({activeTrip.bookingCode}) — {activeTrip.origin.split(',')[0]} ➔ {activeTrip.destination.split(',')[0]}
                  </strong>
                </div>
              </Space>

              <Space size={8} wrap>
                <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>Chọn chuyến theo dõi:</span>
                <Select
                  value={activeTrip.tripCode}
                  onChange={setSelectedTripCode}
                  style={{ width: 250 }}
                  size="middle"
                  options={trips.map((t) => ({
                    value: t.tripCode,
                    label: `${t.tripCode} (${t.status})`,
                  }))}
                />
              </Space>
            </Flex>
          </div>

          {/* NỘI DUNG 2 CỘT CHUẨN GỌN ĐẸP FIGMA */}
          <Row gutter={[16, 16]}>
            {/* CỘT TRÁI: LỘ TRÌNH, TRẠM KIỂM SOÁT & THÔNG TIN KÍP LÁI */}
            <Col xs={24} lg={13}>
              {/* Thẻ Lộ trình & Các mốc kiểm soát */}
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  marginBottom: 16,
                }}
                styles={{ body: { padding: '16px 18px' } }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                      Itinerary & Milestones (Lộ trình & Trạm dừng)
                    </h3>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      Cập nhật trạng thái từng trạm theo quy trình kiểm tra thú y quốc tế
                    </span>
                  </div>
                  <Tag
                    color={activeTrip.status === 'InTransit' ? 'orange' : 'green'}
                    style={{ fontWeight: 700, fontSize: 11.5, padding: '2px 8px', borderRadius: 6 }}
                  >
                    {activeTrip.status === 'InTransit' ? '🚚 Đang trên đường' : '✓ Đã hoàn thành'}
                  </Tag>
                </Flex>

                {/* Timeline trạm kiểm soát gọn gàng */}
                <Timeline
                  mode="left"
                  style={{ marginBottom: -8 }}
                  items={activeTrip.checkpoints.map((cp) => {
                    const isDone = cp.status === 'Departed';
                    const isCurrent = cp.status === 'InTransit' || cp.status === 'Arrived';

                    return {
                      color: isDone ? '#10B981' : isCurrent ? '#F59E0B' : '#CBD5E1',
                      dot: (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            backgroundColor: isDone ? '#10B981' : isCurrent ? '#F59E0B' : '#E2E8F0',
                            color: isDone || isCurrent ? '#FFFFFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 11,
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
                            borderRadius: 10,
                            padding: '8px 12px',
                            marginBottom: 8,
                          }}
                        >
                          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                            <strong style={{ fontSize: 13.5, color: '#0F172A' }}>{cp.name}</strong>
                            <Tag
                              color={isDone ? 'green' : isCurrent ? 'gold' : 'default'}
                              style={{ fontWeight: 700, fontSize: 11, margin: 0, padding: '1px 8px', borderRadius: 4 }}
                            >
                              {isDone ? '✓ Đã hoàn thành' : cp.status === 'Arrived' ? '● Đang dừng tại đây' : isCurrent ? '● Đang di chuyển tới' : 'Dự kiến'}
                            </Tag>
                          </Flex>
                          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} /> {cp.time}
                          </div>
                          {cp.notes && (
                            <div style={{ fontSize: 11.5, color: '#334155', marginTop: 2 }}>
                              {cp.notes}
                            </div>
                          )}
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
                  borderRadius: 14,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
                styles={{ body: { padding: '16px 18px' } }}
              >
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  👥 Kíp điều khiển & Phương tiện (Crew & Equipment)
                </h3>

                <Row gutter={[12, 12]}>
                  {/* Bác sĩ thú y áp tải */}
                  <Col xs={24} sm={12}>
                    <div
                      style={{
                        backgroundColor: '#F0FDF4',
                        border: '1.5px solid #BBF7D0',
                        borderRadius: 12,
                        padding: '10px 14px',
                        height: '100%',
                      }}
                    >
                      <Flex align="center" gap={8} style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 24 }}>{activeTrip.escort?.avatar || '👩‍⚕️'}</span>
                        <div>
                          <strong style={{ fontSize: 13.5, color: '#166534', display: 'block' }}>
                            {activeTrip.escort?.name || '—'}
                          </strong>
                          <span style={{ fontSize: 11, color: '#15803D' }}>
                            {activeTrip.escort?.role || 'Bác sĩ Thú y Áp tải FEI'}
                          </span>
                        </div>
                      </Flex>
                      <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 8 }}>
                        Liên hệ qua điều phối viên của chuyến
                      </div>
                      <Space size={6}>
                        <Button
                          size="small"
                          type="primary"
                          icon={<PhoneOutlined />}
                          onClick={() => handleCall(activeTrip.escort?.name, activeTrip.escort?.phone)}
                          style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', borderRadius: 6, fontWeight: 600, fontSize: 11.5 }}
                        >
                          Gọi điện
                        </Button>
                        <Button
                          size="small"
                          icon={<MessageOutlined />}
                          onClick={() => handleMessage(activeTrip.escort?.name)}
                          style={{ borderRadius: 6, fontSize: 11.5 }}
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
                        borderRadius: 12,
                        padding: '10px 14px',
                        height: '100%',
                      }}
                    >
                      <Flex align="center" gap={8} style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 24 }}>{activeTrip.driver?.avatar || '👨‍✈️'}</span>
                        <div>
                          <strong style={{ fontSize: 13.5, color: '#1E40AF', display: 'block' }}>
                            {activeTrip.driver?.name || '—'}
                          </strong>
                          <span style={{ fontSize: 11, color: '#2563EB' }}>
                            {activeTrip.driver?.role || 'Vận tải Chuyên trách FEI'}
                          </span>
                        </div>
                      </Flex>
                      <div style={{ fontSize: 11, color: '#4B5563', marginBottom: 8 }}>
                        Phương tiện: <strong>{activeTrip.vehicleName}</strong>
                      </div>
                      {activeTrip.driver ? (
                        <Space size={6}>
                          <Button
                            size="small"
                            type="primary"
                            icon={<PhoneOutlined />}
                            onClick={() => handleCall(activeTrip.driver?.name, activeTrip.driver?.phone)}
                            style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', borderRadius: 6, fontWeight: 600, fontSize: 11.5 }}
                          >
                            Gọi điện
                          </Button>
                          <Button
                            size="small"
                            icon={<MessageOutlined />}
                            onClick={() => handleMessage(activeTrip.driver?.name)}
                            style={{ borderRadius: 6, fontSize: 11.5 }}
                          >
                            Nhắn tin
                          </Button>
                        </Space>
                      ) : (
                        <Tag color="blue" style={{ fontWeight: 700, fontSize: 11 }}>
                          ✈️ Chuyên cơ IATA do Phi hành đoàn & Vet Escort đảm trách
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
                  borderRadius: 14,
                  borderColor: '#E2E8F0',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.2)',
                  marginBottom: 16,
                  color: '#FFFFFF',
                }}
                styles={{ body: { padding: '16px 18px' } }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                  <Space align="center" size={6}>
                    <ThunderboltOutlined style={{ fontSize: 18, color: '#F59E0B' }} />
                    <h3 style={{ margin: 0, color: '#FFFFFF', fontWeight: 800, fontSize: 15 }}>
                      Cabin Telemetry (Vi khí hậu)
                    </h3>
                  </Space>
                  <Tag color="cyan" style={{ fontWeight: 800, margin: 0, fontSize: 11, borderRadius: 4 }}>
                    Chuẩn FEI 16-19°C
                  </Tag>
                </Flex>

                <Row gutter={[10, 10]}>
                  {/* Gauge 1: Nhiệt độ khoang */}
                  <Col span={12}>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                        NHIỆT ĐỘ CABIN
                      </span>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', margin: '2px 0' }}>
                        {activeTrip.cabinTemp != null ? `${activeTrip.cabinTemp}°C` : '—'}
                      </div>
                      {activeTrip.cabinTemp != null && (
                        <Tag
                          color={activeTrip.cabinTemp >= 16 && activeTrip.cabinTemp <= 19 ? 'success' : 'warning'}
                          style={{ fontWeight: 700, margin: 0, fontSize: 10.5, borderRadius: 4 }}
                        >
                          {activeTrip.cabinTemp >= 16 && activeTrip.cabinTemp <= 19 ? '✓ Trong chuẩn FEI' : 'Ngoài 16-19°C'}
                        </Tag>
                      )}
                    </div>
                  </Col>

                  {/* Gauge 2: Độ ẩm */}
                  <Col span={12}>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                        TIẾN ĐỘ CÁC MỐC
                      </span>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#38BDF8', margin: '2px 0' }}>
                        {activeTrip.checkpointsReached}/{activeTrip.checkpointsTotal}
                      </div>
                      <Tag color="blue" style={{ fontWeight: 700, margin: 0, fontSize: 10.5, borderRadius: 4 }}>
                        Mốc đã tới
                      </Tag>
                    </div>
                  </Col>

                  {/* Gauge 3: Thông gió */}
                  <Col span={12}>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                        TRỄ SO VỚI KẾ HOẠCH
                      </span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: activeTrip.delayMinutes > 0 ? '#F87171' : '#F59E0B', margin: '2px 0' }}>
                        {activeTrip.delayMinutes} phút
                      </div>
                      <span style={{ fontSize: 10.5, color: '#94A3B8' }}>{activeTrip.delayMinutes > 0 ? 'Đang trễ' : 'Đúng giờ'}</span>
                    </div>
                  </Col>

                  {/* Gauge 4: CO2 nồng độ */}
                  <Col span={12}>
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', fontWeight: 600 }}>
                        MỐC KẾ TIẾP
                      </span>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#A78BFA', margin: '4px 0' }}>
                        {activeTrip.nextCheckpointName || '—'}
                      </div>
                      <span style={{ fontSize: 10.5, color: '#94A3B8' }}>{activeTrip.nextCheckpointTime ? formatTime(activeTrip.nextCheckpointTime) : ''}</span>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* KHỐI 2: THỂ TRẠNG SINH TRẮC HỌC NGỰA ĐUA (EQUINE HEALTH VITALS) */}
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
                styles={{ body: { padding: '16px 18px' } }}
              >
                <Flex justify="space-between" align="center" wrap="wrap" gap={6} style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                      🩺 Equine Health Vitals (Sinh trắc học)
                    </h3>
                    <span style={{ fontSize: 11.5, color: '#64748B' }}>
                      Theo dõi cá thể hóa cho từng ngựa trên chuyến
                    </span>
                  </div>

                  {/* Segment chọn ngựa */}
                  {activeTrip.horses?.length > 1 && (
                    <Segmented
                      size="small"
                      value={effectiveHorseId}
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
                    borderRadius: 10,
                    padding: '8px 12px',
                    border: '1px solid #E2E8F0',
                    marginBottom: 12,
                  }}
                >
                  <Flex justify="space-between" align="center">
                    <div>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>🐴 {activeHorse.name}</strong>
                      <span style={{ fontSize: 11.5, color: '#64748B', display: 'block' }}>
                        {activeHorse.breed} • {activeHorse.gender}
                      </span>
                    </div>
                    <Tag color={activeHorse.needsAttention ? 'red' : 'green'} style={{ fontWeight: 700, padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>
                      {activeHorse.needsAttention ? '⚠ Cần chú ý' : '✓ Bình thường'}
                    </Tag>
                  </Flex>
                </div>

                {/* 4 chỉ số sinh trắc học gọn gàng */}
                <Row gutter={[8, 8]}>
                  {/* Nhịp tim */}
                  <Col span={12}>
                    <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 10px' }}>
                      <Flex align="center" gap={4}>
                        <HeartOutlined style={{ color: '#DC2626', fontSize: 12 }} />
                        <span style={{ fontSize: 11, color: '#991B1B', fontWeight: 700 }}>TÌNH TRẠNG ĂN</span>
                      </Flex>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#991B1B', margin: '4px 0 2px' }}>
                        {activeHorse.feedText}
                      </div>
                      <span style={{ fontSize: 10.5, color: '#B91C1C' }}>{activeHorse.needsAttention ? '⚠ Cần chú ý' : 'Theo nhật ký đoàn xe'}</span>
                    </div>
                  </Col>

                  {/* Thân nhiệt */}
                  <Col span={12}>
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '8px 10px' }}>
                      <Flex align="center" gap={4}>
                        <ThunderboltOutlined style={{ color: '#D97706', fontSize: 12 }} />
                        <span style={{ fontSize: 11, color: '#92400E', fontWeight: 700 }}>LẦN GHI GẦN NHẤT</span>
                      </Flex>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E', margin: '4px 0 2px' }}>
                        {formatTime(activeHorse.lastLogAt)}
                      </div>
                      <span style={{ fontSize: 10.5, color: '#B45309' }}>Nhật ký thể trạng</span>
                    </div>
                  </Col>

                  {/* Mức độ stress */}
                  <Col span={12}>
                    <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '8px 10px' }}>
                      <span style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>MỨC ĐỘ STRESS</span>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#166534', margin: '4px 0 2px' }}>
                        {activeHorse.stressText}
                      </div>
                      <span style={{ fontSize: 10.5, color: '#15803D' }}>Đoàn xe đánh giá</span>
                    </div>
                  </Col>

                  {/* Bù nước */}
                  <Col span={12}>
                    <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '8px 10px' }}>
                      <span style={{ fontSize: 11, color: '#1E40AF', fontWeight: 700 }}>LƯỢNG NƯỚC UỐNG</span>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1E40AF', margin: '4px 0 2px' }}>
                        {activeHorse.waterIntake}
                      </div>
                      <span style={{ fontSize: 10.5, color: '#2563EB' }}>Lần ghi gần nhất</span>
                    </div>
                  </Col>
                </Row>

                {/* Ghi nhận bác sĩ thú y */}
                <div
                  style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    backgroundColor: '#F1F5F9',
                    borderRadius: 8,
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <strong style={{ fontSize: 11.5, color: '#0F172A', display: 'block', marginBottom: 2 }}>
                    📝 Ghi chú mới nhất của đoàn xe:
                  </strong>
                  <Paragraph style={{ margin: 0, fontSize: 11.5, color: '#475569', fontStyle: 'italic', lineHeight: 1.4 }}>
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
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{trips.length}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, textAlign: 'center', borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>ĐÃ HOÀN THÀNH</Text>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', marginTop: 4 }}>{countByStatus('Completed')}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, textAlign: 'center', borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 13, color: '#D97706', fontWeight: 600 }}>ĐANG DI CHUYỂN</Text>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#D97706', marginTop: 4 }}>{countByStatus('InTransit')}</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered style={{ borderRadius: 14, textAlign: 'center', borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 13, color: '#2563EB', fontWeight: 600 }}>NGỰA CHỜ XẾP CHUYẾN</Text>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2563EB', marginTop: 4 }}>
                  {awaitingPlanning.length}
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
                  { label: `Tất cả (${trips.length})`, value: 'ALL' },
                  { label: `Đang di chuyển (${countByStatus('InTransit')})`, value: 'InTransit' },
                  { label: `Đã hoàn thành (${countByStatus('Completed')})`, value: 'Completed' },
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
                      {r.cost != null ? `$${Number(r.cost).toLocaleString()} USD` : '—'}
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
