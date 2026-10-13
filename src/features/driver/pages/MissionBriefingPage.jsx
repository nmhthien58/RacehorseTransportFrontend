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
  Progress,
  Divider,
  Spin,
  Alert,
  Empty,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  CompassOutlined,
  CarOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  HeartOutlined,
  FileDoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDriverMissions } from '../hooks/useDriverMissions';
import { getTripStatusMeta } from '../services/driverService';

const { Title, Text, Paragraph } = Typography;

/**
 * Màn hình 1: Nhiệm vụ vận chuyển (Mission Briefing)
 * Cho phép tài xế và nhân sự áp tải xem danh sách các chuyến đi được phân công và tiến hành các bước điều phối
 */
export default function MissionBriefingPage() {
  const navigate = useNavigate();
  const { missions, loading, error, refresh } = useDriverMissions();

  const [activeTab, setActiveTab] = useState('All');
  const [searchText, setSearchText] = useState('');

  // Thống kê nhanh số lượng chuyến theo trạng thái
  const stats = useMemo(() => {
    return {
      all: missions.length,
      scheduled: missions.filter((m) => m.overallStatus === 'Scheduled').length,
      inTransit: missions.filter((m) => m.overallStatus === 'InTransit' || m.overallStatus === 'EmergencyRerouting').length,
      arrived: missions.filter((m) => m.overallStatus === 'ArrivedDestination').length,
      completed: missions.filter((m) => m.overallStatus === 'Completed').length,
    };
  }, [missions]);

  // Bộ lọc dữ liệu theo Tab và Ô tìm kiếm
  const filteredMissions = useMemo(() => {
    return missions.filter((mission) => {
      // Lọc theo Tab
      if (activeTab === 'Scheduled' && mission.overallStatus !== 'Scheduled') return false;
      if (activeTab === 'InTransit' && !['InTransit', 'EmergencyRerouting'].includes(mission.overallStatus)) return false;
      if (activeTab === 'ArrivedDestination' && mission.overallStatus !== 'ArrivedDestination') return false;
      if (activeTab === 'Completed' && mission.overallStatus !== 'Completed') return false;

      // Tìm kiếm từ khóa
      if (searchText.trim()) {
        const query = searchText.toLowerCase().trim();
        const tripCodeMatch = mission.tripCode?.toLowerCase().includes(query);
        const vehicleMatch = mission.vehicleCode?.toLowerCase().includes(query);
        const routeMatch =
          mission.origin?.toLowerCase().includes(query) ||
          mission.destination?.toLowerCase().includes(query);
        const horseMatch = (mission.horses || []).some((h) =>
          h.horseName?.toLowerCase().includes(query)
        );
        if (!tripCodeMatch && !vehicleMatch && !routeMatch && !horseMatch) {
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
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            Nhiệm vụ vận chuyển của tôi
          </Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
            Trung tâm tác nghiệp dành cho Tài xế & Nhân sự áp tải — Giám sát lộ trình, kiểm tra an toàn và ghi nhận phúc lợi ngựa
          </Paragraph>
        </div>

        <Button
          icon={<SyncOutlined />}
          onClick={refresh}
          loading={loading}
          style={{ borderRadius: 8 }}
        >
          Làm mới
        </Button>
      </div>

      {error && (
        <Alert
          message="Lỗi nạp dữ liệu"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      {/* 4 Khối thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('Scheduled')}
          >
            <Text type="secondary" style={{ fontSize: 13, color: '#0369A1' }}>
              Chờ khởi hành
            </Text>
            <Title level={3} style={{ margin: '6px 0 0 0', color: '#0284C7' }}>
              {stats.scheduled}
            </Title>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('InTransit')}
          >
            <Text type="secondary" style={{ fontSize: 13, color: '#B45309' }}>
              Đang trên đường
            </Text>
            <Title level={3} style={{ margin: '6px 0 0 0', color: '#D97706' }}>
              {stats.inTransit}
            </Title>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: '#F5F3FF',
              border: '1px solid #DDD6FE',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('ArrivedDestination')}
          >
            <Text type="secondary" style={{ fontSize: 13, color: '#6D28D9' }}>
              Chờ bàn giao đích
            </Text>
            <Title level={3} style={{ margin: '6px 0 0 0', color: '#7C3AED' }}>
              {stats.arrived}
            </Title>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('Completed')}
          >
            <Text type="secondary" style={{ fontSize: 13, color: '#15803D' }}>
              Đã hoàn thành
            </Text>
            <Title level={3} style={{ margin: '6px 0 0 0', color: '#16A34A' }}>
              {stats.completed}
            </Title>
          </Card>
        </Col>
      </Row>

      {/* Thanh lọc Tab & Ô tìm kiếm */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
            placeholder="Tìm theo mã chuyến, xe, ngựa, lộ trình..."
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 320, borderRadius: 8 }}
            allowClear
          />
        </div>
      </Card>

      {/* Danh sách các nhiệm vụ */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Đang tải danh sách nhiệm vụ..." />
        </div>
      ) : filteredMissions.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
          <Empty description="Không tìm thấy nhiệm vụ vận chuyển nào phù hợp" />
        </Card>
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {filteredMissions.map((mission) => {
            const statusMeta = getTripStatusMeta(mission.overallStatus);
            const leadDriver = (mission.crew || []).find((c) => c.crewRole === 'Driver') || mission.crew?.[0];
            const escortVet = (mission.crew || []).find((c) => c.crewRole === 'Escort');

            // Tính toán tiến độ checklist
            const checklistItems = mission.preDepartureChecklist || [];
            const mandatoryItems = checklistItems.filter((i) => i.isMandatory);
            const completedMandatory = mandatoryItems.filter((i) => i.checked);
            const checklistPercent =
              mandatoryItems.length > 0
                ? Math.round((completedMandatory.length / mandatoryItems.length) * 100)
                : 100;
            const isChecklistReady = checklistPercent === 100;

            // Tính toán trạm kiểm soát
            const checkpoints = mission.routeCheckpoints || [];
            const completedCps = checkpoints.filter((c) => c.status === 'Departed');
            const currentCp = checkpoints.find((c) => c.status === 'Arrived' || c.status === 'Cleared') || checkpoints.find((c) => c.status === 'Pending');

            return (
              <Card
                key={mission.tripId}
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                }}
                bodyStyle={{ padding: 24 }}
              >
                {/* Header thẻ: Mã chuyến, Trạng thái, Biển số xe */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <Space size="middle" align="center" wrap>
                      <Title level={4} style={{ margin: 0, color: '#111827' }}>
                        {mission.tripCode}
                      </Title>
                      <Tag color={statusMeta.color} style={{ padding: '2px 10px', borderRadius: 6 }}>
                        <Badge status={statusMeta.badgeStatus} text={statusMeta.text} />
                      </Tag>
                      {mission.bookingCode && (
                        <Tag style={{ borderRadius: 6 }}>
                          Đơn: {mission.bookingCode}
                        </Tag>
                      )}
                    </Space>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ClockCircleOutlined style={{ color: '#6B7280' }} />
                      <Text type="secondary">
                        Khởi hành dự kiến:{' '}
                        {mission.plannedStartDate
                          ? new Date(mission.plannedStartDate).toLocaleString('vi-VN')
                          : 'Đang cập nhật'}
                      </Text>
                    </div>
                  </div>

                  {/* Xe & điều hòa */}
                  <div style={{ textAlign: 'right' }}>
                    <Space size={8}>
                      <CarOutlined style={{ color: '#4B5563' }} />
                      <Text strong style={{ fontSize: 15 }}>
                        {mission.vehicleCode}
                      </Text>
                      <Tag color="cyan" style={{ borderRadius: 6 }}>
                        {mission.hasClimateControl ? 'Điều hòa VIP' : 'Tiêu chuẩn'}
                      </Tag>
                    </Space>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                      {mission.vehicleName}
                    </div>
                  </div>
                </div>

                <Divider style={{ margin: '12px 0 16px 0' }} />

                {/* Nội dung chi tiết: Lộ trình, Kíp lái, Ngựa đua */}
                <Row gutter={[24, 16]}>
                  {/* Cột 1: Lộ trình & Hướng dẫn đặc biệt */}
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Lộ trình di chuyển:
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <EnvironmentOutlined style={{ color: '#F59E0B' }} />
                        <Text strong style={{ color: '#1F2937' }}>
                          {mission.origin}
                        </Text>
                        <Text type="secondary">→</Text>
                        <Text strong style={{ color: '#1F2937' }}>
                          {mission.destination}
                        </Text>
                      </div>
                    </div>

                    {mission.specialInstructions && (
                      <div
                        style={{
                          background: '#FFFBEB',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid #FEF3C7',
                          marginTop: 10,
                        }}
                      >
                        <Space align="start" size={8}>
                          <ExclamationCircleOutlined style={{ color: '#D97706', marginTop: 2 }} />
                          <div>
                            <Text strong style={{ color: '#B45309', fontSize: 12 }}>
                              LƯU Ý ĐẶC BIỆT:
                            </Text>
                            <div style={{ fontSize: 13, color: '#92400E' }}>
                              {mission.specialInstructions}
                            </div>
                          </div>
                        </Space>
                      </div>
                    )}
                  </Col>

                  {/* Cột 2: Danh sách ngựa & Kíp lái */}
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Ngựa đua trên chuyến ({mission.horses?.length || 0} con):
                      </Text>
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(mission.horses || []).map((h) => (
                          <Tag
                            key={h.horseId}
                            color="geekblue"
                            style={{ padding: '2px 8px', borderRadius: 6, fontSize: 13 }}
                          >
                            🏇 {h.horseName} ({h.breed || 'Thoroughbred'}) - Chip: {h.microchipNumber}
                          </Tag>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Kíp điều khiển & chăm sóc:
                      </Text>
                      <div style={{ marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <Space size={6}>
                          <UserOutlined style={{ color: '#4B5563' }} />
                          <Text>Tài xế:</Text>
                          <Text strong>{leadDriver?.fullName || 'Chưa phân công'}</Text>
                        </Space>
                        {escortVet && (
                          <Space size={6}>
                            <UserOutlined style={{ color: '#10B981' }} />
                            <Text>Thú y áp tải:</Text>
                            <Text strong>{escortVet.fullName}</Text>
                          </Space>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Thanh tiến độ theo từng trạng thái */}
                {mission.overallStatus === 'Scheduled' && (
                  <div
                    style={{
                      background: '#F9FAFB',
                      padding: '12px 16px',
                      borderRadius: 8,
                      marginTop: 16,
                      border: '1px solid #F3F4F6',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Space size={6}>
                        <SafetyCertificateOutlined style={{ color: isChecklistReady ? '#10B981' : '#F59E0B' }} />
                        <Text strong>Tiến độ kiểm tra an toàn tiền khởi hành:</Text>
                      </Space>
                      <Text strong style={{ color: isChecklistReady ? '#10B981' : '#D97706' }}>
                        {completedMandatory.length}/{mandatoryItems.length} mục bắt buộc ({checklistPercent}%)
                      </Text>
                    </div>
                    <Progress
                      percent={checklistPercent}
                      strokeColor={isChecklistReady ? '#10B981' : '#F59E0B'}
                      showInfo={false}
                    />
                  </div>
                )}

                {['InTransit', 'EmergencyRerouting'].includes(mission.overallStatus) && (
                  <div
                    style={{
                      background: '#F9FAFB',
                      padding: '12px 16px',
                      borderRadius: 8,
                      marginTop: 16,
                      border: '1px solid #F3F4F6',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Space size={6}>
                        <CompassOutlined style={{ color: '#F59E0B' }} />
                        <Text strong>Tiến độ lộ trình:</Text>
                        <Text type="secondary">
                          Đã qua {completedCps.length}/{checkpoints.length} trạm
                        </Text>
                      </Space>
                      {currentCp && (
                        <Text strong style={{ color: '#1D4ED8' }}>
                          Trạm hiện tại: {currentCp.locationName} ({currentCp.status})
                        </Text>
                      )}
                    </div>
                    <Progress
                      percent={
                        checkpoints.length > 0
                          ? Math.round((completedCps.length / checkpoints.length) * 100)
                          : 0
                      }
                      strokeColor="#F59E0B"
                      showInfo={false}
                    />
                  </div>
                )}

                {/* Các nút hành động nghiệp vụ */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 20,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Hành động khi Chờ khởi hành */}
                  {mission.overallStatus === 'Scheduled' && (
                    <Button
                      type="primary"
                      icon={<SafetyCertificateOutlined />}
                      onClick={() => navigate(`/driver/missions/${mission.tripId}/checklist`)}
                      style={{
                        backgroundColor: '#F59E0B',
                        borderColor: '#F59E0B',
                        fontWeight: 600,
                        borderRadius: 8,
                      }}
                    >
                      Kiểm tra an toàn tiền khởi hành ({checklistPercent}%)
                    </Button>
                  )}

                  {/* Hành động khi Đang chạy */}
                  {['InTransit', 'EmergencyRerouting'].includes(mission.overallStatus) && (
                    <>
                      <Button
                        icon={<HeartOutlined />}
                        onClick={() => navigate(`/driver/missions/${mission.tripId}/welfare-log`)}
                        style={{ borderRadius: 8 }}
                      >
                        Nhật ký phúc lợi ngựa
                      </Button>
                      <Button
                        type="primary"
                        icon={<CompassOutlined />}
                        onClick={() => navigate(`/driver/missions/${mission.tripId}/execution`)}
                        style={{
                          backgroundColor: '#F59E0B',
                          borderColor: '#F59E0B',
                          fontWeight: 600,
                          borderRadius: 8,
                        }}
                      >
                        Theo dõi lộ trình & Check-in trạm
                      </Button>
                    </>
                  )}

                  {/* Hành động khi Đã tới đích */}
                  {mission.overallStatus === 'ArrivedDestination' && (
                    <Button
                      type="primary"
                      icon={<FileDoneOutlined />}
                      onClick={() => navigate(`/driver/missions/${mission.tripId}/arrival`)}
                      style={{
                        backgroundColor: '#8B5CF6',
                        borderColor: '#8B5CF6',
                        fontWeight: 600,
                        borderRadius: 8,
                      }}
                    >
                      Bàn giao & Ký xác nhận e-POD
                    </Button>
                  )}

                  {/* Hành động khi Hoàn tất */}
                  {mission.overallStatus === 'Completed' && (
                    <Button
                      type="default"
                      icon={<FileDoneOutlined />}
                      onClick={() => navigate(`/driver/missions/${mission.tripId}/arrival`)}
                      style={{ borderRadius: 8 }}
                    >
                      Xem biên bản nghiệm thu e-POD
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
