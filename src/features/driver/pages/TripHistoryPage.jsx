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
  Badge,
  Spin,
  Empty,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileDoneOutlined,
  PrinterOutlined,
  TrophyOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDriverMissions } from '../hooks/useDriverMissions';
import { getTripStatusMeta } from '../services/driverService';

const { Title, Text, Paragraph } = Typography;

/**
 * Màn hình: Lịch sử chuyến đi của Tài xế (Trip History)
 * Khớp thiết kế Frame 153:876 và 193:1599 trong Figma
 */
export default function TripHistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { missions, loading } = useDriverMissions();

  const [activeTab, setActiveTab] = useState('All');
  const [searchText, setSearchText] = useState('');

  // Thống kê nhanh
  const stats = useMemo(() => {
    const completed = missions.filter((m) => m.overallStatus === 'Completed');
    const inTransit = missions.filter((m) => ['InTransit', 'ArrivedDestination', 'EmergencyRerouting'].includes(m.overallStatus));
    const cancelled = missions.filter((m) => m.overallStatus === 'Cancelled');

    return {
      total: missions.length,
      completedCount: completed.length,
      inTransitCount: inTransit.length,
      cancelledCount: cancelled.length,
      successRate: missions.length > 0 ? Math.round((completed.length / missions.length) * 100) : 100,
    };
  }, [missions]);

  // Bộ lọc danh sách chuyến
  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      if (activeTab === 'Completed' && m.overallStatus !== 'Completed') return false;
      if (activeTab === 'InTransit' && !['InTransit', 'ArrivedDestination', 'EmergencyRerouting'].includes(m.overallStatus)) return false;
      if (activeTab === 'Cancelled' && m.overallStatus !== 'Cancelled') return false;

      if (searchText.trim()) {
        const query = searchText.toLowerCase().trim();
        const codeMatch = m.tripCode?.toLowerCase().includes(query);
        const routeMatch = m.origin?.toLowerCase().includes(query) || m.destination?.toLowerCase().includes(query);
        const horseMatch = (m.horses || []).some((h) => h.horseName?.toLowerCase().includes(query));
        if (!codeMatch && !routeMatch && !horseMatch) return false;
      }
      return true;
    });
  }, [missions, activeTab, searchText]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Tiêu đề trang */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#111827' }}>
          {t('driver.history.title', 'Lịch sử chuyến đi & Hồ sơ hoàn thành')}
        </Title>
        <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
          {t('driver.history.subtitle', 'Tra cứu hồ sơ các chuyến vận chuyển đã hoàn tất, biên bản giao nhận e-POD và tổng kết giờ làm việc của kíp lái')}
        </Paragraph>
      </div>

      {/* 4 Thẻ chỉ số tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 10, background: '#FFFFFF', border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '14px 18px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('driver.history.totalTrips', 'Tổng số chuyến')}</Text>
            <Title level={3} style={{ margin: '4px 0 0 0', color: '#111827' }}>{stats.total}</Title>
            <Text type="secondary" style={{ fontSize: 11 }}>{t('driver.history.allTime', 'Tất cả thời gian')}</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 10, background: '#FFFFFF', border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '14px 18px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('driver.history.completedTrips', 'Đã hoàn tất (e-POD)')}</Text>
            <Title level={3} style={{ margin: '4px 0 0 0', color: '#16A34A' }}>{stats.completedCount}</Title>
            <Text style={{ fontSize: 11, color: '#16A34A' }}>{t('driver.history.successRate', 'Tỷ lệ đạt')} {stats.successRate}%</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 10, background: '#FFFFFF', border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '14px 18px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('driver.history.inTransitTrips', 'Đang thực hiện')}</Text>
            <Title level={3} style={{ margin: '4px 0 0 0', color: '#D97706' }}>{stats.inTransitCount}</Title>
            <Text style={{ fontSize: 11, color: '#D97706' }}>{t('driver.history.onRoute', 'Trên lộ trình')}</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered style={{ borderRadius: 10, background: '#FFFFFF', border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '14px 18px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('driver.history.safetyRating', 'Đánh giá an toàn')}</Text>
            <Title level={3} style={{ margin: '4px 0 0 0', color: '#111827' }}>4.9 / 5.0</Title>
            <Text style={{ fontSize: 11, color: '#16A34A' }}>{t('driver.history.feiStandard', 'Tiêu chuẩn FEI 100%')}</Text>
          </Card>
        </Col>
      </Row>

      {/* Thanh lọc & tìm kiếm */}
      <Card style={{ borderRadius: 12, marginBottom: 24 }} bodyStyle={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Radio.Group value={activeTab} onChange={(e) => setActiveTab(e.target.value)} buttonStyle="solid">
            <Radio.Button value="All">{t('driver.history.tabAll', 'Tất cả')} ({stats.total})</Radio.Button>
            <Radio.Button value="Completed">{t('driver.history.tabCompleted', 'Đã hoàn thành')} ({stats.completedCount})</Radio.Button>
            <Radio.Button value="InTransit">{t('driver.history.tabInTransit', 'Đang chạy')} ({stats.inTransitCount})</Radio.Button>
            <Radio.Button value="Cancelled">{t('driver.history.tabCancelled', 'Đã hủy')} ({stats.cancelledCount})</Radio.Button>
          </Radio.Group>

          <Input
            placeholder={t('driver.history.searchPlaceholder', 'Tìm theo mã chuyến, địa danh, ngựa...')}
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: 8 }}
            allowClear
          />
        </div>
      </Card>

      {/* Danh sách các chuyến */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip={t('driver.history.loading', 'Đang nạp lịch sử chuyến...')} />
        </div>
      ) : filteredMissions.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
          <Empty description={t('driver.history.empty', 'Không có chuyến vận chuyển nào trong lịch sử phù hợp')} />
        </Card>
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {filteredMissions.map((trip) => {
            const statusMeta = getTripStatusMeta(trip.overallStatus);
            const isCompleted = trip.overallStatus === 'Completed';

            return (
              <Card
                key={trip.tripId}
                style={{
                  borderRadius: 12,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  border: '1px solid #E5E7EB',
                }}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <Space size="middle" align="center">
                      <Title level={4} style={{ margin: 0, color: '#111827' }}>
                        {trip.tripCode}
                      </Title>
                      <Tag color={statusMeta.color} style={{ borderRadius: 6, padding: '2px 8px' }}>
                        <Badge status={statusMeta.badgeStatus} text={statusMeta.text} />
                      </Tag>
                      {trip.bookingCode && <Tag style={{ borderRadius: 4 }}>{t('driver.history.bookingTag', 'Đơn:')} {trip.bookingCode}</Tag>}
                    </Space>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <EnvironmentOutlined style={{ color: '#F59E0B' }} />
                      <Text strong>{trip.origin}</Text>
                      <Text type="secondary">→</Text>
                      <Text strong>{trip.destination}</Text>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Space size={6}>
                      <DashboardOutlined style={{ color: '#6B7280' }} />
                      <Text strong>{trip.vehicleCode}</Text>
                    </Space>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                      {trip.vehicleName}
                    </div>
                  </div>
                </div>

                <Divider style={{ margin: '12px 0 16px 0' }} />

                <Row gutter={[20, 12]} align="middle">
                  <Col xs={24} md={12}>
                    <div style={{ fontSize: 13 }}>
                      <Text type="secondary">{t('driver.history.horsesTransported', 'Ngựa đua vận chuyển:')} </Text>
                      <Text strong>{(trip.horses || []).map((h) => h.horseName).join(', ') || t('common.updating', 'Đang cập nhật')}</Text>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: '#6B7280' }}>
                      <div>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {t('driver.history.departureTime', 'Khởi hành:')} {trip.actualStartDate ? new Date(trip.actualStartDate).toLocaleDateString('vi-VN') : t('common.estimated', 'Dự kiến')}
                      </div>
                      {trip.actualEndDate && (
                        <div>
                          <CheckCircleOutlined style={{ marginRight: 4, color: '#10B981' }} />
                          {t('driver.history.completedTime', 'Hoàn thành:')} {new Date(trip.actualEndDate).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  </Col>

                  <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                    <Space size={10} wrap>
                      {/* Nút xem báo cáo tổng kết hoàn tất ca trực */}
                      {isCompleted && (
                        <Button
                          icon={<TrophyOutlined />}
                          onClick={() => navigate(`/driver/missions/${trip.tripId}/completion-report`)}
                          style={{ borderRadius: 8, fontWeight: 500 }}
                        >
                          {t('driver.history.completionReportBtn', 'Báo cáo hoàn thành ca trực')}
                        </Button>
                      )}

                      {/* Nút xem e-POD */}
                      <Button
                        type={isCompleted ? 'primary' : 'default'}
                        icon={<FileDoneOutlined />}
                        onClick={() => navigate(`/driver/missions/${trip.tripId}/arrival`)}
                        style={{
                          borderRadius: 8,
                          backgroundColor: isCompleted ? '#10B981' : undefined,
                          borderColor: isCompleted ? '#10B981' : undefined,
                          fontWeight: 500,
                        }}
                      >
                        {isCompleted ? t('driver.history.viewEpod', 'Biên bản e-POD') : t('driver.history.viewHandover', 'Chi tiết bàn giao')}
                      </Button>

                      <Button
                        icon={<PrinterOutlined />}
                        onClick={() => window.print()}
                        style={{ borderRadius: 8 }}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </Space>
      )}
    </div>
  );
}
