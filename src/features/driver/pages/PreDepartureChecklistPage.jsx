import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  List,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import TripHorseStatusTag from '@components/common/TripHorseStatusTag';
import { ROUTES } from '@routes/routes';
import { getTripStatusMeta } from '@features/driver/services/driverService';
import { useMissionDetail } from '@features/driver/hooks/useDriverMissions';
import { tripService } from '@services/tripService';

const { Text } = Typography;
const ACTIVE_TRIP_STATUSES = ['InTransit', 'EmergencyRerouting', 'ArrivedDestination', 'Completed'];

/**
 * Chuyển enum vai trò trong đoàn xe thành nhãn tiếng Việt.
 * @param {string} role
 * @param {(key: string, options?: Object) => string} t
 * @returns {string}
 */
function getCrewRoleLabel(role, t) {
  return role === 'Driver' ? t('driver.checklist.driverRole') : t('driver.checklist.escortRole');
}

/**
 * Chuyển loại phương tiện backend thành nhãn tiếng Việt.
 * @param {string} vehicleType
 * @param {(key: string, options?: Object) => string} t
 * @returns {string}
 */
function getVehicleTypeLabel(vehicleType, t) {
  if (vehicleType === 'AirStall') return t('driver.checklist.airStall');
  if (vehicleType === 'HorseVan') return t('driver.checklist.horseVan');
  return vehicleType || '—';
}

/**
 * Màn hình đối soát điều kiện xuất bến từ dữ liệu thật của chuyến.
 * @returns {JSX.Element}
 */
export default function PreDepartureChecklistPage() {
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { mission, loading, actionLoading, error, fetchMission, startTrip } = useMissionDetail(tripId);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [departureCheck, setDepartureCheck] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  // Backend chưa có / lỗi kiểm tra trước khi xuất phát (BE-10): báo rõ, không tự tính thay
  const [checkUnavailable, setCheckUnavailable] = useState(false);

  const loadDepartureCheck = useCallback(async () => {
    if (!tripId) return;
    setCheckLoading(true);
    try {
      const res = await tripService.getDepartureCheck(tripId);
      const data = res?.data || res;
      setDepartureCheck(data);
      setCheckUnavailable(false);
    } catch {
      setDepartureCheck(null);
      setCheckUnavailable(true);
    } finally {
      setCheckLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    let ignore = false;
    const initCheck = async () => {
      if (!tripId) return;
      try {
        const res = await tripService.getDepartureCheck(tripId);
        if (!ignore) {
          const data = res?.data || res;
          setDepartureCheck(data);
        }
      } catch {
        if (!ignore) setCheckUnavailable(true);
      }
    };
    initCheck();
    return () => {
      ignore = true;
    };
  }, [tripId]);

  const horses = useMemo(() => mission?.horses || [], [mission?.horses]);
  const crew = useMemo(() => mission?.crew || [], [mission?.crew]);
  const checkpoints = useMemo(() => mission?.routeCheckpoints || [], [mission?.routeCheckpoints]);
  const drivers = crew.filter((member) => member.crewRole === 'Driver');
  const escorts = crew.filter((member) => member.crewRole === 'Escort');
  const requiredEscortCount = Math.max(1, Math.ceil(horses.length / 3));
  const origin = checkpoints.find((checkpoint) => checkpoint.checkpointType === 'Origin');
  const destination = [...checkpoints].reverse().find((checkpoint) => checkpoint.checkpointType === 'Destination');
  const tripStatus = mission?.overallStatus;
  const statusMeta = getTripStatusMeta(tripStatus);
  const allDossiersCleared = horses.length > 0 && horses.every((horse) => horse.dossierStatus === 'Cleared');
  const hasAssignedVehicle = Boolean(mission?.vehicleId && mission?.vehicleCode);
  const hasRequiredCrew = drivers.length >= 1 && escorts.length >= requiredEscortCount;
  const hasValidRoute = Boolean(origin && destination && checkpoints.length >= 2);
  const isScheduled = tripStatus === 'Scheduled';
  const isAlreadyInTransit = ACTIVE_TRIP_STATUSES.includes(tripStatus);

  const readinessItems = useMemo(
    () => [
      {
        key: 'status',
        label: t('driver.checklist.tripStatus'),
        value: statusMeta.text,
        ready: isScheduled,
        note: isScheduled
          ? t('driver.checklist.scheduledReady')
          : t('driver.checklist.scheduledRequired'),
      },
      {
        key: 'vehicle',
        label: t('driver.checklist.assignedVehicle'),
        value: mission?.vehicleCode || t('driver.checklist.notAssigned'),
        ready: hasAssignedVehicle,
        note: hasAssignedVehicle
          ? getVehicleTypeLabel(mission?.vehicleType, t)
          : t('driver.checklist.vehicleRequired'),
      },
      {
        key: 'crew',
        label: t('driver.checklist.operatingCrew'),
        value: t('driver.checklist.crewSummary', {
          drivers: drivers.length,
          escorts: escorts.length,
        }),
        ready: hasRequiredCrew,
        note: hasRequiredCrew
          ? t('driver.checklist.crewReady')
          : t('driver.checklist.crewRequired', { count: requiredEscortCount }),
      },
      {
        key: 'clearance',
        label: t('driver.checklist.clearance'),
        value: t('driver.checklist.clearanceSummary', {
          cleared: horses.filter((horse) => horse.dossierStatus === 'Cleared').length,
          total: horses.length,
        }),
        ready: allDossiersCleared,
        note: allDossiersCleared
          ? t('driver.checklist.clearanceReady')
          : t('driver.checklist.clearanceRequired'),
      },
      {
        key: 'route',
        label: t('driver.checklist.route'),
        value: t('driver.checklist.checkpointCount', { count: checkpoints.length }),
        ready: hasValidRoute,
        note: hasValidRoute
          ? `${origin.checkpointName} → ${destination.checkpointName}`
          : t('driver.checklist.routeRequired'),
      },
    ],
    [
      allDossiersCleared,
      checkpoints.length,
      destination,
      drivers.length,
      escorts.length,
      hasAssignedVehicle,
      hasRequiredCrew,
      hasValidRoute,
      horses,
      isScheduled,
      mission?.vehicleCode,
      mission?.vehicleType,
      origin,
      requiredEscortCount,
      statusMeta.text,
      t,
    ],
  );

  const departureIssues = useMemo(() => departureCheck?.issues || [], [departureCheck?.issues]);
  const blockingIssues = useMemo(() => departureIssues.filter((i) => i.severity === 'Error'), [departureIssues]);
  const warningIssues = useMemo(() => departureIssues.filter((i) => i.severity === 'Warning'), [departureIssues]);

  const blockers = readinessItems.filter((item) => !item.ready);
  const canStart = blockers.length === 0 && blockingIssues.length === 0 && !isAlreadyInTransit;

  const horseColumns = useMemo(
    () => [
      {
        title: t('driver.checklist.horse'),
        dataIndex: 'horseName',
        key: 'horseName',
        render: (value, record) => (
          <div>
            <Text strong>{value}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('driver.checklist.microchip')}: {record.microchipNumber || '—'}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: t('driver.checklist.bookingCode'),
        dataIndex: 'bookingCode',
        key: 'bookingCode',
      },
      {
        title: t('driver.checklist.horseStatus'),
        dataIndex: 'status',
        key: 'status',
        render: (status) => <TripHorseStatusTag status={status || 'Planned'} />,
      },
      {
        title: t('driver.checklist.stall'),
        dataIndex: 'stallClass',
        key: 'stallClass',
        render: (value) => t(`driver.checklist.stallClass.${value}`, value || '—'),
      },
      {
        title: t('driver.checklist.clearanceStatus'),
        dataIndex: 'dossierStatus',
        key: 'dossierStatus',
        render: (value) => (
          <Tag color={value === 'Cleared' ? 'success' : 'error'} style={{ margin: 0 }}>
            {value === 'Cleared'
              ? t('driver.checklist.cleared')
              : t('driver.checklist.notCleared')}
          </Tag>
        ),
      },
    ],
    [t],
  );

  const handleStartMission = async () => {
    setStartConfirmOpen(false);
    const success = await startTrip();
    if (success) {
      message.success(t('driver.checklist.startSuccess'));
      navigate(`/driver/missions/${tripId}/execution`);
    }
  };

  if (loading && !mission) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" description={t('driver.checklist.loading')} />
      </div>
    );
  }

  if (!mission) {
    return (
      <Card>
        <Empty description={error || t('driver.checklist.notFound')}>
          <Button onClick={() => navigate(ROUTES.DRIVER_MISSIONS)}>
            {t('driver.checklist.backToMissions')}
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      <PageHeader
        title={t('driver.checklist.title')}
        subtitle={t('driver.checklist.subtitle', { code: mission.tripCode })}
        breadcrumb={[
          { label: t('driver.missions.title'), path: ROUTES.DRIVER_MISSIONS },
          { label: mission.tripCode },
        ]}
        actions={
          <Button
            onClick={() => {
              fetchMission();
              loadDepartureCheck();
            }}
            loading={loading || checkLoading}
          >
            {t('driver.checklist.refresh')}
          </Button>
        }
      />

      {error && (
        <Alert
          type="error"
          showIcon
          message={t('driver.checklist.loadError')}
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      {isAlreadyInTransit && (
        <Alert
          type="info"
          showIcon
          message={t('driver.checklist.alreadyStarted')}
          description={t('driver.checklist.alreadyStartedDescription', { status: statusMeta.text })}
          action={
            <Button type="primary" onClick={() => navigate(`/driver/missions/${tripId}/execution`)}>
              {t('driver.checklist.openTracking')}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Card style={{ marginBottom: 20 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 4 }} size="small">
          <Descriptions.Item label={t('driver.checklist.tripCode')}>
            <Text strong>{mission.tripCode}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('driver.checklist.status')}>
            <Tag color={statusMeta.color} style={{ margin: 0 }}>
              {statusMeta.text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('driver.checklist.departure')}>
            {mission.plannedStartDate
              ? dayjs(mission.plannedStartDate).format('DD/MM/YYYY HH:mm')
              : '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('driver.checklist.vehicle')}>
            {mission.vehicleCode || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {!isAlreadyInTransit && (
        <Alert
          type={canStart ? 'success' : 'warning'}
          showIcon
          message={
            canStart
              ? t('driver.checklist.readyToStart')
              : t('driver.checklist.mandatoryPending')
          }
          description={
            canStart
              ? t('driver.checklist.readyDescription')
              : t('driver.checklist.pendingDescription', {
                  count: blockers.length + blockingIssues.length,
                })
          }
          style={{ marginBottom: 20 }}
        />
      )}

      {!isAlreadyInTransit && checkUnavailable && (
        <Alert
          type="info"
          showIcon
          title={t('driver.checklist.departureCheck.unavailable')}
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Cảnh báo các vấn đề chặn xuất phát từ API kiểm tra trước khi khởi hành (FE-09 / R-12 / R-15) */}
      {!isAlreadyInTransit && blockingIssues.length > 0 && (
        <Alert
          type="error"
          showIcon
          message={t('driver.checklist.departureCheck.blockingTitle', { count: blockingIssues.length })}
          description={
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                {t('driver.checklist.departureCheck.blockingHint')}
              </Text>
              <List
                size="small"
                dataSource={blockingIssues}
                renderItem={(issue, idx) => (
                  <List.Item key={idx} style={{ padding: '6px 0' }}>
                    <Space align="start">
                      <Tag color="error">
                        {issue.category
                          ? t(`driver.checklist.departureCheck.category.${issue.category}`, issue.category)
                          : t('driver.checklist.departureCheck.errorTag')}
                      </Tag>
                      <div>
                        {issue.horseName && <Text strong style={{ marginRight: 8 }}>{issue.horseName}</Text>}
                        {issue.bookingCode && <Tag style={{ marginRight: 8 }}>{issue.bookingCode}</Tag>}
                        <Text>{issue.message}</Text>
                      </div>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          }
          style={{ marginBottom: 20 }}
        />
      )}

      {!isAlreadyInTransit && warningIssues.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={t('driver.checklist.departureCheck.warningTitle', { count: warningIssues.length })}
          description={
            <List
              size="small"
              dataSource={warningIssues}
              renderItem={(issue, idx) => (
                <List.Item key={idx} style={{ padding: '4px 0' }}>
                  <Space align="start">
                    <Tag color="warning">
                      {issue.category
                        ? t(`driver.checklist.departureCheck.category.${issue.category}`, issue.category)
                        : t('driver.checklist.departureCheck.warningTag')}
                    </Tag>
                    <div>
                      {issue.horseName && <Text strong style={{ marginRight: 8 }}>{issue.horseName}</Text>}
                      {issue.bookingCode && <Tag style={{ marginRight: 8 }}>{issue.bookingCode}</Tag>}
                      <Text>{issue.message}</Text>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          }
          style={{ marginBottom: 20 }}
        />
      )}

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <Card title={t('driver.checklist.departureConditions')} style={{ height: '100%' }}>
            <List
              dataSource={readinessItems}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Tag color={item.ready ? 'success' : 'warning'} style={{ margin: 0 }}>
                      {item.ready ? t('driver.checklist.ready') : t('driver.checklist.notReady')}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    title={
                      <Flex justify="space-between" gap={12} wrap="wrap">
                        <Text strong>{item.label}</Text>
                        <Text>{item.value}</Text>
                      </Flex>
                    }
                    description={item.note}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card title={t('driver.checklist.route')}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={t('driver.checklist.origin')}>
                  {origin ? `${origin.checkpointName} · ${origin.address}` : '—'}
                </Descriptions.Item>
                <Descriptions.Item label={t('driver.checklist.destination')}>
                  {destination ? `${destination.checkpointName} · ${destination.address}` : '—'}
                </Descriptions.Item>
                <Descriptions.Item label={t('driver.checklist.plannedArrival')}>
                  {mission.plannedEndDate
                    ? dayjs(mission.plannedEndDate).format('DD/MM/YYYY HH:mm')
                    : '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={t('driver.checklist.operatingCrew')}>
              <List
                dataSource={crew}
                locale={{ emptyText: t('driver.checklist.noCrew') }}
                renderItem={(member) => (
                  <List.Item>
                    <List.Item.Meta
                      title={member.fullName}
                      description={`${getCrewRoleLabel(member.crewRole, t)}${member.isLead ? ` · ${t('driver.checklist.lead')}` : ''}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Col>

        <Col span={24}>
          <Card title={t('driver.checklist.horseClearance')}>
            <Table
              rowKey="tripHorseId"
              columns={horseColumns}
              dataSource={horses}
              pagination={false}
              scroll={{ x: 720 }}
              locale={{ emptyText: t('driver.checklist.noHorses') }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 20 }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <Button onClick={() => navigate(ROUTES.DRIVER_MISSIONS)}>
            {t('driver.checklist.backToMissions')}
          </Button>
          {!isAlreadyInTransit && (
            <Button
              type="primary"
              size="large"
              disabled={!canStart}
              loading={actionLoading}
              onClick={() => setStartConfirmOpen(true)}
            >
              {t('driver.checklist.startTrip')}
            </Button>
          )}
        </Flex>
      </Card>

      <Modal
        title={t('driver.checklist.confirmTitle')}
        open={startConfirmOpen}
        onCancel={() => setStartConfirmOpen(false)}
        onOk={handleStartMission}
        confirmLoading={actionLoading}
        okText={t('driver.checklist.confirmStart')}
        cancelText={t('common.cancel')}
      >
        <p>{t('driver.checklist.confirmDescription', { code: mission.tripCode })}</p>
        <p>{t('driver.checklist.confirmEffect')}</p>
      </Modal>
    </div>
  );
}
