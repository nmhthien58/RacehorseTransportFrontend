import {
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import useHorseDetail from '@features/customer/hooks/useHorseDetail';
import { ROUTES } from '@routes/routes';

const { Title, Text } = Typography;

/**
 * Trang chi tiết hồ sơ ngựa đua (Horse Detail Profile)
 * Tuyến đường dẫn: /customer/horses/:id
 * Tái hiện cấu trúc quản lý hồ sơ chuyên sâu: Thông tin cơ bản, Hồ sơ thú y, Lịch sử vận chuyển
 *
 * @returns {JSX.Element}
 */
export default function HorseDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  // Lấy dữ liệu hồ sơ ngựa qua custom hook
  const { data: horse, loading, error } = useHorseDetail(id);

  /**
   * Quay lại trang danh sách ngựa
   */
  const handleBackToList = () => {
    navigate(ROUTES.CUSTOMER_HORSES);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
          {t('common.loading') || 'Đang tải thông tin cá thể ngựa...'}
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
                {t('horses.notFound') || 'Không tìm thấy thông tin cá thể ngựa'}
              </Text>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Mã ngựa #{id} có thể không tồn tại hoặc bạn không có quyền truy cập.
              </Text>
            </div>
          }
        >
          <Button type="primary" onClick={handleBackToList} style={{ marginTop: 16 }}>
            {t('common.back') || 'Quay lại danh sách'}
          </Button>
        </Empty>
      </div>
    );
  }

  const age = horse.dateOfBirth
    ? dayjs().diff(dayjs(horse.dateOfBirth), 'year')
    : null;

  // Cấu hình bảng Hồ sơ thú y
  const vetColumns = [
    {
      title: 'Hạng mục kiểm dịch / Y tế',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <strong style={{ color: '#0f172a' }}>{title}</strong>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Bác sĩ phụ trách: {record.veterinarian} · {record.clinic}
          </div>
        </div>
      ),
    },
    {
      title: 'Ngày cấp',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Hiệu lực đến',
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (date) => (
        <span style={{ color: '#059669', fontWeight: 500 }}>
          {dayjs(date).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          {status === 'Valid' ? 'Còn hiệu lực' : status}
        </Tag>
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes) => <span style={{ fontSize: 12 }}>{notes}</span>,
    },
  ];

  // Cấu hình bảng Lịch sử vận chuyển
  const tripColumns = [
    {
      title: 'Mã đơn / Chuyến đi',
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      render: (code, record) => (
        <div>
          <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{code}</strong>
          <div style={{ fontSize: 12, color: '#64748b' }}>{record.vehicleCode}</div>
        </div>
      ),
    },
    {
      title: 'Lộ trình vận chuyển',
      dataIndex: 'route',
      key: 'route',
      render: (route, record) => (
        <div>
          <span>{route}</span>
          <div>
            <Tag color={record.transportMode === 'Air' ? 'blue' : 'orange'} style={{ fontSize: 11 }}>
              {record.transportMode === 'Air' ? '✈ Hàng không' : '🚛 Đường bộ'}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'departureDate',
      key: 'departureDate',
      render: (dep, record) => (
        <span style={{ fontSize: 13 }}>
          {dayjs(dep).format('DD/MM/YYYY')} ➔ {dayjs(record.arrivalDate).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: 'Thể trạng khi bàn giao',
      dataIndex: 'welfareScore',
      key: 'welfareScore',
      render: (score) => <Tag color="green">{score}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (st) => (
        <Tag color={st === 'InTransit' ? 'processing' : 'success'}>
          {st === 'InTransit' ? 'Đang vận chuyển' : 'Đã hoàn thành'}
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
          <InfoCircleOutlined /> {t('horses.tabs.general') || 'Thông tin chung'}
        </span>
      ),
      children: (
        <Card bordered style={{ borderRadius: 12, borderColor: '#e2e8f0', marginTop: 12 }}>
          <Title level={5} style={{ margin: '0 0 16px', color: '#0f172a' }}>
            Đặc điểm sinh trắc học & Lưu ý chăm sóc đặc biệt
          </Title>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: 8, marginBottom: 16, border: '1px solid #f1f5f9' }}>
            <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
              Chăm sóc đặc biệt:
            </Text>
            <Text strong style={{ color: '#0f172a' }}>
              {horse.specialCareRequirements || 'Không có yêu cầu đặc biệt.'}
            </Text>
          </div>

          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} styles={{ label: { fontWeight: 600, color: '#475569' } }}>
            <Descriptions.Item label="Màu lông định danh">{horse.color || '-'}</Descriptions.Item>
            <Descriptions.Item label="Tình trạng tiêm chủng">
              <Tag color="success">Đã hoàn thành</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Chứng nhận Fit-to-Travel">
              <Tag color="cyan">Đạt chuẩn IATA LAR</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đăng ký hồ sơ">
              {dayjs(horse.createdAt).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái hồ sơ">
              <Tag color={horse.isActive ? 'success' : 'default'}>
                {horse.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
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
          <MedicineBoxOutlined /> {t('horses.tabs.vetRecords') || 'Hồ sơ thú y'}
        </span>
      ),
      children: (
        <Card bordered style={{ borderRadius: 12, borderColor: '#e2e8f0', marginTop: 12 }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
            <div>
              <Title level={5} style={{ margin: 0, color: '#0f172a' }}>
                Lịch sử chứng nhận kiểm dịch & tiêm phòng
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Được giám sát và xác thực bởi bác sĩ thú y có chứng chỉ FEI quốc tế
              </Text>
            </div>
            <Tag color="blue">Tổng cộng: {horse.vetRecords?.length || 0} bản ghi</Tag>
          </Flex>

          <Table
            columns={vetColumns}
            dataSource={horse.vetRecords || []}
            rowKey="recordId"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'trips',
      label: (
        <span>
          <CarOutlined /> {t('horses.tabs.tripHistory') || 'Lịch sử vận chuyển'}
        </span>
      ),
      children: (
        <Card bordered style={{ borderRadius: 12, borderColor: '#e2e8f0', marginTop: 12 }}>
          <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
            <div>
              <Title level={5} style={{ margin: 0, color: '#0f172a' }}>
                Các chuyến vận chuyển đã tham gia
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Lưu trữ hành trình di chuyển và báo cáo phúc lợi e-POD sau mỗi chặng
              </Text>
            </div>
            <Tag color="orange">Tổng cộng: {horse.transportHistory?.length || 0} chuyến</Tag>
          </Flex>

          <Table
            columns={tripColumns}
            dataSource={horse.transportHistory || []}
            rowKey="tripId"
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
        title={t('horses.detailTitle') || 'Hồ sơ chi tiết ngựa đua'}
        breadcrumb={[
          { label: t('nav.horses') || 'Ngựa của tôi', path: ROUTES.CUSTOMER_HORSES },
          { label: horse.name },
        ]}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList}>
            {t('common.back') || 'Quay lại'}
          </Button>
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
                {horse.name}
              </Title>
              <Space size="small" style={{ marginTop: 4 }}>
                <Tag color="blue">{horse.breed}</Tag>
                <Tag color="gold">
                  {t(`horses.genderOptions.${horse.gender?.toLowerCase()}`) || horse.gender}
                </Tag>
                {horse.healthStatus === 'Excellent' && (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Sức khỏe xuất sắc
                  </Tag>
                )}
                {horse.healthStatus === 'Good' && (
                  <Tag color="processing" icon={<CheckCircleOutlined />}>
                    Khỏe mạnh
                  </Tag>
                )}
                {horse.healthStatus === 'Attention' && (
                  <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                    Cần theo dõi
                  </Tag>
                )}
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
          <Descriptions.Item label="Mã vi mạch">
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
              {horse.microchipNumber}
            </code>
          </Descriptions.Item>

          <Descriptions.Item label="Hộ chiếu FEI">
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: '#0f172a' }}>
              {horse.passportNumber || 'Chưa cập nhật'}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày sinh & Tuổi">
            <span style={{ whiteSpace: 'nowrap' }}>
              {dayjs(horse.dateOfBirth).format('DD/MM/YYYY')} ({age} tuổi)
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Màu lông">
            <span>{horse.color || '-'}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Giới tính">
            <span>{t(`horses.genderOptions.${horse.gender?.toLowerCase()}`) || horse.gender}</span>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái">
            <Tag color={horse.isActive ? 'success' : 'default'} style={{ margin: 0 }}>
              {horse.isActive ? 'Sẵn sàng thi đấu' : 'Tạm nghỉ'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* KHỐI TABS: THÔNG TIN CHUNG / HỒ SƠ THÚ Y / LỊCH SỬ VẬN CHUYỂN */}
      <Tabs defaultActiveKey="general" items={tabItems} size="large" />
    </div>
  );
}
