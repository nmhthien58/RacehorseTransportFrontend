import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  BarsOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import DataTable from '@components/common/DataTable';
import StatusTag from '@components/common/StatusTag';
import HorseCard from '@features/customer/components/HorseCard';
import horseService from '@services/horseService';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';
import {
  calculateHorseRisk,
  HealthStatusTag,
  RiskBadge,
} from '@utils/horseHealth';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Trang quản lý hồ sơ ngựa đua dành cho khách hàng (Customer)
 * Tái hiện phong cách Frame 70:706 của Figma kết hợp linh hoạt Grid & Table view
 *
 * @returns {JSX.Element}
 */
export default function CustomerHorses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingHorse, setEditingHorse] = useState(null);

  // Tải danh sách ngựa từ API khi mount hoặc khi refreshKey thay đổi
  useEffect(() => {
    let isSubscribed = true;

    horseService
      .getHorses({
        ownerId: user?.UserID || undefined,
      })
      .then((res) => {
        if (isSubscribed) {
          setHorses(res.data?.data || res.data || []);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          message.error(t('common.loading'));
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [user, refreshKey, t]);

  /**
   * Kích hoạt tải lại dữ liệu danh sách
   */
  const triggerReload = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  /**
   * Điều hướng sang trang thêm ngựa mới (/customer/horses/new)
   */
  const handleNavigateToAddHorse = () => {
    navigate(ROUTES.CUSTOMER_HORSE_NEW);
  };

  /**
   * Mở modal sửa thông tin nhanh
   * @param {import('@types/database').Horse} record
   */
  const handleOpenEditModal = (record) => {
    setEditingHorse(record);
    form.setFieldsValue({
      Name: record.Name,
      Breed: record.Breed,
      Gender: record.Gender,
      DateOfBirth: record.DateOfBirth ? dayjs(record.DateOfBirth) : null,
      MicrochipNumber: record.MicrochipNumber,
      PassportNumber: record.PassportNumber,
      Color: record.Color,
      HealthStatus: record.HealthStatus || 'Good',
      SpecialCareRequirements: record.SpecialCareRequirements,
    });
    setEditModalVisible(true);
  };

  /**
   * Đóng modal chỉnh sửa
   */
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingHorse(null);
    form.resetFields();
  };

  /**
   * Xử lý submit form Chỉnh sửa nhanh
   */
  const handleEditSubmit = async (values) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        DateOfBirth: values.DateOfBirth
          ? values.DateOfBirth.format('YYYY-MM-DD')
          : null,
      };

      if (editingHorse) {
        await horseService.updateHorse(editingHorse.HorseID, payload);
        message.success(t('horses.updateSuccess'));
      }

      handleCloseEditModal();
      triggerReload();
    } catch {
      message.error(t('common.save'));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Xóa hồ sơ ngựa
   * @param {number} horseId
   */
  const handleDeleteHorse = async (horseId) => {
    try {
      await horseService.deleteHorse(horseId);
      message.success(t('horses.deleteSuccess'));
      triggerReload();
    } catch {
      message.error(t('common.delete'));
    }
  };

  // Tính toán số liệu thống kê đầu trang theo Frame 70:706 của Figma
  const totalCount = horses.length;
  const docsCompleteCount = horses.filter(
    (h) => h.PassportNumber && h.MicrochipNumber,
  ).length;
  const needAttentionCount = horses.filter(
    (h) => !h.PassportNumber || (h.SpecialCareRequirements && h.SpecialCareRequirements.length > 20),
  ).length;

  // Cấu hình các cột của bảng danh sách khi chuyển qua Table View
  const columns = [
    {
      title: t('horses.fields.name'),
      dataIndex: 'Name',
      key: 'Name',
      render: (text) => (
        <Space size="small">
          <span style={{ fontSize: 18 }}>🐴</span>
          <strong style={{ color: '#0f172a' }}>{text}</strong>
        </Space>
      ),
    },
    {
      title: t('horses.fields.breed'),
      dataIndex: 'Breed',
      key: 'Breed',
      render: (breed) => <Tag color="blue">{breed}</Tag>,
    },
    {
      title: t('horses.fields.gender'),
      dataIndex: 'Gender',
      key: 'Gender',
      render: (gender) => {
        const genderKey = gender ? gender.toLowerCase() : '';
        return t(`horses.genderOptions.${genderKey}`) || gender || '-';
      },
    },
    {
      title: t('horses.fields.microchip'),
      dataIndex: 'MicrochipNumber',
      key: 'MicrochipNumber',
      render: (code) => (
        <code
          style={{
            fontSize: 12,
            background: '#f1f5f9',
            padding: '3px 8px',
            borderRadius: 6,
          }}
        >
          {code || '-'}
        </code>
      ),
    },
    {
      title: t('horses.fields.passport'),
      dataIndex: 'PassportNumber',
      key: 'PassportNumber',
      render: (passport) => passport || '-',
    },
    {
      title: t('horses.fields.dob'),
      dataIndex: 'DateOfBirth',
      key: 'DateOfBirth',
      render: (dob) => (dob ? dayjs(dob).format('DD/MM/YYYY') : '-'),
    },
    {
      title: t('horses.columns.health') || 'Sức khỏe',
      dataIndex: 'HealthStatus',
      key: 'HealthStatus',
      render: (status) => <HealthStatusTag status={status} size="small" />,
    },
    {
      title: 'Mức rủi ro',
      key: 'RiskLevel',
      render: (_, record) => {
        const risk = calculateHorseRisk(record);
        return <RiskBadge risk={risk} size="small" />;
      },
    },
    {
      title: t('horses.fields.status'),
      dataIndex: 'IsActive',
      key: 'IsActive',
      render: (isActive) => (
        <StatusTag status={isActive ? 'Available' : 'Maintenance'} />
      ),
    },
    {
      title: t('table.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditModal(record)}
            aria-label={t('common.edit')}
          />
          <Popconfirm
            title={t('horses.deleteConfirm')}
            onConfirm={() => handleDeleteHorse(record.HorseID)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={t('common.delete')}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Tiêu đề trang + Nút Thêm ngựa mới dẫn tới /customer/horses/new */}
      <PageHeader
        title={t('horses.title')}
        subtitle={t('horses.subtitle')}
        actions={
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleNavigateToAddHorse}
            style={{
              fontWeight: 700,
              borderRadius: 9999,
              height: 44,
              padding: '0 24px',
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {t('horses.add')}
          </Button>
        }
      />

      {/* 3 THẺ THỐNG KÊ TỔNG QUAN THEO FIGMA FRAME 70:706 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Flex justify="space-between" align="center">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t('horses.stats.totalHorses')}
                </Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, color: '#0f172a' }}>
                  {totalCount}
                </Title>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                  fontSize: 22,
                }}
              >
                <FireOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Flex justify="space-between" align="center">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t('horses.stats.docsComplete')}
                </Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, color: '#10b981' }}>
                  {docsCompleteCount}
                </Title>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  fontSize: 22,
                }}
              >
                <CheckCircleOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card
            bordered
            style={{
              borderRadius: 14,
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Flex justify="space-between" align="center">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t('horses.stats.needAttention')}
                </Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800, color: '#f59e0b' }}>
                  {needAttentionCount}
                </Title>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  fontSize: 22,
                }}
              >
                <ExclamationCircleOutlined />
              </div>
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* THANH ĐIỀU HƯỚNG CHUYỂN ĐỔI GIAO DIỆN (GRID vs TABLE) */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
            {t('horses.listTitle')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('horses.listSubtitle')}
          </Text>
        </div>

        <Segmented
          value={viewMode}
          onChange={setViewMode}
          options={[
            {
              value: 'grid',
              label: t('horses.views.grid'),
              icon: <AppstoreOutlined />,
            },
            {
              value: 'table',
              label: t('horses.views.table'),
              icon: <BarsOutlined />,
            },
          ]}
        />
      </Flex>

      {/* NỘI DUNG HIỂN THỊ DANH SÁCH */}
      {loading ? (
        <Card style={{ textAlign: 'center', padding: '60px 0', borderRadius: 12 }}>
          <Spin size="large" />
          <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
            {t('common.loading')}
          </Text>
        </Card>
      ) : horses.length === 0 ? (
        <Card style={{ padding: '60px 0', textAlign: 'center', borderRadius: 12 }}>
          <Empty
            description={t('horses.emptyText')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleNavigateToAddHorse}
              style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
            >
              {t('horses.addNow')}
            </Button>
          </Empty>
        </Card>
      ) : viewMode === 'grid' ? (
        <Row gutter={[20, 20]}>
          {horses.map((horse) => (
            <Col key={horse.HorseID} xs={24} sm={12} lg={8}>
              <HorseCard
                horse={horse}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteHorse}
                onView={() => handleOpenEditModal(horse)}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 12, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            dataSource={horses}
            rowKey="HorseID"
            loading={loading}
          />
        </Card>
      )}

      {/* Modal Chỉnh sửa thông tin nhanh */}
      <Modal
        title={t('horses.edit')}
        open={editModalVisible}
        onCancel={handleCloseEditModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnHidden
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          initialValues={{
            Gender: 'Stallion',
            Breed: 'Thoroughbred',
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="Name"
                label={t('horses.fields.name')}
                rules={[
                  {
                    required: true,
                    message: t('horses.validation.nameRequired'),
                  },
                ]}
              >
                <Input placeholder={t('horses.fields.name')} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="Breed"
                label={t('horses.fields.breed')}
                rules={[
                  {
                    required: true,
                    message: t('horses.validation.breedRequired'),
                  },
                ]}
              >
                <Select>
                  <Select.Option value="Thoroughbred">Thoroughbred</Select.Option>
                  <Select.Option value="Arabian">Arabian</Select.Option>
                  <Select.Option value="Quarter Horse">Quarter Horse</Select.Option>
                  <Select.Option value="Warmblood">Warmblood</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="Gender" label={t('horses.fields.gender')}>
                <Select>
                  <Select.Option value="Stallion">
                    {t('horses.genderOptions.stallion')}
                  </Select.Option>
                  <Select.Option value="Mare">
                    {t('horses.genderOptions.mare')}
                  </Select.Option>
                  <Select.Option value="Gelding">
                    {t('horses.genderOptions.gelding')}
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="DateOfBirth" label={t('horses.fields.dob')}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="MicrochipNumber"
                label={t('horses.fields.microchip')}
                rules={[
                  {
                    required: true,
                    message: t('horses.validation.microchipRequired'),
                  },
                ]}
              >
                <Input placeholder="e.g. 982000412345678" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="PassportNumber"
                label={t('horses.fields.passport')}
              >
                <Input placeholder="e.g. FEI-VN-2026-01" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="Color" label={t('horses.fields.color')}>
                <Input placeholder="e.g. Hồng sắc, Bạch sắc, Ô sắc" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="HealthStatus" label="Đánh giá sức khỏe (Health Status)">
                <Select
                  options={[
                    {
                      value: 'Excellent',
                      label: (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <HealthStatusTag status="Excellent" size="small" />
                          <span style={{ fontSize: 13 }}>Xuất sắc (Tối ưu thi đấu)</span>
                        </div>
                      ),
                    },
                    {
                      value: 'Good',
                      label: (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <HealthStatusTag status="Good" size="small" />
                          <span style={{ fontSize: 13 }}>Khỏe mạnh (Ổn định)</span>
                        </div>
                      ),
                    },
                    {
                      value: 'Attention',
                      label: (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <HealthStatusTag status="Attention" size="small" />
                          <span style={{ fontSize: 13 }}>Cần theo dõi (Có lưu ý)</span>
                        </div>
                      ),
                    },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="SpecialCareRequirements"
            label={t('horses.fields.specialCare')}
          >
            <TextArea
              rows={3}
              placeholder="e.g. Cần lót rơm dày, bổ sung điện giải trước giờ bay..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
