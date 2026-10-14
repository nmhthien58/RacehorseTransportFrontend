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
  Spin,
  Badge,
} from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  EnvironmentOutlined,
  CarOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  HeartOutlined,
  FileDoneOutlined,
  DashboardOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROLES } from '@utils/constants';
import dayjs from 'dayjs';
import { useDriverMissions } from '../hooks/useDriverMissions';
import { getTripStatusMeta, driverService } from '../services/driverService';
import {
  getStoredCrewOffDays,
  setCrewOffDays,
} from '@utils/routePlanStorage';

const { Title, Text, Paragraph } = Typography;

/**
 * Trang Driver & Escort Dashboard & Mission Control
 * Tối giản, thanh lịch, chuyên nghiệp, đồng bộ 100% dữ liệu với Flow 4.
 */
export default function DriverDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isEscort = user?.role === ROLES.ESCORT || user?.role === 'Escort';
  const crewId = isEscort ? (user?.userId || 9) : (user?.userId || 4);

  // Nguồn dữ liệu chuẩn thống nhất từ useDriverMissions (Flow 4)
  const { missions, loading, refresh } = useDriverMissions();

  const [selectedTripId, setSelectedTripId] = useState(null);

  // State cho Đăng ký ngày nghỉ phép hàng tháng
  const [offDaysMap, setOffDaysMap] = useState(() => getStoredCrewOffDays());
  const [offDayModalOpen, setOffDayModalOpen] = useState(false);
  const [selectedOffDate, setSelectedOffDate] = useState(null);
  const [pendingOffDays, setPendingOffDays] = useState([]);

  // State cho Modal ghi sinh trắc thú y nhanh
  const [welfareModalOpen, setWelfareModalOpen] = useState(false);
  const [bodyTemp, setBodyTemp] = useState('38.1');
  const [waterIntake, setWaterIntake] = useState('15');
  const [welfareNotes, setWelfareNotes] = useState('Ngựa tỉnh táo, ăn cỏ tốt, nhịp thở đều đặn.');
  const [welfareSubmitting, setWelfareSubmitting] = useState(false);

  useEffect(() => {
    const handleOffDaysUpdate = () => {
      setOffDaysMap(getStoredCrewOffDays());
    };
    window.addEventListener('crew_offdays_updated', handleOffDaysUpdate);
    return () => {
      window.removeEventListener('crew_offdays_updated', handleOffDaysUpdate);
    };
  }, []);

  // Xác định chuyến đi khẩn cấp hoặc ưu tiên
  const getMissionPriority = (trip) => {
    if (trip.overallStatus === 'InTransit' || trip.overallStatus === 'EmergencyRerouting') {
      return {
        isUrgent: true,
        priorityRank: 1,
        label: trip.overallStatus === 'EmergencyRerouting' ? 'SỰ CỐ ĐỔI TUYẾN' : 'ĐANG TRÊN ĐƯỜNG',
        tagColor: trip.overallStatus === 'EmergencyRerouting' ? 'red' : 'blue',
      };
    }
    const departureDate = trip.plannedStartDate || trip.actualStartDate;
    if (!departureDate) {
      return { isUrgent: false, priorityRank: 4, label: 'KẾ HOẠCH TIÊU CHUẨN', tagColor: 'default' };
    }
    const diffHours = dayjs(departureDate).diff(dayjs(), 'hour');
    if (diffHours >= -24 && diffHours <= 48 && trip.overallStatus === 'Scheduled') {
      return { isUrgent: true, priorityRank: 2, label: 'KHẨN CẤP (<48 GIỜ)', tagColor: 'error' };
    }
    if (trip.overallStatus === 'ArrivedDestination') {
      return { isUrgent: false, priorityRank: 3, label: 'CHỜ BÀN GIAO ĐÍCH', tagColor: 'purple' };
    }
    if (trip.overallStatus === 'Completed') {
      return { isUrgent: false, priorityRank: 5, label: 'ĐÃ HOÀN TẤT', tagColor: 'green' };
    }
    return { isUrgent: false, priorityRank: 4, label: 'KẾ HOẠCH TIÊU CHUẨN', tagColor: 'default' };
  };

  // Sắp xếp nhiệm vụ: Khẩn cấp / Đang chạy lên đầu, rồi tới thời gian khởi hành
  const prioritizedMissions = useMemo(() => {
    return [...missions].sort((a, b) => {
      const pA = getMissionPriority(a).priorityRank;
      const pB = getMissionPriority(b).priorityRank;
      if (pA !== pB) return pA - pB;
      const dateA = new Date(a.plannedStartDate || 0).getTime();
      const dateB = new Date(b.plannedStartDate || 0).getTime();
      return dateA - dateB;
    });
  }, [missions]);

  // Chuyến được chọn xem chi tiết
  const activeMission = useMemo(() => {
    if (!prioritizedMissions.length) return null;
    if (selectedTripId) {
      const found = prioritizedMissions.find((m) => m.tripId === selectedTripId);
      if (found) return found;
    }
    return prioritizedMissions[0];
  }, [prioritizedMissions, selectedTripId]);

  // Số lượng chuyến khẩn cấp
  const urgentCount = useMemo(() => {
    return missions.filter((m) => getMissionPriority(m).isUrgent).length;
  }, [missions]);

  // Thông tin ngày nghỉ tháng hiện tại
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

  // Kiểm tra chuyến trùng ngày nghỉ Thứ 7 hoặc Chủ Nhật để kích hoạt thông báo dời ngày nghỉ bù
  const rolloverMission = useMemo(() => {
    return missions.find((m) => {
      const date = m.plannedStartDate || m.actualStartDate;
      if (!date) return false;
      const day = dayjs(date).day();
      return day === 0 || day === 6;
    });
  }, [missions]);

  // Xử lý thêm ngày nghỉ
  const handleAddOffDate = () => {
    if (!selectedOffDate) {
      message.warning('Vui lòng chọn ngày trên lịch');
      return;
    }
    const dayOfWeek = selectedOffDate.day();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      message.error('Thứ Bảy và Chủ Nhật là ngày nghỉ định kỳ. Chỉ đăng ký từ Thứ Hai đến Thứ Sáu.');
      return;
    }
    const dateStr = selectedOffDate.format('YYYY-MM-DD');
    if (pendingOffDays.includes(dateStr)) {
      message.warning('Ngày này đã có trong danh sách');
      return;
    }
    const targetMonthKey = selectedOffDate.format('YYYY-MM');
    const sameMonthCount = pendingOffDays.filter((d) => dayjs(d).format('YYYY-MM') === targetMonthKey).length;
    if (sameMonthCount >= 2) {
      message.error(`Tháng ${selectedOffDate.format('MM/YYYY')} đã đạt tối đa 2 ngày nghỉ phép.`);
      return;
    }
    setPendingOffDays([...pendingOffDays, dateStr]);
    setSelectedOffDate(null);
    message.success(`Đã thêm ngày ${selectedOffDate.format('DD/MM/YYYY')}`);
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
    message.success('Đã lưu lịch đăng ký ngày nghỉ phép thành công.');
    setOffDayModalOpen(false);
  };

  // Xử lý ghi nhanh nhật ký phúc lợi thú y
  const handleSaveWelfareLog = async () => {
    if (!activeMission) return;
    try {
      setWelfareSubmitting(true);
      await driverService.createWelfareLog(activeMission.tripId, {
        cabinTemp: parseFloat(bodyTemp) || 19.0,
        waterIntakeLiters: parseFloat(waterIntake) || 15.0,
        notes: welfareNotes,
        loggedAt: new Date().toISOString(),
        recordedBy: user?.fullName || 'Tài xế / Bác sĩ áp tải',
      });
      message.success(`Đã ghi nhận nhật ký thú y: Thân nhiệt ${bodyTemp}°C, Uống ${waterIntake}L nước.`);
      setWelfareModalOpen(false);
      refresh();
    } catch {
      message.error('Không thể lưu nhật ký thú y. Vui lòng thử lại.');
    } finally {
      setWelfareSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header trang */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#111827' }}>
            {t('driver.dashboard.title', 'Bảng Điều Khiển Ca Trực & Nhiệm Vụ Vận Chuyển')}
          </Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 14 }}>
            {t('driver.dashboard.subtitle', 'Theo dõi ca trực, tiếp nhận nhiệm vụ điều phối và thực thi an toàn hành trình vận chuyển ngựa')}
          </Paragraph>
        </div>

        <Space size={12}>
          <Button
            icon={<CalendarOutlined />}
            onClick={() => {
              setPendingOffDays(offDaysMap[String(crewId)] || []);
              setOffDayModalOpen(true);
            }}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            {t('driver.dashboard.registerOffDays', 'Đăng ký ngày nghỉ')} ({myOffDaysThisMonth.length}/2)
          </Button>

          <Tag color={isEscort ? 'purple' : 'blue'} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, fontWeight: 600 }}>
            {isEscort ? 'VET ESCORT APP' : 'DRIVER APP'}
          </Tag>
        </Space>
      </Flex>

      {/* 4 Thẻ chỉ số tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF' }} bodyStyle={{ padding: '16px 20px' }}>
            <Flex gap={12} align="center">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontSize: 18 }}>
                <ClockCircleOutlined />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                  {missions.length}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginTop: 4 }}>
                  {t('driver.dashboard.assignedMissions', 'NHIỆM VỤ ĐƯỢC GIAO')}
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: '#2563EB', marginTop: 8, fontWeight: 500 }}>
              {t('driver.dashboard.approvedAndDispatched', 'Đã duyệt & bàn giao')}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF' }} bodyStyle={{ padding: '16px 20px' }}>
            <Flex gap={12} align="center">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', fontSize: 18 }}>
                <AlertOutlined />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', lineHeight: 1 }}>
                  {urgentCount}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#991B1B', marginTop: 4 }}>
                  {t('driver.dashboard.urgentMissions', 'KHẨN CẤP (<48 GIỜ)')}
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: '#DC2626', marginTop: 8, fontWeight: 500 }}>
              {t('driver.dashboard.highPriority', 'Ưu tiên chuẩn bị cao')}
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF' }} bodyStyle={{ padding: '16px 20px' }}>
            <Flex gap={12} align="center">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', fontSize: 18 }}>
                <CalendarOutlined />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#D97706', lineHeight: 1 }}>
                  {myOffDaysThisMonth.length}/2
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#92400E', marginTop: 4 }}>
                  {t('driver.dashboard.offDaysThisMonth', 'NGÀY NGHỈ THÁNG NÀY')} ({currentMonthLabel})
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
                style={{ padding: 0, fontWeight: 600, color: '#D97706', fontSize: 12 }}
              >
                {t('driver.dashboard.registerOrEditOffDays', 'Đăng ký / Chỉnh ngày nghỉ')} &rarr;
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF' }} bodyStyle={{ padding: '16px 20px' }}>
            <Flex gap={12} align="center">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: isOffToday ? '#FEF2F2' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOffToday ? '#DC2626' : '#16A34A', fontSize: 18 }}>
                <CheckCircleOutlined />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: isOffToday ? '#DC2626' : '#16A34A', lineHeight: 1 }}>
                  {isOffToday ? t('driver.dashboard.statusOnLeave', 'NGHỈ PHÉP') : t('driver.dashboard.statusReady', 'SẴN SÀNG')}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginTop: 4 }}>
                  {t('driver.dashboard.currentStatus', 'TRẠNG THÁI HIỆN TẠI')}
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: isOffToday ? '#DC2626' : '#16A34A', marginTop: 8, fontWeight: 500 }}>
              {isOffToday ? t('driver.dashboard.onApprovedLeave', 'Đang trong kỳ nghỉ phép') : t('driver.dashboard.readyForMission', 'Sẵn sàng nhận chuyến')}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Khối Lịch làm việc định kỳ & Thông báo dời ngày nghỉ bù */}
      <Card
        bordered
        style={{ borderRadius: 12, marginBottom: 24, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
        bodyStyle={{ padding: '14px 20px' }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <div>
            <Flex align="center" gap={8} style={{ marginBottom: 2 }}>
              <CalendarOutlined style={{ color: '#2563EB', fontSize: 15 }} />
              <strong style={{ fontSize: 14, color: '#1E293B' }}>
                {t('driver.dashboard.shiftSchedule', 'Lịch làm việc định kỳ')}: Thứ Hai ➔ Thứ Sáu (08:00 - 18:00)
              </strong>
            </Flex>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              {t('driver.dashboard.shiftDescription', 'Thứ Hai đến Thứ Sáu (08:00 - 18:00). Nghỉ định kỳ Thứ Bảy & Chủ Nhật.')}
            </Text>
          </div>

          <Tag color="blue" style={{ fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>
            {myOffDaysThisMonth.length > 0
              ? `ĐÃ ĐĂNG KÝ ${myOffDaysThisMonth.length}/2 NGÀY NGHỈ THÁNG NÀY`
              : 'CHƯA ĐĂNG KÝ NGÀY NGHỈ THÁNG NÀY'}
          </Tag>
        </Flex>

        {rolloverMission && (
          <Alert
            style={{ marginTop: 12, borderRadius: 8 }}
            message={<strong>{t('driver.dashboard.rolloverAlertTitle', 'Thông báo dời ngày nghỉ bù (Off-day Rollover)')}</strong>}
            description={
              <span style={{ fontSize: 12.5 }}>
                Chuyến đi <strong>#{rolloverMission.tripCode}</strong> khởi hành vào ngày nghỉ cuối tuần ({dayjs(rolloverMission.plannedStartDate).format('dddd, DD/MM/YYYY')}). Theo chính sách phúc lợi công ty, ngày nghỉ được tự động dời sang Thứ Tư tuần kế tiếp.
              </span>
            }
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* Danh sách nhiệm vụ và chi tiết */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Đang nạp danh sách nhiệm vụ..." />
        </div>
      ) : prioritizedMissions.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '48px 20px', border: '1px solid #E2E8F0' }}>
          <ClockCircleOutlined style={{ fontSize: 40, color: '#9CA3AF', marginBottom: 12 }} />
          <Title level={4} style={{ color: '#111827', margin: '0 0 8px 0' }}>
            {t('driver.dashboard.emptyMissions', 'Chưa có chuyến đi nào sẵn sàng bàn giao')}
          </Title>
          <Text type="secondary" style={{ display: 'block', maxWidth: 480, margin: '0 auto', fontSize: 13 }}>
            {t('driver.dashboard.emptyMissionsDesc', 'Chuyến đi chỉ chính thức chuyển giao cho Driver & Escort khi Logistics Manager phê duyệt lộ trình và Transport Specialist thông qua kiểm dịch y tế.')}
          </Text>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {/* Cột trái: Danh sách nhiệm vụ căn thẳng hàng, ngay ngắn */}
          <Col xs={24} lg={11}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: 16 }}>
                {t('driver.dashboard.missionListTitle', 'Danh sách nhiệm vụ ưu tiên')} ({prioritizedMissions.length})
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('driver.dashboard.sortByDate', 'Sắp xếp theo ngày đi sớm nhất')}
              </Text>
            </Flex>

            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {prioritizedMissions.map((trip) => {
                const isSelected = activeMission?.tripId === trip.tripId;
                const statusMeta = getTripStatusMeta(trip.overallStatus);
                const priority = getMissionPriority(trip);

                return (
                  <div
                    key={trip.tripId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTripId(trip.tripId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedTripId(trip.tripId);
                      }
                    }}
                    style={{
                      border: isSelected ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                      backgroundColor: isSelected ? '#FFFBEB' : '#FFFFFF',
                      borderRadius: 10,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(245, 158, 11, 0.12)' : 'none',
                    }}
                  >
                    {/* Hàng 1: Mã chuyến, Tag khẩn cấp, Tag trạng thái */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Space size={8} align="center">
                        <Text strong style={{ fontSize: 15, color: '#111827' }}>
                          {trip.tripCode}
                        </Text>
                        <Tag color={statusMeta.color} style={{ margin: 0, borderRadius: 4, fontSize: 11, padding: '1px 8px' }}>
                          <Badge status={statusMeta.badgeStatus} text={statusMeta.text} />
                        </Tag>
                        {priority.isUrgent && (
                          <Tag color="error" style={{ margin: 0, borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                            {priority.label}
                          </Tag>
                        )}
                      </Space>

                      <Space size={4}>
                        <CarOutlined style={{ color: '#6B7280', fontSize: 13 }} />
                        <Text style={{ fontSize: 12, color: '#4B5563', fontWeight: 500 }}>
                          {trip.vehicleCode}
                        </Text>
                      </Space>
                    </div>

                    {/* Hàng 2: Lộ trình Điểm xuất phát -> Điểm đến */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 13 }}>
                      <EnvironmentOutlined style={{ color: '#F59E0B', fontSize: 14 }} />
                      <Text strong style={{ color: '#1F2937' }}>{trip.origin}</Text>
                      <Text type="secondary">→</Text>
                      <Text strong style={{ color: '#1F2937' }}>{trip.destination}</Text>
                    </div>

                    {/* Hàng 3: Metadata thời gian khởi hành & số ngựa */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#6B7280' }}>
                      <div>
                        Khởi hành:{' '}
                        <strong>
                          {trip.plannedStartDate
                            ? new Date(trip.plannedStartDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                            : 'Đang cập nhật'}
                        </strong>
                      </div>
                      <div>
                        Ngựa: <strong>{(trip.horses || []).map((h) => h.horseName).join(', ') || '0 con'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Space>
          </Col>

          {/* Cột phải: Chi tiết nhiệm vụ được chọn & Tác vụ trực tiếp */}
          <Col xs={24} lg={13}>
            {activeMission && (
              <Card
                bordered
                style={{ borderRadius: 12, border: '1px solid #E2E8F0', background: '#FFFFFF' }}
                bodyStyle={{ padding: '20px 22px' }}
              >
                {/* Header chi tiết */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                  <div>
                    <Space size={8} align="center" style={{ marginBottom: 4 }}>
                      <Title level={4} style={{ margin: 0, color: '#111827' }}>
                        {activeMission.tripCode}
                      </Title>
                      {activeMission.bookingCode && (
                        <Tag style={{ borderRadius: 4 }}>Đơn: {activeMission.bookingCode}</Tag>
                      )}
                      <Tag color={getTripStatusMeta(activeMission.overallStatus).color} style={{ borderRadius: 4 }}>
                        {getTripStatusMeta(activeMission.overallStatus).text}
                      </Tag>
                    </Space>
                    <div style={{ fontSize: 12.5, color: '#6B7280' }}>
                      Khách hàng: <strong>{activeMission.customerName || 'Jane Smith'}</strong> • Điều phối: <strong>{activeMission.coordinatorName || 'Lê Hoàng Nam'}</strong>
                    </div>
                  </div>

                  {/* Nút hành động trực tiếp khớp theo Flow 4 */}
                  <Space size={8} wrap>
                    {activeMission.overallStatus === 'Scheduled' && (
                      <Button
                        type="primary"
                        icon={<SafetyCertificateOutlined />}
                        onClick={() => navigate(`/driver/missions/${activeMission.tripId}/checklist`)}
                        style={{
                          backgroundColor: '#F59E0B',
                          borderColor: '#F59E0B',
                          borderRadius: 6,
                          fontWeight: 600,
                        }}
                      >
                        {t('driver.dashboard.actionChecklist', 'Kiểm tra an toàn & Xuất bến')}
                      </Button>
                    )}

                    {activeMission.overallStatus === 'InTransit' && (
                      <>
                        <Button
                          icon={<HeartOutlined />}
                          onClick={() => setWelfareModalOpen(true)}
                          style={{ borderRadius: 6, fontWeight: 500 }}
                        >
                          {t('driver.dashboard.actionWelfare', 'Ghi sinh trắc nhanh')}
                        </Button>
                        <Button
                          type="primary"
                          icon={<DashboardOutlined />}
                          onClick={() => navigate(`/driver/missions/${activeMission.tripId}/execution`)}
                          style={{
                            backgroundColor: '#F59E0B',
                            borderColor: '#F59E0B',
                            borderRadius: 6,
                            fontWeight: 600,
                          }}
                        >
                          {t('driver.dashboard.actionExecution', 'Lộ trình & Trạm kiểm soát')}
                        </Button>
                      </>
                    )}

                    {activeMission.overallStatus === 'ArrivedDestination' && (
                      <Button
                        type="primary"
                        icon={<FileDoneOutlined />}
                        onClick={() => navigate(`/driver/missions/${activeMission.tripId}/arrival`)}
                        style={{
                          backgroundColor: '#10B981',
                          borderColor: '#10B981',
                          borderRadius: 6,
                          fontWeight: 600,
                        }}
                      >
                        {t('driver.dashboard.actionArrival', 'Bàn giao & Ký e-POD')}
                      </Button>
                    )}

                    {activeMission.overallStatus === 'Completed' && (
                      <Button
                        icon={<TrophyOutlined />}
                        onClick={() => navigate(`/driver/missions/${activeMission.tripId}/completion-report`)}
                        style={{ borderRadius: 6, fontWeight: 500 }}
                      >
                        {t('driver.dashboard.actionReport', 'Xem Báo cáo hoàn tất ca trực')}
                      </Button>
                    )}
                  </Space>
                </div>

                <Divider style={{ margin: '12px 0 16px 0' }} />

                {/* Khối Thông tin căn thẳng cột ngay ngắn */}
                <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Tài xế chuyên dụng:</Text>
                      <strong style={{ fontSize: 13, color: '#111827' }}>
                        <UserOutlined style={{ marginRight: 4, color: '#6B7280' }} />
                        {activeMission.crew?.find(c => c.crewRole === 'Driver')?.fullName || 'Phạm Văn Đức'}
                      </strong>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Bác sĩ thú y áp tải:</Text>
                      <strong style={{ fontSize: 13, color: '#111827' }}>
                        <UserOutlined style={{ marginRight: 4, color: '#10B981' }} />
                        {activeMission.crew?.find(c => c.crewRole === 'Escort')?.fullName || 'Trần Thị Hoa (FEI Vet)'}
                      </strong>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Phương tiện điều phối:</Text>
                      <strong style={{ fontSize: 13, color: '#111827' }}>
                        <CarOutlined style={{ marginRight: 4, color: '#6B7280' }} />
                        {activeMission.vehicleCode} — {activeMission.vehicleName}
                      </strong>
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Hệ thống khoang thùng:</Text>
                      <strong style={{ fontSize: 13, color: '#111827' }}>
                        {activeMission.hasClimateControl ? 'Điều hòa khí hậu 18-20°C • Treo bóng hơi' : 'Tiêu chuẩn'}
                      </strong>
                    </div>
                  </Col>
                </Row>

                {/* Danh sách ngựa trên chuyến */}
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    Ngựa đua trên chuyến ({activeMission.horses?.length || 0} con):
                  </Text>
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    {(activeMission.horses || []).map((horse) => (
                      <div
                        key={horse.tripHorseId || horse.horseId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: '#F8FAFC',
                          borderRadius: 6,
                          border: '1px solid #E5E7EB',
                          fontSize: 12.5,
                        }}
                      >
                        <div>
                          <Text strong style={{ color: '#111827' }}>{horse.horseName}</Text>
                          <span style={{ color: '#6B7280', marginLeft: 8 }}>
                            (Mã chip: {horse.microchipNumber} • Chuồng #{horse.stallSlotNumber || 1})
                          </span>
                        </div>
                        <Tag color="cyan" style={{ margin: 0, fontSize: 11 }}>
                          {horse.healthStatus || 'Tốt'}
                        </Tag>
                      </div>
                    ))}
                  </Space>
                </div>

                {/* Lộ trình & Các trạm dừng chân */}
                <div style={{ marginBottom: 14 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    Lộ trình & Trạm dừng kiểm soát ({activeMission.checkpoints?.length || 0} trạm):
                  </Text>
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    {(activeMission.checkpoints || []).map((cp) => (
                      <div
                        key={cp.checkpointId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: '#FFFFFF',
                          borderRadius: 6,
                          border: '1px solid #E5E7EB',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: cp.status === 'Departed' ? '#10B981' : cp.status === 'Arrived' ? '#3B82F6' : '#9CA3AF',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {cp.sequenceOrder}
                          </span>
                          <strong style={{ color: '#1F2937' }}>{cp.checkpointName}</strong>
                          <span style={{ color: '#6B7280' }}>({cp.address})</span>
                        </div>

                        <Tag color={cp.status === 'Departed' ? 'success' : cp.status === 'Arrived' ? 'processing' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                          {cp.status}
                        </Tag>
                      </div>
                    ))}
                  </Space>
                </div>

                {/* Hướng dẫn đặc biệt */}
                {activeMission.specialInstructions && (
                  <div
                    style={{
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#92400E',
                    }}
                  >
                    <strong>Lưu ý nghiệp vụ:</strong> {activeMission.specialInstructions}
                  </div>
                )}
              </Card>
            )}
          </Col>
        </Row>
      )}

      {/* MODAL ĐĂNG KÝ NGÀY NGHỈ PHÉP HÀNG THÁNG */}
      <Modal
        open={offDayModalOpen}
        onCancel={() => setOffDayModalOpen(false)}
        onOk={handleSaveOffDays}
        title="Đăng ký ngày nghỉ phép trong tháng (Tối đa 2 ngày/tháng)"
        okText="Lưu lịch nghỉ"
        cancelText="Đóng"
        okButtonProps={{ style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B', fontWeight: 600 } }}
        width={520}
      >
        <div style={{ padding: '8px 0' }}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
            message="Chính sách ngày nghỉ phép nhân sự"
            description="Tối đa 2 ngày trong 1 tháng dương lịch. Thứ Bảy và Chủ Nhật là ngày nghỉ định kỳ. Chỉ được đăng ký từ Thứ Hai đến Thứ Sáu."
          />

          <div style={{ marginBottom: 14 }}>
            <label htmlFor="off-date-picker" style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 13 }}>
              Chọn ngày nghỉ muốn đăng ký:
            </label>
            <Flex gap={8}>
              <DatePicker
                id="off-date-picker"
                placeholder="Chọn ngày (Thứ 2 - Thứ 6)"
                value={selectedOffDate}
                onChange={(d) => setSelectedOffDate(d)}
                style={{ flex: 1, borderRadius: 6 }}
                disabledDate={(current) => {
                  if (!current) return false;
                  const day = current.day();
                  return day === 0 || day === 6;
                }}
              />
              <Button
                type="primary"
                onClick={handleAddOffDate}
                style={{ backgroundColor: '#111827', borderColor: '#111827', fontWeight: 500, borderRadius: 6 }}
              >
                + Thêm ngày
              </Button>
            </Flex>
          </div>

          <Divider style={{ margin: '14px 0' }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
                Danh sách ngày nghỉ đã đăng ký ({pendingOffDays.length} ngày):
              </span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>
                Tháng này: <strong>{pendingOffDays.filter(d => dayjs(d).format('YYYY-MM') === currentMonthKey).length}/2 ngày</strong>
              </span>
            </div>

            {pendingOffDays.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', background: '#F8FAFC', borderRadius: 6, color: '#9CA3AF', fontSize: 12 }}>
                Chưa đăng ký ngày nghỉ nào. Hãy chọn ngày ở trên và bấm &quot;+ Thêm ngày&quot;.
              </div>
            ) : (
              <Flex wrap="wrap" gap={6}>
                {pendingOffDays.map((d) => (
                  <Tag
                    key={d}
                    color="blue"
                    closable
                    onClose={() => handleRemoveOffDate(d)}
                    style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4 }}
                  >
                    {dayjs(d).format('dddd, DD/MM/YYYY')}
                  </Tag>
                ))}
              </Flex>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL GHI SINH TRẮC HỌC THÚ Y NHANH */}
      <Modal
        open={welfareModalOpen}
        onCancel={() => setWelfareModalOpen(false)}
        onOk={handleSaveWelfareLog}
        confirmLoading={welfareSubmitting}
        title="Ghi nhật ký kiểm tra sinh trắc học & Phúc lợi ngựa"
        okText="Lưu nhật ký"
        cancelText="Hủy"
        okButtonProps={{ style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B', fontWeight: 600 } }}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="body-temp-input" style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: 13 }}>
              Thân nhiệt ngựa (°C):
            </label>
            <Input id="body-temp-input" value={bodyTemp} onChange={(e) => setBodyTemp(e.target.value)} style={{ borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="water-intake-input" style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: 13 }}>
              Lượng nước uống (Lít):
            </label>
            <Input id="water-intake-input" value={waterIntake} onChange={(e) => setWaterIntake(e.target.value)} style={{ borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="welfare-notes-input" style={{ fontWeight: 600, display: 'block', marginBottom: 4, fontSize: 13 }}>
              Đánh giá thể trạng & hô hấp:
            </label>
            <Input.TextArea id="welfare-notes-input" rows={3} value={welfareNotes} onChange={(e) => setWelfareNotes(e.target.value)} style={{ borderRadius: 6 }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
