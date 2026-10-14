import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Timeline,
  Modal,
  Form,
  Input,
  InputNumber,
  Spin,
  Alert,
  message,
  Popconfirm,
} from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  HeartOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { Tooltip } from 'antd';
import { useMissionDetail } from '../hooks/useDriverMissions';
import MissionHeaderCard from '../components/MissionHeaderCard';
import EmergencyReportModal from '../components/EmergencyReportModal';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * Trả về màu và nhãn cho trạng thái trạm kiểm soát
 * @param {string} status
 */
function getCheckpointStatusMeta(status) {
  switch (status) {
    case 'Departed':
      return { color: 'green', text: 'Đã rời trạm', icon: <CheckCircleOutlined /> };
    case 'Cleared':
      return { color: 'cyan', text: 'Đã hoàn tất kiểm tra', icon: <SafetyCertificateOutlined /> };
    case 'Arrived':
      return { color: 'blue', text: 'Đang tại trạm', icon: <LoginOutlined /> };
    case 'Pending':
    default:
      return { color: 'default', text: 'Chờ đến', icon: <ClockCircleOutlined /> };
  }
}

/**
 * Màn hình 3: Vận hành lộ trình & Theo dõi trạm kiểm soát (Trip Execution & Checkpoints)
 */
export default function TripExecutionPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const {
    mission,
    loading,
    actionLoading,
    error,
    arriveCheckpoint,
    clearCheckpoint,
    departCheckpoint,
    reportIncident,
  } = useMissionDetail(tripId);

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [selectedCp, setSelectedCp] = useState(null);
  const [clearForm] = Form.useForm();

  const checkpoints = mission?.routeCheckpoints || [];
  const { user } = useAuthStore();
  const userRole = user?.role || user?.Role;
  const isEscort = userRole === 'Escort';
  const isDriver = userRole === 'Driver';
  const isAirFlight = mission?.transportMode === 'Air';
  // Phân quyền Flow 4 theo Figma: Chuyến Air do Escort cập nhật, Ground/Door-to-Door do Driver cập nhật
  const canUpdateRoute = isAirFlight
    ? (isEscort || userRole === 'Admin' || userRole === 'LogisticsManager' || userRole === 'FleetCoordinator')
    : (isDriver || userRole === 'Admin' || userRole === 'LogisticsManager' || userRole === 'FleetCoordinator');

  // Mở modal hoàn tất kiểm tra trạm
  const handleOpenClearModal = (cp) => {
    setSelectedCp(cp);
    clearForm.resetFields();
    clearForm.setFieldsValue({
      odometerReading: cp.odometerReading || 12450,
      clearanceNumber: cp.clearanceNumber || '',
      notes: cp.notes || '',
    });
    setClearModalOpen(true);
  };

  // Xác nhận Clear trạm
  const handleConfirmClear = async () => {
    try {
      const values = await clearForm.validateFields();
      if (!selectedCp) return;

      const success = await clearCheckpoint(selectedCp.checkpointId, values);
      if (success) {
        message.success(`Đã hoàn tất kiểm tra tại trạm "${selectedCp.locationName}"!`);
        setClearModalOpen(false);
        setSelectedCp(null);
      }
    } catch {
      // Validate error
    }
  };

  // Check-in Arrive
  const handleArrive = async (cp) => {
    const success = await arriveCheckpoint(cp.checkpointId);
    if (success) {
      message.success(`Đã check-in đến trạm "${cp.locationName}"!`);
    }
  };

  // Check-in Depart
  const handleDepart = async (cp) => {
    const success = await departCheckpoint(cp.checkpointId);
    if (success) {
      message.success(`Đã xác nhận rời trạm "${cp.locationName}" tiếp tục hành trình!`);
      // Nếu là trạm cuối cùng (hoặc điểm đích), thông báo chuyển sang e-POD
      if (cp.locationType === 'Destination' || cp.orderIndex === checkpoints.length) {
        message.info('Xe đã đến điểm đích an toàn! Vui lòng tiến hành nghiệm thu bàn giao e-POD.');
      }
    }
  };

  if (loading && !mission) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải lộ trình và trạm kiểm soát..." />
      </div>
    );
  }

  const isDestinationReached =
    mission?.overallStatus === 'ArrivedDestination' || mission?.overallStatus === 'Completed';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header thông tin tóm tắt chuyến xe */}
      <MissionHeaderCard
        mission={mission}
        activeTab="execution"
        onOpenSos={() => setSosModalOpen(true)}
        breadcrumbItems={[{ title: 'Lộ trình & Trạm kiểm soát' }]}
      />

      {error && (
        <Alert
          message="Lỗi tác nghiệp"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      {/* Thông báo nếu đã tới điểm đích */}
      {isDestinationReached && (
        <Alert
          message="Đã tới điểm đích an toàn!"
          description="Chuyến xe đã hoàn thành toàn bộ các mốc kiểm soát. Tiếp tục với bước lập Biên bản bàn giao và Ký xác nhận điện tử (e-POD)."
          type="success"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
          action={
            <Button
              type="primary"
              onClick={() => navigate(`/driver/missions/${tripId}/arrival`)}
              style={{ backgroundColor: '#10B981', borderColor: '#10B981', fontWeight: 600 }}
            >
              Chuyển sang ký e-POD
            </Button>
          }
        />
      )}

      {/* Dải Telemetry Realtime trên xe */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={6}>
            <Space size={10} align="center">
              <DashboardOutlined style={{ color: '#F59E0B', fontSize: 24 }} />
              <div>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>VẬN TỐC HIỆN TẠI (GPS)</Text>
                <div style={{ color: '#FFF', fontSize: 22, fontWeight: 700 }}>
                  62 <span style={{ fontSize: 14, fontWeight: 400 }}>km/h</span>
                </div>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Space size={10} align="center">
              <ThunderboltOutlined style={{ color: '#10B981', fontSize: 24 }} />
              <div>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>NHIỆT ĐỘ CABIN NGỰA</Text>
                <div style={{ color: '#10B981', fontSize: 22, fontWeight: 700 }}>
                  19.4°C <Tag color="green" style={{ marginLeft: 6 }}>Tối ưu</Tag>
                </div>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Space size={10} align="center">
              <ApartmentOutlined style={{ color: '#38BDF8', fontSize: 24 }} />
              <div>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>ĐỘ ẨM & THÔNG GIÓ</Text>
                <div style={{ color: '#FFF', fontSize: 22, fontWeight: 700 }}>
                  64% <span style={{ fontSize: 14, fontWeight: 400 }}>/ Cấp 3</span>
                </div>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<HeartOutlined />}
              onClick={() => navigate(`/driver/missions/${tripId}/welfare-log`)}
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                fontWeight: 600,
                borderRadius: 8,
              }}
            >
              Ghi nhật ký phúc lợi ngựa
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Danh sách các Mốc Lộ trình & Trạm kiểm soát */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: '#111827' }}>
              Danh sách trạm kiểm soát & Điểm dừng nghỉ trên lộ trình
            </Title>
            <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
              Thực hiện check-in đúng quy trình State Machine: Đến trạm (Arrive) → Hoàn tất kiểm tra (Clear) → Rời trạm (Depart)
            </Paragraph>
          </div>

          <Tag color="blue" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6 }}>
            Tổng số: {checkpoints.length} trạm
          </Tag>
        </div>

        {/* Banner phân quyền tác nghiệp Flow 4 theo Figma */}
        {!canUpdateRoute && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 20, borderRadius: 10 }}
            message={
              isAirFlight
                ? '✈️ Hành trình Chuyên cơ Hàng không (Air Flight)'
                : '🚛 Tuyến đường bộ / Door-to-Door (Ground Trailer)'
            }
            description={
              isAirFlight
                ? 'Theo quy định vận hành, Bác sĩ thú y / Chuyên viên Áp tải (Escort) trực tiếp áp tải trên chuyên cơ và phụ trách check-in các mốc lộ trình bay. Cả Tài xế và Áp tải đều có toàn quyền gửi Báo cáo Tình huống Khẩn cấp (SOS).'
                : 'Theo quy định vận hành, Tài xế (Driver) phụ trách check-in các trạm dừng và ghi nhận chỉ số Odometer. Bác sĩ Áp tải (Escort) phụ trách ghi nhận Nhật ký Phúc lợi ngựa. Cả Tài xế và Áp tải đều có toàn quyền gửi Báo cáo Tình huống Khẩn cấp (SOS).'
            }
          />
        )}

        {/* Timeline chi tiết các trạm */}
        <Timeline
          mode="left"
          items={checkpoints.map((cp) => {
            const statusMeta = getCheckpointStatusMeta(cp.status);
            const isDestination = cp.locationType === 'Destination';
            const isBorder = cp.locationType === 'BorderGate' || cp.locationType === 'Customs';

            return {
              color: statusMeta.color === 'default' ? 'gray' : statusMeta.color,
              dot: (
                <div
                  style={{
                    background:
                      cp.status === 'Departed'
                        ? '#10B981'
                        : cp.status === 'Arrived' || cp.status === 'Cleared'
                        ? '#F59E0B'
                        : '#9CA3AF',
                    color: '#FFF',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {cp.orderIndex}
                </div>
              ),
              children: (
                <Card
                  key={cp.checkpointId}
                  style={{
                    borderRadius: 10,
                    marginBottom: 20,
                    border:
                      cp.status === 'Arrived' || cp.status === 'Cleared'
                        ? '2px solid #F59E0B'
                        : '1px solid #E5E7EB',
                    background:
                      cp.status === 'Arrived' || cp.status === 'Cleared'
                        ? '#FFFBEB'
                        : cp.status === 'Departed'
                        ? '#F9FAFB'
                        : '#FFFFFF',
                  }}
                  bodyStyle={{ padding: 18 }}
                >
                  <Row gutter={[16, 12]} align="middle">
                    {/* Thông tin mốc kiểm soát */}
                    <Col xs={24} lg={14}>
                      <Space align="center" size={8} wrap>
                        <Title level={5} style={{ margin: 0, color: '#1F2937' }}>
                          {cp.locationName}
                        </Title>
                        <Tag color={statusMeta.color} icon={statusMeta.icon} style={{ borderRadius: 6 }}>
                          {statusMeta.text}
                        </Tag>
                        {isBorder && (
                          <Tag color="purple" style={{ borderRadius: 4 }}>
                            Cửa khẩu quốc tế
                          </Tag>
                        )}
                        {isDestination && (
                          <Tag color="success" style={{ borderRadius: 4 }}>
                            Điểm giao đích
                          </Tag>
                        )}
                      </Space>

                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: '#4B5563' }}>
                        <EnvironmentOutlined style={{ color: '#9CA3AF' }} />
                        <Text type="secondary">{cp.address}</Text>
                      </div>

                      <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                        <div>
                          <Text type="secondary">Kế hoạch đến: </Text>
                          <Text strong>
                            {cp.plannedArrivalTime
                              ? new Date(cp.plannedArrivalTime).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                })
                              : 'Chưa có'}
                          </Text>
                        </div>

                        {cp.actualArrivalTime && (
                          <div>
                            <Text type="secondary">Thực tế đến: </Text>
                            <Text strong style={{ color: '#0284C7' }}>
                              {new Date(cp.actualArrivalTime).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </div>
                        )}

                        {cp.actualDepartureTime && (
                          <div>
                            <Text type="secondary">Rời trạm: </Text>
                            <Text strong style={{ color: '#16A34A' }}>
                              {new Date(cp.actualDepartureTime).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Ghi chú hoặc số tờ khai */}
                      {cp.clearanceNumber && (
                        <div style={{ marginTop: 6 }}>
                          <Tag color="cyan">Số tờ khai/chứng chỉ: {cp.clearanceNumber}</Tag>
                        </div>
                      )}
                      {cp.notes && (
                        <Paragraph type="secondary" style={{ margin: '6px 0 0 0', fontSize: 12 }}>
                          Ghi chú: {cp.notes}
                        </Paragraph>
                      )}
                    </Col>

                    {/* Nút hành động theo State Machine */}
                    <Col xs={24} lg={10} style={{ textAlign: 'right' }}>
                      <Space size={8} wrap>
                        {/* 1. Nếu Pending -> Có nút Arrive */}
                        {cp.status === 'Pending' && (
                          <Tooltip title={!canUpdateRoute ? (isAirFlight ? "Chỉ Escort phụ trách cập nhật hành trình chuyến bay" : "Chỉ Driver phụ trách cập nhật trạm dừng & Odometer") : ""}>
                          <Button
                            type="primary"
                            icon={<LoginOutlined />}
                            loading={actionLoading}
                            disabled={!canUpdateRoute}
                            onClick={() => handleArrive(cp)}
                            style={{
                              backgroundColor: '#0284C7',
                              borderColor: '#0284C7',
                              borderRadius: 8,
                              fontWeight: 600,
                            }}
                          >
                            Xác nhận Đã đến trạm
                          </Button>
                          </Tooltip>
                        )}

                        {/* 2. Nếu Arrived -> Có nút Clear */}
                        {cp.status === 'Arrived' && (
                          <Tooltip title={!canUpdateRoute ? (isAirFlight ? "Chỉ Escort phụ trách cập nhật hành trình chuyến bay" : "Chỉ Driver phụ trách cập nhật trạm dừng & Odometer") : ""}>
                            <Button
                              type="primary"
                              icon={<SafetyCertificateOutlined />}
                              disabled={!canUpdateRoute}
                              onClick={() => handleOpenClearModal(cp)}
                              style={{
                                backgroundColor: '#7C3AED',
                                borderColor: '#7C3AED',
                                borderRadius: 8,
                                fontWeight: 600,
                              }}
                            >
                              Hoàn tất kiểm tra / Thông quan
                            </Button>
                          </Tooltip>
                        )}

                        {/* 3. Nếu Cleared -> Có nút Depart */}
                        {cp.status === 'Cleared' && (
                          <Tooltip title={!canUpdateRoute ? (isAirFlight ? "Chỉ Escort phụ trách cập nhật hành trình chuyến bay" : "Chỉ Driver phụ trách cập nhật trạm dừng & Odometer") : ""}>
                            <Popconfirm
                              title="Xác nhận rời trạm kiểm soát?"
                              description="Đảm bảo ngựa đã ổn định và toàn bộ giấy tờ đã được bàn giao lại cho kíp lái."
                              onConfirm={() => handleDepart(cp)}
                              okText="Rời trạm"
                              cancelText="Kiểm tra lại"
                              disabled={!canUpdateRoute}
                            >
                              <Button
                                type="primary"
                                icon={<LogoutOutlined />}
                                loading={actionLoading}
                                disabled={!canUpdateRoute}
                                style={{
                                  backgroundColor: '#10B981',
                                  borderColor: '#10B981',
                                  borderRadius: 8,
                                  fontWeight: 600,
                                }}
                              >
                                Xác nhận Rời trạm
                              </Button>
                            </Popconfirm>
                          </Tooltip>
                        )}

                        {/* 4. Nếu Departed -> Hiển thị badge hoàn tất */}
                        {cp.status === 'Departed' && (
                          <Tag color="success" icon={<CheckCircleOutlined />} style={{ padding: '4px 10px', borderRadius: 6 }}>
                            Đã qua mốc này
                          </Tag>
                        )}

                        {/* Nút phụ ghi nhật ký sức khỏe ngựa tại trạm */}
                        {['Arrived', 'Cleared', 'Departed'].includes(cp.status) && (
                          <Button
                            icon={<HeartOutlined />}
                            size="small"
                            onClick={() => navigate(`/driver/missions/${tripId}/welfare-log`)}
                            style={{ borderRadius: 6 }}
                          >
                            Ghi sinh trắc
                          </Button>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ),
            };
          })}
        />
      </Card>

      {/* Modal hoàn tất kiểm tra trạm (Clear Modal) */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#7C3AED' }} />
            <span>Hoàn tất kiểm tra tại: {selectedCp?.locationName}</span>
          </Space>
        }
        open={clearModalOpen}
        onCancel={() => setClearModalOpen(false)}
        onOk={handleConfirmClear}
        okText="Lưu & Xác nhận Đạt"
        cancelText="Hủy"
        okButtonProps={{
          style: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
          loading: actionLoading,
        }}
      >
        <Paragraph type="secondary">
          Ghi nhận thông tin kiểm tra dịch tễ thú y, số chứng nhận thông quan và chỉ số đồng hồ công-tơ-mét xe.
        </Paragraph>

        <Form form={clearForm} layout="vertical">
          <Form.Item
            name="odometerReading"
            label="Số chỉ đồng hồ Km (Odometer)"
            rules={[{ required: true, message: 'Vui lòng nhập số km' }]}
          >
            <InputNumber style={{ width: '100%' }} size="large" addonAfter="km" />
          </Form.Item>

          <Form.Item
            name="clearanceNumber"
            label="Số chứng nhận thông quan / Phiếu kiểm dịch (nếu có)"
          >
            <Input placeholder="Ví dụ: VET-CL-2026-9988" size="large" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú tại trạm">
            <TextArea rows={3} placeholder="Ghi nhận thời tiết, tình trạng ngựa hoặc thời gian dừng nghỉ..." />
          </Form.Item>
        </Form>
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
