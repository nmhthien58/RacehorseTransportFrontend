import { Card, Tag, Row, Col, Space, Typography, Button, Badge, Breadcrumb } from 'antd';
import {
  CarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  HeartOutlined,
  FileDoneOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { getTripStatusMeta } from '../services/driverService';

const { Title, Text } = Typography;

/**
 * Component Header thông tin tóm tắt chuyến đi dùng chung cho các màn hình của Driver
 * @param {{
 *   mission: Object,
 *   activeTab?: 'checklist' | 'execution' | 'welfare' | 'arrival',
 *   onOpenSos?: () => void,
 *   breadcrumbItems?: Array<any>
 * }} props
 */
export default function MissionHeaderCard({
  mission,
  activeTab,
  onOpenSos,
  breadcrumbItems,
}) {
  const navigate = useNavigate();

  if (!mission) return null;

  const statusMeta = getTripStatusMeta(mission.overallStatus);
  const leadDriver = (mission.crew || []).find((c) => c.crewRole === 'Driver') || mission.crew?.[0];
  const escortVet = (mission.crew || []).find((c) => c.crewRole === 'Escort');
  const horseNames = (mission.horses || []).map((h) => h.horseName).join(', ');

  const navItems = [
    {
      key: 'checklist',
      label: '1. Kiểm tra tiền khởi hành',
      icon: <SafetyCertificateOutlined />,
      path: `/driver/missions/${mission.tripId}/checklist`,
    },
    {
      key: 'execution',
      label: '2. Lộ trình & Trạm kiểm soát',
      icon: <CompassOutlined />,
      path: `/driver/missions/${mission.tripId}/execution`,
    },
    {
      key: 'welfare',
      label: '3. Nhật ký phúc lợi ngựa',
      icon: <HeartOutlined />,
      path: `/driver/missions/${mission.tripId}/welfare-log`,
    },
    {
      key: 'arrival',
      label: '4. Nghiệm thu & Ký e-POD',
      icon: <FileDoneOutlined />,
      path: `/driver/missions/${mission.tripId}/arrival`,
    },
  ];

  return (
    <Card
      style={{
        marginBottom: 20,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #E5E7EB',
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      {/* Breadcrumb & Nút quay lại */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Space size="middle">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/driver/missions')}
            style={{ fontWeight: 500 }}
          >
            Danh sách nhiệm vụ
          </Button>
          {breadcrumbItems && (
            <Breadcrumb
              items={[
                { title: <Link to="/driver/missions">Nhiệm vụ</Link> },
                ...breadcrumbItems,
              ]}
            />
          )}
        </Space>

        {onOpenSos && (
          <Button
            danger
            type="primary"
            icon={<AlertOutlined />}
            onClick={onOpenSos}
            style={{ fontWeight: 600, boxShadow: '0 2px 6px rgba(239,68,68,0.3)' }}
          >
            Báo cáo khẩn cấp (SOS)
          </Button>
        )}
      </div>

      {/* Main Mission Header */}
      <Row gutter={[24, 16]} align="middle">
        <Col xs={24} lg={16}>
          <Space align="center" size="middle" wrap style={{ marginBottom: 6 }}>
            <Title level={4} style={{ margin: 0, color: '#111827' }}>
              Chuyến xe: {mission.tripCode}
            </Title>
            <Tag color={statusMeta.color} style={{ fontSize: 13, padding: '2px 10px', borderRadius: 6 }}>
              <Badge status={statusMeta.badgeStatus} text={statusMeta.text} />
            </Tag>
            {mission.bookingCode && (
              <Tag style={{ fontSize: 12, borderRadius: 6 }}>
                Đơn: {mission.bookingCode}
              </Tag>
            )}
          </Space>

          {/* Lộ trình xuất phát -> đích đến */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <EnvironmentOutlined style={{ color: '#F59E0B', fontSize: 16 }} />
            <Text strong style={{ color: '#374151' }}>
              {mission.origin}
            </Text>
            <Text type="secondary">→</Text>
            <Text strong style={{ color: '#374151' }}>
              {mission.destination}
            </Text>
          </div>

          {/* Ngựa đua trên xe */}
          <div style={{ marginTop: 6 }}>
            <Text type="secondary">Ngựa đua vận chuyển: </Text>
            <Text strong style={{ color: '#1F2937' }}>
              {horseNames || 'Đang cập nhật'} ({mission.horses?.length || 0} con)
            </Text>
          </div>
        </Col>

        {/* Thông tin phương tiện & Tổ đội */}
        <Col xs={24} lg={8}>
          <div
            style={{
              background: '#F9FAFB',
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #F3F4F6',
            }}
          >
            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={6}>
                  <CarOutlined style={{ color: '#4B5563' }} />
                  <Text strong>{mission.vehicleCode}</Text>
                </Space>
                <Tag color="cyan" style={{ margin: 0 }}>
                  {mission.hasClimateControl ? 'Điều hòa VIP' : 'Tiêu chuẩn'}
                </Tag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <Space size={6}>
                  <UserOutlined style={{ color: '#6B7280' }} />
                  <Text type="secondary">Tài xế:</Text>
                </Space>
                <Text strong>{leadDriver?.fullName || 'Chưa phân công'}</Text>
              </div>

              {escortVet && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <Space size={6}>
                    <CheckCircleOutlined style={{ color: '#10B981' }} />
                    <Text type="secondary">Thú y áp tải:</Text>
                  </Space>
                  <Text strong>{escortVet.fullName}</Text>
                </div>
              )}
            </Space>
          </div>
        </Col>
      </Row>

      {/* Navigation Tabs giữa 4 màn của Flow */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid #F3F4F6',
          overflowX: 'auto',
        }}
      >
        {navItems.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Button
              key={tab.key}
              type={isActive ? 'primary' : 'default'}
              icon={tab.icon}
              onClick={() => navigate(tab.path)}
              style={{
                borderRadius: 8,
                fontWeight: isActive ? 600 : 400,
                backgroundColor: isActive ? '#F59E0B' : '#FFF',
                borderColor: isActive ? '#F59E0B' : '#D1D5DB',
                color: isActive ? '#FFF' : '#374151',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
