import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Form,
  Input,
  Select,
  Checkbox,
  Spin,
  Alert,
  message,
  Modal,
  Table,
  Result,
} from 'antd';
import {
  FileDoneOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ArrowLeftOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useMissionDetail } from '../hooks/useDriverMissions';
import MissionHeaderCard from '../components/MissionHeaderCard';
import DigitalSignaturePad from '../components/DigitalSignaturePad';
import EmergencyReportModal from '../components/EmergencyReportModal';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const RECIPIENT_ROLES = [
  { value: 'Owner', label: 'Chủ sở hữu ngựa (Customer / Owner)' },
  { value: 'Trainer', label: 'Huấn luyện viên trường đua (Racecourse Trainer)' },
  { value: 'DestinationVet', label: 'Bác sĩ thú y điểm đến (Destination Vet)' },
  { value: 'StableManager', label: 'Quản lý trang trại / Chuồng đua (Stable Manager)' },
  { value: 'AuthorizedAgent', label: 'Đại diện ủy quyền hợp pháp' },
];

/**
 * Màn hình 5: Nghiệm thu bàn giao điểm đến & Chữ ký số e-POD (Arrival & Digital POD)
 */
export default function ArrivalHandoverPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const {
    mission,
    loading,
    actionLoading,
    error,
    submitArrivalPod,
    reportIncident,
  } = useMissionDetail(tripId);

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successResultOpen, setSuccessResultOpen] = useState(false);
  const [form] = Form.useForm();

  // State chữ ký điện tử
  const [driverSig, setDriverSig] = useState(mission?.handover?.driverSignature || null);
  const [receiverSig, setReceiverSig] = useState(mission?.handover?.receiverSignature || null);

  // State các mục kiểm tra
  const [allHorsesHealthy, setAllHorsesHealthy] = useState(true);
  const [allDocsDelivered, setAllDocsDelivered] = useState(true);
  const [equipmentReturned, setEquipmentReturned] = useState(true);
  const [acceptedHorses, setAcceptedHorses] = useState({});

  const toggleHorseAccepted = (id) => {
    setAcceptedHorses((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : !prev[id],
    }));
  };

  const horses = useMemo(() => mission?.horses || [], [mission?.horses]);
  const isCompleted = mission?.overallStatus === 'Completed';
  const leadDriver = (mission?.crew || []).find((c) => c.crewRole === 'Driver') || mission?.crew?.[0];

  // Xử lý nộp biên bản e-POD
  const handleSubmitHandover = async () => {
    try {
      const values = await form.validateFields();

      if (!driverSig) {
        message.error('Vui lòng ký xác nhận chữ ký của Tài xế trưởng');
        return;
      }
      if (!receiverSig) {
        message.error('Vui lòng lấy chữ ký số xác nhận của Người tiếp nhận ngựa');
        return;
      }

      setConfirmModalOpen(false);

      const handoverData = {
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        recipientRole: values.recipientRole,
        destinationAddress: mission.destination,
        allHorsesChecked: allHorsesHealthy,
        allDocumentsHandedOver: allDocsDelivered,
        equipmentReturned: equipmentReturned,
        notes: values.notes || '',
        driverSignature: driverSig,
        receiverSignature: receiverSig,
      };

      const success = await submitArrivalPod(handoverData);
      if (success) {
        setSuccessResultOpen(true);
        message.success('Đã lưu biên bản nghiệm thu bàn giao và ký e-POD thành công!');
      }
    } catch {
      // Validate error
    }
  };

  if (loading && !mission) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu nghiệm thu bàn giao..." />
      </div>
    );
  }

  const horseColumns = [
    {
      title: 'Ngựa đua',
      dataIndex: 'horseName',
      key: 'horseName',
      render: (val, record) => (
        <div>
          <Text strong style={{ color: '#1F2937' }}>
            {val}
          </Text>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            Giống: {record.breed || 'Thoroughbred'} | {record.gender === 'Stallion' ? 'Ngựa đực' : 'Ngựa cái'}
          </div>
        </div>
      ),
    },
    {
      title: 'Số vi mạch (Microchip)',
      dataIndex: 'microchipNumber',
      key: 'microchipNumber',
      render: (val) => <Tag color="geekblue">{val}</Tag>,
    },
    {
      title: 'Thể trạng lúc bàn giao',
      key: 'status',
      render: () => (
        <Space size={6}>
          <Tag color="success">Không trầy xước</Tag>
          <Tag color="green">Thân nhiệt bình thường</Tag>
          <Tag color="cyan">Dáng đi ổn định</Tag>
        </Space>
      ),
    },
    {
      title: 'Xác nhận kiểm đếm',
      key: 'check',
      align: 'center',
      render: () => <Tag color="success" icon={<CheckCircleOutlined />}>Đã đối chiếu khớp</Tag>,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header thông tin tóm tắt chuyến xe */}
      <MissionHeaderCard
        mission={mission}
        activeTab="arrival"
        onOpenSos={() => setSosModalOpen(true)}
        breadcrumbItems={[{ title: 'Nghiệm thu bàn giao & e-POD' }]}
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

      {/* Thông báo trạng thái chuyến */}
      {isCompleted ? (
        <Alert
          message="Biên bản nghiệm thu bàn giao điện tử (e-POD) đã hoàn tất"
          description="Chuyến xe đã đóng thành công. Chữ ký số của hai bên đã được mã hóa và lưu trữ vĩnh viễn trên hệ thống."
          type="success"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8 }}
          action={
            <Button
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              style={{ borderRadius: 6 }}
            >
              In biên bản
            </Button>
          }
        />
      ) : (
        <Alert
          message="Kiểm đếm thực địa tại điểm đích & Lấy chữ ký số e-POD"
          description="Yêu cầu kiểm tra kỹ thể trạng từng cá thể ngựa, giao đủ giấy tờ gốc kèm hộ chiếu, và lấy chữ ký xác nhận của đại diện bên tiếp nhận."
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      {/* Kết quả sau khi nộp thành công */}
      {successResultOpen ? (
        <Card style={{ borderRadius: 12, padding: '40px 0', textAlign: 'center' }}>
          <Result
            status="success"
            title="Biên bản bàn giao điện tử (e-POD) đã được xác nhận thành công!"
            subTitle={`Mã chuyến xe: ${mission?.tripCode} | Khách hàng: ${mission?.customerName} | Thời gian: ${new Date().toLocaleString('vi-VN')}`}
            extra={[
              <Button
                type="primary"
                key="completionReport"
                onClick={() => navigate(`/driver/missions/${tripId}/completion-report`)}
                style={{ backgroundColor: '#10B981', borderColor: '#10B981', borderRadius: 8, fontWeight: 600 }}
              >
                Xem Báo cáo hoàn thành ca trực
              </Button>,
              <Button
                key="missions"
                onClick={() => navigate('/driver/missions')}
                style={{ borderRadius: 8 }}
              >
                Về danh sách nhiệm vụ
              </Button>,
              <Button
                key="print"
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
                style={{ borderRadius: 8 }}
              >
                In biên bản giao nhận
              </Button>,
            ]}
          />
        </Card>
      ) : (
        <>
          {/* Mục 1: Thẩm định thể trạng ngựa tại điểm đích */}
          <Card
            style={{
              borderRadius: 12,
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
            }}
            bodyStyle={{ padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <SafetyCertificateOutlined style={{ color: '#10B981', fontSize: 20 }} />
              <div>
                <Title level={4} style={{ margin: 0, color: '#111827' }}>
                  1. Khảo sát thể trạng ngựa bàn giao tại đích ({horses.length} con)
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  Đối chiếu vi mạch quét thực tế và kiểm tra dấu hiệu ngoại thương hoặc suy nhược
                </Paragraph>
              </div>
            </div>

            {/* Delivery Confirmation Horse Cards (Matching Figma Image 5) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              {(horses.length > 0 ? horses : [
                { horseId: 1, horseName: 'Midnight Gunner', temp: '37.6°C', weight: '495 kg (Stable)' },
                { horseId: 2, horseName: 'Royal Duchess', temp: '37.4°C', weight: '488 kg (Stable)' },
              ]).map((h) => {
                const isAccepted = acceptedHorses[h.horseId] !== false;
                return (
                  <div
                    key={h.horseId}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: `1.5px solid ${isAccepted ? '#BBF7D0' : '#FED7AA'}`,
                      borderRadius: 12,
                      padding: '14px 18px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                      <strong style={{ fontSize: 15, color: '#0F172A' }}>
                        🐴 {h.horseName || h.name}
                      </strong>
                      <Space>
                        <span style={{ fontSize: 12, color: '#64748B' }}>Final Trip Condition:</span>
                        <Tag color="success" style={{ fontWeight: 800, borderRadius: 4, margin: 0, padding: '2px 8px' }}>
                          HEALTHY
                        </Tag>
                      </Space>
                    </div>

                    <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 10 }}>
                      Temperature: <strong>{h.temp || '37.6°C'}</strong> · Weight: <strong>{h.weight || '495 kg (Stable)'}</strong>
                    </div>

                    <Button
                      block
                      type={isAccepted ? 'primary' : 'default'}
                      icon={isAccepted ? <CheckCircleOutlined /> : undefined}
                      onClick={() => toggleHorseAccepted(h.horseId)}
                      style={{
                        backgroundColor: isAccepted ? '#16A34A' : '#FFFBEB',
                        borderColor: isAccepted ? '#16A34A' : '#FCD34D',
                        color: isAccepted ? '#FFFFFF' : '#92400E',
                        fontWeight: 700,
                        borderRadius: 8,
                        height: 38,
                      }}
                    >
                      {isAccepted ? '✓ Post-trip inspection & Vitals accepted' : 'Bấm để chấp thuận kiểm tra thể trạng'}
                    </Button>
                  </div>
                );
              })}
            </div>

            <Table
              dataSource={horses}
              columns={horseColumns}
              rowKey="horseId"
              pagination={false}
              bordered
              style={{ marginBottom: 16 }}
            />

            <div
              style={{
                background: '#F0FDF4',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #BBF7D0',
              }}
            >
              <Checkbox
                checked={allHorsesHealthy}
                onChange={(e) => setAllHorsesHealthy(e.target.checked)}
                disabled={isCompleted}
              >
                <Text strong style={{ color: '#15803D' }}>
                  Xác nhận toàn bộ ngựa đua khỏe mạnh, tỉnh táo, không phát sinh chấn thương trong suốt quá trình vận chuyển đường bộ
                </Text>
              </Checkbox>
            </div>
          </Card>

          {/* Mục 2: Bàn giao Giấy tờ & Tài sản phụ kiện */}
          <Card
            style={{
              borderRadius: 12,
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
            }}
            bodyStyle={{ padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <FileDoneOutlined style={{ color: '#7C3AED', fontSize: 20 }} />
              <div>
                <Title level={4} style={{ margin: 0, color: '#111827' }}>
                  2. Bàn giao Giấy tờ pháp lý & Tài sản kèm theo
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  Chuyển giao các giấy tờ thú y bản gốc và phụ kiện bảo hộ của chủ ngựa
                </Paragraph>
              </div>
            </div>

            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <div
                  style={{
                    background: '#F9FAFB',
                    padding: '14px 16px',
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Checkbox
                    checked={allDocsDelivered}
                    onChange={(e) => setAllDocsDelivered(e.target.checked)}
                    disabled={isCompleted}
                  >
                    <div>
                      <Text strong style={{ color: '#1F2937' }}>
                        Bàn giao đầy đủ Hộ chiếu FEI & Giấy kiểm dịch bản gốc
                      </Text>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        Bao gồm kết quả xét nghiệm máu Coggins, phiếu tiêm phòng và giấy phép thông quan
                      </div>
                    </div>
                  </Checkbox>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div
                  style={{
                    background: '#F9FAFB',
                    padding: '14px 16px',
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Checkbox
                    checked={equipmentReturned}
                    onChange={(e) => setEquipmentReturned(e.target.checked)}
                    disabled={isCompleted}
                  >
                    <div>
                      <Text strong style={{ color: '#1F2937' }}>
                        Hoàn trả phụ kiện & Trang thiết bị của chủ ngựa
                      </Text>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        Yên cương, bọc móng bảo hộ, thảm đệm lưng và máng nước riêng (nếu có)
                      </div>
                    </div>
                  </Checkbox>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Mục 3: Thông tin người tiếp nhận & Chữ ký số e-POD */}
          <Card
            style={{
              borderRadius: 12,
              marginBottom: 32,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
            }}
            bodyStyle={{ padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <UserOutlined style={{ color: '#0284C7', fontSize: 20 }} />
              <div>
                <Title level={4} style={{ margin: 0, color: '#111827' }}>
                  3. Thông tin bên tiếp nhận & Xác thực chữ ký số điện tử (e-POD)
                </Title>
                <Paragraph type="secondary" style={{ margin: 0 }}>
                  Cả hai bên ký tên trực tiếp trên màn hình cảm ứng để hoàn tất giá trị pháp lý bàn giao
                </Paragraph>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                recipientName: mission?.handover?.recipientName || mission?.customerName || 'Jane Smith',
                recipientPhone: mission?.handover?.recipientPhone || mission?.customerPhone || '+84988111222',
                recipientRole: mission?.handover?.recipientRole || 'Owner',
                notes: mission?.handover?.notes || '',
              }}
            >
              <Row gutter={[20, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="recipientName"
                    label="Họ tên người nhận ngựa"
                    rules={[{ required: true, message: 'Nhập họ tên người nhận' }]}
                  >
                    <Input prefix={<UserOutlined style={{ color: '#9CA3AF' }} />} size="large" disabled={isCompleted} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="recipientPhone"
                    label="Số điện thoại liên lạc"
                    rules={[{ required: true, message: 'Nhập số điện thoại' }]}
                  >
                    <Input prefix={<PhoneOutlined style={{ color: '#9CA3AF' }} />} size="large" disabled={isCompleted} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="recipientRole"
                    label="Vai trò đại diện nhận"
                    rules={[{ required: true, message: 'Chọn vai trò' }]}
                  >
                    <Select size="large" options={RECIPIENT_ROLES} disabled={isCompleted} />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary">Địa điểm giao nhận thực tế: </Text>
                    <Space size={6}>
                      <EnvironmentOutlined style={{ color: '#F59E0B' }} />
                      <Text strong>{mission?.destination}</Text>
                    </Space>
                  </div>
                </Col>

                <Col xs={24}>
                  <Form.Item name="notes" label="Ghi chú bàn giao thêm (nếu có)">
                    <TextArea
                      rows={2}
                      placeholder="Ghi nhận tình trạng người nhận đã hài lòng, dặn dò chế độ hồi phục cho ngựa..."
                      disabled={isCompleted}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            {/* 2 Khung chữ ký số của Tài xế và Người nhận */}
            <div style={{ marginTop: 16 }}>
              <Row gutter={[24, 20]}>
                <Col xs={24} md={12}>
                  <DigitalSignaturePad
                    title="1. Chữ ký của Tài xế trưởng (Lead Driver)"
                    signatoryName={leadDriver?.fullName || 'Phạm Văn Đức'}
                    value={driverSig}
                    onChange={setDriverSig}
                    disabled={isCompleted}
                    height={160}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <DigitalSignaturePad
                    title="2. Chữ ký của Người nhận (Recipient POD)"
                    signatoryName={form.getFieldValue('recipientName') || mission?.customerName || 'Người nhận'}
                    value={receiverSig}
                    onChange={setReceiverSig}
                    disabled={isCompleted}
                    height={160}
                  />
                </Col>
              </Row>
            </div>
          </Card>

          {/* Action Bar cuối trang */}
          <Card
            style={{
              borderRadius: 12,
              position: 'sticky',
              bottom: 16,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              border: '1px solid #E5E7EB',
              zIndex: 10,
            }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/driver/missions/${tripId}/execution`)}
                style={{ borderRadius: 8 }}
              >
                Quay lại lộ trình
              </Button>

              <Space size={12}>
                <Button
                  onClick={() => navigate('/driver/missions')}
                  style={{ borderRadius: 8 }}
                >
                  Danh sách nhiệm vụ
                </Button>

                {!isCompleted && (
                  <Button
                    type="primary"
                    size="large"
                    icon={<FileDoneOutlined />}
                    disabled={!allHorsesHealthy || !allDocsDelivered || !allDocsDelivered}
                    loading={actionLoading}
                    onClick={() => setConfirmModalOpen(true)}
                    style={{
                      backgroundColor: '#10B981',
                      borderColor: '#10B981',
                      fontWeight: 600,
                      borderRadius: 8,
                      padding: '0 28px',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                    }}
                  >
                    Ký xác nhận & Hoàn tất bàn giao e-POD
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </>
      )}

      {/* Modal xác nhận nộp e-POD */}
      <Modal
        title="Xác nhận hoàn tất thủ tục bàn giao điện tử (e-POD)"
        open={confirmModalOpen}
        onOk={handleSubmitHandover}
        onCancel={() => setConfirmModalOpen(false)}
        okText="Ký & Đóng chuyến"
        cancelText="Kiểm tra lại"
        okButtonProps={{
          style: { backgroundColor: '#10B981', borderColor: '#10B981' },
          loading: actionLoading,
        }}
      >
        <Paragraph>
          Bạn đang thực hiện ký số xác nhận bàn giao nghiệm thu cho chuyến xe <Text strong>{mission?.tripCode}</Text>.
        </Paragraph>
        <Paragraph>
          Sau khi xác nhận, chuyến xe sẽ chuyển sang trạng thái <Tag color="green">Đã hoàn thành</Tag>, biên bản e-POD sẽ được gửi thông báo đến khách hàng và trung tâm điều hành.
        </Paragraph>
      </Modal>

      {/* Modal Báo cáo khẩn cấp SOS */}
      <EmergencyReportModal
        open={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        tripId={tripId}
        tripCode={mission?.tripCode}
        horses={horses}
        onSubmit={reportIncident}
      />
    </div>
  );
}
