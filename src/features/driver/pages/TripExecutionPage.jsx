import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Timeline,
  Modal,
  Spin,
  Alert,
  message,
  Popconfirm,
  Switch,
} from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  FileDoneOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { Tooltip } from 'antd';
import { useMissionDetail } from '../hooks/useDriverMissions';
import MissionHeaderCard from '../components/MissionHeaderCard';
import TripHorseStatusTag from '@components/common/TripHorseStatusTag';
import EmergencyReportModal from '../components/EmergencyReportModal';
import TripIncidentsCard from '../components/TripIncidentsCard';

const { Title, Text, Paragraph } = Typography;

/**
 * Trả về màu và nhãn cho trạng thái trạm kiểm soát
 * @param {string} status
 */
function getCheckpointStatusMeta(status) {
  switch (status) {
    case 'Departed':
      return { color: 'green', text: 'Đã rời trạm', icon: <CheckCircleOutlined /> };
    case 'Cleared':
      return { color: 'cyan', text: 'Đã hoàn tất kiểm tra', icon: <SafetyCertificateOutlined /> };
    case 'Arrived':
      return { color: 'blue', text: 'Đang tại trạm', icon: <LoginOutlined /> };
    case 'Pending':
    default:
      return { color: 'default', text: 'Chờ đến', icon: <ClockCircleOutlined /> };
  }
}

/**
 * Màn hình 3: Vận hành lộ trình & Theo dõi trạm kiểm soát (Trip Execution & Checkpoints)
 */
export default function TripExecutionPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const {
    mission,
    incidents,
    loading,
    actionLoading,
    error,
    arriveCheckpoint,
    clearCheckpoint,
    departCheckpoint,
    reportIncident,
    fetchMission,
  } = useMissionDetail(tripId);

  // Mở từ thông báo sự cố (#incidents): tải lại để thấy phương án mới nhất rồi cuộn tới khung sự cố
  useEffect(() => {
    if (location.hash !== '#incidents') return;
    fetchMission();
  }, [location.key, location.hash, fetchMission]);

  useEffect(() => {
    if (location.hash === '#incidents' && incidents.length > 0) {
      document.getElementById('incidents')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.key, location.hash, incidents.length]);
  const [sosPreset, setSosPreset] = useState(null);

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [selectedCp, setSelectedCp] = useState(null);

  const checkpoints = mission?.routeCheckpoints || [];
  // Mốc được thêm theo phương án xử lý sự cố đã duyệt: checkpointId -> mã sự cố
  const addedByIncident = new Map();
  (incidents || []).forEach((inc) =>
    (inc.routeChange?.newCheckpoints || []).forEach((c) => c.checkpointId && addedByIncident.set(c.checkpointId, inc.incidentCode)),
  );
  const { user } = useAuthStore();
  const userRole = user?.role || user?.Role;
  const isAirFlight = mission?.transportMode === 'Air';
  // Backend: chỉ người có tên trong đoàn xe của chuyến (Driver hoặc Escort) và Admin được cập nhật hành trình
  const isCrewMember = (mission?.crew || []).some((c) => Number(c.userId) === Number(user?.userId));
  const canUpdateRoute = isCrewMember || userRole === 'Admin';
  // R-06: escort xem riêng các ngựa mình phụ trách (mặc định bật nếu có ngựa được giao)
  const isMyHorse = (h) => Number(h.escortUserId) === Number(user?.userId);
  const hasMyHorses = (mission?.horses || []).some(isMyHorse);
  const [onlyMine, setOnlyMine] = useState(null);
  const showOnlyMine = onlyMine ?? hasMyHorses;

  // Mở modal xác nhận thông quan cửa khẩu
  const handleOpenClearModal = (cp) => {
    setSelectedCp(cp);
    setClearModalOpen(true);
  };

  // Xác nhận thông quan (POST /checkpoints/{id}/clear không nhận body)
  const handleConfirmClear = async () => {
    if (!selectedCp) return;
    const success = await clearCheckpoint(selectedCp.checkpointId);
    if (success) {
      message.success(`Đã hoàn tất kiểm tra tại trạm "${selectedCp.locationName}"!`);
      setClearModalOpen(false);
      setSelectedCp(null);
    }
  };

  // Check-in Arrive
  const handleArrive = async (cp) => {
    const success = await arriveCheckpoint(cp.checkpointId);
    if (success) {
      message.success(`Đã check-in đến trạm "${cp.locationName}"!`);
    }
  };

  // Check-in Depart
  const handleDepart = async (cp) => {
    const success = await departCheckpoint(cp.checkpointId);
    if (success) {
      message.success(`Đã xác nhận rời trạm "${cp.locationName}" tiếp tục hành trình!`);
      // Nếu là trạm cuối cùng (hoặc điểm đích), thông báo chuyển sang e-POD
      if (cp.locationType === 'Destination' || cp.orderIndex === checkpoints.length) {
        message.info('Xe đã đến điểm đích an toàn! Vui lòng tiến hành nghiệm thu bàn giao e-POD.');
      }
    }
  };

  if (loading && !mission) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải lộ trình và trạm kiểm soát..." />
      </div>
    );
  }

  const isDestinationReached =
    mission?.overallStatus === 'ArrivedDestination' || mission?.overallStatus === 'Completed';
  const isOnTheRoad = ['InTransit', 'EmergencyRerouting', 'ArrivedDestination'].includes(mission?.overallStatus);

  // R-04: đơn được trả ở mốc DropOff này còn ngựa trên xe chưa bàn giao không
  const bookingOf = (bookingId) => (mission?.bookings || []).find((b) => b.bookingId === bookingId);
  const horsesAwaitingHandover = (bookingId) =>
    (mission?.horses || []).filter((h) => h.bookingId === bookingId && (h.status === 'InTransit' || h.status === 'Planned'));


  // Số liệu tóm tắt lấy từ dữ liệu thật của chuyến (mốc + nhật ký thể trạng), không có cảm biến GPS
  const welfareLogs = [...(mission?.welfareLogs || [])].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
  const latestLog = welfareLogs[0];
  const passedCount = checkpoints.filter(
    (cp) => cp.status === 'Departed' || (cp.locationType === 'Destination' && cp.actualArrivalTime),
  ).length;
  const alertCount = welfareLogs.filter((log) => log.needsAttention).length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header thông tin tóm tắt chuyến xe */}
      <MissionHeaderCard
        mission={mission}
        activeTab="execution"
        onOpenSos={() => setSosModalOpen(true)}
        breadcrumbItems={[{ title: 'Lộ trình & Trạm kiểm soát' }]}
      />

      {error && (
        <Alert
          message="Lỗi tác nghiệp"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      {/* Thông báo nếu đã tới điểm đích */}
      {isDestinationReached && (
        <Alert
          message="Đã tới điểm đích an toàn!"
          description="Chuyến xe đã hoàn thành toàn bộ các mốc kiểm soát. Tiếp tục với bước lập Biên bản bàn giao và Ký xác nhận điện tử (e-POD)."
          type="success"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
          action={
            <Button
              type="primary"
              onClick={() => navigate(`/driver/missions/${tripId}/arrival`)}
              style={{ backgroundColor: '#10B981', borderColor: '#10B981', fontWeight: 600 }}
            >
              Chuyển sang ký e-POD
            </Button>
          }
        />
      )}

      {/* Tóm tắt chuyến từ dữ liệu thật */}
      <Card style={{ borderRadius: 12, marginBottom: 24, border: '1px solid #E5E7EB' }} bodyStyle={{ padding: '16px 24px' }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={12} md={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('driver.execution.summary.checkpoints')}</Text>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {passedCount}/{checkpoints.length}
            </div>
          </Col>
          <Col xs={12} md={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('driver.execution.summary.cabinTemp')}</Text>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {latestLog ? `${latestLog.cabinTemp} °C` : '—'}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {latestLog
                ? t('driver.execution.summary.loggedAt', {
                    time: new Date(latestLog.loggedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
                  })
                : t('driver.execution.summary.noLog')}
            </Text>
          </Col>
          <Col xs={12} md={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('driver.execution.summary.logs')}</Text>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {welfareLogs.length}
              {alertCount > 0 && (
                <Tag color="red" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                  {t('driver.execution.summary.alerts', { count: alertCount })}
                </Tag>
              )}
            </div>
          </Col>
          <Col xs={12} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<HeartOutlined />}
              onClick={() => navigate(`/driver/missions/${tripId}/welfare-log`)}
              style={{ fontWeight: 600, borderRadius: 8 }}
            >
              Ghi nhật ký phúc lợi ngựa
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Sự cố của chuyến và phương án xử lý đã duyệt */}
      <TripIncidentsCard incidents={incidents} />

      {/* Danh sách các Mốc Lộ trình & Trạm kiểm soát */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #E5E7EB',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: '#111827' }}>
              Danh sách trạm kiểm soát & Điểm dừng nghỉ trên lộ trình
            </Title>
            <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
              {t('driver.execution.stepsHint')}
            </Paragraph>
          </div>

          <Tag color="blue" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6 }}>
            Tổng số: {checkpoints.length} trạm
          </Tag>
        </div>

        {/* Banner phân quyền tác nghiệp Flow 4 theo Figma */}
        {!canUpdateRoute && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 20, borderRadius: 10 }}
            message={
              isAirFlight
                ? '✈️ Hành trình Chuyên cơ Hàng không (Air Flight)'
                : '🚛 Tuyến đường bộ / Door-to-Door (Ground Trailer)'
            }
            description={
              isAirFlight
                ? 'Theo quy định vận hành, Bác sĩ thú y / Chuyên viên Áp tải (Escort) trực tiếp áp tải trên chuyên cơ và phụ trách check-in các mốc lộ trình bay. Cả Tài xế và Áp tải đều có toàn quyền gửi Báo cáo Tình huống Khẩn cấp (SOS).'
                : 'Theo quy định vận hành, Tài xế (Driver) phụ trách check-in các trạm dừng và ghi nhận chỉ số Odometer. Bác sĩ Áp tải (Escort) phụ trách ghi nhận Nhật ký Phúc lợi ngựa. Cả Tài xế và Áp tải đều có toàn quyền gửi Báo cáo Tình huống Khẩn cấp (SOS).'
            }
          />
        )}

        {/* R-08: đoàn xe đang trễ so với kế hoạch */}
        {isOnTheRoad && mission?.liveDelayMinutes > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
            message={t('driver.execution.behindSchedule', { minutes: mission.liveDelayMinutes })}
          />
        )}

        {/* Timeline chi tiết các trạm */}
        <Timeline
          mode="left"
          items={checkpoints.map((cp) => {
            const statusMeta = getCheckpointStatusMeta(cp.status);
            const isDestination = cp.locationType === 'Destination';
            const isBorder = cp.locationType === 'BorderGate' || cp.locationType === 'Customs';
            const isDropOff = cp.locationType === 'DropOff';
            // Xe đang dừng ở điểm trả của một đơn mà đơn đó chưa ký biên bản: phải bàn giao trước khi đi tiếp
            const handoverPendingHere =
              isDropOff && cp.status === 'Arrived' && horsesAwaitingHandover(cp.bookingId).length > 0
              && !bookingOf(cp.bookingId)?.handoverCompleted;

            return {
              color: statusMeta.color === 'default' ? 'gray' : statusMeta.color,
              dot: (
                <div
                  style={{
                    background:
                      cp.status === 'Departed'
                        ? '#10B981'
                        : cp.status === 'Arrived' || cp.status === 'Cleared'
                        ? '#F59E0B'
                        : '#9CA3AF',
                    color: '#FFF',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {cp.orderIndex}
                </div>
              ),
              children: (
                <Card
                  key={cp.checkpointId}
                  style={{
                    borderRadius: 10,
                    marginBottom: 20,
                    border:
                      cp.status === 'Arrived' || cp.status === 'Cleared'
                        ? '2px solid #F59E0B'
                        : '1px solid #E5E7EB',
                    background:
                      cp.status === 'Arrived' || cp.status === 'Cleared'
                        ? '#FFFBEB'
                        : cp.status === 'Departed'
                        ? '#F9FAFB'
                        : '#FFFFFF',
                  }}
                  bodyStyle={{ padding: 18 }}
                >
                  <Row gutter={[16, 12]} align="middle">
                    {/* Thông tin mốc kiểm soát */}
                    <Col xs={24} lg={14}>
                      <Space align="center" size={8} wrap>
                        <Title level={5} style={{ margin: 0, color: '#1F2937' }}>
                          {cp.locationName}
                        </Title>
                        <Tag color={statusMeta.color} icon={statusMeta.icon} style={{ borderRadius: 6 }}>
                          {statusMeta.text}
                        </Tag>
                        {isBorder && (
                          <Tag color="purple" style={{ borderRadius: 4 }}>
                            Cửa khẩu quốc tế
                          </Tag>
                        )}
                        {isDestination && (
                          <Tag color="success" style={{ borderRadius: 4 }}>
                            Điểm giao đích
                          </Tag>
                        )}
                        {addedByIncident.has(cp.checkpointId) && (
                          <Tag color="green" style={{ borderRadius: 4 }}>
                            {t('driver.incidents.addedStop', { code: addedByIncident.get(cp.checkpointId) })}
                          </Tag>
                        )}
                        {cp.locationType === 'PickUp' && (
                          <Tag color="cyan" style={{ borderRadius: 4 }}>
                            {t('driver.execution.pickUpTag', { code: cp.bookingCode })}
                          </Tag>
                        )}
                        {isDropOff && (
                          <Tag color="orange" style={{ borderRadius: 4 }}>
                            {t('driver.execution.dropOffTag', { code: cp.bookingCode })}
                          </Tag>
                        )}
                      </Space>

                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: '#4B5563' }}>
                        <EnvironmentOutlined style={{ color: '#9CA3AF' }} />
                        <Text type="secondary">{cp.address}</Text>
                      </div>

                      <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                        <div>
                          <Text type="secondary">Kế hoạch đến: </Text>
                          <Text strong>
                            {cp.plannedArrivalTime
                              ? new Date(cp.plannedArrivalTime).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                })
                              : 'Chưa có'}
                          </Text>
                        </div>

                        {/* R-08: giờ dự kiến mới theo check-in thực tế, chỉ hiện khi lệch kế hoạch */}
                        {!cp.actualArrivalTime &&
                          cp.estimatedArrivalTime &&
                          cp.plannedArrivalTime &&
                          new Date(cp.estimatedArrivalTime).getTime() - new Date(cp.plannedArrivalTime).getTime() >= 60000 && (
                            <div>
                              <Text type="secondary">{t('driver.execution.revisedEta')}: </Text>
                              <Text strong style={{ color: '#DC2626' }}>
                                {new Date(cp.estimatedArrivalTime).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </Text>
                            </div>
                          )}

                        {cp.actualArrivalTime && (
                          <div>
                            <Text type="secondary">Thực tế đến: </Text>
                            <Text strong style={{ color: '#0284C7' }}>
                              {new Date(cp.actualArrivalTime).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </div>
                        )}

                        {cp.actualDepartureTime && (
                          <div>
                            <Text type="secondary">Rời trạm: </Text>
                            <Text strong style={{ color: '#16A34A' }}>
                              {new Date(cp.actualDepartureTime).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Ghi chú hoặc số tờ khai */}
                      {cp.clearanceNumber && (
                        <div style={{ marginTop: 6 }}>
                          <Tag color="cyan">Số tờ khai/chứng chỉ: {cp.clearanceNumber}</Tag>
                        </div>
                      )}
                      {cp.notes && (
                        <Paragraph type="secondary" style={{ margin: '6px 0 0 0', fontSize: 12 }}>
                          Ghi chú: {cp.notes}
                        </Paragraph>
                      )}
                    </Col>

                    {/* Nút hành động theo State Machine */}
                    <Col xs={24} lg={10} style={{ textAlign: 'right' }}>
                      <Space size={8} wrap>
                        {/* 1. Nếu Pending -> Có nút Arrive */}
                        {cp.status === 'Pending' && (
                          <Tooltip title={!canUpdateRoute ? "Chỉ thành viên đoàn xe của chuyến này mới cập nhật được hành trình" : ""}>
                          <Button
                            type="primary"
                            icon={<LoginOutlined />}
                            loading={actionLoading}
                            disabled={!canUpdateRoute}
                            onClick={() => handleArrive(cp)}
                            style={{
                              backgroundColor: '#0284C7',
                              borderColor: '#0284C7',
                              borderRadius: 8,
                              fontWeight: 600,
                            }}
                          >
                            Xác nhận Đã đến trạm
                          </Button>
                          </Tooltip>
                        )}

                        {/* 2. Cửa khẩu đã tới -> phải thông quan trước khi rời (backend: /checkpoints/{id}/clear chỉ cho BorderGate) */}
                        {cp.status === 'Arrived' && isBorder && (
                          <Tooltip title={!canUpdateRoute ? "Chỉ thành viên đoàn xe của chuyến này mới cập nhật được hành trình" : ""}>
                            <Button
                              type="primary"
                              icon={<SafetyCertificateOutlined />}
                              disabled={!canUpdateRoute}
                              onClick={() => handleOpenClearModal(cp)}
                              style={{
                                backgroundColor: '#7C3AED',
                                borderColor: '#7C3AED',
                                borderRadius: 8,
                                fontWeight: 600,
                              }}
                            >
                              Hoàn tất kiểm tra / Thông quan
                            </Button>
                          </Tooltip>
                        )}

                        {/* 2b. Điểm trả của một đơn giữa đường (R-04): ký e-POD cho đơn đó trước khi rời */}
                        {handoverPendingHere && (
                          <Button
                            type="primary"
                            icon={<FileDoneOutlined />}
                            onClick={() => navigate(`/driver/missions/${tripId}/arrival?booking=${cp.bookingId}`)}
                            style={{ backgroundColor: '#10B981', borderColor: '#10B981', borderRadius: 8, fontWeight: 600 }}
                          >
                            {t('driver.execution.handoverHere', { code: cp.bookingCode })}
                          </Button>
                        )}

                        {/* 3. Rời mốc: cửa khẩu sau khi Cleared, mốc khác ngay sau khi Arrived; điểm giao không có bước rời */}
                        {!isDestination && !handoverPendingHere && (cp.status === 'Cleared' || (cp.status === 'Arrived' && !isBorder)) && (
                          <Tooltip title={!canUpdateRoute ? "Chỉ thành viên đoàn xe của chuyến này mới cập nhật được hành trình" : ""}>
                            <Popconfirm
                              title="Xác nhận rời trạm kiểm soát?"
                              description="Đảm bảo ngựa đã ổn định và toàn bộ giấy tờ đã được bàn giao lại cho kíp lái."
                              onConfirm={() => handleDepart(cp)}
                              okText="Rời trạm"
                              cancelText="Kiểm tra lại"
                              disabled={!canUpdateRoute}
                            >
                              <Button
                                type="primary"
                                icon={<LogoutOutlined />}
                                loading={actionLoading}
                                disabled={!canUpdateRoute}
                                style={{
                                  backgroundColor: '#10B981',
                                  borderColor: '#10B981',
                                  borderRadius: 8,
                                  fontWeight: 600,
                                }}
                              >
                                Xác nhận Rời trạm
                              </Button>
                            </Popconfirm>
                          </Tooltip>
                        )}

                        {handoverPendingHere && (
                          <div style={{ width: '100%', fontSize: 12, color: '#B45309' }}>{t('driver.execution.handoverFirst')}</div>
                        )}

                        {/* 4. Nếu Departed -> Hiển thị badge hoàn tất */}
                        {cp.status === 'Departed' && (
                          <Tag color="success" icon={<CheckCircleOutlined />} style={{ padding: '4px 10px', borderRadius: 6 }}>
                            Đã qua mốc này
                          </Tag>
                        )}

                        {/* Nút phụ ghi nhật ký sức khỏe ngựa tại trạm */}
                        {['Arrived', 'Cleared', 'Departed'].includes(cp.status) && (
                          <Button
                            icon={<HeartOutlined />}
                            size="small"
                            onClick={() => navigate(`/driver/missions/${tripId}/welfare-log`)}
                            style={{ borderRadius: 6 }}
                          >
                            Ghi sinh trắc
                          </Button>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ),
            };
          })}
        />
      </Card>

      {/* Ngựa trên chuyến và trạng thái từng con (R-05) */}
      <Card
        title={t('driver.execution.horsesTitle')}
        extra={
          hasMyHorses && (
            <Space size={6}>
              <Text style={{ fontSize: 12 }}>{t('driver.escortAssign.onlyMine')}</Text>
              <Switch size="small" checked={showOnlyMine} onChange={setOnlyMine} />
            </Space>
          )
        }
        style={{ borderRadius: 12, marginBottom: 24, border: '1px solid #E5E7EB' }}
        bodyStyle={{ padding: '8px 24px' }}
      >
        {(mission?.horses || [])
          .filter((h) => !showOnlyMine || isMyHorse(h))
          .slice()
          .sort((a, b) => a.stallSlotNumber - b.stallSlotNumber)
          .map((h, idx) => (
            <Row
              key={h.tripHorseId}
              gutter={[12, 6]}
              align="middle"
              style={{ padding: '10px 0', borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6' }}
            >
              <Col xs={24} md={14}>
                <Text strong>{h.horseName}</Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  {h.bookingCode} · {t('customerTrips.stall', { number: h.stallSlotNumber })}
                  {h.escortName ? ` · ${t('driver.escortAssign.escort', { name: h.escortName })}` : ''}
                </Text>
                {isMyHorse(h) && (
                  <Tag color="gold" style={{ marginLeft: 8 }}>
                    {t('driver.escortAssign.mine')}
                  </Tag>
                )}
                {h.offloadReason && <div style={{ fontSize: 12, color: '#6B7280' }}>{h.offloadReason}</div>}
              </Col>
              <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                <Space size={8}>
                  <TripHorseStatusTag status={h.status} />
                  {isOnTheRoad && canUpdateRoute && (h.status === 'InTransit' || h.status === 'Planned') && (
                    <Button
                      size="small"
                      danger
                      icon={<AlertOutlined />}
                      onClick={() => {
                        setSosPreset({
                          incidentType: 'HorseHealth',
                          affectedTripHorseId: h.tripHorseId,
                          severity: 'Moderate',
                          emergencyOffload: true,
                        });
                        setSosModalOpen(true);
                      }}
                    >
                      {t('driver.execution.horseCannotContinue')}
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          ))}
      </Card>

      {/* Modal hoàn tất kiểm tra trạm (Clear Modal) */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#7C3AED' }} />
            <span>Hoàn tất kiểm tra tại: {selectedCp?.locationName}</span>
          </Space>
        }
        open={clearModalOpen}
        onCancel={() => setClearModalOpen(false)}
        onOk={handleConfirmClear}
        okText={t('driver.execution.clearOk')}
        cancelText="Hủy"
        okButtonProps={{
          style: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
          loading: actionLoading,
        }}
      >
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('driver.execution.clearConfirm')}
        </Paragraph>
      </Modal>

      {/* Modal Báo cáo khẩn cấp SOS */}
      <EmergencyReportModal
        open={sosModalOpen}
        onClose={() => {
          setSosModalOpen(false);
          setSosPreset(null);
        }}
        tripId={tripId}
        tripCode={mission?.tripCode}
        horses={mission?.horses || []}
        presetValues={sosPreset}
        onSubmit={reportIncident}
      />
    </div>
  );
}
