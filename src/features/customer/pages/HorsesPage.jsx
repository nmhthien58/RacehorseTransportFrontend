import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/common/PageHeader';
import DataTable from '@components/common/DataTable';
import StatusTag from '@components/common/StatusTag';
import horseService from '@services/horseService';
import { useAuthStore } from '@features/auth/store/authStore';

const { TextArea } = Input;

/**
 * Trang quản lý hồ sơ ngựa đua dành cho khách hàng (Customer)
 * @returns {JSX.Element}
 */
export default function CustomerHorses() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
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
   * Mở modal thêm ngựa mới
   */
  const handleOpenCreateModal = () => {
    setEditingHorse(null);
    form.resetFields();
    setModalVisible(true);
  };

  /**
   * Mở modal sửa thông tin ngựa
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
      SpecialCareRequirements: record.SpecialCareRequirements,
    });
    setModalVisible(true);
  };

  /**
   * Đóng modal và reset form
   */
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingHorse(null);
    form.resetFields();
  };

  /**
   * Xử lý submit form Thêm / Sửa
   */
  const handleFormSubmit = async (values) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        DateOfBirth: values.DateOfBirth
          ? values.DateOfBirth.format('YYYY-MM-DD')
          : null,
        OwnerUserID: user?.UserID || 5,
      };

      if (editingHorse) {
        await horseService.updateHorse(editingHorse.HorseID, payload);
        message.success(t('horses.updateSuccess'));
      } else {
        await horseService.createHorse(payload);
        message.success(t('horses.createSuccess'));
      }

      handleCloseModal();
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

  // Cấu hình các cột của bảng danh sách
  const columns = [
    {
      title: t('horses.fields.name'),
      dataIndex: 'Name',
      key: 'Name',
      render: (text) => (
        <Space size="small">
          <span style={{ fontSize: 16 }}>🐴</span>
          <strong style={{ color: '#1f2937' }}>{text}</strong>
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
            background: '#f3f4f6',
            padding: '2px 6px',
            borderRadius: 4,
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
      <PageHeader
        title={t('horses.title')}
        subtitle={t('horses.subtitle')}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
          >
            {t('horses.add')}
          </Button>
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <DataTable
          columns={columns}
          dataSource={horses}
          rowKey="HorseID"
          loading={loading}
        />
      </Card>

      {/* Modal Thêm / Chỉnh sửa thông tin ngựa */}
      <Modal
        title={editingHorse ? t('horses.edit') : t('horses.add')}
        open={modalVisible}
        onCancel={handleCloseModal}
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
          onFinish={handleFormSubmit}
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
                  <Select.Option value="Thoroughbred">
                    Thoroughbred
                  </Select.Option>
                  <Select.Option value="Arabian">Arabian</Select.Option>
                  <Select.Option value="Quarter Horse">
                    Quarter Horse
                  </Select.Option>
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
            <Col span={24}>
              <Form.Item name="Color" label={t('horses.fields.color')}>
                <Input placeholder="e.g. Hồng sắc, Bạch sắc, Ô sắc" />
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
