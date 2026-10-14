import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Divider,
  Spin,
  Alert,
  Badge,
  Steps,
  Progress,
  Empty,
} from 'antd';
import {
  CompassOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  AlertOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDriverMissions } from '../hooks/useDriverMissions';
import { getTripStatusMeta, driverService } from '../services/driverService';
import EmergencyReportModal from '../components/EmergencyReportModal';

const { Title, Text, Paragraph } = Typography;

/**
 * Màn hình: Hành trình đang chạy (Active Trip Overview)
 * Chuyên biệt cho mục Sidebar "Hành trình đang chạy" (/driver/trips)
 */
export default function ActiveTripPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { missions, loading, refreshMissions } = useDriverMissions();

  const [sosModalOpen, setSosModalOpen] = useState(false);

  // Tìm chuyến đang chạy: ưu tiên InTransit > EmergencyRerouting > ArrivedDestination > Scheduled
  const activeTrip = useMemo(() => {
    if (!missions || missions.length === 0) return null;
    const inTransit = missions.find((m) => m.overallStatus === 'InTransit');
    if (inTransit) return inTransit;

    const rerouting = missions.find((m) => m.overallStatus === 'EmergencyRerouting');
    if (rerouting) return rerouting;

    const arrived = missions.find((m) => m.overallStatus === 'ArrivedDestination');
    if (arrived) return arrived;

    const scheduled = missions.find((m) => m.overallStatus === 'Scheduled');
    if (scheduled) return scheduled;

    return missions[0];
  }, [missions]);

  // Xử lý gửi báo cáo SOS
  const handleReportSOS = async (incidentData) => {
    if (!activeTrip) return false;
    try {
      await driverService.reportIncident(activeTrip.tripId, incidentData);
      refreshMissions();
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip={t('driver.activeTrip.loading', 'Đang nạp thông tin hành trình thời gian thực...')} />
      </div>
    );
  }

  // Nếu không có chuyến nào
  if (!activeTrip) {
    return (
      <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 16px' }}>
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: '60px 20px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} style={{ color: '#1E293B', marginBottom: 8 }}>
                  {t('driver.activeTrip.noTripTitle', 'Hiện không có chuyến xe nào đang hoạt động')}
                </Title>
                <Paragraph type="secondary">
                  {t('driver.activeTrip.noTripDesc', 'Bạn chưa được giao chuyến mới hoặc chuyến đi trước đó đã hoàn tất bàn giao.')}
                </Paragraph>
              </div>
            }
          >
            <Button
              type="primary"
              size="large"
              icon={<CompassOutlined />}
              onClick={() => navigate('/driver/missions')}
              style={{
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                borderRadius: 8,
                fontWeight: 600,
                marginTop: 12,
              }}
            >
              {t('driver.activeTrip.viewBriefing', 'Xem Danh sách Nhiệm vụ')}
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  const statusMeta = getTripStatusMeta(activeTrip.overallStatus);
  const isEmergency = activeTrip.overallStatus === 'EmergencyRerouting';
  const checkpoints = activeTrip.checkpoints || [];
  const horses = activeTrip.horses || [];

  // Tính tiến độ trạm dừng
  const passedCheckpoints = checkpoints.filter((cp) => cp.status === 'Departed' || cp.status === 'Arrived').length;
  const progressPercent = checkpoints.length > 0 ? Math.round((passedCheckpoints / checkpoints.length) * 100) : 0;

  // Tìm trạm kế tiếp
  const nextCheckpoint = checkpoints.find((cp) => cp.status === 'Pending') || checkpoints[checkpoints.length - 1];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Tiêu đề & Trạng thái xe */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Space align="center">
            <Title level={2} style={{ margin: 0, color: '#111827' }}>
              {t('driver.activeTrip.title', 'Hành Trình Đang Chạy')}
            </Title>
            <Tag color={statusMeta.color} style={{ borderRadius: 6, fontSize: 13, padding: '3px 10px' }}>
              <Badge status={statusMeta.badgeStatus} text={statusMeta.text} />
            </Tag>
          </Space>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
            {t('driver.activeTrip.subtitle', 'Giám sát điều hành trực tiếp phương tiện, telemetry môi trường thùng xe và chỉ số sinh tồn của ngựa')}
          </Paragraph>
        </div>

        <Space size={10} wrap>
          <Button
            danger
            icon={<AlertOutlined />}
            onClick={() => setSosModalOpen(true)}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            {t('driver.activeTrip.sosButton', 'Báo Cáo Sự Cố (SOS)')}
          </Button>

          <Button
            type="primary"
            icon={<DashboardOutlined />}
            onClick={() => navigate(`/driver/missions/${activeTrip.tripId}/execution`)}
            style={{
              borderRadius: 8,
              backgroundColor: '#F59E0B',
              borderColor: '#F59E0B',
              fontWeight: 600,
            }}
          >
            {t('driver.activeTrip.manageCheckpoints', 'Check-in Trạm Kiểm Soát')}
          </Button>
        </Space>
      </div>

      {/* Cảnh báo khẩn cấp nếu có sự cố */}
      {isEmergency && (
        <Alert
          type="error"
          showIcon
          banner
          message={<Text strong style={{ fontSize: 15 }}>Cảnh báo: Chuyến đi đang kích hoạt điều hướng khẩn cấp (Emergency Rerouting)</Text>}
          description="Đang xử lý đổi lộ trình để đảm bảo an toàn cho ngựa. Vui lòng liên hệ ngay Điều phối viên hoặc trạm thú y gần nhất."
          style={{ borderRadius: 12, marginBottom: 24 }}
        />
      )}

      {/* Khối Telemetry Thời Gian Thực (IoT Telemetry Clean Card) */}
      <Card
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          marginBottom: 24,
          border: '1px solid #E2E8F0',
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Space align="center">
              <DashboardOutlined style={{ color: '#F59E0B', fontSize: 18 }} />
              <Text strong style={{ color: '#111827', fontSize: 15 }}>
                Thông Số Telemetry Thời Gian Thực Khoang Xe
              </Text>
            </Space>
            <div style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
              Phương tiện: <strong>{activeTrip.vehicleCode}</strong> ({activeTrip.vehicleName}) • Tín hiệu GPS: Ổn định
            </div>
          </div>

          <Tag color="processing" style={{ borderRadius: 4, padding: '2px 10px', fontWeight: 600 }}>
            LIVE SENSOR
          </Tag>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card bordered style={{ background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', textAlign: 'center' }} bodyStyle={{ padding: 14 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tốc Độ GPS Hiện Tại</Text>
              <Title level={3} style={{ color: '#111827', margin: '4px 0 2px 0' }}>
                68 <span style={{ fontSize: 13, fontWeight: 400 }}>km/h</span>
              </Title>
              <Tag color="success" style={{ margin: 0, fontSize: 10 }}>Dải an toàn (&lt; 80 km/h)</Tag>
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card bordered style={{ background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', textAlign: 'center' }} bodyStyle={{ padding: 14 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Nhiệt Độ Thùng Xe</Text>
              <Title level={3} style={{ color: '#111827', margin: '4px 0 2px 0' }}>
                19.2 <span style={{ fontSize: 13, fontWeight: 400 }}>°C</span>
              </Title>
              <Tag color="success" style={{ margin: 0, fontSize: 10 }}>Chuẩn FEI (18-20°C)</Tag>
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card bordered style={{ background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', textAlign: 'center' }} bodyStyle={{ padding: 14 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Độ Ẩm Khoang Ngựa</Text>
              <Title level={3} style={{ color: '#111827', margin: '4px 0 2px 0' }}>
                62 <span style={{ fontSize: 13, fontWeight: 400 }}>%</span>
              </Title>
              <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>Thoáng khí tự động</Tag>
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card bordered style={{ background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', textAlign: 'center' }} bodyStyle={{ padding: 14 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Treo Khí Nén Thùng</Text>
              <Title level={3} style={{ color: '#111827', margin: '4px 0 2px 0' }}>
                HOẠT ĐỘNG
              </Title>
              <Tag color="success" style={{ margin: 0, fontSize: 10 }}>Giảm chấn êm dịu</Tag>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Cột trái: Tiến trình lộ trình & Trạm dừng */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <CompassOutlined style={{ color: '#F59E0B' }} />
                  <Text strong style={{ fontSize: 15 }}>Tiến Trình Chặng Đường</Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {passedCheckpoints} / {checkpoints.length} Trạm
                </Text>
              </div>
            }
            style={{ borderRadius: 14, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            {/* Lộ trình xuất phát & đích */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: 16, borderRadius: 10, marginBottom: 20 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>ĐIỂM XUẤT PHÁT</Text>
                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{activeTrip.origin}</div>
              </div>
              <ArrowRightOutlined style={{ color: '#9CA3AF', fontSize: 18 }} />
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>ĐIỂM ĐẾN</Text>
                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{activeTrip.destination}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>Tiến độ tổng thể</Text>
                <Text strong style={{ color: '#F59E0B' }}>{progressPercent}%</Text>
              </div>
              <Progress percent={progressPercent} strokeColor="#F59E0B" showInfo={false} />
            </div>

            {/* Steps Timeline của các trạm */}
            <Steps
              direction="vertical"
              size="small"
              current={passedCheckpoints}
              style={{ marginTop: 16 }}
              items={checkpoints.map((cp) => {
                const isPassed = cp.status === 'Departed' || cp.status === 'Arrived';
                const isCurrent = cp.status === 'Pending' && cp.checkpointId === nextCheckpoint?.checkpointId;

                return {
                  title: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Text strong style={{ color: isPassed ? '#10B981' : isCurrent ? '#D97706' : '#64748B' }}>
                        {cp.checkpointName}
                      </Text>
                      <Tag color={isPassed ? 'success' : isCurrent ? 'warning' : 'default'} style={{ fontSize: 11 }}>
                        {cp.status}
                      </Tag>
                    </div>
                  ),
                  description: (
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      <div><EnvironmentOutlined style={{ marginRight: 4 }} />{cp.address}</div>
                      {cp.mandatoryRestMinutes > 0 && (
                        <div style={{ marginTop: 2, color: '#D97706' }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          Nghỉ bắt buộc: {cp.mandatoryRestMinutes} phút
                        </div>
                      )}
                    </div>
                  ),
                };
              })}
            />

            <Divider style={{ margin: '20px 0 16px 0' }} />

            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={() => navigate(`/driver/missions/${activeTrip.tripId}/execution`)}
                style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', borderRadius: 8, fontWeight: 600 }}
              >
                Mở Màn Hình Điều Hành Lộ Trình Chi Tiết
              </Button>
            </div>
          </Card>
        </Col>

        {/* Cột phải: Ngựa trên xe & Tác vụ nhanh */}
        <Col xs={24} lg={9}>
          {/* Ngựa đang vận chuyển */}
          <Card
            title={
              <Space>
                <HeartOutlined style={{ color: '#EF4444' }} />
                <Text strong style={{ fontSize: 15 }}>Ngựa Đua Trên Xe ({horses.length})</Text>
              </Space>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate(`/driver/missions/${activeTrip.tripId}/welfare-log`)}
                style={{ color: '#F59E0B', fontWeight: 600 }}
              >
                Ghi Sinh Trắc
              </Button>
            }
            style={{ borderRadius: 14, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {horses.map((horse) => (
                <div
                  key={horse.tripHorseId || horse.horseId}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text strong style={{ fontSize: 14, color: '#1E293B' }}>{horse.horseName}</Text>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        Mã chip: {horse.microchipNumber} • Chuồng #{horse.stallSlotNumber || 1}
                      </div>
                    </div>
                    <Tag color="green" style={{ borderRadius: 4 }}>Ổn định</Tag>
                  </div>

                  <Divider style={{ margin: '10px 0' }} />

                  <Row gutter={8} style={{ fontSize: 11, textAlign: 'center' }}>
                    <Col span={8}>
                      <div style={{ color: '#64748B' }}>Nhịp tim</div>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>38 bpm</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#64748B' }}>Thân nhiệt</div>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>38.1 °C</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#64748B' }}>Mức stress</div>
                      <div style={{ fontWeight: 600, color: '#10B981' }}>Bình tĩnh</div>
                    </Col>
                  </Row>
                </div>
              ))}
            </Space>
          </Card>

          {/* Khối các tác vụ chính (Quick Action Tiles) */}
          <Card
            title={<Text strong style={{ fontSize: 15 }}>Tác Vụ Ca Trực Hiện Tại</Text>}
            style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Button
                block
                size="large"
                icon={<SafetyCertificateOutlined style={{ color: '#10B981' }} />}
                onClick={() => navigate(`/driver/missions/${activeTrip.tripId}/checklist`)}
                style={{ textAlign: 'left', borderRadius: 8, height: 48 }}
              >
                1. Checklist An Toàn Xuất Bến
              </Button>

              <Button
                block
                size="large"
                icon={<DashboardOutlined style={{ color: '#3B82F6' }} />}
                onClick={() => navigate(`/driver/missions/${activeTrip.tripId}/execution`)}
                style={{ textAlign: 'left', borderRadius: 8, height: 48 }}
              >
                2. Điều Hành Check-in Trạm Dừng
              </Button>

              <Button
                block
                size="large"
                icon={<HeartOutlined style={{ color: '#EF4444' }} />}
                onClick={() => navigate(`/driver/missions/${activeTrip.tripId}/welfare-log`)}
                style={{ textAlign: 'left', borderRadius: 8, height: 48 }}
              >
                3. Nhật Ký Sinh Trắc Thú Y
              </Button>

              <Button
                block
                size="large"
                type="primary"
                icon={<FileDoneOutlined />}
                onClick={() => navigate(`/driver/missions/${activeTrip.tripId}/arrival`)}
                style={{
                  textAlign: 'left',
                  borderRadius: 8,
                  height: 48,
                  backgroundColor: '#10B981',
                  borderColor: '#10B981',
                  fontWeight: 600,
                }}
              >
                4. Nghiệm Thu & Ký e-POD Điểm Đến
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Modal Báo cáo khẩn cấp SOS */}
      <EmergencyReportModal
        open={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        tripId={activeTrip.tripId}
        tripCode={activeTrip.tripCode}
        horses={activeTrip.horses}
        onSubmit={handleReportSOS}
      />
    </div>
  );
}
