import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Input,
  Radio,
  Divider,
  Spin,
  Alert,
  Empty,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  CarOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  HeartOutlined,
  FileDoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  DashboardOutlined,
  TrophyOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDriverMissions } from '../hooks/useDriverMissions';
import { getTripStatusMeta } from '../services/driverService';

const { Title, Text, Paragraph } = Typography;

/**
 * Màn hình: Nhiệm vụ vận chuyển (Mission Briefing)
 * Cho phép tài xế và nhân sự áp tải xem chi tiết đầy đủ các chuyến đi được phân công
 * Bố cục ngay ngắn, thẳng hàng, tối giản, màu sắc nhận biết tinh tế chuẩn Ant Design
 */
export default function MissionBriefingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { missions, loading, error, refresh } = useDriverMissions();

  const [activeTab, setActiveTab] = useState('All');
  const [searchText, setSearchText] = useState('');

  // Thống kê số lượng chuyến
  const stats = useMemo(() => {
    return {
      all: missions.length,
      scheduled: missions.filter((m) => m.overallStatus === 'Scheduled').length,
      inTransit: missions.filter((m) => m.overallStatus === 'InTransit' || m.overallStatus === 'EmergencyRerouting').length,
      arrived: missions.filter((m) => m.overallStatus === 'ArrivedDestination').length,
      completed: missions.filter((m) => m.overallStatus === 'Completed').length,
    };
  }, [missions]);

  // Bộ lọc dữ liệu theo Tab và Tìm kiếm
  const filteredMissions = useMemo(() => {
    return missions.filter((mission) => {
      if (activeTab === 'Scheduled' && mission.overallStatus !== 'Scheduled') return false;
      if (activeTab === 'InTransit' && !['InTransit', 'EmergencyRerouting'].includes(mission.overallStatus)) return false;
      if (activeTab === 'ArrivedDestination' && mission.overallStatus !== 'ArrivedDestination') return false;
      if (activeTab === 'Completed' && mission.overallStatus !== 'Completed') return false;

      if (searchText.trim()) {
        const query = searchText.toLowerCase().trim();
        const tripCodeMatch = mission.tripCode?.toLowerCase().includes(query);
        const bookingMatch = mission.bookingCode?.toLowerCase().includes(query);
        const vehicleMatch = mission.vehicleCode?.toLowerCase().includes(query);
        const routeMatch =
          mission.origin?.toLowerCase().includes(query) ||
          mission.destination?.toLowerCase().includes(query);
        const horseMatch = (mission.horses || []).some((h) =>
          h.horseName?.toLowerCase().includes(query) || h.microchipNumber?.toLowerCase().includes(query)
        );
        if (!tripCodeMatch && !bookingMatch && !vehicleMatch && !routeMatch && !horseMatch) {
          return false;
        }
      }

      return true;
    });
  }, [missions, activeTab, searchText]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header trang */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: '#111827', fontWeight: 700 }}>
            {t('driver.missions.title', 'Nhiệm vụ vận chuyển của tôi')}
          </Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 14 }}>
            {t('driver.missions.subtitle', 'Trung tâm tác nghiệp dành cho Tài xế & Nhân sự áp tải — Giám sát lộ trình, kiểm tra an toàn và ghi nhận phúc lợi ngựa')}
          </Paragraph>
        </div>

        <Button
          icon={<SyncOutlined />}
          onClick={refresh}
          loading={loading}
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          {t('common.refresh', 'Làm mới')}
        </Button>
      </div>

      {error && (
        <Alert
          message={t('common.error', 'Lỗi')}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      {/* 4 Thẻ thống kê tổng quan: Nền trắng sạch sẽ, viền trung tính */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            key: 'Scheduled',
            label: t('driver.missions.status.scheduled', 'Chờ xuất bến'),
            count: stats.scheduled,
            color: '#111827',
            subText: 'Cần kiểm tra an toàn',
          },
          {
            key: 'InTransit',
            label: t('driver.missions.status.inTransit', 'Đang di chuyển'),
            count: stats.inTransit,
            color: '#D97706',
            subText: 'Đang trên lộ trình',
          },
          {
            key: 'ArrivedDestination',
            label: t('driver.missions.status.arrivedDestination', 'Tại điểm đích'),
            count: stats.arrived,
            color: '#7C3AED',
            subText: 'Chờ bàn giao e-POD',
          },
          {
            key: 'Completed',
            label: t('driver.missions.status.completed', 'Đã hoàn thành'),
            count: stats.completed,
            color: '#16A34A',
            subText: 'Đã ký nhận e-POD',
          },
        ].map((card) => (
          <Col xs={12} sm={6} key={card.key}>
            <Card
              bordered
              style={{
                borderRadius: 12,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
              }}
              styles={{ body: { padding: 18 } }}
              onClick={() => setActiveTab(card.key)}
            >
              <Text type="secondary" style={{ fontSize: 13 }}>
                {card.label}
              </Text>
              <Title level={3} style={{ margin: '6px 0 0 0', color: card.color }}>
                {card.count}
              </Title>
              <Text type="secondary" style={{ fontSize: 11 }}>{card.subText}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Thanh lọc Tab & Ô tìm kiếm */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          border: '1px solid #E2E8F0',
        }}
        bodyStyle={{ padding: 16 }}
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
          <Radio.Group
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="All">Tất cả ({stats.all})</Radio.Button>
            <Radio.Button value="Scheduled">Chờ xuất bến ({stats.scheduled})</Radio.Button>
            <Radio.Button value="InTransit">Đang chạy ({stats.inTransit})</Radio.Button>
            <Radio.Button value="ArrivedDestination">Tại đích ({stats.arrived})</Radio.Button>
            <Radio.Button value="Completed">Hoàn tất ({stats.completed})</Radio.Button>
          </Radio.Group>

          <Input
            placeholder="Tìm theo mã chuyến, mã đơn, xe, ngựa, lộ trình..."
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 340, borderRadius: 8 }}
            allowClear
          />
        </div>
      </Card>

      {/* Danh sách nhiệm vụ chi tiết */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Đang nạp danh sách nhiệm vụ..." />
        </div>
      ) : filteredMissions.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0', border: '1px solid #E2E8F0' }}>
          <Empty description="Không tìm thấy nhiệm vụ vận chuyển nào phù hợp" />
        </Card>
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {filteredMissions.map((mission) => {
            const statusMeta = getTripStatusMeta(mission.overallStatus);
            const leadDriver = (mission.crew || []).find((c) => c.crewRole === 'Driver') || mission.crew?.[0];
            const escortVet = (mission.crew || []).find((c) => c.crewRole === 'Escort');

            return (
              <Card
                key={mission.tripId}
                style={{
                  borderRadius: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                }}
                bodyStyle={{ padding: 22 }}
              >
                {/* Header: Mã chuyến, Trạng thái, Biển số xe & Thời gian */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <Space size="middle" align="center" wrap>
                      <Title level={4} style={{ margin: 0, color: '#111827' }}>
                        {mission.tripCode}
                      </Title>
                      <Tag color={statusMeta.color} style={{ padding: '2px 8px', borderRadius: 4 }}>
                        <Badge status={statusMeta.badgeStatus} text={statusMeta.text} />
                      </Tag>
                      {mission.bookingCode && (
                        <Tag style={{ borderRadius: 4 }}>
                          Đơn: {mission.bookingCode}
                        </Tag>
                      )}
                    </Space>

                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12.5, color: '#6B7280' }}>
                      <div>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        Khởi hành: <strong>{mission.plannedStartDate ? new Date(mission.plannedStartDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Dự kiến'}</strong>
                      </div>
                      <div>
                        Dự kiến đến: <strong>{mission.plannedEndDate ? new Date(mission.plannedEndDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Đang cập nhật'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Space size={6} align="center">
                      <CarOutlined style={{ color: '#4B5563' }} />
                      <Text strong style={{ fontSize: 14 }}>
                        {mission.vehicleCode}
                      </Text>
                      <Tag color={mission.hasClimateControl ? 'blue' : 'default'} style={{ borderRadius: 4, fontSize: 11 }}>
                        {mission.hasClimateControl ? 'Điều hòa 18-20°C' : 'Tiêu chuẩn'}
                      </Tag>
                    </Space>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {mission.vehicleName}
                    </div>
                  </div>
                </div>

                <Divider style={{ margin: '14px 0 16px 0' }} />

                {/* Khối Thông tin chi tiết: Lộ trình, Ngựa, Người liên hệ, Kíp lái */}
                <Row gutter={[20, 16]}>
                  {/* Cột 1: Lộ trình & Hướng dẫn đặc biệt */}
                  <Col xs={24} md={12}>
                    <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8, border: '1px solid #E2E8F0', height: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Lộ trình di chuyển:
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 8 }}>
                        <EnvironmentOutlined style={{ color: '#F59E0B' }} />
                        <Text strong style={{ color: '#1F2937' }}>
                          {mission.origin}
                        </Text>
                        <Text type="secondary">→</Text>
                        <Text strong style={{ color: '#1F2937' }}>
                          {mission.destination}
                        </Text>
                      </div>

                      {/* Thông tin liên hệ khách hàng & điều phối */}
                      <div style={{ fontSize: 12, color: '#4B5563', paddingTop: 6, borderTop: '1px dashed #E2E8F0' }}>
                        <Row gutter={8}>
                          <Col span={12}>
                            <Text type="secondary">Khách hàng: </Text>
                            <strong>{mission.customerName || 'Jane Smith'}</strong>
                            <div style={{ color: '#6B7280', fontSize: 11 }}>
                              <PhoneOutlined style={{ marginRight: 4 }} />
                              {mission.customerPhone || '+84 988 111 222'}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Điều phối viên: </Text>
                            <strong>{mission.coordinatorName || 'Lê Hoàng Nam'}</strong>
                            <div style={{ color: '#6B7280', fontSize: 11 }}>
                              <PhoneOutlined style={{ marginRight: 4 }} />
                              {mission.coordinatorPhone || '+84 912 000 003'}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  </Col>

                  {/* Cột 2: Ngựa đua & Kíp lái */}
                  <Col xs={24} md={12}>
                    <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8, border: '1px solid #E2E8F0', height: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Ngựa đua trên chuyến ({mission.horses?.length || 0} con):
                      </Text>
                      <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 4, marginBottom: 8 }}>
                        {(mission.horses || []).map((h) => (
                          <div
                            key={h.tripHorseId || h.horseId}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                              background: '#FFFFFF',
                              padding: '4px 8px',
                              borderRadius: 4,
                              border: '1px solid #E5E7EB',
                            }}
                          >
                            <span>
                              <Text strong>{h.horseName}</Text>
                              <span style={{ color: '#6B7280', marginLeft: 6 }}>
                                (Chip: {h.microchipNumber} • Chuồng #{h.stallSlotNumber || 1})
                              </span>
                            </span>
                            <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>{h.healthStatus || 'Tốt'}</Tag>
                          </div>
                        ))}
                      </Space>

                      {/* Kíp lái */}
                      <div style={{ fontSize: 12, color: '#4B5563', paddingTop: 6, borderTop: '1px dashed #E2E8F0' }}>
                        <Space size={16} wrap>
                          <div>
                            <UserOutlined style={{ marginRight: 4, color: '#6B7280' }} />
                            Tài xế: <strong>{leadDriver?.fullName || 'Chưa phân công'}</strong>
                          </div>
                          {escortVet && (
                            <div>
                              <UserOutlined style={{ marginRight: 4, color: '#10B981' }} />
                              Thú y áp tải: <strong>{escortVet.fullName}</strong>
                            </div>
                          )}
                        </Space>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Hướng dẫn nghiệp vụ đặc biệt nếu có */}
                {mission.specialInstructions && (
                  <div
                    style={{
                      background: '#FFFBEB',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #FEF3C7',
                      marginTop: 12,
                      fontSize: 12,
                      color: '#92400E',
                    }}
                  >
                    <strong>Lưu ý từ Ban Điều Phối:</strong> {mission.specialInstructions}
                  </div>
                )}

                {/* Thanh nút hành động nghiệp vụ theo Flow 4 */}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                  {mission.overallStatus === 'Scheduled' && (
                    <Button
                      type="primary"
                      icon={<SafetyCertificateOutlined />}
                      onClick={() => navigate(`/driver/missions/${mission.tripId}/checklist`)}
                      style={{
                        borderRadius: 6,
                        backgroundColor: '#F59E0B',
                        borderColor: '#F59E0B',
                        fontWeight: 600,
                      }}
                    >
                      {t('driver.missions.actions.checklist', 'Kiểm tra tiền khởi hành & Xuất bến')}
                    </Button>
                  )}

                  {['InTransit', 'EmergencyRerouting'].includes(mission.overallStatus) && (
                    <>
                      <Button
                        icon={<HeartOutlined />}
                        onClick={() => navigate(`/driver/missions/${mission.tripId}/welfare-log`)}
                        style={{ borderRadius: 6, fontWeight: 500 }}
                      >
                        {t('driver.missions.actions.welfare', 'Ghi nhật ký sinh trắc ngựa')}
                      </Button>
                      <Button
                        type="primary"
                        icon={<DashboardOutlined />}
                        onClick={() => navigate(`/driver/missions/${mission.tripId}/execution`)}
                        style={{
                          borderRadius: 6,
                          backgroundColor: '#F59E0B',
                          borderColor: '#F59E0B',
                          fontWeight: 600,
                        }}
                      >
                        {t('driver.missions.actions.execution', 'Lộ trình & Trạm kiểm soát')}
                      </Button>
                    </>
                  )}

                  {mission.overallStatus === 'ArrivedDestination' && (
                    <Button
                      type="primary"
                      icon={<FileDoneOutlined />}
                      onClick={() => navigate(`/driver/missions/${mission.tripId}/arrival`)}
                      style={{
                        borderRadius: 6,
                        backgroundColor: '#10B981',
                        borderColor: '#10B981',
                        fontWeight: 600,
                      }}
                    >
                      {t('driver.missions.actions.arrival', 'Nghiệm thu bàn giao & Ký e-POD')}
                    </Button>
                  )}

                  {mission.overallStatus === 'Completed' && (
                    <Button
                      icon={<TrophyOutlined />}
                      onClick={() => navigate(`/driver/missions/${mission.tripId}/completion-report`)}
                      style={{ borderRadius: 6, fontWeight: 500 }}
                    >
                      Xem Báo cáo hoàn tất ca trực
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </Space>
      )}
    </div>
  );
}
