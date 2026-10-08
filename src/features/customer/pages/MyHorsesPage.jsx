import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import {
  EyeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import useMyHorses from '@features/customer/hooks/useMyHorses';
import { ROUTES } from '@routes/routes';

const { Text } = Typography;

/**
 * Trang danh sách hồ sơ ngựa đua của khách hàng (My Horses List)
 * Đường dẫn: /customer/horses
 * Sử dụng AntD Table với các cột: [Tên, Giống, Tuổi, Microchip, Sức khỏe, Action]
 *
 * @returns {JSX.Element}
 */
export default function MyHorsesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: horses, loading } = useMyHorses();

  /**
   * Điều hướng xem chi tiết một cá thể ngựa
   * @param {number} horseId
   */
  const handleViewDetail = (horseId) => {
    navigate(`/customer/horses/${horseId}`);
  };

  /**
   * Điều hướng sang trang thêm ngựa mới
   */
  const handleAddNewHorse = () => {
    navigate(ROUTES.CUSTOMER_HORSE_NEW);
  };

  // Cấu hình các cột của bảng AntD Table theo đúng yêu cầu
  const columns = [
    {
      title: t('horses.columns.name') || 'Tên ngựa',
      dataIndex: 'Name',
      key: 'Name',
      render: (name, record) => (
        <Space size="middle">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            🐴
          </div>
          <div>
            <Text
              strong
              style={{
                fontSize: 15,
                color: '#0f172a',
                cursor: 'pointer',
              }}
              onClick={() => handleViewDetail(record.HorseID)}
            >
              {name}
            </Text>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {t(`horses.genderOptions.${record.Gender?.toLowerCase()}`) || record.Gender} · {record.PassportNumber || 'No Passport'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: t('horses.columns.breed') || 'Giống',
      dataIndex: 'Breed',
      key: 'Breed',
      render: (breed) => <Tag color="blue">{breed}</Tag>,
    },
    {
      title: t('horses.columns.age') || 'Tuổi',
      dataIndex: 'DateOfBirth',
      key: 'Age',
      render: (dob) => {
        if (!dob) return '-';
        const age = dayjs().diff(dayjs(dob), 'year');
        return (
          <Text strong style={{ color: '#334155' }}>
            {age} {t('horses.yearsOld') || 'tuổi'}
          </Text>
        );
      },
    },
    {
      title: t('horses.columns.microchip') || 'Microchip',
      dataIndex: 'MicrochipNumber',
      key: 'MicrochipNumber',
      render: (code) => (
        <code
          style={{
            fontSize: 12,
            backgroundColor: '#f1f5f9',
            padding: '3px 8px',
            borderRadius: 6,
            color: '#0f172a',
            fontFamily: 'monospace',
          }}
        >
          {code}
        </code>
      ),
    },
    {
      title: t('horses.columns.health') || 'Sức khỏe',
      dataIndex: 'HealthStatus',
      key: 'HealthStatus',
      render: (status) => {
        if (status === 'Excellent') {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {t('horses.healthOptions.excellent') || 'Xuất sắc'}
            </Tag>
          );
        }
        if (status === 'Good') {
          return (
            <Tag color="processing" icon={<CheckCircleOutlined />}>
              {t('horses.healthOptions.good') || 'Khỏe mạnh'}
            </Tag>
          );
        }
        return (
          <Tag color="warning" icon={<ExclamationCircleOutlined />}>
            {t('horses.healthOptions.attention') || 'Cần theo dõi'}
          </Tag>
        );
      },
    },
    {
      title: t('horses.columns.action') || 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          size="middle"
          onClick={() => handleViewDetail(record.HorseID)}
          style={{ borderRadius: 6, fontWeight: 500 }}
        >
          {t('horses.viewAction') || 'Xem'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Tiêu đề trang & Nút Thêm ngựa mới */}
      <PageHeader
        title={t('horses.myHorsesTitle') || 'Danh sách ngựa của tôi'}
        subtitle={
          t('horses.myHorsesSubtitle') ||
          'Quản lý danh sách ngựa đua, theo dõi số vi mạch sinh trắc học và lịch sử sức khỏe'
        }
        actions={
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAddNewHorse}
            style={{
              fontWeight: 700,
              borderRadius: 9999,
              height: 44,
              padding: '0 24px',
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
            }}
          >
            {t('horses.add') || '+ Thêm ngựa mới'}
          </Button>
        }
      />

      {/* Bảng danh sách AntD Table */}
      <Card
        bordered
        style={{
          borderRadius: 14,
          borderColor: '#e2e8f0',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
        }}
        styles={{ body: { padding: '8px 12px' } }}
      >
        <Table
          columns={columns}
          dataSource={horses}
          rowKey="HorseID"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng: ${total} con ngựa` }}
        />
      </Card>
    </div>
  );
}
