import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Flex,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleFilled,
  RocketOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@routes/routes';
import {
  getStoredRoutePlans,
  approveRoutePlan,
  rejectRoutePlan,
} from '@utils/routePlanStorage';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Trang Logistic Manager: Route Approvals (Transport Plan Review & Official Dispatch)
 * Tái hiện 100% Figma Image 5 (Logistic Manager_Route manager)
 */
export default function RouteApprovalsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [plans, setPlans] = useState(() => getStoredRoutePlans());
  const paramCode = searchParams.get('planCode');
  const [selectedPlanCodeState, setSelectedPlanCodeState] = useState(() => {
    const loadedPlans = getStoredRoutePlans();
    return loadedPlans.find((p) => p.status === 'PENDING_APPROVAL')?.planCode || loadedPlans[0]?.planCode || '';
  });
  const selectedPlanCode = paramCode || selectedPlanCodeState;
  const [, setRefreshKey] = useState(0);

  // State cho Modal từ chối (Reject Plan Modal)
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState(['Route not feasible (checkpoints/timing)']);
  const [rejectRemarks, setRejectRemarks] = useState(
    'Rest stop interval too long (>8 hrs). Add intermediate vet station.',
  );
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setPlans(getStoredRoutePlans());
    };
    window.addEventListener('plans_updated', handleUpdate);
    return () => window.removeEventListener('plans_updated', handleUpdate);
  }, []);

  const activePlan = useMemo(() => {
    return (
      plans.find(
        (p) =>
          p.planCode === selectedPlanCode ||
          p.planCode === `#${selectedPlanCode}` ||
          String(p.planId) === String(selectedPlanCode),
      ) || plans[0] || {}
    );
  }, [plans, selectedPlanCode]);

  // Phê duyệt kế hoạch lộ trình (Approve & Officially Assign)
  const handleApprovePlan = () => {
    setActionLoading(true);
    setTimeout(() => {
      approveRoutePlan(activePlan.planId || activePlan.planCode, {
        reviewerName: 'Trần Quốc Bảo (Logistics Manager)',
        managerNotes: 'Approved by Log. Manager • Dispatched to Driver App',
      });
      setActionLoading(false);
      message.success(
        `✓ Đã phê duyệt kế hoạch #${activePlan.planCode}! Lộ trình đã được giao chính thức cho Tài xế (${activePlan.driverName}) & Bác sĩ thú y (${activePlan.vetEscortName}).`,
      );
      setRefreshKey((k) => k + 1);
    }, 400);
  };

  // Từ chối kế hoạch (Reject Plan)
  const handleConfirmReject = () => {
    if (selectedReasons.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 lý do từ chối!');
      return;
    }
    setActionLoading(true);
    setTimeout(() => {
      rejectRoutePlan(activePlan.planId || activePlan.planCode, {
        reason: selectedReasons.join(', '),
        remarks: rejectRemarks,
      });
      setActionLoading(false);
      setRejectModalOpen(false);
      message.info(
        `Đã từ chối kế hoạch #${activePlan.planCode} và gửi thông báo yêu cầu điều chỉnh lại tới Fleet Coordinator!`,
      );
      setRefreshKey((k) => k + 1);
    }, 400);
  };

  const isPending = activePlan.status === 'PENDING_APPROVAL';
  const isAssigned = activePlan.status === 'ASSIGNED';
  const isRejected = activePlan.status === 'REJECTED';

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', paddingBottom: 40 }}>
      {/* THANH SELECTOR CHỌN PLAN */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: 28 }}>
            Transport Plan Review & Official Dispatch
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13.5 }}>
            Step 7 (Flow 3): Review proposed multimodal routes, audit expenses, detect driver collisions, and grant ASSIGNED status
          </Text>
        </div>

        <Space>
          <Text strong style={{ fontSize: 13, color: '#334155' }}>Chọn kế hoạch xem xét:</Text>
          <Select
            value={activePlan.planCode}
            onChange={(val) => {
              setSelectedPlanCodeState(val);
              setSearchParams({ planCode: val });
            }}
            style={{ width: 280 }}
            options={plans.map((p) => ({
              value: p.planCode,
              label: (
                <Flex justify="space-between" align="center">
                  <span>#{p.planCode} ({p.originCode || 'SGN'} → {p.destinationCode || 'CDG'})</span>
                  <Tag
                    color={
                      p.status === 'ASSIGNED'
                        ? 'green'
                        : p.status === 'PENDING_APPROVAL'
                        ? 'gold'
                        : 'red'
                    }
                    style={{ fontSize: 11, margin: 0 }}
                  >
                    {p.status}
                  </Tag>
                </Flex>
              ),
            }))}
          />
        </Space>
      </Flex>

      {/* HEADER META CARD KHỚP FIGMA */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '16px 22px',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="small">
          <Flex align="center" gap={12} wrap="wrap">
            <strong style={{ fontSize: 16, color: '#0F172A', fontFamily: 'monospace' }}>
              Plan #{activePlan.planCode}
            </strong>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <Text style={{ fontSize: 13.5, color: '#475569' }}>
              Submitted by: <strong>{activePlan.submittedBy || 'Fleet Coordinator IET'}</strong>
            </Text>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <Text style={{ fontSize: 13.5, color: '#475569' }}>
              Order: <strong>#{activePlan.orderCode}</strong> • {activePlan.customerName} ({activePlan.totalHorses} Horses: {activePlan.horses?.join(' & ')})
            </Text>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <Text style={{ fontSize: 12.5, color: '#94A3B8' }}>
              Submitted: {activePlan.submittedAgo || '4 hrs ago'}
            </Text>
          </Flex>

          <Space>
            {isPending && (
              <Tag color="gold" style={{ fontWeight: 800, padding: '4px 14px', borderRadius: 8, fontSize: 13 }}>
                PENDING_APPROVAL
              </Tag>
            )}
            {isAssigned && (
              <Tag color="green" style={{ fontWeight: 800, padding: '4px 14px', borderRadius: 8, fontSize: 13 }}>
                ASSIGNED
              </Tag>
            )}
            {isRejected && (
              <Tag color="red" style={{ fontWeight: 800, padding: '4px 14px', borderRadius: 8, fontSize: 13 }}>
                REJECTED
              </Tag>
            )}
          </Space>
        </Flex>
      </div>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI: 1. MULTIMODAL ROUTE & 2. BUDGET & EXPENSE AUDIT */}
        <Col xs={24} lg={15}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* PHẦN 1: MULTIMODAL ROUTE & CARRIER INSPECTION */}
            <Card
              bordered
              style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
              styles={{ body: { padding: '24px' } }}
            >
              <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                1. Multimodal Route & Carrier Inspection
              </Title>
              <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 18 }}>
                Verify air carrier slot, stall safety certifications, and rest stop intervals
              </Text>

              {/* KHỐI PHƯƠNG TIỆN / CHUYÊN CƠ */}
              <div
                style={{
                  backgroundColor: '#FFFDF5',
                  border: '1.5px solid #FDE68A',
                  borderRadius: 14,
                  padding: '16px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Flex align="center" gap={14}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      backgroundColor: '#FEF3C7',
                      color: '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                    }}
                  >
                    {activePlan.transportMode === 'Air' ? <RocketOutlined /> : <CarOutlined />}
                  </div>
                  <div>
                    <strong style={{ fontSize: 16, color: '#0F172A' }}>
                      {activePlan.vehicleName || 'Boeing 777F Cargo Charter • Air France Cargo'}
                    </strong>
                    <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                      Allocated Stall: {activePlan.stalls || 'AirBox #ST-04 (Twin-Bay Partition, Dual HVAC 18°C)'}
                    </div>
                  </div>
                </Flex>

                <Tag color="green" style={{ fontWeight: 800, borderRadius: 6, padding: '4px 10px' }}>
                  ✓ FEASIBLE
                </Tag>
              </div>

              {/* TIMELINE CÁC TRẠM DỪNG */}
              <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SCHEDULED WAYPOINTS & VET CHECKS:
              </div>

              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                {(activePlan.checkpoints || []).map((cp, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
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
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {cp.step}
                    </div>

                    <div style={{ flex: 1 }}>
                      <Flex justify="space-between" align="center">
                        <strong style={{ fontSize: 14, color: '#0F172A' }}>
                          {cp.name}
                        </strong>
                        <Tag color={cp.type === 'ORIGIN' ? 'green' : cp.type === 'ARRIVAL' ? 'blue' : 'gold'}>
                          {cp.type}
                        </Tag>
                      </Flex>
                      <div style={{ fontSize: 12.5, color: '#475569', marginTop: 3 }}>
                        {cp.description} • ETA: <strong>{cp.eta}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </Space>
            </Card>

            {/* PHẦN 2: BUDGET & EXPENSE AUDIT KHỚP FIGMA */}
            <Card
              bordered
              style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
              styles={{ body: { padding: '24px' } }}
            >
              <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                2. Budget & Expense Audit (Manager Oversight)
              </Title>
              <Text style={{ fontSize: 13, color: '#64748B', display: 'block', marginBottom: 18 }}>
                Compare proposed logistics expenditure against customer invoice cap
              </Text>

              {/* 3 Ô THÔNG SỐ: CAP, ESTIMATED TOTAL, GROSS MARGIN */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Customer Fee Cap:</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                      ${Number(activePlan.customerFeeCap || 22500).toLocaleString()}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 14px' }}>
                    <Text style={{ fontSize: 12, color: '#B45309', display: 'block' }}>Estimated Total:</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706' }}>
                      ${Number(activePlan.estimatedCost || 18450).toLocaleString()}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 14px' }}>
                    <Text style={{ fontSize: 12, color: '#15803D', display: 'block' }}>Gross Margin:</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#16A34A' }}>
                      +${Number(activePlan.grossMargin || 4050).toLocaleString()} ({activePlan.grossMarginPercent || '18%'})
                    </div>
                  </div>
                </Col>
              </Row>

              <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 12 }}>
                Includes: Air Charter (${Number(activePlan.costBreakdown?.airCharter || 14200) / 1000}k), Stall Rental (${Number(activePlan.costBreakdown?.stallRent || 2100) / 1000}k), Escort Vet (${Number(activePlan.costBreakdown?.vetEscort || 1450) / 1000}k), Quarantine (${activePlan.costBreakdown?.quarantine || 700})
              </div>

              {/* BANNER FLEET STATUS CHECK */}
              <div
                style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 12.5,
                  color: '#15803D',
                  fontWeight: 600,
                }}
              >
                ✓ Fleet Status Check: OK! Internal air stall allocated. No 3rd-party charter surcharge required.
              </div>
            </Card>
          </Space>
        </Col>

        {/* CỘT PHẢI: PERSONNEL AUDIT & MANAGER DECISION ACTIONS */}
        <Col xs={24} lg={9}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* PHẦN 3: PERSONNEL ROSTER AUDIT */}
            <Card
              bordered
              style={{ borderRadius: 18, border: '1px solid #E2E8F0' }}
              styles={{ body: { padding: '22px' } }}
            >
              <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                Personnel Roster Audit
              </Title>
              <Text style={{ fontSize: 12.5, color: '#64748B', display: 'block', marginBottom: 16 }}>
                Collision check against concurrent trips (Alt Flow C)
              </Text>

              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {[
                  {
                    key: 'driver',
                    title: `Driver: ${activePlan.driverName || 'Le Hoang Nam'}`,
                    duty: 'Duty: Solo-Driver & Airport Handover',
                  },
                  {
                    key: 'vet',
                    title: `Vet Escort: ${activePlan.vetEscortName || 'Dr. Elena Rostova'}`,
                    duty: 'Duty: In-Flight Care & DXB Layover',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '12px 14px',
                    }}
                  >
                    <Flex justify="space-between" align="center">
                      <div>
                        <strong style={{ fontSize: 14, color: '#0F172A' }}>{item.title}</strong>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{item.duty}</div>
                      </div>
                      <Tag color="green" style={{ fontWeight: 800, borderRadius: 6 }}>
                        AVAILABLE
                      </Tag>
                    </Flex>
                  </div>
                ))}
              </Space>

              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginTop: 14,
                  fontSize: 12,
                  color: '#15803D',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircleFilled /> No overlap detected.
              </div>

              <Button
                block
                type="dashed"
                onClick={() => navigate('/coordinator/dashboard')}
                style={{ marginTop: 12, borderRadius: 8, fontSize: 12, fontWeight: 600 }}
              >
                Request Driver Change (Alt Flow C)
              </Button>
            </Card>

            {/* PHẦN 4: MANAGER DECISION ACTIONS KHỚP FIGMA */}
            <Card
              bordered
              style={{
                borderRadius: 18,
                border: '1.5px solid #FDE68A',
                backgroundColor: '#FFFDF9',
              }}
              styles={{ body: { padding: '22px' } }}
            >
              <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
                Manager Decision Actions
              </Title>
              <Text style={{ fontSize: 12.5, color: '#64748B', display: 'block', marginBottom: 18 }}>
                Grant formal assignment or reject with remarks.
              </Text>

              {isAssigned ? (
                <div
                  style={{
                    backgroundColor: '#F0FDF4',
                    border: '1.5px solid #BBF7D0',
                    borderRadius: 12,
                    padding: '16px',
                    textAlign: 'center',
                    marginBottom: 12,
                  }}
                >
                  <CheckCircleFilled style={{ fontSize: 32, color: '#16A34A', marginBottom: 6 }} />
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#14532D' }}>
                    KẾ HOẠCH ĐÃ ĐƯỢC DUYỆT VÀ ĐIỀU PHỐI
                  </div>
                  <div style={{ fontSize: 12.5, color: '#15803D', marginTop: 4 }}>
                    Thông tin chuyến đi đã tự động chuyển qua cho Driver & Escort.
                  </div>
                  <Button
                    type="primary"
                    onClick={() => navigate(ROUTES.DRIVER_DASHBOARD)}
                    style={{
                      marginTop: 12,
                      backgroundColor: '#16A34A',
                      borderColor: '#16A34A',
                      fontWeight: 700,
                      borderRadius: 8,
                    }}
                  >
                    Xem giao diện Driver &rarr;
                  </Button>
                </div>
              ) : (
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  {/* NÚT 1: APPROVE & OFFICIALLY ASSIGN (LỚN MÀU XANH LÁ) */}
                  <div>
                    <Button
                      type="primary"
                      block
                      size="large"
                      loading={actionLoading}
                      onClick={handleApprovePlan}
                      style={{
                        backgroundColor: '#16A34A',
                        borderColor: '#16A34A',
                        fontWeight: 800,
                        fontSize: 16,
                        height: 52,
                        borderRadius: 12,
                        boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
                      }}
                    >
                      ✓ Approve & Officially Assign →
                    </Button>
                    <div style={{ fontSize: 11.5, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                      Status → <strong>ASSIGNED</strong>. Pushes notifications to Driver & Escort.
                    </div>
                  </div>

                  {/* NÚT 2: REJECT PLAN & REQUEST REVISIONS (VIỀN ĐỎ) */}
                  <div>
                    <Button
                      danger
                      block
                      size="large"
                      onClick={() => setRejectModalOpen(true)}
                      style={{
                        fontWeight: 700,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: '#FEF2F2',
                        borderColor: '#FECACA',
                        color: '#DC2626',
                      }}
                    >
                      Reject Plan & Request Revisions
                    </Button>
                    <div style={{ fontSize: 11.5, color: '#991B1B', textAlign: 'center', marginTop: 4 }}>
                      Current Plan Rejections: <strong>{activePlan.rejectionCount || 0} of 3</strong>. If rejected 3 times, auto-escalates to Operations Director.
                    </div>
                  </div>
                </Space>
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* POPUP MODAL REJECT PLAN KHỚP 100% FIGMA IMAGE 5 RIGHT POPUP */}
      <Modal
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        footer={null}
        closable={false}
        width={540}
        styles={{ content: { borderRadius: 20, padding: '28px' } }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#DC2626', fontSize: 22 }}>
              Reject Plan
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Plan #{activePlan.planCode} • Order #{activePlan.orderCode}
            </Text>
          </div>
          <Button
            type="text"
            shape="circle"
            onClick={() => setRejectModalOpen(false)}
            style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
          >
            ✕
          </Button>
        </Flex>

        <div style={{ marginBottom: 18 }}>
          <Text strong style={{ fontSize: 13, color: '#0F172A', display: 'block', marginBottom: 8 }}>
            Rejection Reason *
          </Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
            Please specify why this plan is being rejected:
          </Text>

          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {[
              'Budget exceeds customer invoice cap',
              'Route not feasible (checkpoints/timing)',
              'Personnel conflict (driver/escort unavailable)',
              'Vehicle not suitable',
              'Other (specify below)',
            ].map((reason) => {
              const isChecked = selectedReasons.includes(reason);
              return (
                <div
                  key={reason}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (isChecked) {
                      setSelectedReasons(selectedReasons.filter((r) => r !== reason));
                    } else {
                      setSelectedReasons([...selectedReasons, reason]);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isChecked) {
                        setSelectedReasons(selectedReasons.filter((r) => r !== reason));
                      } else {
                        setSelectedReasons([...selectedReasons, reason]);
                      }
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: isChecked ? '#FEF2F2' : '#F8FAFC',
                    border: isChecked ? '1px solid #FECACA' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Checkbox checked={isChecked} />
                  <span style={{ fontSize: 13, color: isChecked ? '#991B1B' : '#334155', fontWeight: isChecked ? 600 : 400 }}>
                    {reason}
                  </span>
                </div>
              );
            })}
          </Space>
        </div>

        {/* DETAILED REMARKS TEXTAREA */}
        <div style={{ marginBottom: 18 }}>
          <label htmlFor="reject-remarks-input" style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Detailed Remarks *
          </label>
          <TextArea
            id="reject-remarks-input"
            rows={3}
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            placeholder="Enter detailed rejection reason and suggested revisions..."
            style={{ borderRadius: 10 }}
          />
        </div>

        {/* CẢNH BÁO REVISION COUNTER KHỚP FIGMA */}
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: 12,
            color: '#92400E',
          }}
        >
          <div style={{ fontWeight: 800 }}>⚠️ Revision Counter: {activePlan.rejectionCount || 0}/3</div>
          <div>Coordinator can resubmit up to 3 times. After 3 rejections, plan will be escalated to Operations Director.</div>
        </div>

        <Text style={{ fontSize: 11.5, color: '#64748B', display: 'block', marginBottom: 16 }}>
          Coordinator will be notified via email & dashboard alert with your rejection reason.
        </Text>

        <Flex gap={12}>
          <Button
            size="large"
            block
            onClick={() => setRejectModalOpen(false)}
            style={{ borderRadius: 10, fontWeight: 600, height: 44 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            danger
            size="large"
            block
            loading={actionLoading}
            onClick={handleConfirmReject}
            style={{
              backgroundColor: '#DC2626',
              borderColor: '#DC2626',
              fontWeight: 800,
              borderRadius: 10,
              height: 44,
            }}
          >
            Confirm Reject
          </Button>
        </Flex>
      </Modal>
    </div>
  );
}
