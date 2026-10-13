import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Flex,
  Input,
  Modal,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
  Select,
  Table,
  DatePicker,
  Alert,
} from 'antd';
import {
  CarOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  PlusOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  FileDoneOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ROUTES } from '@routes/routes';
import {
  getStoredRoutePlans,
  getOrdersToPlan,
  updateStoredRoutePlan,
  getStoredPersonnel,
  getStoredCrewOffDays,
  setCrewOffDays,
} from '@utils/routePlanStorage';

const { Title, Text, Paragraph } = Typography;

/**
 * Trang Fleet & Dispatch Operations Hub dành cho Fleet & Route Coordinator
 * Đáp ứng Item 3, 4, 5:
 * - Xóa dấu '+' thừa trên nút tạo lộ trình
 * - Cung cấp bảng danh sách yêu cầu cần lên kế hoạch (Orders to Plan)
 * - Quản lý lịch làm việc và ngày nghỉ phép của toàn bộ Driver & Escort (tối đa 2 ngày/tháng, Thứ 2 - Thứ 6)
 * - Tinh chỉnh giao diện trực quan, dễ quản lý và dễ phân công
 */
export default function CoordinatorDashboard() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState(() => getStoredRoutePlans());
  const [ordersToPlan, setOrdersToPlan] = useState(() => getOrdersToPlan());
  const [personnelList, setPersonnelList] = useState(() => getStoredPersonnel());
  const [offDaysMap, setOffDaysMap] = useState(() => getStoredCrewOffDays());

  // Điều hướng phân mục chính: 'plans' | 'orders' | 'crew_schedule'
  const [mainView, setMainView] = useState('plans');
  const [activePlanTab, setActivePlanTab] = useState('All');
  const [refreshKey, setRefreshKey] = useState(0);

  // State cho Alt Flow A: Propose External Charter Modal
  const [shortageModalOpen, setShortageModalOpen] = useState(false);
  const [charterCost, setCharterCost] = useState(2500);

  // State cho Alt Flow C: Driver Conflict Resolution Modal
  const [driverConflictModalOpen, setDriverConflictModalOpen] = useState(false);
  const [selectedReplacementDriver, setSelectedReplacementDriver] = useState('Le Hoang Nam');

  // State cho Quản lý ngày nghỉ nhân sự (Item 5)
  const [crewLeaveModalOpen, setCrewLeaveModalOpen] = useState(false);
  const [managingCrew, setManagingCrew] = useState(null);
  const [selectedCrewDate, setSelectedCrewDate] = useState(null);
  const [pendingCrewDates, setPendingCrewDates] = useState([]);

  useEffect(() => {
    const handleUpdate = () => {
      setPlans(getStoredRoutePlans());
      setOrdersToPlan(getOrdersToPlan());
      setPersonnelList(getStoredPersonnel());
      setOffDaysMap(getStoredCrewOffDays());
    };

    window.addEventListener('plans_updated', handleUpdate);
    window.addEventListener('bookings_updated', handleUpdate);
    window.addEventListener('crew_offdays_updated', handleUpdate);
    return () => {
      window.removeEventListener('plans_updated', handleUpdate);
      window.removeEventListener('bookings_updated', handleUpdate);
      window.removeEventListener('crew_offdays_updated', handleUpdate);
    };
  }, [refreshKey]);

  // Thống kê 4 ô chỉ số
  const fleetCount = 12; // 8 Horse Vans + 4 Air Stalls
  const ordersCount = ordersToPlan.length || 4;
  const pendingCount = plans.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const inTransitCount = plans.filter((p) => p.status === 'ASSIGNED' || p.status === 'InTransit').length || 5;

  const currentMonthKey = dayjs().format('YYYY-MM');
  const currentMonthLabel = dayjs().format('MM/YYYY');
  const todayStr = dayjs().format('YYYY-MM-DD');

  // Lọc kế hoạch theo Tab
  const filteredPlans = useMemo(() => {
    if (activePlanTab === 'Pending') {
      return plans.filter((p) => p.status === 'PENDING_APPROVAL');
    }
    if (activePlanTab === 'Assigned') {
      return plans.filter((p) => p.status === 'ASSIGNED');
    }
    if (activePlanTab === 'Rejected') {
      return plans.filter((p) => p.status === 'REJECTED' || p.status === 'WAITING_VEHICLE');
    }
    return plans;
  }, [plans, activePlanTab]);

  // Danh sách đơn hàng kèm trạng thái lộ trình
  const ordersWithPlanStatus = useMemo(() => {
    return ordersToPlan.map((order) => {
      const existingPlan = plans.find((p) => p.orderId === order.orderId);
      return {
        ...order,
        hasPlan: !!existingPlan,
        planStatus: existingPlan ? existingPlan.status : 'NOT_CREATED',
        planId: existingPlan ? existingPlan.planId : null,
      };
    });
  }, [ordersToPlan, plans]);

  // Xử lý gửi phụ phí External Charter (Alt Flow A)
  const handleSubmitExternalCharter = () => {
    message.success(
      `Đã gửi đề xuất thuê chuyên cơ ngoại hãng (+$${charterCost}) cho Quản lý phê duyệt!`,
    );
    setShortageModalOpen(false);
  };

  // Xử lý đổi tài xế thay thế (Alt Flow C)
  const handleResolveDriverConflict = () => {
    updateStoredRoutePlan('PLN-8809', {
      driverName: selectedReplacementDriver,
      driverStatus: 'AVAILABLE',
      status: 'PENDING_APPROVAL',
      managerNotes: 'Updated driver to resolve schedule collision. Resubmitted to Manager.',
    });
    message.success(`Đã chỉ định tài xế thay thế: ${selectedReplacementDriver}!`);
    setDriverConflictModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  // Thao tác mở Modal quản lý ngày nghỉ của nhân sự
  const handleOpenCrewLeaveModal = (crew) => {
    setManagingCrew(crew);
    const dates = offDaysMap[String(crew.id)] || [];
    setPendingCrewDates(dates);
    setSelectedCrewDate(null);
    setCrewLeaveModalOpen(true);
  };

  // Thêm ngày nghỉ cho nhân sự trong Modal
  const handleAddCrewLeaveDate = () => {
    if (!selectedCrewDate) {
      message.warning('Vui lòng chọn một ngày trên lịch!');
      return;
    }
    const dayOfWeek = selectedCrewDate.day();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      message.error('Thứ Bảy và Chủ Nhật là ngày nghỉ định kỳ. Chỉ được phân bổ ngày nghỉ từ Thứ Hai đến Thứ Sáu!');
      return;
    }
    const dateStr = selectedCrewDate.format('YYYY-MM-DD');
    if (pendingCrewDates.includes(dateStr)) {
      message.warning('Ngày này đã có trong danh sách!');
      return;
    }
    const targetMonthKey = selectedCrewDate.format('YYYY-MM');
    const countInMonth = pendingCrewDates.filter((d) => dayjs(d).format('YYYY-MM') === targetMonthKey).length;
    if (countInMonth >= 2) {
      message.error(`Tháng ${selectedCrewDate.format('MM/YYYY')} đã đạt giới hạn tối đa 2 ngày nghỉ phép cho nhân sự này!`);
      return;
    }

    setPendingCrewDates([...pendingCrewDates, dateStr]);
    setSelectedCrewDate(null);
    message.success(`Đã thêm ngày ${selectedCrewDate.format('DD/MM/YYYY')} vào lịch nghỉ.`);
  };

  const handleRemoveCrewLeaveDate = (dateStr) => {
    setPendingCrewDates(pendingCrewDates.filter((d) => d !== dateStr));
  };

  const handleSaveCrewLeave = () => {
    if (!managingCrew) return;
    const res = setCrewOffDays(managingCrew.id, pendingCrewDates);
    if (!res.success) {
      message.error(res.message);
      return;
    }
    // Đồng bộ nếu là Elena Rostova (id 2 & 6)
    if (managingCrew.id === 2) setCrewOffDays(6, pendingCrewDates);
    if (managingCrew.id === 6) setCrewOffDays(2, pendingCrewDates);

    message.success(`Đã cập nhật lịch nghỉ cho ${managingCrew.name} thành công!`);
    setCrewLeaveModalOpen(false);
  };

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', paddingBottom: 40 }}>
      {/* HEADER: FLEET & DISPATCH OPERATIONS HUB */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap="middle" style={{ marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: 28 }}>
            Fleet & Dispatch Operations Hub
          </Title>
          <Text style={{ color: '#64748B', fontSize: 14 }}>
            Plan multimodal routes, allocate vehicles & escorts, manage draft approvals and personnel leave roster
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate(ROUTES.COORDINATOR_ROUTE_PLANNING)}
          style={{
            backgroundColor: '#F59E0B',
            borderColor: '#F59E0B',
            color: '#0F172A',
            fontWeight: 800,
            borderRadius: 9999,
            height: 44,
            padding: '0 26px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
          }}
        >
          Create Route Plan
        </Button>
      </Flex>

      {/* 4 THẺ THỐNG KÊ TRÊN CÙNG */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Card 1: Available Fleet */}
        <Col xs={12} sm={6}>
          <Card
            bordered
            style={{ borderRadius: 18, border: '1px solid #E2E8F0', height: '100%' }}
            styles={{ body: { padding: '20px 22px' } }}
          >
            <Flex gap={12} align="center">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  fontSize: 22,
                }}
              >
                <CarOutlined />
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {fleetCount}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginTop: 4 }}>
                  AVAILABLE FLEET
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: '#10B981', marginTop: 12, fontWeight: 600 }}>
              ✓ 8 Horse Vans • 4 Air Stalls
            </div>
          </Card>
        </Col>

        {/* Card 2: Orders to Plan */}
        <Col xs={12} sm={6}>
          <Card
            bordered
            onClick={() => setMainView('orders')}
            style={{
              borderRadius: 18,
              border: mainView === 'orders' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
              cursor: 'pointer',
              height: '100%',
              backgroundColor: '#FFFBEB',
            }}
            styles={{ body: { padding: '20px 22px' } }}
          >
            <Flex gap={12} align="center">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  fontSize: 22,
                }}
              >
                <FileDoneOutlined />
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#D97706', lineHeight: 1 }}>
                  {String(ordersCount).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309', marginTop: 4 }}>
                  ORDERS TO PLAN
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: '#D97706', marginTop: 12, fontWeight: 600 }}>
              Incoming from Log. Manager →
            </div>
          </Card>
        </Col>

        {/* Card 3: Pending Approval */}
        <Col xs={12} sm={6}>
          <Card
            bordered
            onClick={() => {
              setMainView('plans');
              setActivePlanTab('Pending');
            }}
            style={{
              borderRadius: 18,
              border: mainView === 'plans' && activePlanTab === 'Pending' ? '2px solid #2563EB' : '1px solid #E2E8F0',
              cursor: 'pointer',
              height: '100%',
            }}
            styles={{ body: { padding: '20px 22px' } }}
          >
            <Flex gap={12} align="center">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                  fontSize: 22,
                }}
              >
                <ClockCircleOutlined />
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {String(pendingCount).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginTop: 4 }}>
                  PENDING APPROVAL
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: '#2563EB', marginTop: 12, fontWeight: 600 }}>
              Drafts submitted to Manager
            </div>
          </Card>
        </Col>

        {/* Card 4: Active In-Transit */}
        <Col xs={12} sm={6}>
          <Card
            bordered
            onClick={() => {
              setMainView('plans');
              setActivePlanTab('Assigned');
            }}
            style={{
              borderRadius: 18,
              border: mainView === 'plans' && activePlanTab === 'Assigned' ? '2px solid #059669' : '1px solid #E2E8F0',
              cursor: 'pointer',
              height: '100%',
            }}
            styles={{ body: { padding: '20px 22px' } }}
          >
            <Flex gap={12} align="center">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  fontSize: 22,
                }}
              >
                <CompassOutlined />
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                  {String(inTransitCount).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginTop: 4 }}>
                  ACTIVE IN-TRANSIT
                </div>
              </div>
            </Flex>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 12, fontWeight: 600 }}>
              Live telemetry on GPS map
            </div>
          </Card>
        </Col>
      </Row>

      {/* THANH ĐIỀU HƯỚNG TẦNG TRUNG: CHỌN MỤC QUẢN TRỊ */}
      <Card
        bordered
        style={{ borderRadius: 18, marginBottom: 24, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}
        styles={{ body: { padding: '12px 18px' } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <Segmented
            size="large"
            value={mainView}
            onChange={setMainView}
            options={[
              {
                label: `📋 Kế hoạch Lộ trình (${plans.length})`,
                value: 'plans',
              },
              {
                label: `📥 Đơn chờ Lập kế hoạch (${ordersToPlan.length})`,
                value: 'orders',
              },
              {
                label: `👥 Lịch trực & Ngày nghỉ Driver / Escort (${personnelList.length})`,
                value: 'crew_schedule',
              },
            ]}
            style={{ backgroundColor: '#EDF2F7', padding: 4, borderRadius: 12, fontWeight: 700 }}
          />

          <Button
            type="dashed"
            icon={<RocketOutlined />}
            onClick={() => navigate(ROUTES.COORDINATOR_ROUTE_PLANNING)}
            style={{ fontWeight: 700, borderRadius: 8 }}
          >
            Mở Studio Lập lộ trình &rarr;
          </Button>
        </Flex>
      </Card>

      {/* VIEW 1: KẾ HOẠCH LỘ TRÌNH (ACTIVE ROUTE PLANS + ALT FLOWS) */}
      {mainView === 'plans' && (
        <Row gutter={[24, 24]}>
          {/* CỘT TRÁI: TRANSPORT ROUTE PLANS */}
          <Col xs={24} lg={15}>
            <Card
              bordered
              style={{ borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              styles={{ body: { padding: '24px' } }}
            >
              <Flex justify="space-between" align="center" wrap="wrap" gap="small" style={{ marginBottom: 20 }}>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                    Transport Route Plans
                  </Title>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>
                    Overview of drafted, pending, and assigned execution plans
                  </Text>
                </div>

                <Segmented
                  value={activePlanTab}
                  onChange={setActivePlanTab}
                  options={[
                    { label: 'All', value: 'All' },
                    { label: `Pending (${pendingCount})`, value: 'Pending' },
                    { label: `Assigned (${plans.filter((p) => p.status === 'ASSIGNED').length})`, value: 'Assigned' },
                    { label: 'Rejected/Hold', value: 'Rejected' },
                  ]}
                  style={{ backgroundColor: '#F1F5F9', padding: 3, borderRadius: 10 }}
                />
              </Flex>

              {/* DANH SÁCH ROUTE PLAN CARDS */}
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {filteredPlans.map((plan) => {
                  const isPending = plan.status === 'PENDING_APPROVAL';
                  const isAssigned = plan.status === 'ASSIGNED';
                  const isRejected = plan.status === 'REJECTED';
                  const isWaitingVehicle = plan.status === 'WAITING_VEHICLE';

                  return (
                    <div
                      key={plan.planId}
                      style={{
                        border: isPending
                          ? '1.5px solid #FDE68A'
                          : isAssigned
                          ? '1.5px solid #BBF7D0'
                          : isRejected
                          ? '1.5px solid #FECACA'
                          : '1.5px solid #E2E8F0',
                        borderRadius: 16,
                        padding: '18px 20px',
                        backgroundColor: isPending
                          ? '#FFFDF5'
                          : isAssigned
                          ? '#F9FEFB'
                          : isRejected
                          ? '#FEF2F2'
                          : '#FFFFFF',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                      }}
                    >
                      {/* Header Thẻ: Plan code + Route + Status badge */}
                      <Flex justify="space-between" align="center" wrap="wrap" gap="small" style={{ marginBottom: 10 }}>
                        <Flex align="center" gap={8}>
                          <strong style={{ fontSize: 16, color: '#0F172A', fontFamily: 'monospace' }}>
                            Plan #{plan.planCode}
                          </strong>
                          <span style={{ color: '#64748B', fontWeight: 600 }}>•</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>
                            {plan.originCode || 'SGN'} &rarr; {plan.destinationCode || 'AMS'}
                          </span>
                        </Flex>

                        <div>
                          {isPending && <Tag color="gold" style={{ fontWeight: 800, borderRadius: 6 }}>PENDING APPROVAL</Tag>}
                          {isAssigned && <Tag color="green" style={{ fontWeight: 800, borderRadius: 6 }}>ASSIGNED & READY</Tag>}
                          {isRejected && <Tag color="error" style={{ fontWeight: 800, borderRadius: 6 }}>REJECTED (EDIT REQUIRED)</Tag>}
                          {isWaitingVehicle && <Tag color="orange" style={{ fontWeight: 800, borderRadius: 6 }}>WAITING VEHICLE</Tag>}
                        </div>
                      </Flex>

                      {/* Chi tiết lộ trình */}
                      <div style={{ fontSize: 13, color: '#475569', marginBottom: 10 }}>
                        <div>📍 <strong>Từ:</strong> {plan.origin}</div>
                        <div>🏁 <strong>Đến:</strong> {plan.destination}</div>
                      </div>

                      {/* Grid thông tin phân bổ */}
                      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                        <Col span={12}>
                          <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>VEHICLE / AIR STALL:</div>
                            <strong style={{ fontSize: 13, color: '#0F172A' }}>{plan.vehicleName}</strong>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>{plan.stalls}</div>
                          </div>
                        </Col>

                        <Col span={12}>
                          <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>PERSONNEL ASSIGNED:</div>
                            <strong style={{ fontSize: 13, color: '#0F172A' }}>
                              {plan.transportMode === 'Air' ? (
                                <span>✈️ Chỉ Escort: {plan.vetEscortName}</span>
                              ) : (
                                <span>👨‍✈️ {plan.driverName} • 👩‍⚕️ {plan.vetEscortName}</span>
                              )}
                            </strong>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>
                              FEI Standard Cleared
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Footer Thẻ: Margin & Hành động */}
                      <Flex justify="space-between" align="center" wrap="wrap" gap="small" style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                        <Space size={16}>
                          <span style={{ fontSize: 12, color: '#64748B' }}>
                            Cost: <strong>${plan.estimatedCost?.toLocaleString()}</strong> / Cap: <strong>${plan.customerFeeCap?.toLocaleString()}</strong>
                          </span>
                          <Tag color="cyan" style={{ fontWeight: 700 }}>
                            Margin: {plan.grossMarginPercent || '18%'} (+${plan.grossMargin || 850})
                          </Tag>
                        </Space>

                        <Space>
                          {isRejected ? (
                            <Button
                              type="primary"
                              danger
                              size="small"
                              onClick={() => navigate(`/coordinator/route-planning?orderId=${plan.orderId}&planId=${plan.planId}`)}
                              style={{ fontWeight: 700, borderRadius: 6 }}
                            >
                              Edit Plan & Resubmit &gt;
                            </Button>
                          ) : (
                            <Button
                              type="default"
                              size="small"
                              onClick={() => navigate(`/coordinator/route-planning?orderId=${plan.orderId}&planId=${plan.planId}`)}
                              style={{ fontWeight: 600, borderRadius: 6 }}
                            >
                              Xem & Chỉnh sửa Lộ trình &rarr;
                            </Button>
                          )}

                          {isAssigned && (
                            <Button
                              type="default"
                              size="small"
                              onClick={() => navigate(ROUTES.DRIVER_DASHBOARD)}
                              style={{ fontWeight: 600, borderRadius: 6, color: '#16A34A', borderColor: '#86EFAC' }}
                            >
                              Xem trên Driver App →
                            </Button>
                          )}
                        </Space>
                      </Flex>
                    </div>
                  );
                })}
              </Space>
            </Card>
          </Col>

          {/* CỘT PHẢI: CÁC THẺ ALT FLOW A (SHORTAGE) & ALT FLOW C (CONFLICT) */}
          <Col xs={24} lg={9}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              {/* THẺ 1: ALT FLOW A: SHORTAGE (VEHICLE WAITING QUEUE) */}
              <Card
                bordered
                style={{
                  borderRadius: 18,
                  border: '1.5px solid #FED7AA',
                  backgroundColor: '#FFFBF5',
                }}
                styles={{ body: { padding: '20px' } }}
              >
                <Tag color="orange" style={{ fontWeight: 800, borderRadius: 6, marginBottom: 8 }}>
                  ALT FLOW A: SHORTAGE
                </Tag>
                <Title level={5} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                  Vehicle Waiting Queue
                </Title>
                <Text style={{ fontSize: 12.5, color: '#64748B', display: 'block', marginBottom: 14 }}>
                  No available internal fleet matching specs for requested trip.
                </Text>

                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FED7AA',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 14,
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                    <strong style={{ fontSize: 13.5, color: '#0F172A' }}>
                      #PLN-8834 • 3-Horse Stall Van
                    </strong>
                    <Tag color="orange" style={{ fontWeight: 800, margin: 0, fontSize: 11 }}>
                      WAITING_VEHICLE
                    </Tag>
                  </Flex>
                  <div style={{ fontSize: 12, color: '#B45309', fontWeight: 600 }}>
                    ⏳ Day 1 of 3 (Max wait: 72 hrs)
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Earliest internal van free: Sep 23, 2026
                  </div>
                  <div style={{ fontSize: 12, color: '#2563EB', marginTop: 4, fontWeight: 600 }}>
                    → Option 2: Propose External Charter
                  </div>
                </div>

                <Button
                  type="primary"
                  block
                  onClick={() => setShortageModalOpen(true)}
                  style={{
                    backgroundColor: '#0F172A',
                    borderColor: '#0F172A',
                    fontWeight: 700,
                    borderRadius: 10,
                    height: 40,
                  }}
                >
                  📝 Submit Extra Charter Cost
                </Button>
                <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', display: 'block', marginTop: 6 }}>
                  Triggers Manager surcharge approval flow
                </Text>
              </Card>

              {/* THẺ 2: ALT FLOW C: CONFLICT (DRIVER SCHEDULE COLLISION) */}
              <Card
                bordered
                style={{
                  borderRadius: 18,
                  border: '1.5px solid #FECACA',
                  backgroundColor: '#FEF8F8',
                }}
                styles={{ body: { padding: '20px' } }}
              >
                <Tag color="red" style={{ fontWeight: 800, borderRadius: 6, marginBottom: 8 }}>
                  ALT FLOW C: CONFLICT
                </Tag>
                <Title level={5} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                  Driver Schedule Collision
                </Title>
                <Text style={{ fontSize: 12.5, color: '#64748B', display: 'block', marginBottom: 14 }}>
                  Detected overlap by Manager review for assigned trip.
                </Text>

                <div
                  style={{
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FECACA',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#991B1B' }}>
                    Driver: Nguyen Van Binh
                  </div>
                  <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                    Conflict on: Sep 24, 2026 (14:00 - 22:00)
                  </div>
                  <div style={{ fontSize: 12, color: '#7F1D1D', marginTop: 2 }}>
                    Already booked for: Trip #TRP-401 (Hanoi Depot)
                  </div>
                </div>

                <Button
                  type="primary"
                  danger
                  block
                  onClick={() => setDriverConflictModalOpen(true)}
                  style={{
                    fontWeight: 700,
                    borderRadius: 10,
                    height: 40,
                  }}
                >
                  <SwapOutlined /> Re-assign Available Driver
                </Button>

                <div
                  style={{
                    marginTop: 12,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 10,
                    padding: '10px 12px',
                    border: '1px solid #E2E8F0',
                    fontSize: 12,
                  }}
                >
                  <Text type="secondary" style={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>
                    AVAILABLE REPLACEMENTS:
                  </Text>
                  <div style={{ color: '#16A34A', fontWeight: 700, marginTop: 4 }}>
                    ✓ Le Hoang Nam (Rest completed • 0 trips)
                  </div>
                </div>
              </Card>
            </Space>
          </Col>
        </Row>
      )}

      {/* VIEW 2: ĐƠN CHỜ LẬP KẾ HOẠCH (ORDERS TO PLAN) */}
      {mainView === 'orders' && (
        <Card
          bordered
          style={{ borderRadius: 20, border: '1px solid #E2E8F0' }}
          styles={{ body: { padding: '24px' } }}
        >
          <Flex justify="space-between" align="center" style={{ marginBottom: 18 }}>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                Yêu cầu Vận chuyển cần Lên Kế hoạch ({ordersToPlan.length})
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Nguồn đơn đã được Logistics Manager phê duyệt. Điều phối viên chọn đơn và nhấn để mở Studio thiết lập phương tiện, tuyến đường và nhân sự.
              </Text>
            </div>
          </Flex>

          <Table
            dataSource={ordersWithPlanStatus}
            rowKey="orderId"
            pagination={{ pageSize: 5 }}
            columns={[
              {
                title: 'Mã đơn / Khách hàng',
                key: 'order',
                render: (_, record) => (
                  <div>
                    <strong style={{ fontFamily: 'monospace', color: '#0F172A', fontSize: 14 }}>
                      #{record.orderCode}
                    </strong>
                    <div style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>{record.customerName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{record.customerPhone}</div>
                  </div>
                ),
              },
              {
                title: 'Ngựa đua',
                key: 'horses',
                render: (_, record) => (
                  <div>
                    <Tag color="cyan" style={{ fontWeight: 700 }}>
                      {record.totalHorses} con
                    </Tag>
                    <div style={{ fontSize: 12.5, color: '#0F172A', marginTop: 4, fontWeight: 600 }}>
                      {record.horses?.join(', ')}
                    </div>
                  </div>
                ),
              },
              {
                title: 'Lộ trình vận chuyển',
                key: 'route',
                render: (_, record) => (
                  <div style={{ fontSize: 12.5 }}>
                    <div>📍 <strong>Từ:</strong> {record.origin}</div>
                    <div>🏁 <strong>Đến:</strong> {record.destination}</div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      Phương thức: <strong>{record.transportMode}</strong>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Ngân sách trần (Cap)',
                key: 'cap',
                render: (_, record) => (
                  <div>
                    <strong style={{ fontSize: 14, color: '#059669' }}>
                      ${record.customerFeeCap?.toLocaleString()}
                    </strong>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Khách chi trả</div>
                  </div>
                ),
              },
              {
                title: 'Trạng thái Kế hoạch',
                key: 'status',
                render: (_, record) => {
                  if (record.planStatus === 'PENDING_APPROVAL') {
                    return <Tag color="gold" style={{ fontWeight: 700 }}>Chờ Quản lý duyệt</Tag>;
                  }
                  if (record.planStatus === 'ASSIGNED') {
                    return <Tag color="green" style={{ fontWeight: 700 }}>Đã duyệt & Bàn giao</Tag>;
                  }
                  if (record.planStatus === 'REJECTED') {
                    return <Tag color="error" style={{ fontWeight: 700 }}>Cần chỉnh sửa lại</Tag>;
                  }
                  return <Tag color="default" style={{ fontWeight: 700 }}>Chưa lập kế hoạch</Tag>;
                },
              },
              {
                title: 'Thao tác điều phối',
                key: 'action',
                render: (_, record) => (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => navigate(`/coordinator/route-planning?orderId=${record.orderId}`)}
                    style={{
                      backgroundColor: record.hasPlan ? '#2563EB' : '#F59E0B',
                      borderColor: record.hasPlan ? '#2563EB' : '#F59E0B',
                      color: record.hasPlan ? '#FFFFFF' : '#0F172A',
                      fontWeight: 800,
                      borderRadius: 6,
                    }}
                  >
                    {record.hasPlan ? 'Mở & Chỉnh sửa Studio →' : '⚡ Lập Kế Hoạch (Studio) →'}
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* VIEW 3: LỊCH TRỰC & NGÀY NGHỈ DRIVER / ESCORT (ITEM 5) */}
      {mainView === 'crew_schedule' && (
        <Card
          bordered
          style={{ borderRadius: 20, border: '1px solid #E2E8F0' }}
          styles={{ body: { padding: '24px' } }}
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 20, borderRadius: 12 }}
            message="Chính sách quản lý ngày nghỉ phép đội ngũ vận chuyển (Item 5)"
            description={
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 12.5, color: '#334155' }}>
                <li>Mỗi Tài xế (Driver) và Bác sĩ thú y (Escort) được đăng ký tối đa <strong>2 ngày nghỉ trong 1 tháng</strong> (theo tháng dương lịch).</li>
                <li><strong>Thứ Bảy & Chủ Nhật là ngày nghỉ định kỳ</strong>, không tính vào hạn mức ngày nghỉ phép trong tuần. Chỉ đăng ký từ <strong>Thứ Hai đến Thứ Sáu</strong>.</li>
                <li>Fleet & Route Coordinator theo dõi bảng lịch này để tránh chỉ định nhân sự vào ngày họ nghỉ phép khi lập kế hoạch lộ trình.</li>
              </ul>
            }
          />

          <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
              Danh sách Nhân sự & Lịch nghỉ phép ({currentMonthLabel})
            </Title>
            <Tag color="blue" style={{ fontWeight: 700, padding: '4px 12px', borderRadius: 8 }}>
              Tháng hiện tại: {currentMonthLabel}
            </Tag>
          </Flex>

          <Table
            dataSource={personnelList}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Nhân sự',
                key: 'personnel',
                render: (_, record) => (
                  <Flex align="center" gap={12}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}
                    >
                      {record.avatar || (record.role?.toLowerCase().includes('vet') ? '👩‍⚕️' : '👨‍✈️')}
                    </div>
                    <div>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>{record.name}</strong>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        ID #{record.id} • {record.experience || 'Chuyên môn vận chuyển'}
                      </div>
                    </div>
                  </Flex>
                ),
              },
              {
                title: 'Vai trò chuyên trách',
                dataIndex: 'role',
                key: 'role',
                render: (role) => {
                  const isVet = role?.toLowerCase().includes('vet') || role?.toLowerCase().includes('escort');
                  return (
                    <Tag
                      color={isVet ? 'purple' : 'green'}
                      icon={isVet ? <SafetyCertificateOutlined /> : <UserOutlined />}
                      style={{ fontWeight: 700, borderRadius: 6 }}
                    >
                      {role}
                    </Tag>
                  );
                },
              },
              {
                title: 'Giấy phép / Chứng nhận',
                dataIndex: 'license',
                key: 'license',
                render: (lic) => (
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                    {lic || 'FEI Transport Standard'}
                  </span>
                ),
              },
              {
                title: `Ngày nghỉ tháng này (${currentMonthLabel})`,
                key: 'offDaysCount',
                render: (_, record) => {
                  const crewOffs = offDaysMap[String(record.id)] || [];
                  const thisMonthOffs = crewOffs.filter((d) => dayjs(d).format('YYYY-MM') === currentMonthKey);
                  return (
                    <div>
                      <strong style={{ fontSize: 14, color: thisMonthOffs.length >= 2 ? '#D97706' : '#2563EB' }}>
                        {thisMonthOffs.length} / 2 ngày
                      </strong>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {thisMonthOffs.length >= 2 ? 'Đã dùng hết chỉ tiêu' : `Còn ${2 - thisMonthOffs.length} ngày`}
                      </div>
                    </div>
                  );
                },
              },
              {
                title: 'Lịch ngày nghỉ đã đăng ký',
                key: 'offDaysList',
                render: (_, record) => {
                  const crewOffs = offDaysMap[String(record.id)] || [];
                  if (crewOffs.length === 0) {
                    return <span style={{ color: '#94A3B8', fontSize: 12 }}>Chưa có ngày nghỉ nào</span>;
                  }
                  return (
                    <Flex wrap="wrap" gap={6}>
                      {crewOffs.map((d) => (
                        <Tag key={d} color="blue" style={{ borderRadius: 6, fontWeight: 600, fontSize: 11.5 }}>
                          📅 {dayjs(d).format('DD/MM/YYYY')}
                        </Tag>
                      ))}
                    </Flex>
                  );
                },
              },
              {
                title: 'Trạng thái hôm nay',
                key: 'todayStatus',
                render: (_, record) => {
                  const crewOffs = offDaysMap[String(record.id)] || [];
                  const isOffToday = crewOffs.includes(todayStr);
                  if (isOffToday) {
                    return (
                      <Tag color="error" style={{ fontWeight: 800, borderRadius: 6 }}>
                        🔴 ĐANG NGHỈ PHÉP
                      </Tag>
                    );
                  }
                  return (
                    <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontWeight: 800, borderRadius: 6 }}>
                      🟢 SẴN SÀNG ĐIỀU ĐỘNG
                    </Tag>
                  );
                },
              },
              {
                title: 'Thao tác',
                key: 'action',
                render: (_, record) => (
                  <Button
                    type="default"
                    size="small"
                    icon={<CalendarOutlined />}
                    onClick={() => handleOpenCrewLeaveModal(record)}
                    style={{ fontWeight: 700, borderRadius: 6, color: '#0F172A' }}
                  >
                    Quản lý ngày nghỉ
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* MODAL ĐIỀU CHỈNH NGÀY NGHỈ NHÂN SỰ DÀNH CHO COORDINATOR (ITEM 5) */}
      <Modal
        open={crewLeaveModalOpen}
        onCancel={() => setCrewLeaveModalOpen(false)}
        onOk={handleSaveCrewLeave}
        title={`Quản lý ngày nghỉ phép cho: ${managingCrew?.name || 'Nhân sự'}`}
        okText="Lưu thay đổi lịch nghỉ"
        cancelText="Đóng"
        okButtonProps={{ style: { backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 } }}
        width={560}
      >
        <div style={{ padding: '12px 0' }}>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
            message="Chính sách: Tối đa 2 ngày trong 1 tháng (Thứ 2 - Thứ 6)"
            description="Fleet Coordinator có quyền duyệt bổ sung hoặc hủy ngày nghỉ theo thỏa thuận điều vận thực tế."
          />

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="coordinator-crew-offdate-picker" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Thêm ngày nghỉ mới:
            </label>
            <Flex gap={8}>
              <DatePicker
                id="coordinator-crew-offdate-picker"
                placeholder="Chọn ngày nghỉ (Thứ 2 - Thứ 6)"
                value={selectedCrewDate}
                onChange={(d) => setSelectedCrewDate(d)}
                style={{ flex: 1 }}
                disabledDate={(current) => {
                  if (!current) return false;
                  const day = current.day();
                  return day === 0 || day === 6; // Chặn Thứ 7 & CN
                }}
              />
              <Button
                type="primary"
                onClick={handleAddCrewLeaveDate}
                style={{ backgroundColor: '#0F172A', borderColor: '#0F172A', fontWeight: 700 }}
              >
                + Thêm ngày nghỉ
              </Button>
            </Flex>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
              Danh sách ngày nghỉ đã phê duyệt ({pendingCrewDates.length} ngày):
            </span>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Tháng này: <strong>{pendingCrewDates.filter((d) => dayjs(d).format('YYYY-MM') === currentMonthKey).length}/2 ngày</strong>
            </span>
          </div>

          {pendingCrewDates.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, color: '#94A3B8', fontSize: 13 }}>
              Chưa có ngày nghỉ nào. Hãy chọn ngày ở trên và nhấn &quot;+ Thêm ngày nghỉ&quot;.
            </div>
          ) : (
            <Flex wrap="wrap" gap={8}>
              {pendingCrewDates.map((d) => (
                <Tag
                  key={d}
                  color="blue"
                  closable
                  onClose={() => handleRemoveCrewLeaveDate(d)}
                  style={{ fontSize: 13, padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}
                >
                  📅 {dayjs(d).format('dddd, DD/MM/YYYY')}
                </Tag>
              ))}
            </Flex>
          )}
        </div>
      </Modal>

      {/* MODAL ALT FLOW A: PROPOSE EXTERNAL CHARTER */}
      <Modal
        open={shortageModalOpen}
        onCancel={() => setShortageModalOpen(false)}
        onOk={handleSubmitExternalCharter}
        title="Propose External Charter Surcharge (Alt Flow A)"
        okText="Submit for Manager Approval"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0F172A', fontWeight: 700 } }}
      >
        <div style={{ padding: '12px 0' }}>
          <Paragraph>
            Vì không có xe chuyên dụng nội bộ sẵn sàng trong vòng 72 giờ, bạn có thể đề xuất hợp đồng thuê xe / chuyên cơ từ đối tác ngoài hãng.
          </Paragraph>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="charter-cost-input" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Dự toán phụ phí thuê ngoài (USD):
            </label>
            <Input
              id="charter-cost-input"
              type="number"
              value={charterCost}
              onChange={(e) => setCharterCost(Number(e.target.value))}
              prefix="$"
              size="large"
            />
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Yêu cầu này sẽ được gửi trực tiếp tới Logistics Manager để xem xét trước khi cam kết với đối tác.
          </Text>
        </div>
      </Modal>

      {/* MODAL ALT FLOW C: DRIVER CONFLICT RESOLUTION */}
      <Modal
        open={driverConflictModalOpen}
        onCancel={() => setDriverConflictModalOpen(false)}
        onOk={handleResolveDriverConflict}
        title="Driver Schedule Conflict Resolution (Alt Flow C)"
        okText="Confirm Replacement"
        cancelText="Cancel"
        okButtonProps={{ style: { backgroundColor: '#16A34A', borderColor: '#16A34A', fontWeight: 700 } }}
      >
        <div style={{ padding: '12px 0' }}>
          <Paragraph>
            Tài xế <strong>Nguyễn Văn Bình</strong> đang bị trùng lịch chạy xe trên chuyến #TRP-401 vào ngày 24/09/2026. Hãy chọn tài xế thay thế đủ điều kiện:
          </Paragraph>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="replacement-driver-select" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Chọn tài xế khả dụng:
            </label>
            <Select
              id="replacement-driver-select"
              value={selectedReplacementDriver}
              onChange={setSelectedReplacementDriver}
              size="large"
              style={{ width: '100%' }}
              options={[
                { value: 'Le Hoang Nam', label: 'Lê Hoàng Nam (License #VN-99201 • Nghỉ đủ 24h • Sẵn sàng)' },
                { value: 'Pham Van Duc', label: 'Phạm Văn Đức (License #VN-66321 • Standby • Sẵn sàng)' },
              ]}
            />
          </div>
          <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
            ✓ Tài xế được chọn đã hoàn thành bài kiểm tra an toàn FEI và không bị chồng chéo lịch trình.
          </Text>
        </div>
      </Modal>
    </div>
  );
}
