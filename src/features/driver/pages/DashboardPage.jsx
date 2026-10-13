import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Modal,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
  message,
  Input,
} from 'antd';
import {
  CarOutlined,
  CompassOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getDriverDispatchedTrips, updateStoredRoutePlan } from '@utils/routePlanStorage';
import { useAuthStore } from '@features/auth/store/authStore';

const { Title, Text, Paragraph } = Typography;

/**
 * Trang Driver & Escort Dashboard
 * Hiển thị các nhiệm vụ chuyến đi chính thức được Manager phê duyệt và bàn giao
 */
export default function DriverDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [welfareModalOpen, setWelfareModalOpen] = useState(false);
  const [bodyTemp, setBodyTemp] = useState('38.1');
  const [waterIntake, setWaterIntake] = useState('15');
  const [welfareNotes, setWelfareNotes] = useState('Ngựa tỉnh táo, ăn cỏ tốt, nhịp thở đều đặn.');

  useEffect(() => {
    const list = getDriverDispatchedTrips();
    setTrips(list);
    if (list.length > 0 && !selectedTrip) {
      setSelectedTrip(list[0]);
    }

    const handleUpdate = () => {
      const refreshed = getDriverDispatchedTrips();
      setTrips(refreshed);
      if (selectedTrip) {
        const found = refreshed.find((p) => p.planId === selectedTrip.planId);
        if (found) setSelectedTrip(found);
      }
    };

    window.addEventListener('plans_updated', handleUpdate);
    window.addEventListener('plan_assigned_to_driver', handleUpdate);
    return () => {
      window.removeEventListener('plans_updated', handleUpdate);
      window.removeEventListener('plan_assigned_to_driver', handleUpdate);
    };
  }, [selectedTrip]);

  const activeTrip = selectedTrip || trips[0];

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

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 40 }}>
      {/* HEADER DRIVER DASHBOARD */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: 28 }}>
            Driver & Escort Mission Control
          </Title>
          <Text style={{ color: '#64748B', fontSize: 14 }}>
            Official Dispatched Trips assigned by Logistics Manager & Route Coordinator
          </Text>
        </div>

        <Space>
          <Tag color="green" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 8, fontWeight: 700 }}>
            ● DRIVER APP ONLINE
          </Tag>
        </Space>
      </Flex>

      {/* DANH SÁCH CÁC NHIỆM VỤ ĐƯỢC CHỈ ĐỊNH */}
      {trips.length === 0 ? (
        <Card style={{ borderRadius: 18, textAlign: 'center', padding: '60px 20px' }}>
          <ClockCircleOutlined style={{ fontSize: 48, color: '#94A3B8', marginBottom: 16 }} />
          <Title level={4} style={{ color: '#0F172A' }}>
            Chưa có chuyến đi nào được bàn giao
          </Title>
          <Text type="secondary">
            Khi Logistics Manager duyệt và Officially Assign kế hoạch lộ trình từ Coordinator, chuyến đi sẽ xuất hiện ngay tại đây.
          </Text>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {/* CỘT TRÁI: DANH SÁCH THẺ CHUYẾN ĐI ASSIGNED */}
          <Col xs={24} lg={10}>
            <Title level={4} style={{ margin: '0 0 14px', fontWeight: 800, color: '#0F172A' }}>
              Nhiệm vụ được phân công ({trips.length})
            </Title>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {trips.map((trip) => {
                const isSelected = activeTrip?.planId === trip.planId;
                const isInTransit = trip.status === 'InTransit';
                return (
                  <div
                    key={trip.planId}
                    onClick={() => setSelectedTrip(trip)}
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
                      <strong style={{ fontSize: 15, color: '#0F172A', fontFamily: 'monospace' }}>
                        Mission #{trip.planCode}
                      </strong>
                      <Tag color={isInTransit ? 'blue' : 'green'} style={{ fontWeight: 800, borderRadius: 6 }}>
                        {isInTransit ? 'IN_TRANSIT' : 'ASSIGNED'}
                      </Tag>
                    </Flex>

                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                      {trip.originCode || 'SGN'} → {trip.destinationCode || 'CDG'} ({trip.destination})
                    </div>

                    <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 8 }}>
                      🐴 Ngựa: <strong>{trip.horses?.join(', ')}</strong> ({trip.totalHorses} con)
                    </div>

                    <Flex justify="space-between" align="center" style={{ fontSize: 12, color: '#64748B' }}>
                      <span>Xe: {trip.vehicleName || trip.vehicleType}</span>
                      <span style={{ fontWeight: 600, color: '#16A34A' }}>Xem chi tiết &rarr;</span>
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
                    <Tag color="green" style={{ fontWeight: 800, borderRadius: 6, marginBottom: 6 }}>
                      OFFICIAL DISPATCH
                    </Tag>
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

                {/* THÔNG TIN PHÂN BỔ ĐỘI NGŨ & XE */}
                <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <Col span={12}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Tài xế chỉ định:</Text>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>
                        👨‍✈️ {activeTrip.driverName} ({activeTrip.driverLicense || 'VN-99201'})
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
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Phương tiện & Thùng xe:</Text>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>
                        {activeTrip.vehicleName}
                      </strong>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Ngăn chuồng chuyên dụng:</Text>
                      <strong style={{ fontSize: 14, color: '#0F172A' }}>
                        📦 {activeTrip.stalls}
                      </strong>
                    </div>
                  </Col>
                </Row>

                {/* DANH SÁCH CHECKPOINTS TRÊN TUYẾN ĐƯỜNG */}
                <Title level={5} style={{ margin: '0 0 12px', fontWeight: 800, color: '#0F172A' }}>
                  Các trạm kiểm soát & điểm dừng tiếp nước
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
                          <div style={{ fontSize: 12, color: '#64748B' }}>{cp.description}</div>
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
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Thân nhiệt ngựa (°C):</label>
            <Input value={bodyTemp} onChange={(e) => setBodyTemp(e.target.value)} size="large" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Lượng nước uống (Lít):</label>
            <Input value={waterIntake} onChange={(e) => setWaterIntake(e.target.value)} size="large" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Đánh giá hành vi & hô hấp:</label>
            <Input.TextArea rows={3} value={welfareNotes} onChange={(e) => setWelfareNotes(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
