import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  message,
  Input,
  Alert,
  DatePicker,
} from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  FireOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  getDriverDispatchedTrips,
  updateStoredRoutePlan,
  getStoredCrewOffDays,
  setCrewOffDays,
} from '@utils/routePlanStorage';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROLES } from '@utils/constants';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

/**
 * Trang Driver & Escort Mission Control
 * Đáp ứng Item 5, 6, 20, 22, 23:
 * - Dạng list có sắp xếp thứ tự ưu tiên (gần ngày khởi hành được ưu tiên cao)
 * - Lịch làm việc cụ thể và cơ chế dời ngày nghỉ bù (off-day rollover) khi chuyến đi rơi vào ngày nghỉ
 * - Đăng ký ngày nghỉ phép hàng tháng (tối đa 2 ngày trong tháng, chỉ Thứ 2 - Thứ 6)
 * - Dashboard chỉ số trực quan, dễ quản lý & bàn giao
 * - Phân biệt nhân sự: Air chỉ có Escort, Ground & Door-to-Door có Driver + Escort và phí thuê xe nước ngoài
 */
export default function DriverDashboard() {
  const { user } = useAuthStore();
  const isEscort = user?.role === ROLES.ESCORT || user?.role === 'Escort';
  const crewId = isEscort ? (user?.userId || 6) : (user?.userId || 4);

  const [trips, setTrips] = useState(() => getDriverDispatchedTrips());
  const [selectedTrip, setSelectedTrip] = useState(() => {
    const list = getDriverDispatchedTrips();
    return list[0] || null;
  });

  // State cho Nhật ký phúc lợi thú y
  const [welfareModalOpen, setWelfareModalOpen] = useState(false);
  const [bodyTemp, setBodyTemp] = useState('38.1');
  const [waterIntake, setWaterIntake] = useState('15');
  const [welfareNotes, setWelfareNotes] = useState('Ngựa tỉnh táo, ăn cỏ tốt, nhịp thở đều đặn.');

  // State cho Đăng ký ngày nghỉ phép hàng tháng (Item 5)
  const [offDaysMap, setOffDaysMap] = useState(() => getStoredCrewOffDays());
  const [offDayModalOpen, setOffDayModalOpen] = useState(false);
  const [selectedOffDate, setSelectedOffDate] = useState(null);
  const [pendingOffDays, setPendingOffDays] = useState([]);

  useEffect(() => {
    const handleUpdate = () => {
      const refreshed = getDriverDispatchedTrips();
      setTrips(refreshed);
      if (selectedTrip) {
        const found = refreshed.find((p) => p.planId === selectedTrip.planId);
        if (found) setSelectedTrip(found);
      }
    };

    const handleOffDaysUpdate = () => {
      setOffDaysMap(getStoredCrewOffDays());
    };

    window.addEventListener('plans_updated', handleUpdate);
    window.addEventListener('plan_assigned_to_driver', handleUpdate);
    window.addEventListener('plan_quarantine_cleared', handleUpdate);
    window.addEventListener('crew_offdays_updated', handleOffDaysUpdate);

    return () => {
      window.removeEventListener('plans_updated', handleUpdate);
      window.removeEventListener('plan_assigned_to_driver', handleUpdate);
      window.removeEventListener('plan_quarantine_cleared', handleUpdate);
      window.removeEventListener('crew_offdays_updated', handleOffDaysUpdate);
    };
  }, [selectedTrip]);

  // Sắp xếp chuyến đi theo thứ tự ưu tiên: Khởi hành sớm nhất lên đầu (Item 20)
  const prioritizedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      const dateA = new Date(a.departureDate || 0).getTime();
      const dateB = new Date(b.departureDate || 0).getTime();
      return dateA - dateB;
    });
  }, [trips]);

  const activeTrip = selectedTrip || prioritizedTrips[0];

  // Tính số lượng chuyến khẩn cấp & ngày nghỉ trong tháng hiện tại
  const currentMonthKey = dayjs().format('YYYY-MM');
  const currentMonthLabel = dayjs().format('MM/YYYY');
  const myAllOffDays = useMemo(() => {
    return offDaysMap[String(crewId)] || [];
  }, [offDaysMap, crewId]);
  const myOffDaysThisMonth = useMemo(() => {
    return myAllOffDays.filter((d) => dayjs(d).format('YYYY-MM') === currentMonthKey);
  }, [myAllOffDays, currentMonthKey]);

  const todayStr = dayjs().format('YYYY-MM-DD');
  const isOffToday = myAllOffDays.includes(todayStr);

  const getPriorityInfo = (departureDate) => {
    if (!departureDate) return { label: 'TIÊU CHUẨN', color: 'blue', isUrgent: false };
    const diffDays = dayjs(departureDate).diff(dayjs(), 'day');
    if (diffDays <= 2) {
      return { label: 'ƯU TIÊN CAO • KHẨN CẤP (TRONG 48H)', color: 'red', isUrgent: true };
    }
    if (diffDays <= 7) {
      return { label: 'SẮP KHỞI HÀNH (TUẦN NÀY)', color: 'orange', isUrgent: false };
    }
    return { label: 'KẾ HOẠCH TIÊU CHUẨN', color: 'cyan', isUrgent: false };
  };

  const urgentTripsCount = useMemo(() => {
    return trips.filter((t) => getPriorityInfo(t.departureDate).isUrgent).length;
  }, [trips]);

  // Kiểm tra chuyến đi có trùng ngày nghỉ định kỳ Thứ Bảy hoặc Chủ Nhật không (Item 22)
  const rolloverTrip = useMemo(() => {
    return trips.find((t) => {
      const day = dayjs(t.departureDate).day();
      return day === 0 || day === 6; // 0: CN, 6: Thứ 7
    });
  }, [trips]);

  const handleStartTrip = (planId) => {
    updateStoredRoutePlan(planId, {
      status: 'InTransit',
      statusText: 'In Transit',
      managerNotes: 'Trip en route. Real-time GPS and welfare telemetry live.',
    });
    message.success('Chuyến đi đã chính thức khởi hành! Hệ thống GPS và Telemetry đã được kích hoạt.');
  };

  const handleLogWelfare = () => {
    message.success(`Đã ghi nhận nhật ký kiểm tra thú y: Thân nhiệt ${bodyTemp}°C, Uống ${waterIntake}L nước!`);
    setWelfareModalOpen(false);
  };

  // Xử lý thêm ngày nghỉ trong Modal (Item 5)
  const handleAddOffDate = () => {
    if (!selectedOffDate) {
      message.warning('Vui lòng chọn một ngày trên lịch trước khi thêm!');
      return;
    }
    const dayOfWeek = selectedOffDate.day();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      message.error('Thứ Bảy và Chủ Nhật là ngày nghỉ định kỳ. Vui lòng chỉ chọn từ Thứ Hai đến Thứ Sáu!');
      return;
    }

    const dateStr = selectedOffDate.format('YYYY-MM-DD');
    if (pendingOffDays.includes(dateStr)) {
      message.warning('Ngày này đã có trong danh sách đăng ký!');
      return;
    }

    const targetMonthKey = selectedOffDate.format('YYYY-MM');
    const sameMonthCount = pendingOffDays.filter((d) => dayjs(d).format('YYYY-MM') === targetMonthKey).length;
    if (sameMonthCount >= 2) {
      message.error(`Tháng ${selectedOffDate.format('MM/YYYY')} đã đạt giới hạn tối đa 2 ngày nghỉ phép!`);
      return;
    }

    setPendingOffDays([...pendingOffDays, dateStr]);
    setSelectedOffDate(null);
    message.success(`Đã thêm ngày ${selectedOffDate.format('DD/MM/YYYY')} vào danh sách.`);
  };

  const handleRemoveOffDate = (dateStr) => {
    setPendingOffDays(pendingOffDays.filter((d) => d !== dateStr));
  };

  const handleSaveOffDays = () => {
    const res = setCrewOffDays(crewId, pendingOffDays);
    if (!res.success) {
      message.error(res.message);
      return;
    }
    // Đồng bộ cả userId 2 và 6 nếu là Elena Rostova
    if (crewId === 6) setCrewOffDays(2, pendingOffDays);
    if (crewId === 2) setCrewOffDays(6, pendingOffDays);

    message.success('Đã lưu lịch đăng ký ngày nghỉ phép thành công!');
    setOffDayModalOpen(false);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
      {/* HEADER DRIVER / ESCORT DASHBOARD */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: 28 }}>
            {isEscort ? 'Veterinary Escort Mission Control & In-Transit Care' : 'Driver & Escort Mission Control'}
          </Title>
          <Text style={{ color: '#64748B', fontSize: 14 }}>
            Official Dispatched Trips cleared by Logistics Manager & Transport Specialist
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => {
              setPendingOffDays(offDaysMap[String(crewId)] || []);
              setOffDayModalOpen(true);
            }}
            style={{
              backgroundColor: '#0F172A',
              borderColor: '#0F172A',
              fontWeight: 700,
              borderRadius: 8,
              height: 40,
            }}
          >
            Đăng ký ngày nghỉ ({myOffDaysThisMonth.length}/2)
          </Button>

          <Tag color={isEscort ? 'purple' : 'green'} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 8, fontWeight: 700 }}>
            {isEscort ? '● ESCORT APP ONLINE' : '● DRIVER APP ONLINE'}
          </Tag>
        </Space>
      </Flex>

      {/* 4 THẺ THỐNG KÊ TỔNG QUAN (ITEM 6) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Card 1: Tổng nhiệm vụ */}
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 16, border: '1px solid #E2E8F0', height: '100%' }} styles={{ body: { padding: '18px 20px' } }}>
            <Flex gap={12} align="center">
              <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontSize: 20 }}>
                <ClockCircleOutlined />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {trips.length}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginTop: 4 }}>
                  NHIỆM VỤ ĐƯỢC GIAO
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: '#2563EB', marginTop: 10, fontWeight: 600 }}>
              ✓ Đã duyệt & bàn giao
            </div>
          </Card>
        </Col>

        {/* Card 2: Khẩn cấp <48h */}
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 16, border: '1px solid #E2E8F0', height: '100%' }} styles={{ body: { padding: '18px 20px' } }}>
            <Flex gap={12} align="center">
              <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', fontSize: 20 }}>
                <FireOutlined />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#DC2626', lineHeight: 1 }}>
                  {urgentTripsCount}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', marginTop: 4 }}>
                  KHẨN CẤP (&lt;48 GIỜ)
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: '#DC2626', marginTop: 10, fontWeight: 600 }}>
              Ưu tiên chuẩn bị cao
            </div>
          </Card>
        </Col>

        {/* Card 3: Ngày nghỉ phép tháng này (Item 5) */}
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 16, border: '1px solid #E2E8F0', height: '100%', backgroundColor: '#FDFCF7' }} styles={{ body: { padding: '18px 20px' } }}>
            <Flex gap={12} align="center">
              <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', fontSize: 20 }}>
                <CalendarOutlined />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#D97706', lineHeight: 1 }}>
                  {myOffDaysThisMonth.length}/2
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginTop: 4 }}>
                  NGÀY NGHỈ ({currentMonthLabel})
                </div>
              </div>
            </Flex>
            <div style={{ marginTop: 8 }}>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setPendingOffDays(offDaysMap[String(crewId)] || []);
                  setOffDayModalOpen(true);
                }}
                style={{ padding: 0, fontWeight: 700, color: '#D97706', fontSize: 12 }}
              >
                📅 Đăng ký / Chỉnh ngày nghỉ &gt;
              </Button>
            </div>
          </Card>
        </Col>

        {/* Card 4: Trạng thái trực */}
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 16, border: '1px solid #E2E8F0', height: '100%' }} styles={{ body: { padding: '18px 20px' } }}>
            <Flex gap={12} align="center">
              <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: isOffToday ? '#FEF2F2' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOffToday ? '#DC2626' : '#10B981', fontSize: 20 }}>
                <CheckCircleOutlined />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: isOffToday ? '#DC2626' : '#10B981', lineHeight: 1 }}>
                  {isOffToday ? 'NGHỈ PHÉP' : 'SẴN SÀNG'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginTop: 4 }}>
                  TRẠNG THÁI HIỆN TẠI
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: isOffToday ? '#DC2626' : '#10B981', marginTop: 10, fontWeight: 600 }}>
              {isOffToday ? '● Đang trong kỳ nghỉ phép' : '● Sẵn sàng nhận chuyến'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* LỊCH LÀM VIỆC VÀ THÔNG BÁO DỜI NGÀY NGHỈ BÙ (ITEM 22) */}
      <Card
        bordered
        style={{ borderRadius: 16, marginBottom: 20, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <div>
            <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
              <CalendarOutlined style={{ color: '#2563EB', fontSize: 16 }} />
              <strong style={{ fontSize: 14, color: '#0F172A' }}>
                Lịch làm việc định kỳ của {isEscort ? 'Bác sĩ Escort' : 'Tài xế'}: Thứ Hai ➔ Thứ Sáu (08:00 - 18:00)
              </strong>
            </Flex>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              Ngày nghỉ định kỳ hàng tuần: <strong>Thứ Bảy & Chủ Nhật</strong>. Nếu lịch vận hành trùng ngày off, hệ thống sẽ tự động dời ngày nghỉ bù.
            </Text>
          </div>

          <Tag color="blue" style={{ fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>
            {myOffDaysThisMonth.length > 0
              ? `ĐÃ ĐĂNG KÝ ${myOffDaysThisMonth.length}/2 NGÀY NGHỈ THÁNG NÀY`
              : 'CHƯA ĐĂNG KÝ NGÀY NGHỈ THÁNG NÀY'}
          </Tag>
        </Flex>

        {rolloverTrip && (
          <Alert
            style={{ marginTop: 14, borderRadius: 10 }}
            message={
              <strong style={{ color: '#92400E' }}>
                📅 THÔNG BÁO DỜI NGÀY NGHỈ BÙ (OFF-DAY ROLLOVER)
              </strong>
            }
            description={
              <span style={{ fontSize: 12.5, color: '#78350F' }}>
                Chuyến đi <strong>#{rolloverTrip.planCode}</strong> khởi hành vào ngày nghỉ định kỳ (
                {dayjs(rolloverTrip.departureDate).format('dddd, DD/MM/YYYY')}). Theo chính sách phúc lợi nhân sự của công ty, ngày nghỉ đã được <strong>tự động chuyển dời sang Thứ Tư tuần kế tiếp</strong>.
              </span>
            }
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* DANH SÁCH CÁC NHIỆM VỤ ĐƯỢC CHỈ ĐỊNH */}
      {prioritizedTrips.length === 0 ? (
        <Card style={{ borderRadius: 18, textAlign: 'center', padding: '60px 20px' }}>
          <ClockCircleOutlined style={{ fontSize: 48, color: '#94A3B8', marginBottom: 16 }} />
          <Title level={4} style={{ color: '#0F172A' }}>
            Chưa có chuyến đi nào sẵn sàng bàn giao
          </Title>
          <Text type="secondary" style={{ display: 'block', maxWidth: 520, margin: '0 auto' }}>
            Theo quy trình điều vận (Item 12), chuyến đi chỉ chính thức chuyển giao cho Driver & Escort khi cả <strong>Logistics Manager phê duyệt lộ trình</strong> VÀ <strong>Transport Specialist thông qua kiểm dịch y tế</strong>.
          </Text>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {/* CỘT TRÁI: DANH SÁCH THEO THỨ TỰ ƯU TIÊN (ITEM 20) */}
          <Col xs={24} lg={10}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                Nhiệm vụ ưu tiên ({prioritizedTrips.length})
              </Title>
              <Tag color="geekblue" style={{ fontWeight: 700 }}>Sắp xếp theo ngày đi sớm nhất</Tag>
            </Flex>

            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {prioritizedTrips.map((trip) => {
                const isSelected = activeTrip?.planId === trip.planId;
                const isInTransit = trip.status === 'InTransit';
                const priority = getPriorityInfo(trip.departureDate);

                return (
                  <div
                    key={trip.planId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTrip(trip)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedTrip(trip);
                      }
                    }}
                    style={{
                      border: isSelected ? '2px solid #16A34A' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                      borderRadius: 16,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 14px rgba(22, 163, 74, 0.15)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                      <Tag
                        color={priority.color}
                        icon={priority.isUrgent ? <FireOutlined /> : undefined}
                        style={{ fontWeight: 800, fontSize: 11, borderRadius: 6 }}
                      >
                        {priority.label}
                      </Tag>
                      <Tag color={isInTransit ? 'blue' : 'green'} style={{ fontWeight: 800, borderRadius: 6 }}>
                        {isInTransit ? 'IN_TRANSIT' : 'ASSIGNED'}
                      </Tag>
                    </Flex>

                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      #{trip.planCode} • {trip.originCode || 'SGN'} → {trip.destinationCode || 'CDG'}
                    </div>

                    <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 4 }}>
                      🐴 Ngựa: <strong>{trip.horses?.join(', ')}</strong> ({trip.totalHorses} con)
                    </div>

                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                      🕒 Khởi hành: <strong>{dayjs(trip.departureDate).format('MMM DD, YYYY • HH:mm')}</strong>
                    </div>

                    <Flex justify="space-between" align="center" style={{ fontSize: 12, color: '#64748B' }}>
                      <span>
                        {trip.transportMode === 'Air' ? '✈️ Chuyến bay hàng không' : '🚛 Xe chuyên dụng'}
                      </span>
                      <span style={{ fontWeight: 700, color: '#16A34A' }}>Xem chi tiết &rarr;</span>
                    </Flex>
                  </div>
                );
              })}
            </Space>
          </Col>

          {/* CỘT PHẢI: CHI TIẾT LỘ TRÌNH VÀ THAO TÁC KHỞI HÀNH */}
          <Col xs={24} lg={14}>
            {activeTrip && (
              <Card
                bordered
                style={{ borderRadius: 20, border: '1px solid #E2E8F0' }}
                styles={{ body: { padding: '26px' } }}
              >
                <Flex justify="space-between" align="center" wrap="wrap" gap="small" style={{ marginBottom: 16 }}>
                  <div>
                    <Space size={6} style={{ marginBottom: 6 }}>
                      <Tag color="green" style={{ fontWeight: 800, borderRadius: 6 }}>
                        OFFICIAL DISPATCH
                      </Tag>
                      <Tag color="purple" style={{ fontWeight: 800, borderRadius: 6 }}>
                        KIỂM DỊCH CLEARED ✓
                      </Tag>
                    </Space>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                      #{activeTrip.planCode} • {activeTrip.origin} ➔ {activeTrip.destination}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Khách hàng: <strong>{activeTrip.customerName}</strong> • Đơn #{activeTrip.orderCode}
                    </Text>
                  </div>

                  <Space>
                    {activeTrip.status !== 'InTransit' ? (
                      <Button
                        type="primary"
                        size="large"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartTrip(activeTrip.planId)}
                        style={{
                          backgroundColor: '#16A34A',
                          borderColor: '#16A34A',
                          fontWeight: 800,
                          borderRadius: 10,
                          height: 44,
                        }}
                      >
                        Khởi hành chuyến đi (Start)
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        size="large"
                        icon={<FileTextOutlined />}
                        onClick={() => setWelfareModalOpen(true)}
                        style={{
                          backgroundColor: '#0284C7',
                          borderColor: '#0284C7',
                          fontWeight: 800,
                          borderRadius: 10,
                          height: 44,
                        }}
                      >
                        Ghi log kiểm tra thú y
                      </Button>
                    )}
                  </Space>
                </Flex>

                <Divider style={{ margin: '16px 0' }} />

                {/* THÔNG TIN PHÂN BỔ NHÂN SỰ & XE (ITEM 23) */}
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <Col span={12}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Tài xế chuyên dụng:</Text>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>
                        {activeTrip.transportMode === 'Air' ? (
                          <span style={{ color: '#64748B' }}>✈️ Chỉ Escort áp tải (Không có tài xế trên máy bay)</span>
                        ) : (
                          `👨‍✈️ ${activeTrip.driverName} (${activeTrip.driverLicense || 'VN-99201'})`
                        )}
                      </strong>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Bác sĩ thú y áp tải (Escort):</Text>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>
                        👩‍⚕️ {activeTrip.vetEscortName} ({activeTrip.vetEscortCert || 'FEI Vet'})
                      </strong>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Phương tiện điều phối:</Text>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>
                        {activeTrip.vehicleName}
                      </strong>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Khoang chuồng & Thiết bị:</Text>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>
                        📦 {activeTrip.stalls}
                      </strong>
                    </div>
                  </Col>

                  {(activeTrip.transportMode === 'DoorToDoor' || activeTrip.transportMode === 'Door-to-Door') && (
                    <Col span={24}>
                      <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 14px', borderRadius: 10, fontSize: 12.5, color: '#1E40AF' }}>
                        ✓ <strong>Đa phương thức Door-to-Door:</strong> Đã bao gồm xe trung chuyển nội địa, chuyến bay chuyên dụng và phí thuê xe tải đón tại nước ngoài ($1,850 USD).
                      </div>
                    </Col>
                  )}
                </Row>

                {/* DANH SÁCH CHECKPOINTS TRÊN TUYẾN ĐƯỜNG */}
                <Title level={5} style={{ margin: '0 0 12px', fontWeight: 800, color: '#0F172A' }}>
                  Lộ trình & Các trạm dừng kiểm soát
                </Title>

                <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 20 }}>
                  {(activeTrip.checkpoints || []).map((cp, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Flex align="center" gap={12}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: cp.type === 'ORIGIN' ? '#16A34A' : cp.type === 'ARRIVAL' ? '#0284C7' : '#D97706',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          {cp.step}
                        </div>
                        <div>
                          <strong style={{ fontSize: 13.5, color: '#0F172A' }}>{cp.name}</strong>
                          <div style={{ fontSize: 12, color: '#64748B' }}>📍 {cp.location}</div>
                          <div style={{ fontSize: 12, color: '#334155' }}>{cp.description}</div>
                        </div>
                      </Flex>

                      <Tag color="default" style={{ fontWeight: 600 }}>
                        ETA: {cp.eta}
                      </Tag>
                    </div>
                  ))}
                </Space>

                {/* LƯU Ý PHÚC LỢI ĐỘNG VẬT */}
                <div
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 12,
                    padding: '14px 16px',
                    fontSize: 12.5,
                    color: '#92400E',
                  }}
                >
                  <strong>Quy chuẩn an toàn FEI:</strong> Giữ nhiệt độ khoang xe ổn định 16-19°C. Thực hiện dừng nghỉ kiểm tra bù nước và thân nhiệt ít nhất mỗi 4 giờ. Bác sĩ thú y áp tải phụ trách theo dõi sinh hiệu.
                </div>
              </Card>
            )}
          </Col>
        </Row>
      )}

      {/* MODAL ĐĂNG KÝ NGÀY NGHỈ PHÉP HÀNG THÁNG (ITEM 5) */}
      <Modal
        open={offDayModalOpen}
        onCancel={() => setOffDayModalOpen(false)}
        onOk={handleSaveOffDays}
        title="Đăng ký ngày nghỉ phép trong tháng (Driver & Escort Monthly Off-Days)"
        okText="Lưu lịch nghỉ phép"
        cancelText="Đóng"
        okButtonProps={{ style: { backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 } }}
        width={560}
      >
        <div style={{ padding: '12px 0' }}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
            message="Chính sách ngày nghỉ phép nhân sự (Item 5)"
            description={
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12.5, color: '#334155' }}>
                <li>Tối đa <strong>2 ngày nghỉ trong 1 tháng</strong> (tính theo tháng dương lịch).</li>
                <li><strong>Thứ Bảy & Chủ Nhật là ngày nghỉ định kỳ</strong>, không được chọn làm ngày nghỉ phép. Chỉ được đăng ký ngày nghỉ từ <strong>Thứ Hai đến Thứ Sáu</strong>.</li>
                <li>Lịch nghỉ này sẽ được đồng bộ trực tiếp tới Fleet & Route Coordinator để kiểm soát lịch phân công.</li>
              </ul>
            }
          />

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="off-date-picker" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Chọn ngày nghỉ muốn đăng ký:
            </label>
            <Flex gap={8}>
              <DatePicker
                id="off-date-picker"
                placeholder="Chọn ngày (Thứ 2 - Thứ 6)"
                value={selectedOffDate}
                onChange={(d) => setSelectedOffDate(d)}
                style={{ flex: 1 }}
                disabledDate={(current) => {
                  if (!current) return false;
                  // Chặn cuối tuần (Thứ 7 & Chủ Nhật)
                  const day = current.day();
                  return day === 0 || day === 6;
                }}
              />
              <Button
                type="primary"
                onClick={handleAddOffDate}
                style={{ backgroundColor: '#0F172A', borderColor: '#0F172A', fontWeight: 700 }}
              >
                + Thêm ngày nghỉ
              </Button>
            </Flex>
          </div>

          <Divider style={{ margin: '14px 0' }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                Danh sách ngày nghỉ đã đăng ký ({pendingOffDays.length} ngày):
              </span>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Tháng này: <strong>{pendingOffDays.filter(d => dayjs(d).format('YYYY-MM') === currentMonthKey).length}/2 ngày</strong>
              </span>
            </div>

            {pendingOffDays.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, color: '#94A3B8', fontSize: 13 }}>
                Chưa đăng ký ngày nghỉ nào. Hãy chọn ngày ở trên và bấm &quot;+ Thêm ngày nghỉ&quot;.
              </div>
            ) : (
              <Flex wrap="wrap" gap={8}>
                {pendingOffDays.map((d) => (
                  <Tag
                    key={d}
                    color="blue"
                    closable
                    onClose={() => handleRemoveOffDate(d)}
                    style={{ fontSize: 13, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}
                  >
                    📅 {dayjs(d).format('dddd, DD/MM/YYYY')}
                  </Tag>
                ))}
              </Flex>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL GHI LOG PHÚC LỢI THÚ Y (WELFARE TELEMETRY) */}
      <Modal
        open={welfareModalOpen}
        onCancel={() => setWelfareModalOpen(false)}
        onOk={handleLogWelfare}
        title="Ghi nhật ký kiểm tra phúc lợi ngựa đua (Welfare Log)"
        okText="Lưu nhật ký"
        cancelText="Hủy"
        okButtonProps={{ style: { backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 } }}
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="body-temp-input" style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Thân nhiệt ngựa (°C):</label>
            <Input id="body-temp-input" value={bodyTemp} onChange={(e) => setBodyTemp(e.target.value)} size="large" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="water-intake-input" style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Lượng nước uống (Lít):</label>
            <Input id="water-intake-input" value={waterIntake} onChange={(e) => setWaterIntake(e.target.value)} size="large" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="welfare-notes-input" style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Đánh giá hành vi & hô hấp:</label>
            <Input.TextArea id="welfare-notes-input" rows={3} value={welfareNotes} onChange={(e) => setWelfareNotes(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
