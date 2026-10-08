import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined,
  CarOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import horseService from '@services/horseService';
import PageHeader from '@components/layout/PageHeader';
import useHorseDetail from '@features/customer/hooks/useHorseDetail';
import { ROUTES } from '@routes/routes';
import {
  HealthStatusTag,
  RiskBadge,
  calculateHorseRisk,
} from '@utils/horseHealth';

const { Title, Text } = Typography;

/**
 * Trang chi tiết cá thể ngựa đua dành cho khách hàng (Horse Detail)
 * Đường dẫn: /customer/horses/:id
 * Giao diện AntD Descriptions + Tabs [Thông tin chung, Hồ sơ thú y, Lịch sử vận chuyển]
 *
 * @returns {JSX.Element}
 */
export default function HorseDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: horse, loading, error, refetch } = useHorseDetail(id);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [form] = Form.useForm();

  const isEn = (i18n.language || 'vi').toLowerCase().startsWith('en');

  const handleOpenEdit = () => {
    if (!horse) return;
    form.setFieldsValue({
      Name: horse.Name,
      Breed: horse.Breed || 'Thoroughbred',
      Gender: horse.Gender || 'Stallion',
      DateOfBirth: horse.DateOfBirth ? dayjs(horse.DateOfBirth) : null,
      Color: horse.Color || '',
      MicrochipNumber: horse.MicrochipNumber || '',
      PassportNumber: horse.PassportNumber || '',
      HealthStatus: horse.HealthStatus || 'Good',
      SpecialCareRequirements: horse.SpecialCareRequirements || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values) => {
    try {
      setEditSubmitting(true);
      const payload = {
        ...values,
        DateOfBirth: values.DateOfBirth
          ? values.DateOfBirth.format('YYYY-MM-DD')
          : null,
      };
      await horseService.updateHorse(horse.HorseID, payload);
      message.success(t('horses.updateHorseSuccess'));
      setEditModalVisible(false);
      refetch?.();
    } catch {
      message.error(t('horses.updateHorseError'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleBackToList = () => {
    navigate(ROUTES.CUSTOMER_HORSES);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
          {t('common.loading')}
        </Text>
      </div>
    );
  }

  if (error || !horse) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center' }}>
        <Empty
          description={
            <div>
              <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                {t('horses.notFound')}
              </Text>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                #{id}
              </Text>
            </div>
          }
        >
          <Button type="primary" onClick={handleBackToList} style={{ marginTop: 16 }}>
            {t('common.back')}
          </Button>
        </Empty>
      </div>
    );
  }

  const age = horse.DateOfBirth
    ? dayjs().diff(dayjs(horse.DateOfBirth), 'year')
    : null;

  // Cấu hình bảng Hồ sơ thú y
  const vetColumns = [
    {
      title: t('horses.vetItem'),
      dataIndex: 'Title',
      key: 'Title',
      render: (title, record) => (
        <div>
          <strong style={{ color: '#0f172a' }}>{title}</strong>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {t('horses.assignedVet', { vet: record.Veterinarian, clinic: record.Clinic })}
          </div>
        </div>
      ),
    },
    {
      title: t('horses.issueDate'),
      dataIndex: 'Date',
      key: 'Date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: t('horses.validUntil'),
      dataIndex: 'ValidUntil',
      key: 'ValidUntil',
      render: (date) => (
        <span style={{ color: '#059669', fontWeight: 500 }}>
          {dayjs(date).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: t('horses.recordStatus'),
      dataIndex: 'Status',
      key: 'Status',
      render: (status) => (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          {status === 'Valid' ? t('horses.statusValid') : status}
        </Tag>
      ),
    },
    {
      title: t('horses.notes'),
      dataIndex: 'Notes',
      key: 'Notes',
      render: (notes) => <span style={{ fontSize: 12 }}>{notes}</span>,
    },
  ];

  // Cấu hình bảng Lịch sử vận chuyển
  const tripColumns = [
    {
      title: t('horses.tripCode'),
      dataIndex: 'BookingCode',
      key: 'BookingCode',
      render: (code, record) => (
        <div>
          <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{code}</strong>
          <div style={{ fontSize: 12, color: '#64748b' }}>{record.VehicleCode}</div>
        </div>
      ),
    },
    {
      title: t('horses.tripRoute'),
      dataIndex: 'Route',
      key: 'Route',
      render: (route, record) => (
        <div>
          <span>{route}</span>
          <div>
            <Tag color={record.TransportMode === 'Air' ? 'blue' : 'orange'} style={{ fontSize: 11 }}>
              {record.TransportMode === 'Air' ? t('horses.modeAir') : t('horses.modeGround')}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: t('horses.tripTime'),
      dataIndex: 'DepartureDate',
      key: 'DepartureDate',
      render: (dep, record) => (
        <span style={{ fontSize: 13 }}>
          {dayjs(dep).format('DD/MM/YYYY')} ➔ {dayjs(record.ArrivalDate).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: t('horses.welfareScore'),
      dataIndex: 'WelfareScore',
      key: 'WelfareScore',
      render: (score) => <Tag color="green">{score}</Tag>,
    },
    {
      title: t('horses.recordStatus'),
      dataIndex: 'Status',
      key: 'Status',
      render: (st) => (
        <Tag color={st === 'InTransit' ? 'processing' : 'success'}>
          {st === 'InTransit' ? t('horses.statusInTransit') : t('horses.statusCompleted')}
        </Tag>
      ),
    },
  ];

  // Danh sách các Tabs
  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <InfoCircleOutlined /> {t('horses.tabs.general')}
        </span>
      ),
      children: (
        <Card bordered style={{ borderRadius: 12, borderColor: '#e2e8f0', marginTop: 12 }}>
          <Title level={5} style={{ margin: '0 0 16px', color: '#0f172a' }}>
            {t('horses.biometricCare')}
          </Title>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: 8, marginBottom: 16, border: '1px solid #f1f5f9' }}>
            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
              {t('horses.fields.specialCare')}:
            </Text>
            <Text strong style={{ color: '#0f172a' }}>
              {horse.SpecialCareRequirements || t('horses.specialCareNone')}
            </Text>
          </div>

          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} styles={{ label: { fontWeight: 600, color: '#475569' } }}>
            <Descriptions.Item label={t('horses.fields.color')}>{horse.Color || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('horses.vaccineStatus')}>
              <Tag color="success">{t('horses.vaccineCompleted')}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('horses.fitCertificate')}>
              <Tag color="cyan">{t('horses.iataStandard')}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('horses.registrationDate')}>
              {dayjs(horse.CreatedAt).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label={t('horses.recordStatus')}>
              <Tag color={horse.IsActive ? 'success' : 'default'}>
                {horse.IsActive ? t('horses.activeStatus') : t('horses.inactiveStatus')}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'vet',
      label: (
        <span>
          <MedicineBoxOutlined /> {t('horses.tabs.vetRecords')}
        </span>
      ),
      children: (
        <Card bordered style={{ borderRadius: 12, borderColor: '#e2e8f0', marginTop: 12 }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
            <div>
              <Title level={5} style={{ margin: 0, color: '#0f172a' }}>
                {t('horses.vetHistory')}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('horses.vetSupervised')}
              </Text>
            </div>
            <Tag color="blue">{t('horses.totalRecords', { count: horse.VetRecords?.length || 0 })}</Tag>
          </Flex>

          <Table
            columns={vetColumns}
            dataSource={horse.VetRecords || []}
            rowKey="RecordID"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'trips',
      label: (
        <span>
          <CarOutlined /> {t('horses.tabs.tripHistory')}
        </span>
      ),
      children: (
        <Card bordered style={{ borderRadius: 12, borderColor: '#e2e8f0', marginTop: 12 }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
            <div>
              <Title level={5} style={{ margin: 0, color: '#0f172a' }}>
                {t('horses.tripHistory')}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('horses.tripHistoryDesc')}
              </Text>
            </div>
            <Tag color="orange">{t('horses.totalTrips', { count: horse.TransportHistory?.length || 0 })}</Tag>
          </Flex>

          <Table
            columns={tripColumns}
            dataSource={horse.TransportHistory || []}
            rowKey="TripID"
            pagination={false}
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header trang & nút quay lại */}
      <PageHeader
        title={t('horses.detailTitle')}
        breadcrumb={[
          { label: t('nav.horses'), path: ROUTES.CUSTOMER_HORSES },
          { label: horse.Name },
        ]}
        actions={
          <Space>
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={handleOpenEdit}
            >
              {t('horses.editHorse')}
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList}>
              {t('common.back')}
            </Button>
          </Space>
        }
      />

      {/* Cảnh báo nghiêm cấm vận chuyển khi ngựa ở mức Critical Risk */}
      {(() => {
        const risk = calculateHorseRisk(horse, i18n.language);
        if (risk.level !== 'CRITICAL') return null;
        return (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>🚫</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>
                {t('horses.prohibitedTitle')}
              </div>
              <div style={{ fontSize: 13, color: '#B91C1C', marginTop: 4, lineHeight: 1.45, fontWeight: 500 }}>
                {t('horses.prohibitedDetail', { status: horse.HealthStatus })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* KHỐI TỔNG QUAN HỒ SƠ (AntD Descriptions) */}
      <Card
        bordered
        style={{
          borderRadius: 14,
          borderColor: '#e2e8f0',
          marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginBottom: 20 }}>
          <Space size="middle" align="center">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              🐴
            </div>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                {horse.Name}
              </Title>
              <Space size="small" style={{ marginTop: 4 }}>
                <Tag color="blue">{horse.Breed}</Tag>
                <Tag color="gold">
                  {t(`horses.genderOptions.${horse.Gender?.toLowerCase()}`) || horse.Gender}
                </Tag>
                <HealthStatusTag status={horse.HealthStatus} />
                <RiskBadge risk={calculateHorseRisk(horse, i18n.language)} />
              </Space>
            </div>
          </Space>
        </Flex>

        {/* AntD Descriptions hiển thị 3 cột x 2 hàng cân xứng tuyệt đối */}
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 3 }}
          styles={{ label: { fontWeight: 600, color: '#475569' } }}
        >
          <Descriptions.Item label={t('horses.fields.microchip')}>
            <code
              style={{
                backgroundColor: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#0f172a',
                whiteSpace: 'nowrap',
              }}
            >
              {horse.MicrochipNumber || '-'}
            </code>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.passport')}>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: '#0f172a' }}>
              {horse.PassportNumber || t('horses.noPassport')}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.dobAge')}>
            <span style={{ whiteSpace: 'nowrap' }}>
              {horse.DateOfBirth ? `${dayjs(horse.DateOfBirth).format('DD/MM/YYYY')} (${age} ${t('horses.yearsOld')})` : '-'}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.color')}>
            <span>{horse.Color || '-'}</span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.gender')}>
            <span>{t(`horses.genderOptions.${horse.Gender?.toLowerCase()}`) || horse.Gender}</span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.status')}>
            <Tag color={horse.IsActive ? 'success' : 'default'} style={{ margin: 0 }}>
              {horse.IsActive ? t('horses.activeRacing') : t('horses.resting')}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* KHỐI TABS: THÔNG TIN CHUNG / HỒ SƠ THÚ Y / LỊCH SỬ VẬN CHUYỂN */}
      <Tabs defaultActiveKey="general" items={tabItems} size="large" />

      {/* MODAL CHỈNH SỬA THÔNG TIN NGỰA */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700 }}>
            <span>✏️ {t('horses.editModalTitle')}</span>
            <Tag color="gold">{horse.Name}</Tag>
          </div>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={editSubmitting}
        okText={t('horses.saveChanges')}
        cancelText={t('horses.cancel')}
        destroyOnClose
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEdit}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="Name"
                label={<span style={{ fontWeight: 600 }}>{t('horses.fields.name')}</span>}
                rules={[{ required: true, message: t('horses.validation.nameRequired') }]}
              >
                <Input placeholder={t('horses.placeholders.name')} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="Breed"
                label={<span style={{ fontWeight: 600 }}>{t('horses.fields.breed')}</span>}
                rules={[{ required: true, message: t('horses.validation.breedRequired') }]}
              >
                <Select size="large">
                  <Select.Option value="Thoroughbred">
                    {t('horses.breedOptions.Thoroughbred')}
                  </Select.Option>
                  <Select.Option value="Quarter Horse">
                    {t('horses.breedOptions.Quarter Horse')}
                  </Select.Option>
                  <Select.Option value="Arabian">
                    {t('horses.breedOptions.Arabian')}
                  </Select.Option>
                  <Select.Option value="Warmblood">
                    {t('horses.breedOptions.Warmblood')}
                  </Select.Option>
                  <Select.Option value="Appaloosa">
                    {t('horses.breedOptions.Appaloosa')}
                  </Select.Option>
                  <Select.Option value="Standardbred">
                    {t('horses.breedOptions.Standardbred')}
                  </Select.Option>
                  <Select.Option value="Andalusian">
                    {t('horses.breedOptions.Andalusian')}
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="Gender" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.gender')}</span>}>
                <Select size="large">
                  <Select.Option value="Stallion">{t('horses.genderOptions.stallion')}</Select.Option>
                  <Select.Option value="Mare">{t('horses.genderOptions.mare')}</Select.Option>
                  <Select.Option value="Gelding">{t('horses.genderOptions.gelding')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="DateOfBirth" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.dob')}</span>}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="Color" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.color')}</span>}>
                <Input placeholder={t('horses.placeholders.color')} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="MicrochipNumber" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.microchip')}</span>}>
                <Input placeholder={t('horses.placeholders.microchip')} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="PassportNumber" label={<span style={{ fontWeight: 600 }}>{t('horses.fields.passport')}</span>}>
                <Input placeholder={t('horses.placeholders.passport')} size="large" />
              </Form.Item>
            </Col>
          </Row>

          {/* ĐÁNH GIÁ SỨC KHỎE */}
          <Form.Item
            name="HealthStatus"
            label={<span style={{ fontWeight: 600 }}>{t('horses.healthStatusForm')}</span>}
          >
            <Select
              size="large"
              options={[
                {
                  value: 'Excellent',
                  label: (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <HealthStatusTag status="Excellent" size="small" />
                      <span style={{ fontSize: 13 }}>{t('horses.healthOptions.excellent')}</span>
                    </div>
                  ),
                },
                {
                  value: 'Good',
                  label: (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <HealthStatusTag status="Good" size="small" />
                      <span style={{ fontSize: 13 }}>{t('horses.healthOptions.good')}</span>
                    </div>
                  ),
                },
                {
                  value: 'Attention',
                  label: (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <HealthStatusTag status="Attention" size="small" />
                      <span style={{ fontSize: 13 }}>{t('horses.healthOptions.attention')}</span>
                    </div>
                  ),
                },
                {
                  value: 'Critical',
                  label: (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <HealthStatusTag status="Critical" size="small" />
                      <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 600 }}>{t('horses.healthOptions.critical')}</span>
                    </div>
                  ),
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="SpecialCareRequirements"
            label={<span style={{ fontWeight: 600 }}>{t('horses.fields.specialCare')}</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder={t('horses.specialCarePlaceholder')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
