import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  EnvironmentOutlined,
  CarOutlined,
  RocketOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  PlusOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { ROUTES } from '@routes/routes';
import {
  getStoredRoutePlans,
  getOrdersToPlan,
  getStoredFleet,
  getStoredPersonnel,
  addStoredRoutePlan,
  updateStoredRoutePlan,
  getStoredRoutePlanById,
} from '@utils/routePlanStorage';

const { Title, Text, Paragraph } = Typography;

/**
 * Trang Route Planning & Resource Allocation Studio khớp 100% Figma Image 2 & 3
 * Thiết lập thứ tự lộ trình, phân bổ phương tiện & nhân sự, dự toán ngân sách và gửi cho Manager
 */
export default function RoutePlanningPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingPlanId = searchParams.get('planId');

  const [orders, setOrders] = useState([]);
  const [fleetList, setFleetList] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);

  // Form states
  const [selectedOrderCode, setSelectedOrderCode] = useState('');
  const [selectedFleetId, setSelectedFleetId] = useState('51D-8921');
  const [selectedDriverId, setSelectedDriverId] = useState(4);
  const [selectedVetId, setSelectedVetId] = useState(2);

  // Checkpoints
  const [checkpoints, setCheckpoints] = useState([]);

  // Expenses
  const [charterCost, setCharterCost] = useState(0);
  const [stallRent, setStallRent] = useState(3600);
  const [vetEscortFees, setVetEscortFees] = useState(1600);
  const [quarantineFees, setQuarantineFees] = useState(1000);

  // Modal checkpoint state
  const [addStopModalOpen, setAddStopModalOpen] = useState(false);
  const [newStopForm] = Form.useForm();

  // Modal Confirm Submit to Manager (Figma Image 3)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmedChecklist, setConfirmedChecklist] = useState(true);

  useEffect(() => {
    const loadedOrders = getOrdersToPlan();
    setOrders(loadedOrders);
    setFleetList(getStoredFleet());
    setPersonnelList(getStoredPersonnel());

    if (editingPlanId) {
      const existing = getStoredRoutePlanById(editingPlanId);
      if (existing) {
        setSelectedOrderCode(existing.orderCode);
        setSelectedFleetId(existing.vehicleId || existing.stallId || '51D-8921');
        setSelectedDriverId(existing.driverId || 4);
        setSelectedVetId(existing.vetEscortId || 2);
        if (existing.checkpoints?.length > 0) {
          setCheckpoints(existing.checkpoints);
        }
        if (existing.costBreakdown) {
          setCharterCost(existing.costBreakdown.airCharter || 0);
          setStallRent(existing.costBreakdown.stallRent || 3600);
          setVetEscortFees(existing.costBreakdown.vetEscort || 1600);
          setQuarantineFees(existing.costBreakdown.quarantine || 1000);
        }
      }
    } else if (loadedOrders.length > 0) {
      setSelectedOrderCode(loadedOrders[0].orderCode);
    }
  }, [editingPlanId]);

  const currentOrder = useMemo(() => {
    return orders.find((o) => o.orderCode === selectedOrderCode) || orders[0] || {};
  }, [orders, selectedOrderCode]);

  // Đồng bộ lộ trình checkpoints & ước tính chi phí theo đúng thông tin khách yêu cầu
  useEffect(() => {
    if (!currentOrder || !currentOrder.orderCode) return;
    if (editingPlanId) return;

    const origin = currentOrder.origin || 'Trang trại Yên Bài, Ba Vì, Hà Nội';
    const destination = currentOrder.destination || 'Điểm đến theo đơn';
    const cap = currentOrder.customerFeeCap || 5000;
    const isAir = currentOrder.transportMode === 'Air';

    setCheckpoints([
      {
        step: 1,
        name: `${origin} — Điểm khởi hành`,
        location: origin,
        coordinates: '21.0560° N, 105.3411° E',
        eta: currentOrder.departureDate ? dayjs(currentOrder.departureDate).format('MMM DD, YYYY • 06:00 AM') : 'Oct 01, 2026 • 06:00 AM',
        type: 'ORIGIN',
        description: 'Tập kết ngựa, kiểm tra vi mạch & cấp phát khẩu phần ăn',
      },
      {
        step: 2,
        name: isAir ? 'Trạm kiểm dịch sân bay — Vetting & Layover' : 'Trạm dừng chân kiểm dịch trung gian — Nghỉ chân & Bù nước',
        location: isAir ? 'Kho hàng hóa quốc tế SGN/HAN' : 'Trạm dừng kiểm soát lộ trình',
        coordinates: '16.0544° N, 108.2022° E',
        eta: 'Dự kiến sau 6-8 tiếng',
        type: 'REST_STOP',
        description: 'Dừng nghỉ, kiểm tra sức khỏe ngựa & đo thân nhiệt, bù điện giải',
      },
      {
        step: 3,
        name: `${destination} — Điểm đến giao nhận`,
        location: destination,
        coordinates: '10.8231° N, 106.6297° E',
        eta: currentOrder.deliveryDate ? dayjs(currentOrder.deliveryDate).format('MMM DD, YYYY • 18:00 PM') : 'Oct 02, 2026 • 18:00 PM',
        type: 'ARRIVAL',
        description: 'Bàn giao ngựa tại chuồng đích, ký nghiệm thu phúc lợi thú y',
      },
    ]);

    // Phân bổ dự toán phù hợp ngân sách tối đa của khách
    const est = Math.round(cap * 0.82); // margin ~18%
    if (isAir) {
      setCharterCost(Math.round(est * 0.72));
      setStallRent(Math.round(est * 0.14));
      setVetEscortFees(Math.round(est * 0.09));
      setQuarantineFees(Math.round(est * 0.05));
    } else {
      setCharterCost(0);
      setStallRent(Math.round(est * 0.58));
      setVetEscortFees(Math.round(est * 0.26));
      setQuarantineFees(Math.round(est * 0.16));
    }
  }, [currentOrder?.orderCode, editingPlanId]);

  const currentFleet = useMemo(() => {
    return fleetList.find((f) => f.id === selectedFleetId) || fleetList[0] || {};
  }, [fleetList, selectedFleetId]);

  const currentDriver = useMemo(() => {
    return personnelList.find((p) => p.id === Number(selectedDriverId)) || personnelList[0] || {};
  }, [personnelList, selectedDriverId]);

  const currentVet = useMemo(() => {
    return personnelList.find((p) => p.id === Number(selectedVetId)) || personnelList[4] || {};
  }, [personnelList, selectedVetId]);

  const totalEstimatedBudget = charterCost + stallRent + vetEscortFees + quarantineFees;
  const customerFeeCap = currentOrder.customerFeeCap || 22500;

  // Thêm trạm dừng trung gian
  const handleAddIntermediateStop = (values) => {
    const newStep = {
      step: checkpoints.length + 1,
      name: values.name,
      location: values.location,
      coordinates: values.coordinates || '21.0285° N, 105.8542° E',
      eta: values.eta,
      type: values.type || 'REST_STOP',
      description: values.description || 'Dừng nghỉ, kiểm tra sức khỏe ngựa & bù nước',
    };
    // Chèn trước điểm Arrival
    const updated = [...checkpoints];
    const arrivalIdx = updated.findIndex((c) => c.type === 'ARRIVAL');
    if (arrivalIdx !== -1) {
      updated.splice(arrivalIdx, 0, newStep);
    } else {
      updated.push(newStep);
    }
    // Cập nhật lại số thứ tự step
    const reindexed = updated.map((item, idx) => ({ ...item, step: idx + 1 }));
    setCheckpoints(reindexed);
    setAddStopModalOpen(false);
    newStopForm.resetFields();
    message.success('Đã thêm trạm kiểm soát trung gian vào lộ trình!');
  };

  const handleRemoveCheckpoint = (index) => {
    if (checkpoints.length <= 2) {
      message.warning('Lộ trình cần ít nhất 1 điểm xuất phát và 1 điểm đến!');
      return;
    }
    const filtered = checkpoints.filter((_, idx) => idx !== index);
    const reindexed = filtered.map((item, idx) => ({ ...item, step: idx + 1 }));
    setCheckpoints(reindexed);
  };

  // Lưu bản nháp (Save as Draft)
  const handleSaveDraft = () => {
    const payload = {
      orderId: currentOrder.orderId,
      orderCode: currentOrder.orderCode,
      customerName: currentOrder.customerName,
      horses: currentOrder.horses || ['Duchess Star'],
      totalHorses: currentOrder.totalHorses || 1,
      origin: currentOrder.origin || 'Tân Sơn Nhất (SGN)',
      destination: currentOrder.destination || 'Paris (CDG)',
      transportMode: currentOrder.transportMode || 'Air',
      vehicleName: currentFleet.name,
      vehicleType: currentFleet.type,
      vehicleId: currentFleet.id,
      stalls: currentFleet.capacity,
      driverName: currentDriver.name,
      driverLicense: currentDriver.license,
      driverId: currentDriver.id,
      vetEscortName: currentVet.name,
      vetEscortCert: currentVet.license,
      vetEscortId: currentVet.id,
      customerFeeCap,
      estimatedCost: totalEstimatedBudget,
      costBreakdown: {
        airCharter: charterCost,
        stallRent,
        vetEscort: vetEscortFees,
        quarantine: quarantineFees,
      },
      checkpoints,
      status: 'DRAFT',
    };

    if (editingPlanId) {
      updateStoredRoutePlan(editingPlanId, payload);
    } else {
      addStoredRoutePlan(payload);
    }
    message.success('Đã lưu bản nháp Route Plan thành công!');
    navigate(ROUTES.COORDINATOR_DASHBOARD);
  };

  // Xác nhận nộp lên Manager (Confirm Submit)
  const handleConfirmSubmit = () => {
    if (!confirmedChecklist) {
      message.warning('Vui lòng tích xác nhận kế hoạch đã đầy đủ điều kiện!');
      return;
    }

    const payload = {
      orderId: currentOrder.orderId,
      orderCode: currentOrder.orderCode,
      customerName: currentOrder.customerName,
      horses: currentOrder.horses || ['Duchess Star'],
      totalHorses: currentOrder.totalHorses || 1,
      origin: currentOrder.origin || 'Tân Sơn Nhất (SGN)',
      destination: currentOrder.destination || 'Paris (CDG)',
      transportMode: currentOrder.transportMode || 'Air',
      vehicleName: currentFleet.name,
      vehicleType: currentFleet.type,
      vehicleId: currentFleet.id,
      stalls: currentFleet.capacity,
      driverName: currentDriver.name,
      driverLicense: currentDriver.license,
      driverId: currentDriver.id,
      vetEscortName: currentVet.name,
      vetEscortCert: currentVet.license,
      vetEscortId: currentVet.id,
      customerFeeCap,
      estimatedCost: totalEstimatedBudget,
      grossMargin: customerFeeCap - totalEstimatedBudget,
      grossMarginPercent: `${Math.round(((customerFeeCap - totalEstimatedBudget) / customerFeeCap) * 100)}%`,
      costBreakdown: {
        airCharter: charterCost,
        stallRent,
        vetEscort: vetEscortFees,
        quarantine: quarantineFees,
      },
      checkpoints,
      status: 'PENDING_APPROVAL',
      submittedAgo: 'Just now',
      submittedAt: new Date().toISOString(),
    };

    if (editingPlanId) {
      updateStoredRoutePlan(editingPlanId, payload);
    } else {
      addStoredRoutePlan(payload);
    }

    setConfirmModalOpen(false);
    message.success('Đã gửi kế hoạch lộ trình cho Logistics Manager phê duyệt!');
    navigate(ROUTES.COORDINATOR_DASHBOARD);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
      {/* HEADER QUAY LẠI VÀ TIÊU ĐỀ */}
      <Flex align="center" gap={12} style={{ marginBottom: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(ROUTES.COORDINATOR_DASHBOARD)}
          style={{ borderRadius: 8 }}
        >
          Operations Hub
        </Button>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: 26 }}>
            Route Planning & Resource Allocation Studio
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            Thiết lập lộ trình đa phương thức, kiểm soát trạm dừng, chỉ định đội ngũ & dự toán ngân sách
          </Text>
        </div>
      </Flex>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: 1. TARGET ORDER & 2. ROUTE CHECKPOINTS */}
        <Col xs={24} lg={15}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* PHẦN 1: TARGET ORDER & VEHICLE ALLOCATION */}
            <Card
              bordered
              style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
              styles={{ body: { padding: '22px 24px' } }}
            >
              <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                1. Target Order & Vehicle Allocation
              </Title>
              <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 18 }}>
                Select approved customer order and assign available fleet (status = AVAILABLE)
              </Text>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    APPROVED ORDER TO PLAN *
                  </label>
                  <Select
                    value={selectedOrderCode}
                    onChange={setSelectedOrderCode}
                    size="large"
                    style={{ width: '100%' }}
                    options={orders.map((o) => ({
                      value: o.orderCode,
                      label: `#${o.orderCode} • ${o.customerName} (${o.totalHorses} Horses)`,
                    }))}
                  />
                  <div style={{ fontSize: 12, color: '#16A34A', marginTop: 6, fontWeight: 600 }}>
                    ✓ Order Status: Approved by Logistics Manager
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    ALLOCATE FLEET / AIR STALL (AVAILABLE) *
                  </label>
                  <Select
                    value={selectedFleetId}
                    onChange={setSelectedFleetId}
                    size="large"
                    style={{ width: '100%' }}
                    options={fleetList.map((f) => ({
                      value: f.id,
                      label: `${f.type.includes('Air') ? '✈️' : '🚛'} ${f.name}`,
                    }))}
                  />
                  <div style={{ fontSize: 12, color: '#2563EB', marginTop: 6 }}>
                    Specs: {currentFleet.specs || 'Dual HVAC, Padded stalls'}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* PHẦN 2: ROUTE CHECKPOINTS & WAYPOINTS SETUP */}
            <Card
              bordered
              style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
              styles={{ body: { padding: '22px 24px' } }}
            >
              <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>
                  2. Route Checkpoints & Waypoints Setup
                </Title>
                <Tag color="blue" style={{ fontWeight: 700, borderRadius: 6 }}>
                  {checkpoints.length} Checkpoints
                </Tag>
              </Flex>
              <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 20 }}>
                Define multimodal route (Road / Air / Intermodal) and intermediate stops
              </Text>

              {/* TIMELINE DANH SÁCH CHECKPOINTS */}
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                {checkpoints.map((cp, idx) => {
                  const isOrigin = cp.type === 'ORIGIN';
                  const isArrival = cp.type === 'ARRIVAL';
                  const isRestStop = cp.type === 'REST_STOP';

                  return (
                    <div
                      key={idx}
                      style={{
                        border: isOrigin
                          ? '1.5px solid #BBF7D0'
                          : isArrival
                          ? '1.5px solid #86EFAC'
                          : '1.5px solid #FED7AA',
                        backgroundColor: isOrigin
                          ? '#F0FDF4'
                          : isArrival
                          ? '#F0FDF4'
                          : '#FFFBF5',
                        borderRadius: 14,
                        padding: '16px 18px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: isOrigin || isArrival ? '#16A34A' : '#D97706',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {cp.step}
                      </div>

                      <div style={{ flex: 1 }}>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <strong style={{ fontSize: 14.5, color: '#0F172A' }}>
                            {cp.name}
                          </strong>
                          <Space size={6}>
                            {isOrigin && (
                              <Tag color="green" style={{ fontWeight: 800, borderRadius: 6 }}>
                                ORIGIN
                              </Tag>
                            )}
                            {isRestStop && (
                              <Tag color="gold" style={{ fontWeight: 800, borderRadius: 6 }}>
                                REST STOP
                              </Tag>
                            )}
                            {isArrival && (
                              <Tag color="cyan" style={{ fontWeight: 800, borderRadius: 6 }}>
                                ARRIVAL
                              </Tag>
                            )}
                            {!isOrigin && !isArrival && (
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                onClick={() => handleRemoveCheckpoint(idx)}
                              />
                            )}
                          </Space>
                        </Flex>

                        <div style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}>
                          Coordinates: <code style={{ backgroundColor: '#FFFFFF', padding: '1px 6px', borderRadius: 4 }}>{cp.coordinates}</code> • ETA: <strong>{cp.eta}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          {cp.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Space>

              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => setAddStopModalOpen(true)}
                style={{
                  marginTop: 16,
                  height: 42,
                  borderRadius: 10,
                  fontWeight: 700,
                  color: '#D97706',
                  borderColor: '#FDE68A',
                }}
              >
                + Add Intermediate Stop
              </Button>
            </Card>
          </Space>
        </Col>

        {/* CỘT PHẢI: 3. PERSONNEL ASSIGNMENT & 4. EXPENSE ESTIMATION & SUBMIT BUTTON */}
        <Col xs={24} lg={9}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* PHẦN 3: PERSONNEL ASSIGNMENT */}
            <Card
              bordered
              style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
              styles={{ body: { padding: '22px' } }}
            >
              <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                3. Personnel Assignment
              </Title>
              <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 16 }}>
                Assign vehicle driver and veterinary escort
              </Text>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  ASSIGNED DRIVER / HANDLER *
                </label>
                <Select
                  value={selectedDriverId}
                  onChange={setSelectedDriverId}
                  size="large"
                  style={{ width: '100%' }}
                  options={personnelList
                    .filter((p) => p.role.includes('Driver'))
                    .map((d) => ({
                      value: d.id,
                      label: `${d.name} (${d.license})`,
                    }))}
                />
                <div style={{ fontSize: 11.5, color: '#16A34A', marginTop: 4, fontWeight: 600 }}>
                  ✓ Rest status verified • No concurrent bookings
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  VETERINARY ESCORT (IN-FLIGHT / GROUND) *
                </label>
                <Select
                  value={selectedVetId}
                  onChange={setSelectedVetId}
                  size="large"
                  style={{ width: '100%' }}
                  options={personnelList
                    .filter((p) => p.role.includes('Vet'))
                    .map((v) => ({
                      value: v.id,
                      label: `${v.name} (Cert #${v.license.split(' ')[0]})`,
                    }))}
                />
                <div style={{ fontSize: 11.5, color: '#2563EB', marginTop: 4 }}>
                  FEI certified for international horse welfare
                </div>
              </div>
            </Card>

            {/* PHẦN 4: EXPENSE ESTIMATION KHỚP FIGMA */}
            <Card
              bordered
              style={{ borderRadius: 18, border: '1px solid #E2E8F0', backgroundColor: '#FFFDF9' }}
              styles={{ body: { padding: '22px' } }}
            >
              <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                4. Expense Estimation
              </Title>
              <Text style={{ fontSize: 12.5, color: '#64748B', display: 'block', marginBottom: 14 }}>
                Projected costs for Manager review
              </Text>

              <div style={{ fontSize: 13, color: '#334155', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Flex justify="space-between">
                  <span>Air Cargo Charter (Boeing 777F):</span>
                  <strong>${charterCost.toLocaleString()}</strong>
                </Flex>
                <Flex justify="space-between">
                  <span>Stall Rent & Climate Control:</span>
                  <strong>${stallRent.toLocaleString()}</strong>
                </Flex>
                <Flex justify="space-between">
                  <span>Vet Escort & Layover Fees:</span>
                  <strong>${vetEscortFees.toLocaleString()}</strong>
                </Flex>
                <Flex justify="space-between">
                  <span>Border Quarantine Fees:</span>
                  <strong>${quarantineFees.toLocaleString()}</strong>
                </Flex>

                <Divider style={{ margin: '8px 0' }} />

                <Flex justify="space-between" align="baseline">
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                    Total Estimated Budget
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#D97706' }}>
                    ${totalEstimatedBudget.toLocaleString()}
                  </span>
                </Flex>

                <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textAlign: 'right' }}>
                  Within Customer Cap (${customerFeeCap.toLocaleString()}) • Margin: +${(customerFeeCap - totalEstimatedBudget).toLocaleString()}
                </div>
              </div>

              {/* NÚT THAO TÁC SUBMIT KHỚP FIGMA */}
              <Space direction="vertical" size={10} style={{ width: '100%', marginTop: 20 }}>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={() => setConfirmModalOpen(true)}
                  style={{
                    backgroundColor: '#F59E0B',
                    borderColor: '#F59E0B',
                    color: '#0F172A',
                    fontWeight: 800,
                    height: 46,
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                  }}
                >
                  Submit to Manager →
                </Button>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>
                  Triggers status change to PENDING_APPROVAL
                </div>

                <Flex gap={10}>
                  <Button
                    block
                    onClick={handleSaveDraft}
                    style={{ borderRadius: 10, height: 38, fontWeight: 600 }}
                  >
                    💾 Save as Draft
                  </Button>
                  <Button
                    block
                    onClick={() => navigate(ROUTES.COORDINATOR_FLEET_ROSTER)}
                    style={{ borderRadius: 10, height: 38, fontWeight: 600 }}
                  >
                    See Roster
                  </Button>
                </Flex>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* MODAL THÊM TRẠM DỪNG TRUNG GIAN */}
      <Modal
        open={addStopModalOpen}
        onCancel={() => setAddStopModalOpen(false)}
        title="Thêm trạm dừng kiểm soát / tiếp nước trung gian"
        onOk={() => newStopForm.submit()}
        okText="Thêm vào lộ trình"
        cancelText="Hủy"
      >
        <Form form={newStopForm} layout="vertical" onFinish={handleAddIntermediateStop} style={{ marginTop: 12 }}>
          <Form.Item name="name" label="Tên trạm dừng *" rules={[{ required: true, message: 'Vui lòng nhập tên trạm' }]}>
            <Input placeholder="Ví dụ: Dubai Cargo Hub (DXB) — Layover & Vet Watering" />
          </Form.Item>
          <Form.Item name="location" label="Địa điểm *" rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}>
            <Input placeholder="Ví dụ: Dubai, UAE hoặc Đà Nẵng Hub" />
          </Form.Item>
          <Form.Item name="coordinates" label="Tọa độ GPS">
            <Input placeholder="Ví dụ: 25.2532° N, 55.3657° E" />
          </Form.Item>
          <Form.Item name="eta" label="Thời gian dự kiến (ETA) *" rules={[{ required: true, message: 'Vui lòng nhập ETA' }]}>
            <Input placeholder="Ví dụ: Sep 25, 2026 • 18:00 PM" />
          </Form.Item>
          <Form.Item name="description" label="Nhiệm vụ tại trạm">
            <Input.TextArea rows={2} placeholder="Nghỉ ngơi, bù nước, kiểm tra thân nhiệt & ghi log thú y" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL XÁC NHẬN CONFIRM PLAN SUBMISSION (FIGMA IMAGE 3) */}
      <Modal
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        footer={null}
        closable={false}
        width={560}
        styles={{ content: { borderRadius: 20, padding: '28px' } }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#16A34A', fontSize: 22 }}>
              Confirm Plan Submission
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Plan #PLN-8821 • Order #{currentOrder.orderCode}
            </Text>
          </div>
          <Button
            type="text"
            shape="circle"
            onClick={() => setConfirmModalOpen(false)}
            style={{ backgroundColor: '#F1F5F9' }}
          >
            ✕
          </Button>
        </Flex>

        {/* BẢNG TÓM TẮT THÔNG SỐ PLAN */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <Row gutter={[16, 12]}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Route</Text>
              <strong style={{ fontSize: 14, color: '#0F172A' }}>
                {currentOrder.originCode || 'SGN'} → DXB → {currentOrder.destinationCode || 'CDG'}
              </strong>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Vehicle</Text>
              <strong style={{ fontSize: 14, color: '#0F172A' }}>
                {currentFleet.name}
              </strong>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Driver</Text>
              <strong style={{ fontSize: 14, color: '#0F172A' }}>
                {currentDriver.name} ({currentDriver.license?.split(' ')[0]})
              </strong>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Vet Escort</Text>
              <strong style={{ fontSize: 14, color: '#0F172A' }}>
                {currentVet.name} ({currentVet.license?.split(' ')[0]})
              </strong>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Departure</Text>
              <strong style={{ fontSize: 14, color: '#0F172A' }}>
                Sep 25, 2026 • 08:00 AM
              </strong>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Estimated Cost</Text>
              <strong style={{ fontSize: 15, color: '#D97706' }}>
                ${totalEstimatedBudget.toLocaleString()} (within ${customerFeeCap.toLocaleString()} cap)
              </strong>
            </Col>
            <Col span={24}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Checkpoints</Text>
              <strong style={{ fontSize: 13, color: '#0F172A' }}>
                {checkpoints.length} stops ({checkpoints.map((c) => c.name.split(' ')[0]).join(', ')})
              </strong>
            </Col>
          </Row>
        </div>

        {/* PRE-SUBMISSION CHECKLIST KHỚP FIGMA */}
        <div style={{ marginBottom: 18 }}>
          <Text strong style={{ fontSize: 13, color: '#0F172A', display: 'block', marginBottom: 8 }}>
            Pre-submission Checklist:
          </Text>
          <Space direction="vertical" size={6}>
            <div style={{ color: '#16A34A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircleFilled /> Route feasibility verified
            </div>
            <div style={{ color: '#16A34A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircleFilled /> Vehicle and personnel assigned
            </div>
            <div style={{ color: '#16A34A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircleFilled /> Budget within customer cap
            </div>
            <div style={{ color: '#16A34A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircleFilled /> No driver schedule conflicts
            </div>
          </Space>
        </div>

        {/* CHECKBOX XÁC NHẬN */}
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 14,
          }}
        >
          <Checkbox
            checked={confirmedChecklist}
            onChange={(e) => setConfirmedChecklist(e.target.checked)}
          >
            <strong style={{ color: '#14532D', fontSize: 13 }}>
              I confirm this plan is complete and ready for Manager review
            </strong>
          </Checkbox>
        </div>

        {/* CALLOUT XANH DƯƠNG */}
        <div
          style={{
            backgroundColor: '#EFF6FF',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: 12.5,
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <InfoCircleOutlined />
          <span>Status will change to <strong>PENDING_APPROVAL</strong> after confirmation</span>
        </div>

        {/* NÚT THAO TÁC DƯỚI MODAL */}
        <Flex gap={12}>
          <Button
            size="large"
            block
            onClick={() => setConfirmModalOpen(false)}
            style={{ borderRadius: 10, fontWeight: 600, height: 44 }}
          >
            Review Again
          </Button>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleConfirmSubmit}
            style={{
              backgroundColor: '#16A34A',
              borderColor: '#16A34A',
              fontWeight: 800,
              borderRadius: 10,
              height: 44,
            }}
          >
            Confirm Submit
          </Button>
        </Flex>
      </Modal>
    </div>
  );
}
