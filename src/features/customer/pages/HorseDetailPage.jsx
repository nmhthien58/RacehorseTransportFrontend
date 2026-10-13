import { useState } from 'react';
import {
  Alert,
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
  Popconfirm,
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
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import horseService from '@services/horseService';
import PageHeader from '@components/layout/PageHeader';
import useHorseDetail from '@features/customer/hooks/useHorseDetail';
import { checkHorseTransportEligibility } from '@utils/horseHealth';
import { ROUTES } from '@routes/routes';
import EditHorseModal from '@features/customer/components/EditHorseModal';

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

  const [vetModalVisible, setVetModalVisible] = useState(false);
  const [vetSubmitting, setVetSubmitting] = useState(false);
  const [editingVetRecord, setEditingVetRecord] = useState(null);
  const [vetForm] = Form.useForm();

  const handleOpenAddVetRecord = () => {
    setEditingVetRecord(null);
    vetForm.resetFields();
    vetForm.setFieldsValue({
      recordType: 'GeneralCheckup',
      status: 'Valid',
      date: dayjs(),
      validUntil: dayjs().add(6, 'month'),
      veterinarian: 'Dr. Sarah Jenkins (FEI Accredited)',
      clinic: 'Bệnh viện Thú y Quốc tế IET',
    });
    setVetModalVisible(true);
  };

  const handleOpenEditVetRecord = (record) => {
    setEditingVetRecord(record);
    const recDate = record.date || record.Date;
    const recValidUntil = record.validUntil || record.ValidUntil;
    vetForm.setFieldsValue({
      title: record.title || record.Title || '',
      recordType: record.recordType || record.RecordType || 'GeneralCheckup',
      veterinarian: record.veterinarian || record.Veterinarian || '',
      clinic: record.clinic || record.Clinic || '',
      date: recDate ? dayjs(recDate) : null,
      validUntil: recValidUntil ? dayjs(recValidUntil) : null,
      status: record.status || record.Status || 'Valid',
      notes: record.notes || record.Notes || '',
    });
    setVetModalVisible(true);
  };

  const handleSaveVetRecord = async (values) => {
    try {
      setVetSubmitting(true);
      const payload = {
        title: values.title?.trim(),
        recordType: values.recordType,
        veterinarian: values.veterinarian?.trim(),
        clinic: values.clinic?.trim(),
        date: values.date ? values.date.format('YYYY-MM-DD') : null,
        validUntil: values.validUntil ? values.validUntil.format('YYYY-MM-DD') : null,
        status: values.status,
        notes: values.notes?.trim() || '',
      };
      const horseId = horse.horseId || horse.HorseID;
      if (editingVetRecord) {
        const recId = editingVetRecord.recordId || editingVetRecord.RecordID;
        await horseService.updateVetRecord(horseId, recId, payload);
        message.success(t('horses.updateSuccess') || 'Cập nhật hồ sơ thú y thành công');
      } else {
        await horseService.addVetRecord(horseId, payload);
        message.success(t('horses.addSuccess') || 'Bổ sung hồ sơ thú y thành công');
      }
      setVetModalVisible(false);
      refetch?.();
    } catch (err) {
      console.error(err);
      message.error('Thao tác hồ sơ thú y thất bại');
    } finally {
      setVetSubmitting(false);
    }
  };

  const handleDeleteVetRecord = async (recordId) => {
    try {
      const horseId = horse.horseId || horse.HorseID;
      await horseService.deleteVetRecord(horseId, recordId);
      message.success(t('horses.deleteSuccess') || 'Đã xóa hồ sơ thú y');
      refetch?.();
    } catch (err) {
      console.error(err);
      message.error('Không thể xóa hồ sơ thú y');
    }
  };

  const handleOpenEdit = () => {
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values) => {
    try {
      setEditSubmitting(true);
      const horseId = horse.horseId || horse.HorseID;
      await horseService.updateHorse(horseId, values);
      message.success(t('horses.updateHorseSuccess'));
      setEditModalVisible(false);
      refetch?.();
    } catch (err) {
      console.error(err);
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

  const horseDob = horse.dateOfBirth || horse.DateOfBirth;
  const age = horseDob ? dayjs().diff(dayjs(horseDob), 'year') : null;
  const eligibility = checkHorseTransportEligibility(horse, i18n?.language);

  // Cấu hình bảng Hồ sơ thú y
  const vetColumns = [
    {
      title: t('horses.vetItem'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => {
        const itemTitle = text || record.Title || record.title;
        const vet = record.veterinarian || record.Veterinarian;
        const clinic = record.clinic || record.Clinic;
        return (
          <div>
            <strong style={{ color: '#0f172a' }}>{itemTitle}</strong>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {t('horses.assignedVet', { vet, clinic })}
            </div>
          </div>
        );
      },
    },
    {
      title: t('horses.issueDate'),
      dataIndex: 'date',
      key: 'date',
      render: (d, record) => {
        const val = d || record.Date;
        return val ? dayjs(val).format('DD/MM/YYYY') : '-';
      },
    },
    {
      title: t('horses.validUntil'),
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (d, record) => {
        const val = d || record.ValidUntil;
        return val ? (
          <span style={{ color: '#059669', fontWeight: 500 }}>
            {dayjs(val).format('DD/MM/YYYY')}
          </span>
        ) : '-';
      },
    },
    {
      title: t('horses.recordStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (st, record) => {
        const val = st || record.Status;
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            {val === 'Valid' ? t('horses.statusValid') : val}
          </Tag>
        );
      },
    },
    {
      title: t('horses.notes'),
      dataIndex: 'notes',
      key: 'notes',
      render: (notes, record) => <span style={{ fontSize: 12 }}>{notes || record.Notes || '-'}</span>,
    },
    {
      title: t('horses.columns.action') || 'Thao tác',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_, record) => {
        const recId = record.recordId || record.RecordID;
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditVetRecord(record)}
            >
              {t('common.edit') || 'Sửa'}
            </Button>
            <Popconfirm
              title={t('horses.confirmDeleteVetRecord') || 'Xóa hồ sơ thú y?'}
              description={t('horses.confirmDeleteVetRecordDesc') || 'Hồ sơ sẽ bị gỡ bỏ khỏi dữ liệu cá thể.'}
              onConfirm={() => handleDeleteVetRecord(recId)}
              okText={t('common.delete') || 'Xóa'}
              cancelText={t('common.cancel') || 'Hủy'}
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                {t('common.delete') || 'Xóa'}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // Cấu hình bảng Lịch sử vận chuyển
  const tripColumns = [
    {
      title: t('horses.tripCode'),
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      render: (code, record) => {
        const bCode = code || record.BookingCode;
        const vCode = record.vehicleCode || record.VehicleCode;
        return (
          <div>
            <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{bCode}</strong>
            <div style={{ fontSize: 12, color: '#64748b' }}>{vCode}</div>
          </div>
        );
      },
    },
    {
      title: t('horses.tripRoute'),
      dataIndex: 'route',
      key: 'route',
      render: (route, record) => {
        const rName = route || record.Route;
        const mode = record.transportMode || record.TransportMode;
        return (
          <div>
            <span>{rName}</span>
            <div>
              <Tag color={mode === 'Air' ? 'blue' : 'orange'} style={{ fontSize: 11 }}>
                {mode === 'Air' ? t('horses.modeAir') : t('horses.modeGround')}
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: t('horses.tripTime'),
      dataIndex: 'departureDate',
      key: 'departureDate',
      render: (dep, record) => {
        const depDate = dep || record.DepartureDate;
        const arrDate = record.arrivalDate || record.ArrivalDate;
        return (
          <span style={{ fontSize: 13 }}>
            {depDate ? dayjs(depDate).format('DD/MM/YYYY') : '-'} ➔ {arrDate ? dayjs(arrDate).format('DD/MM/YYYY') : '-'}
          </span>
        );
      },
    },
    {
      title: t('horses.welfareScore'),
      dataIndex: 'welfareScore',
      key: 'welfareScore',
      render: (score, record) => {
        const val = score ?? record.WelfareScore;
        return val ? <Tag color="green">{val}</Tag> : '-';
      },
    },
    {
      title: t('horses.recordStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (st, record) => {
        const status = st || record.Status;
        return (
          <Tag color={status === 'InTransit' ? 'processing' : 'success'}>
            {status === 'InTransit' ? t('horses.statusInTransit') : t('horses.statusCompleted')}
          </Tag>
        );
      },
    },
  ];

  const horseName = horse.name || horse.Name;
  const horseBreed = horse.breed || horse.Breed;
  const horseGender = horse.gender || horse.Gender;
  const horseMicrochip = horse.microchipNumber || horse.MicrochipNumber;
  const horsePassport = horse.passportNumber || horse.PassportNumber;
  const horseColor = horse.color || horse.Color;
  const horseCare = horse.specialCareRequirements || horse.SpecialCareRequirements;
  const horseActive = horse.isActive ?? horse.IsActive ?? true;
  const horseCreated = horse.createdAt || horse.CreatedAt;

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
              {horseCare || t('horses.specialCareNone')}
            </Text>
          </div>

          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} styles={{ label: { fontWeight: 600, color: '#475569' } }}>
            <Descriptions.Item label={t('horses.fields.color')}>{horseColor || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('horses.vaccineStatus')}>
              <Tag color="success">{t('horses.vaccineCompleted')}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('horses.fitCertificate')}>
              <Tag color={eligibility.tagColor} style={{ fontWeight: 600 }}>
                {eligibility.tagText}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('horses.registrationDate')}>
              {horseCreated ? dayjs(horseCreated).format('DD/MM/YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('horses.recordStatus')}>
              <Tag color={horseActive ? 'success' : 'default'}>
                {horseActive ? t('horses.activeStatus') : t('horses.inactiveStatus')}
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
            <Space>
              <Tag color="blue">{t('horses.totalRecords', { count: (horse.vetRecords || horse.VetRecords || []).length })}</Tag>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleOpenAddVetRecord}
              >
                + Bổ sung hồ sơ thú y
              </Button>
            </Space>
          </Flex>

          <Table
            columns={vetColumns}
            dataSource={horse.vetRecords || horse.VetRecords || []}
            rowKey={(r, idx) => r.recordId || r.RecordID || r.title || r.Title || `vet-${idx}`}
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
            <Tag color="orange">{t('horses.totalTrips', { count: (horse.transportHistory || horse.TransportHistory || []).length })}</Tag>
          </Flex>

          <Table
            columns={tripColumns}
            dataSource={horse.transportHistory || horse.TransportHistory || []}
            rowKey={(r, idx) => r.tripId || r.TripID || r.bookingCode || r.BookingCode || `trip-${idx}`}
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
          { label: horseName },
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
                {horseName}
              </Title>
              <Space size="small" style={{ marginTop: 4 }}>
                <Tag color="blue">{horseBreed}</Tag>
                <Tag color="gold">
                  {t(`horses.genderOptions.${horseGender?.toLowerCase()}`) || horseGender}
                </Tag>
                <Tag color={horseActive ? 'success' : 'default'}>
                  {horseActive ? t('horses.activeRacing') : t('horses.resting')}
                </Tag>
                <Tag color={eligibility.tagColor} style={{ fontWeight: 600 }}>
                  {eligibility.tagText}
                </Tag>
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
              {horseMicrochip || '-'}
            </code>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.passport')}>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: '#0f172a' }}>
              {horsePassport || t('horses.noPassport')}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.dobAge')}>
            <span style={{ whiteSpace: 'nowrap' }}>
              {horseDob ? `${dayjs(horseDob).format('DD/MM/YYYY')} (${age} ${t('horses.yearsOld')})` : '-'}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.color')}>
            <span>{horseColor || '-'}</span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.gender')}>
            <span>{t(`horses.genderOptions.${horseGender?.toLowerCase()}`) || horseGender}</span>
          </Descriptions.Item>

          <Descriptions.Item label={t('horses.fields.status')}>
            <Tag color={horseActive ? 'success' : 'default'} style={{ margin: 0 }}>
              {horseActive ? t('horses.activeRacing') : t('horses.resting')}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {!eligibility.eligible && (
          <div style={{ marginTop: 16 }}>
            <Alert
              type={eligibility.reason === 'CRITICAL_CONDITION' ? 'error' : 'warning'}
              showIcon
              message={eligibility.tagText}
              description={eligibility.message}
            />
          </div>
        )}
      </Card>

      {/* KHỐI TABS: THÔNG TIN CHUNG / HỒ SƠ THÚ Y / LỊCH SỬ VẬN CHUYỂN */}
      <Tabs defaultActiveKey="general" items={tabItems} size="large" />

      {/* MODAL CHỈNH SỬA THÔNG TIN NGỰA (Dùng chung) */}
      <EditHorseModal
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
        horse={horse}
        confirmLoading={editSubmitting}
      />

      {/* MODAL THÊM / CHỈNH SỬA HỒ SƠ THÚ Y */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700 }}>
            <span>{editingVetRecord ? '✏️ Chỉnh sửa hồ sơ thú y' : '➕ Bổ sung hồ sơ thú y'}</span>
            <Tag color="blue">{horseName}</Tag>
          </div>
        }
        open={vetModalVisible}
        onCancel={() => setVetModalVisible(false)}
        onOk={() => vetForm.submit()}
        confirmLoading={vetSubmitting}
        okText={t('common.save') || 'Lưu hồ sơ'}
        cancelText={t('common.cancel') || 'Hủy'}
        destroyOnClose
        width={640}
      >
        <Form
          form={vetForm}
          layout="vertical"
          onFinish={handleSaveVetRecord}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label={<span style={{ fontWeight: 600 }}>Tên tài liệu / Hạng mục kiểm dịch</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên tài liệu hoặc hạng mục' }]}
          >
            <Input placeholder="Ví dụ: Giấy chứng nhận kiểm dịch CVI, Xét nghiệm Coggins..." size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="recordType"
                label={<span style={{ fontWeight: 600 }}>Loại tài liệu</span>}
                rules={[{ required: true, message: 'Vui lòng chọn loại tài liệu' }]}
              >
                <Select size="large">
                  <Select.Option value="CVI">Chứng nhận kiểm dịch xuất xứ (CVI)</Select.Option>
                  <Select.Option value="Passport">Hộ chiếu ngựa quốc tế (FEI Passport)</Select.Option>
                  <Select.Option value="Vaccination">Hồ sơ tiêm chủng (Vaccination)</Select.Option>
                  <Select.Option value="BloodTest">Xét nghiệm huyết thanh Coggins / EVA</Select.Option>
                  <Select.Option value="GeneralCheckup">Khám lâm sàng Fit-to-Travel</Select.Option>
                  <Select.Option value="Quarantine">Chứng nhận cách ly kiểm dịch</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label={<span style={{ fontWeight: 600 }}>Trạng thái</span>}
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select size="large">
                  <Select.Option value="Valid">Còn hiệu lực (Valid)</Select.Option>
                  <Select.Option value="Pending">Chờ phê duyệt (Pending)</Select.Option>
                  <Select.Option value="Expired">Hết hiệu lực (Expired)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="veterinarian"
                label={<span style={{ fontWeight: 600 }}>Bác sĩ thú y phụ trách</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên bác sĩ thú y' }]}
              >
                <Input placeholder="Ví dụ: Dr. Sarah Jenkins (FEI)" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="clinic"
                label={<span style={{ fontWeight: 600 }}>Cơ sở / Bệnh viện thú y</span>}
              >
                <Input placeholder="Ví dụ: Bệnh viện Thú y Quốc tế IET" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="date"
                label={<span style={{ fontWeight: 600 }}>Ngày cấp / Ngày kiểm tra</span>}
                rules={[{ required: true, message: 'Vui lòng chọn ngày cấp' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="validUntil"
                label={<span style={{ fontWeight: 600 }}>Hạn hiệu lực</span>}
                rules={[{ required: true, message: 'Vui lòng chọn hạn hiệu lực' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label={<span style={{ fontWeight: 600 }}>Ghi chú / Kết luận kiểm dịch</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ghi chú lâm sàng, chỉ định đặc biệt khi di chuyển..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
