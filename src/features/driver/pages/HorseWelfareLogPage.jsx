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
  InputNumber,
  Radio,
  Select,
  Table,
  Spin,
  Alert,
  message,
  Tabs,
  Badge,
  Flex,
} from 'antd';
import {
  HeartOutlined,
  AlertOutlined,
  HistoryOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { useMissionDetail } from '../hooks/useDriverMissions';
import MissionHeaderCard from '../components/MissionHeaderCard';
import EmergencyReportModal from '../components/EmergencyReportModal';

// 4 Current Equine Health Status cards (Matching Figma Image 5)
const HEALTH_STATUS_CARDS = [
  {
    key: 'HEALTHY',
    title: 'HEALTHY',
    tagColor: 'success',
    borderColor: '#22C55E',
    bgColor: '#F0FDF4',
    iconColor: '#16A34A',
    description: 'Normal respiration, calm demeanor, alert',
    stressLevel: 'Calm',
    physicalCondition: 'Excellent',
    hydrationStatus: 'Normal',
  },
  {
    key: 'STRESSED',
    title: 'STRESSED',
    tagColor: 'warning',
    borderColor: '#F59E0B',
    bgColor: '#FFFBEB',
    iconColor: '#D97706',
    description: 'Agitated, head tossing, sweating',
    stressLevel: 'MildStress',
    physicalCondition: 'NormalFatigue',
    hydrationStatus: 'Normal',
  },
  {
    key: 'NOT_EATING',
    title: 'NOT EATING / DEHYDRATED',
    tagColor: 'orange',
    borderColor: '#FB923C',
    bgColor: '#FFF7ED',
    iconColor: '#EA580C',
    description: 'Refused feed, skin pinch > 2s',
    stressLevel: 'MildStress',
    physicalCondition: 'NormalFatigue',
    hydrationStatus: 'Refused',
  },
  {
    key: 'CLIMATE_AFFECTED',
    title: 'CLIMATE AFFECTED / ELEVATED TEMP',
    tagColor: 'error',
    borderColor: '#EF4444',
    bgColor: '#FEF2F2',
    iconColor: '#DC2626',
    description: 'Heavy sweating, shivering, rapid breathing',
    stressLevel: 'Agitated',
    physicalCondition: 'Injured',
    hydrationStatus: 'Reduced',
  },
];

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * Trả về config màu sắc cho mức độ stress
 * @param {string} level
 */
function getStressMeta(level) {
  switch (level) {
    case 'Calm':
      return { color: 'green', text: 'Bình tĩnh' };
    case 'MildStress':
      return { color: 'gold', text: 'Hơi căng thẳng' };
    case 'Agitated':
      return { color: 'red', text: 'Hoảng sợ / Kích động' };
    default:
      return { color: 'default', text: level || 'Bình thường' };
  }
}

/**
 * Trả về config màu sắc cho thể lực ngựa
 * @param {string} condition
 */
function getConditionMeta(condition) {
  switch (condition) {
    case 'Excellent':
      return { color: 'green', text: 'Rất tốt' };
    case 'NormalFatigue':
      return { color: 'blue', text: 'Mệt mỏi bình thường' };
    case 'Injured':
      return { color: 'red', text: 'Chấn thương / Bất thường' };
    default:
      return { color: 'default', text: condition || 'Ổn định' };
  }
}

/**
 * Màn hình 4: Nhật ký thể trạng sinh trắc & Phúc lợi ngựa (Horse Health & Telemetry Log)
 */
export default function HorseWelfareLogPage() {
  const { tripId } = useParams();
  const {
    mission,
    loading,
    actionLoading,
    error,
    addWelfareLog,
    reportIncident,
  } = useMissionDetail(tripId);

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [selectedHorseId, setSelectedHorseId] = useState('ALL');
  const [selectedHealthStatus, setSelectedHealthStatus] = useState('HEALTHY');
  const [form] = Form.useForm();

  const { user } = useAuthStore();
  const userRole = user?.role || user?.Role;
  const isEscort = userRole === 'Escort';
  const isDriver = userRole === 'Driver';
  // Quyền ghi nhật ký thú y: Cả Driver & Escort đều có thể tương tác và tick chọn
  const canLogWelfare = isEscort || isDriver || userRole === 'Admin' || userRole === 'LogisticsManager' || userRole === 'FleetCoordinator';

  const horses = useMemo(() => mission?.horses || [], [mission?.horses]);
  const welfareLogs = useMemo(() => mission?.welfareLogs || [], [mission?.welfareLogs]);

  // Lọc nhật ký theo ngựa được chọn
  const filteredLogs = useMemo(() => {
    if (selectedHorseId === 'ALL') return welfareLogs;
    return welfareLogs.filter((log) => String(log.horseId) === String(selectedHorseId));
  }, [welfareLogs, selectedHorseId]);

  // Xử lý gửi biểu mẫu nhật ký
  const handleSaveLog = async () => {
    try {
      const values = await form.validateFields();
      const horse = horses.find((h) => String(h.horseId) === String(values.horseId));

      const payload = {
        horseId: Number(values.horseId),
        horseName: horse ? horse.horseName : 'Ngựa đua',
        heartRate: Number(values.heartRate),
        temperature: Number(values.temperature),
        hydrationStatus: values.hydrationStatus,
        waterIntakeLiters: Number(values.waterIntakeLiters || 0),
        feedGiven: values.feedGiven || '',
        stressLevel: values.stressLevel,
        physicalCondition: values.physicalCondition,
        ambientTemp: Number(values.ambientTemp || 19.5),
        humidity: Number(values.humidity || 65),
        notes: values.notes || '',
      };

      const success = await addWelfareLog(payload);
      if (success) {
        message.success('Đã lưu dữ liệu sinh trắc & nhật ký chăm sóc thành công!');
        form.resetFields();
      }
    } catch {
      // Validate error
    }
  };

  if (loading && !mission) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu nhật ký phúc lợi ngựa..." />
      </div>
    );
  }

  // Cấu hình bảng hiển thị lịch sử đo
  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 140,
      render: (val) => (
        <Space direction="vertical" size={2}>
          <Text strong>{new Date(val).toLocaleTimeString('vi-VN')}</Text>
          <Text orientation="left" type="secondary" style={{ fontSize: 11 }}>
            {new Date(val).toLocaleDateString('vi-VN')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Ngựa đua',
      dataIndex: 'horseName',
      key: 'horseName',
      width: 160,
      render: (val, record) => (
        <div>
          <Text strong style={{ color: '#1F2937' }}>
            {val}
          </Text>
          {record.horseId && (
            <div style={{ fontSize: 11, color: '#6B7280' }}>ID: #{record.horseId}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Sinh trắc (Tim & Nhiệt)',
      key: 'vitals',
      width: 180,
      render: (_, record) => (
        <Space size={12}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Nhịp tim:
            </Text>
            <div>
              <Text strong style={{ color: record.heartRate > 55 ? '#DC2626' : '#16A34A' }}>
                {record.heartRate} bpm
              </Text>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Thân nhiệt:
            </Text>
            <div>
              <Text strong style={{ color: record.temperature > 38.6 ? '#DC2626' : '#16A34A' }}>
                {record.temperature}°C
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Nước & Thức ăn',
      key: 'hydration',
      width: 160,
      render: (_, record) => (
        <div>
          <Tag color={record.hydrationStatus === 'Normal' ? 'green' : 'gold'} style={{ borderRadius: 4 }}>
            Nước: {record.waterIntakeLiters || 0}L ({record.hydrationStatus || 'Bình thường'})
          </Tag>
          {record.feedGiven && (
            <div style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>
              🌾 {record.feedGiven}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Hành vi & Thể lực',
      key: 'stress',
      width: 170,
      render: (_, record) => {
        const stress = getStressMeta(record.stressLevel);
        const cond = getConditionMeta(record.physicalCondition);
        return (
          <Space direction="vertical" size={4}>
            <Tag color={stress.color} style={{ borderRadius: 4, margin: 0 }}>
              Tâm lý: {stress.text}
            </Tag>
            <Tag color={cond.color} style={{ borderRadius: 4, margin: 0 }}>
              Thể lực: {cond.text}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Người ghi & Ghi chú',
      key: 'notes',
      render: (_, record) => (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.loggedBy}
          </Text>
          {record.notes && (
            <div style={{ fontSize: 12, color: '#1F2937', marginTop: 2 }}>
              "{record.notes}"
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header tóm tắt chuyến xe */}
      <MissionHeaderCard
        mission={mission}
        activeTab="welfare"
        onOpenSos={() => setSosModalOpen(true)}
        breadcrumbItems={[{ title: 'Nhật ký phúc lợi ngựa' }]}
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

      {/* Tabs lọc theo từng cá thể ngựa trên chuyến */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Tabs
            activeKey={String(selectedHorseId)}
            onChange={(k) => setSelectedHorseId(k)}
            style={{ marginBottom: 0 }}
            items={[
              {
                key: 'ALL',
                label: `Tất cả ngựa (${welfareLogs.length} lần đo)`,
              },
              ...horses.map((h) => ({
                key: String(h.horseId),
                label: (
                  <Space size={6}>
                    <span>🏇 {h.horseName}</span>
                    <Badge
                      count={welfareLogs.filter((l) => String(l.horseId) === String(h.horseId)).length}
                      style={{ backgroundColor: '#F59E0B' }}
                    />
                  </Space>
                ),
              })),
            ]}
          />

          <Button
            danger
            icon={<AlertOutlined />}
            onClick={() => setSosModalOpen(true)}
            style={{ borderRadius: 8 }}
          >
            Báo cáo khẩn cấp y tế
          </Button>
        </div>
      </Card>

      {/* Form nhập số liệu kiểm tra sinh trắc mới */}
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
          <PlusCircleOutlined style={{ color: '#F59E0B', fontSize: 20 }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#111827' }}>
              Cập nhật nhật ký chăm sóc & Khảo sát sinh trắc học
            </Title>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              Tiêu chuẩn FEI: Đo thân nhiệt, nhịp tim và cấp nước định kỳ mỗi 4 tiếng hoặc tại mỗi trạm dừng chân
            </Paragraph>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            horseId: horses[0]?.horseId,
            heartRate: 38,
            temperature: 38.0,
            hydrationStatus: 'Normal',
            waterIntakeLiters: 12,
            feedGiven: 'Cỏ khô Timothy + Điện giải',
            stressLevel: 'Calm',
            physicalCondition: 'Excellent',
            ambientTemp: 19.5,
            humidity: 65,
          }}
        >
          {/* 1. Current Equine Health Status (Matching Figma Image 5) */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '16px 18px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                1. Current Equine Health Status
              </div>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                (Driver & Escort click to select status)
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
              Select the primary physiological status observed during the checkpoint inspection:
            </div>

            <Row gutter={[12, 12]}>
              {HEALTH_STATUS_CARDS.map((status) => {
                const isSelected = selectedHealthStatus === status.key;
                return (
                  <Col xs={24} sm={12} key={status.key}>
                    <div
                      onClick={() => {
                        setSelectedHealthStatus(status.key);
                        form.setFieldsValue({
                          stressLevel: status.stressLevel,
                          physicalCondition: status.physicalCondition,
                          hydrationStatus: status.hydrationStatus,
                        });
                        message.success(`Đã chọn trạng thái: ${status.title}`);
                      }}
                      style={{
                        border: `2px solid ${isSelected ? status.borderColor : '#CBD5E1'}`,
                        backgroundColor: isSelected ? status.bgColor : '#FFFFFF',
                        borderRadius: 10,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        userSelect: 'none',
                      }}
                    >
                      <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                        <Tag
                          color={status.tagColor}
                          style={{
                            fontWeight: 800,
                            fontSize: 12,
                            borderRadius: 6,
                            padding: '2px 8px',
                            margin: 0,
                          }}
                        >
                          {status.title}
                        </Tag>
                        {isSelected && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: status.iconColor, fontWeight: 700, fontSize: 12 }}>
                            <CheckCircleOutlined /> Đang chọn
                          </div>
                        )}
                      </Flex>
                      <div style={{ fontSize: 12, color: isSelected ? '#1E293B' : '#64748B', marginTop: 4, fontWeight: isSelected ? 600 : 400 }}>
                        {status.description}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>

          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
            2. Clinical Observations & Vitals
          </div>

          <Row gutter={[20, 16]}>
            {/* Chọn ngựa */}
            <Col xs={24} md={8}>
              <Form.Item
                name="horseId"
                label="Ngựa đua kiểm tra"
                rules={[{ required: true, message: 'Vui lòng chọn ngựa' }]}
              >
                <Select
                  size="large"
                  options={horses.map((h) => ({
                    value: h.horseId,
                    label: `${h.horseName} (Chip: ${h.microchipNumber || 'N/A'})`,
                  }))}
                />
              </Form.Item>
            </Col>

            {/* Nhịp tim */}
            <Col xs={12} md={8}>
              <Form.Item
                name="heartRate"
                label="Nhịp tim (BPM - Chuẩn: 32-44)"
                rules={[{ required: true, message: 'Nhập nhịp tim' }]}
              >
                <InputNumber
                  size="large"
                  min={20}
                  max={120}
                  style={{ width: '100%' }}
                  addonAfter="bpm"
                />
              </Form.Item>
            </Col>

            {/* Thân nhiệt */}
            <Col xs={12} md={8}>
              <Form.Item
                name="temperature"
                label="Thân nhiệt (°C - Chuẩn: 37.5-38.5)"
                rules={[{ required: true, message: 'Nhập thân nhiệt' }]}
              >
                <InputNumber
                  size="large"
                  min={35.0}
                  max={42.0}
                  step={0.1}
                  style={{ width: '100%' }}
                  addonAfter="°C"
                />
              </Form.Item>
            </Col>

            {/* Mức độ stress */}
            <Col xs={24} md={8}>
              <Form.Item name="stressLevel" label="Mức độ căng thẳng (Stress)">
                <Radio.Group buttonStyle="solid" size="middle">
                  <Radio.Button value="Calm">Bình tĩnh</Radio.Button>
                  <Radio.Button value="MildStress">Căng thẳng nhẹ</Radio.Button>
                  <Radio.Button value="Agitated">Hoảng sợ (SOS)</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>

            {/* Thể lực */}
            <Col xs={24} md={8}>
              <Form.Item name="physicalCondition" label="Thể trạng vận động">
                <Radio.Group buttonStyle="solid" size="middle">
                  <Radio.Button value="Excellent">Rất tốt</Radio.Button>
                  <Radio.Button value="NormalFatigue">Mệt bình thường</Radio.Button>
                  <Radio.Button value="Injured">Bất thường</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>

            {/* Nhu cầu uống nước */}
            <Col xs={24} md={8}>
              <Form.Item name="hydrationStatus" label="Tình trạng tiếp nhận nước">
                <Radio.Group buttonStyle="solid" size="middle">
                  <Radio.Button value="Normal">Uống tốt</Radio.Button>
                  <Radio.Button value="Reduced">Uống ít</Radio.Button>
                  <Radio.Button value="Refused">Từ chối uống</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>

            {/* Lượng nước đã uống & Khẩu phần ăn */}
            <Col xs={12} md={6}>
              <Form.Item name="waterIntakeLiters" label="Lượng nước bổ sung">
                <InputNumber min={0} max={50} addonAfter="Lít" style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>

            <Col xs={12} md={6}>
              <Form.Item name="feedGiven" label="Khẩu phần cỏ / Dinh dưỡng">
                <Input placeholder="Cỏ khô, cỏ tươi, điện giải..." size="large" />
              </Form.Item>
            </Col>

            <Col xs={12} md={6}>
              <Form.Item name="ambientTemp" label="Nhiệt độ thùng xe">
                <InputNumber step={0.1} addonAfter="°C" style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>

            <Col xs={12} md={6}>
              <Form.Item name="humidity" label="Độ ẩm thùng xe">
                <InputNumber min={0} max={100} addonAfter="%" style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>

            {/* Ghi chú */}
            <Col xs={24}>
              <Form.Item name="notes" label="Quan sát thú y & Ghi chú hành vi">
                <TextArea
                  rows={2}
                  placeholder="Ghi nhận phản ứng của ngựa khi phanh, âm thanh xung quanh, dấu hiệu ra mồ hôi..."
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button
              type="primary"
              size="large"
              icon={<HeartOutlined />}
              loading={actionLoading}
              disabled={!canLogWelfare}
              onClick={handleSaveLog}
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                fontWeight: 600,
                borderRadius: 8,
                padding: '0 28px',
              }}
            >
              Lưu nhật ký chăm sóc & Sinh trắc
            </Button>
          </div>
        </Form>
      </Card>

      {/* Lịch sử nhật ký các lần đo trước */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <HistoryOutlined style={{ color: '#4B5563', fontSize: 18 }} />
          <Title level={4} style={{ margin: 0, color: '#111827' }}>
            Lịch sử khảo sát phúc lợi & Sinh trắc ({filteredLogs.length} bản ghi)
          </Title>
        </div>

        <Table
          dataSource={filteredLogs}
          columns={columns}
          rowKey={(r) => r.logId || r.timestamp}
          pagination={{ pageSize: 6 }}
          bordered
          scroll={{ x: 800 }}
        />
      </Card>

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
