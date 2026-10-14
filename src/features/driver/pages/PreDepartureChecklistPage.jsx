import { useState, useMemo, useEffect } from 'react';
import {
  Row,
  Col,
  Tag,
  Button,
  Space,
  Alert,
  Spin,
  Modal,
  message,
  Flex,
} from 'antd';
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
  AlertOutlined,
  SaveOutlined,
  CheckOutlined,
  QuestionCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useMissionDetail } from '../hooks/useDriverMissions';
import EmergencyReportModal from '../components/EmergencyReportModal';

// Default initial checks matching Figma Image 4
const INITIAL_VEHICLE_CHECKS = [
  {
    id: 'v1',
    title: 'Tire pressure checked',
    desc: 'All 6 tires: 95 PSI (Optimal load bearing)',
    passed: true,
  },
  {
    id: 'v2',
    title: 'Fuel level sufficient',
    desc: 'Auxiliary generator tank: 98% full',
    passed: true,
  },
  {
    id: 'v3',
    title: 'HVAC system tested',
    desc: 'Continuous climate lock active: 18°C',
    passed: true,
  },
  {
    id: 'v4',
    title: 'Stall doors secured',
    desc: 'All mechanical locks fully engaged',
    passed: true,
  },
  {
    id: 'v5',
    title: 'Emergency kit verified',
    desc: 'First aid kit, fire extinguisher in place',
    passed: true,
  },
  {
    id: 'v6',
    title: 'CCTV cameras functional',
    desc: 'Pending verification (Re-checking signal)',
    passed: false,
  },
];

const INITIAL_REQUIRED_DOCS = [
  { id: 'd1', title: 'Transport Permit', passed: true },
  { id: 'd2', title: 'Health Certificates (2 horses)', passed: true },
  { id: 'd3', title: 'Customs Documents', passed: true },
];

/**
 * Pre-Departure Checklist Screen - Chuẩn hóa 100% theo Figma Image 4
 * Driver & Escort có thể tick chọn, tương tác kiểm tra từng mục
 */
export default function PreDepartureChecklistPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const {
    mission,
    loading,
    actionLoading,
    error,
    startTrip,
    reportIncident,
  } = useMissionDetail(tripId);

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);

  // Storage key
  const storageKey = `racehorse_checklist_state_${tripId}`;

  // Vehicle checks state
  const [vehicleChecks, setVehicleChecks] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.vehicleChecks) return parsed.vehicleChecks;
      }
    } catch {
      // ignore
    }
    return INITIAL_VEHICLE_CHECKS;
  });

  // Horse Vitals state
  const [horseVitals, setHorseVitals] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.horseVitals && parsed.horseVitals.length > 0) return parsed.horseVitals;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'h1',
        name: 'Midnight Gunner',
        healthy: true,
        temp: '37.8°C',
        heartRate: '42 bpm',
        hydration: 'Normal',
        recordedAt: '05:15 AM',
        vet: 'Dr. Elena Rostova',
      },
      {
        id: 'h2',
        name: 'Royal Duchess',
        healthy: true,
        temp: '37.5°C',
        heartRate: '38 bpm',
        hydration: 'Normal',
        recordedAt: '05:15 AM',
        vet: 'Dr. Elena Rostova',
      },
    ];
  });

  // Required Docs state
  const [requiredDocs, setRequiredDocs] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.requiredDocs) return parsed.requiredDocs;
      }
    } catch {
      // ignore
    }
    return INITIAL_REQUIRED_DOCS;
  });

  // Derived effective horses
  const missionHorses = mission?.horses;
  const missionVet = mission?.vetEscortName;
  const effectiveHorses = useMemo(() => {
    if (missionHorses && missionHorses.length > 0) {
      return missionHorses.map((mh, idx) => {
        const existing = horseVitals.find(
          (p) => String(p.id) === String(mh.horseId) || p.name === (mh.name || mh.horseName),
        );
        return (
          existing || {
            id: mh.horseId || `h-${idx}`,
            name: mh.name || mh.horseName || `Ngựa đua #${idx + 1}`,
            healthy: true,
            temp: '37.8°C',
            heartRate: '40 bpm',
            hydration: 'Normal',
            recordedAt: '05:15 AM',
            vet: missionVet || 'Dr. Elena Rostova',
          }
        );
      });
    }
    return horseVitals;
  }, [missionHorses, missionVet, horseVitals]);

  // Persist local state whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          vehicleChecks,
          horseVitals,
          requiredDocs,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // ignore
    }
  }, [vehicleChecks, horseVitals, requiredDocs, storageKey]);

  // Toggles
  const handleToggleVehicleCheck = (id) => {
    setVehicleChecks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: !item.passed } : item)),
    );
  };

  const handleToggleHorseVital = (id) => {
    setHorseVitals((prev) =>
      prev.map((h) => (h.id === id ? { ...h, healthy: !h.healthy } : h)),
    );
  };

  const handleToggleDocument = (id) => {
    setRequiredDocs((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, passed: !doc.passed } : doc)),
    );
  };

  // Check all / pass all
  const handlePassAll = () => {
    setVehicleChecks((prev) => prev.map((item) => ({ ...item, passed: true })));
    setHorseVitals((prev) => prev.map((h) => ({ ...h, healthy: true })));
    setRequiredDocs((prev) => prev.map((doc) => ({ ...doc, passed: true })));
    message.success('Đã đánh dấu Đạt (PASSED) cho toàn bộ hạng mục kiểm tra!');
  };

  // Save Draft
  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          vehicleChecks,
          horseVitals,
          requiredDocs,
          savedAt: new Date().toISOString(),
        }),
      );
      message.success('Đã lưu bản nháp danh mục kiểm tra thành công!');
    } catch {
      message.error('Lỗi khi lưu dữ liệu');
    }
  };

  // Stats calculation
  const allVehiclePassed = vehicleChecks.every((v) => v.passed);
  const allHorsesHealthy = effectiveHorses.every((h) => h.healthy);
  const allDocsPassed = requiredDocs.every((d) => d.passed);
  const isAllReady = allVehiclePassed && allHorsesHealthy && allDocsPassed;

  // Handle start mission
  const handleStartMission = async () => {
    setStartConfirmOpen(false);
    const success = await startTrip();
    if (success) {
      message.success('Chuyến xe đã chính thức xuất bến! Chuyển sang màn hình theo dõi lộ trình.');
      navigate(`/driver/missions/${tripId}/execution`);
    }
  };

  if (loading && !mission) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu kiểm tra an toàn..." />
      </div>
    );
  }

  const isAlreadyInTransit = ['InTransit', 'EmergencyRerouting', 'ArrivedDestination', 'Completed'].includes(
    mission?.overallStatus,
  );

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '16px 20px', backgroundColor: '#FDFBF7', minHeight: '100vh' }}>
      {/* 1. Header & Breadcrumbs Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>
            Pre-Departure Checklist
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
            Trip #{mission?.tripCode || 'TRP-8821'} • Assigned by Logistics Manager Group05
          </p>
        </div>

        <Space>
          <Tag color="orange" style={{ fontWeight: 800, padding: '4px 12px', borderRadius: 9999, fontSize: 12 }}>
            ● STATUS: PREPARING
          </Tag>
          <Button size="small" icon={<SyncOutlined />} onClick={handlePassAll}>
            Chọn đạt tất cả (Pass All)
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message="Lỗi hệ thống"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* Thông báo trạng thái chuyến nếu đã xuất bến */}
      {isAlreadyInTransit && (
        <Alert
          message="Chuyến đi đã xuất bến"
          description={`Chuyến xe hiện đang ở trạng thái "${mission.overallStatus}". Bạn có thể xem lại biên bản kiểm tra hoặc chuyển sang màn hình theo dõi lộ trình.`}
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          action={
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(`/driver/missions/${tripId}/execution`)}
              style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B' }}
            >
              Xem lộ trình
            </Button>
          }
        />
      )}

      {/* 2. Top Banner Card (Figma Style) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20,
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        <Row gutter={[20, 14]} align="middle">
          <Col xs={12} sm={8} md={5}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ORDER ID</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
              #{mission?.bookingCode || 'ORD-8821'}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B' }}>SGN ➔ DXB ➔ CDG</div>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ALLOCATED VEHICLE</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
              {mission?.vehicle?.name || 'Boeing 777F • #ST-04'}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B' }}>Target 18°C [±1.5°C]</div>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>HORSES & ESCORT</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
              {horseVitals.length} Horses ({horseVitals.map((h) => h.name.split(' ')[0]).join(', ')})
            </div>
            <div style={{ fontSize: 11.5, color: '#2563EB' }}>Vet: Dr. Elena Rostova</div>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>SCHEDULED DEPARTURE</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
              Sep 25, 2026 • 08:00 AM
            </div>
            <div style={{ fontSize: 11.5, color: '#16A34A' }}>Tarmac Bay #4 Inspected</div>
          </Col>

          <Col xs={24} sm={8} md={4} style={{ textAlign: 'right' }}>
            <div
              style={{
                backgroundColor: '#FFFBEB',
                border: '1.5px solid #FCD34D',
                borderRadius: 10,
                padding: '8px 12px',
                display: 'inline-block',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>
                COUNTDOWN TO DEPARTURE
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#92400E', fontFamily: 'monospace' }}>
                02:45:30
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* 3. Main 2-Column Content (Figma Image 4) */}
      <Row gutter={[20, 20]}>
        {/* Left Column: Vehicle & Compartment Inspection */}
        <Col xs={24} lg={12}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              height: '100%',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                Vehicle & Compartment Inspection
              </h2>
              <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: '#64748B' }}>
                Verify equipment & stall mechanics before moving to runway (Nhấn để chuyển trạng thái)
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vehicleChecks.map((item) => {
                const isPassed = item.passed;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleVehicleCheck(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isPassed ? '#F0FDF4' : '#FFFBEB',
                      border: `1.5px solid ${isPassed ? '#BBF7D0' : '#FCD34D'}`,
                      borderRadius: 10,
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                    }}
                  >
                    <Flex align="center" gap={12} style={{ flex: 1 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: isPassed ? '#22C55E' : '#F59E0B',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {isPassed ? <CheckOutlined /> : <QuestionCircleOutlined />}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isPassed ? '#166534' : '#92400E' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 12, color: isPassed ? '#4B5563' : '#B45309', marginTop: 1 }}>
                          {item.desc}
                        </div>
                      </div>
                    </Flex>

                    <Tag
                      color={isPassed ? 'success' : 'warning'}
                      style={{
                        fontWeight: 800,
                        fontSize: 11.5,
                        padding: '3px 10px',
                        borderRadius: 6,
                        margin: 0,
                      }}
                    >
                      {isPassed ? 'PASSED' : 'PENDING'}
                    </Tag>
                  </div>
                );
              })}
            </div>
          </div>
        </Col>

        {/* Right Column: Pre-Trip Horse Vitals & Required Documents */}
        <Col xs={24} lg={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Box 1: Pre-Trip Horse Vitals */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                  Pre-Trip Horse Vitals
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: '#64748B' }}>
                  Baseline check administered by Dr. Elena Rostova (Nhấn để đánh dấu sức khỏe)
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {effectiveHorses.map((h) => {
                  return (
                    <div
                      key={h.id}
                      onClick={() => handleToggleHorseVital(h.id)}
                      style={{
                        backgroundColor: h.healthy ? '#F8FAFC' : '#FFF7ED',
                        border: `1.5px solid ${h.healthy ? '#CBD5E1' : '#FDBA74'}`,
                        borderRadius: 10,
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                        <strong style={{ fontSize: 14.5, color: '#0F172A' }}>
                          🐴 {h.name}
                        </strong>
                        <Tag
                          color={h.healthy ? 'success' : 'warning'}
                          style={{ fontWeight: 800, fontSize: 11, borderRadius: 6, margin: 0 }}
                        >
                          {h.healthy ? 'HEALTHY' : 'CHECK REQUIRED'}
                        </Tag>
                      </Flex>

                      <div style={{ fontSize: 12, color: '#334155', display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span>Temperature: <strong>{h.temp}</strong> ✓</span>
                        <span>Heart Rate: <strong>{h.heartRate}</strong> ✓</span>
                        <span>Hydration: <strong>{h.hydration}</strong> ✓</span>
                      </div>

                      <div
                        style={{
                          backgroundColor: h.healthy ? '#F0FDF4' : '#FFFBEB',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11.5,
                          color: h.healthy ? '#166534' : '#B45309',
                          fontWeight: 500,
                        }}
                      >
                        ✓ Pre-trip vitals recorded at {h.recordedAt} by {h.vet}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Box 2: Required Documents */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                  Required Documents
                </h2>
                <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: '#64748B' }}>
                  Hồ sơ pháp lý & giấy kiểm dịch bắt buộc trước giờ lăn bánh (Nhấn để đối soát)
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {requiredDocs.map((doc) => {
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleToggleDocument(doc.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: doc.passed ? '#F0FDF4' : '#FFFBEB',
                        border: `1.5px solid ${doc.passed ? '#BBF7D0' : '#FCD34D'}`,
                        borderRadius: 8,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Space size={10}>
                        <CheckCircleOutlined style={{ color: doc.passed ? '#16A34A' : '#D97706', fontSize: 16 }} />
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: doc.passed ? '#166534' : '#92400E' }}>
                          {doc.title}
                        </span>
                      </Space>
                      <Tag color={doc.passed ? 'success' : 'default'} style={{ fontWeight: 700, margin: 0, borderRadius: 4 }}>
                        {doc.passed ? 'Verified ✓' : 'Pending'}
                      </Tag>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 4. Bottom Action Bar (Figma Style) */}
      <div
        style={{
          marginTop: 24,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          position: 'sticky',
          bottom: 16,
          zIndex: 10,
        }}
      >
        <Space size={12} wrap>
          <Button
            size="large"
            icon={<SaveOutlined />}
            onClick={handleSaveDraft}
            style={{
              backgroundColor: '#FFFBEB',
              borderColor: '#FCD34D',
              color: '#92400E',
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            Save Draft
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              if (!isAllReady) {
                Modal.confirm({
                  title: 'Một số hạng mục chưa đạt (Pending)',
                  content: 'Vẫn còn hạng mục kiểm tra chưa ở trạng thái PASSED. Bạn có chắc chắn muốn bỏ qua và xuất bến?',
                  okText: 'Vẫn xuất bến',
                  cancelText: 'Kiểm tra tiếp',
                  onOk: () => setStartConfirmOpen(true),
                });
              } else {
                setStartConfirmOpen(true);
              }
            }}
            style={{
              backgroundColor: '#16A34A',
              borderColor: '#16A34A',
              fontWeight: 700,
              borderRadius: 8,
              padding: '0 24px',
            }}
          >
            🚀 Confirm & Start Trip
          </Button>

          <Button
            danger
            size="large"
            icon={<AlertOutlined />}
            onClick={() => setSosModalOpen(true)}
            style={{
              backgroundColor: '#DC2626',
              borderColor: '#DC2626',
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            Report Issue
          </Button>
        </Space>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
          <InfoCircleOutlined style={{ color: '#10B981' }} />
          <span>Offline Mode Supported • All data saved locally & synced</span>
        </div>
      </div>

      {/* Modal xác nhận bắt đầu xuất bến */}
      <Modal
        title="Xác nhận khởi hành chuyến xe"
        open={startConfirmOpen}
        onOk={handleStartMission}
        onCancel={() => setStartConfirmOpen(false)}
        okText="Xác nhận xuất bến"
        cancelText="Kiểm tra lại"
        okButtonProps={{
          style: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
          loading: actionLoading,
        }}
      >
        <p>
          Bạn đã hoàn thành danh mục kiểm tra an toàn tiền khởi hành cho chuyến xe{' '}
          <strong>{mission?.tripCode}</strong>.
        </p>
        <p>
          Khi xác nhận, chuyến xe sẽ chính thức chuyển sang trạng thái <Tag color="orange">Đang di chuyển</Tag>{' '}
          và hệ thống sẽ bắt đầu truyền phát nhật ký vi khí hậu và GPS vệ tinh theo thời gian thực.
        </p>
      </Modal>

      {/* Modal Báo cáo khẩn cấp SOS */}
      <EmergencyReportModal
        open={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        tripId={tripId}
        tripCode={mission?.tripCode}
        horses={mission?.horses || []}
        onSubmit={reportIncident}
      />
    </div>
  );
}
