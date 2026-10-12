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
} from 'antd';
import {
  CarOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@routes/routes';
import {
  getStoredRoutePlans,
  getOrdersToPlan,
  getStoredFleet,
  getStoredPersonnel,
  updateStoredRoutePlan,
} from '@utils/routePlanStorage';

const { Title, Text, Paragraph } = Typography;

/**
 * Trang Fleet & Dispatch Operations Hub dành cho Fleet & Route Coordinator
 * Tái hiện 100% giao diện theo Figma Frame (Fleet & Route Coordinator Hub)
 */
export default function CoordinatorDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [ordersToPlan, setOrdersToPlan] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [refreshKey, setRefreshKey] = useState(0);

  // State cho Alt Flow A: Propose External Charter Modal
  const [shortageModalOpen, setShortageModalOpen] = useState(false);
  const [charterCost, setCharterCost] = useState(2500);

  // State cho Alt Flow C: Driver Conflict Resolution Modal
  const [driverConflictModalOpen, setDriverConflictModalOpen] = useState(false);
  const [selectedReplacementDriver, setSelectedReplacementDriver] = useState('Le Hoang Nam');

  useEffect(() => {
    setPlans(getStoredRoutePlans());
    setOrdersToPlan(getOrdersToPlan());

    const handleUpdate = () => {
      setPlans(getStoredRoutePlans());
      setOrdersToPlan(getOrdersToPlan());
    };

    window.addEventListener('plans_updated', handleUpdate);
    window.addEventListener('bookings_updated', handleUpdate);
    return () => {
      window.removeEventListener('plans_updated', handleUpdate);
      window.removeEventListener('bookings_updated', handleUpdate);
    };
  }, [refreshKey]);

  // Thống kê 4 ô chỉ số
  const fleetCount = 12; // 8 Horse Vans + 4 Air Stalls
  const ordersCount = ordersToPlan.length || 4;
  const pendingCount = plans.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const inTransitCount = plans.filter((p) => p.status === 'ASSIGNED' || p.status === 'InTransit').length || 5;

  // Lọc kế hoạch theo Tab
  const filteredPlans = useMemo(() => {
    if (activeTab === 'Pending') {
      return plans.filter((p) => p.status === 'PENDING_APPROVAL');
    }
    if (activeTab === 'Assigned') {
      return plans.filter((p) => p.status === 'ASSIGNED');
    }
    if (activeTab === 'Rejected') {
      return plans.filter((p) => p.status === 'REJECTED' || p.status === 'WAITING_VEHICLE');
    }
    return plans;
  }, [plans, activeTab]);

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

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', paddingBottom: 40 }}>
      {/* HEADER: FLEET & DISPATCH OPERATIONS HUB */}
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap="middle" style={{ marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: 28 }}>
            Fleet & Dispatch Operations Hub
          </Title>
          <Text style={{ color: '#64748B', fontSize: 14 }}>
            Plan multimodal routes, allocate vehicles & escorts, manage draft approvals and vehicle shortages
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
          + Create Route Plan
        </Button>
      </Flex>

      {/* 4 THẺ THỐNG KÊ TRÊN CÙNG (FIGMA COMPONENT) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
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
            onClick={() => setActiveTab('All')}
            style={{
              borderRadius: 18,
              border: '1px solid #E2E8F0',
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
              Incoming from Log. Manager
            </div>
          </Card>
        </Col>

        {/* Card 3: Pending Approval */}
        <Col xs={12} sm={6}>
          <Card
            bordered
            onClick={() => setActiveTab('Pending')}
            style={{ borderRadius: 18, border: '1px solid #E2E8F0', cursor: 'pointer', height: '100%' }}
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
            onClick={() => setActiveTab('Assigned')}
            style={{ borderRadius: 18, border: '1px solid #E2E8F0', cursor: 'pointer', height: '100%' }}
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

      {/* BỐ CỤC CHÍNH 2 CỘT: DANH SÁCH PLANS BÊN TRÁI + CÁC THẺ ALT FLOW BÊN PHẢI */}
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
                value={activeTab}
                onChange={setActiveTab}
                options={[
                  { label: 'All', value: 'All' },
                  { label: `Pending (${pendingCount})`, value: 'Pending' },
                  { label: `Assigned (${plans.filter((p) => p.status === 'ASSIGNED').length})`, value: 'Assigned' },
                  { label: 'Rejected/Hold', value: 'Rejected' },
                ]}
                style={{ backgroundColor: '#F1F5F9', padding: 3, borderRadius: 10 }}
              />
            </Flex>

            {/* DANH SÁCH ROUTE PLAN CARDS KHỚP FIGMA */}
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
                        <strong style={{ fontSize: 15, color: '#0F172A' }}>
                          {plan.originCode || 'SGN'} ({plan.transportMode}) → {plan.destinationCode || 'CDG'} ({plan.destination?.split('-')[1]?.trim() || 'France'})
                        </strong>
                      </Flex>

                      {isPending && (
                        <Tag color="gold" style={{ fontWeight: 800, borderRadius: 6, padding: '2px 10px' }}>
                          PENDING_APPROVAL
                        </Tag>
                      )}
                      {isAssigned && (
                        <Tag color="green" style={{ fontWeight: 800, borderRadius: 6, padding: '2px 10px' }}>
                          ASSIGNED
                        </Tag>
                      )}
                      {isRejected && (
                        <Tag color="red" style={{ fontWeight: 800, borderRadius: 6, padding: '2px 10px' }}>
                          REJECTED
                        </Tag>
                      )}
                      {isWaitingVehicle && (
                        <Tag color="orange" style={{ fontWeight: 800, borderRadius: 6, padding: '2px 10px' }}>
                          WAITING_VEHICLE
                        </Tag>
                      )}
                    </Flex>

                    {/* Dòng 2: Associated Order */}
                    <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
                      Associated Order: <strong>#{plan.orderCode}</strong> • {plan.customerName} •{' '}
                      {plan.totalHorses} Horse{plan.totalHorses > 1 ? 's' : ''} ({plan.horses?.join(', ')})
                    </div>

                    {/* Dòng 3: Tags chi tiết Carrier, Stall, Personnel */}
                    <Flex wrap="wrap" gap={8} style={{ marginBottom: 12 }}>
                      <Tag color="blue" style={{ borderRadius: 6 }}>
                        {plan.transportMode === 'Air' ? <RocketOutlined style={{ marginRight: 4 }} /> : <CarOutlined style={{ marginRight: 4 }} />}
                        {plan.vehicleType || plan.vehicleName}
                      </Tag>
                      <Tag color="default" style={{ borderRadius: 6, backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}>
                        📦 {plan.stalls || 'Stall #ST-04'}
                      </Tag>
                      {plan.vetEscortName && (
                        <Tag color="cyan" style={{ borderRadius: 6 }}>
                          <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                          Escort: {plan.vetEscortName}
                        </Tag>
                      )}
                      {plan.driverName && (
                        <Tag color="purple" style={{ borderRadius: 6 }}>
                          <UserOutlined style={{ marginRight: 4 }} />
                          Driver: {plan.driverName}
                        </Tag>
                      )}
                    </Flex>

                    {/* Dòng ghi chú rejected hoặc assigned */}
                    {isRejected && (
                      <div
                        style={{
                          backgroundColor: '#FEE2E2',
                          border: '1px solid #FECACA',
                          borderRadius: 10,
                          padding: '10px 14px',
                          marginBottom: 12,
                          fontSize: 12.5,
                          color: '#991B1B',
                        }}
                      >
                        <strong>Manager Note:</strong> &ldquo;{plan.managerNotes || plan.rejectionRemarks}&rdquo;
                      </div>
                    )}

                    {isAssigned && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', marginBottom: 10 }}>
                        ✓ Approved by Log. Manager • Dispatched to Driver App
                      </div>
                    )}

                    {/* Footer Thẻ: Dự toán chi phí + Nút tương tác */}
                    <Flex justify="space-between" align="center" style={{ borderTop: '1px dashed #E2E8F0', paddingTop: 10, marginTop: 6 }}>
                      <div style={{ fontSize: 13, color: '#64748B' }}>
                        Est. Cost: <strong style={{ color: '#0F172A', fontSize: 15 }}>${Number(plan.estimatedCost || 0).toLocaleString()}</strong>{' '}
                        (Fuel, Layover, Vet, Fees)
                      </div>

                      {isPending && (
                        <Button
                          type="link"
                          onClick={() => navigate(`/coordinator/route-planning?planId=${plan.planId}`)}
                          style={{ fontWeight: 700, color: '#D97706', padding: 0 }}
                        >
                          View Details →
                        </Button>
                      )}

                      {isRejected && (
                        <Button
                          type="primary"
                          danger
                          size="small"
                          onClick={() => navigate(`/coordinator/route-planning?planId=${plan.planId}`)}
                          style={{ fontWeight: 700, borderRadius: 6 }}
                        >
                          Edit Plan & Resubmit &gt;
                        </Button>
                      )}

                      {isAssigned && (
                        <Button
                          type="default"
                          size="small"
                          onClick={() => navigate(ROUTES.DRIVER_DASHBOARD)}
                          style={{ fontWeight: 600, borderRadius: 6, color: '#16A34A', borderColor: '#86EFAC' }}
                        >
                          View in Driver App →
                        </Button>
                      )}
                    </Flex>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>

        {/* CỘT PHẢI: CÁC THẺ ALT FLOW A (SHORTAGE) & ALT FLOW C (CONFLICT) KHỚP FIGMA */}
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
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Dự toán phụ phí thuê ngoài (USD):
            </label>
            <Input
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
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
              Chọn tài xế khả dụng:
            </label>
            <Select
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
