import { Alert, Card, Col, Descriptions, Row, Space, Table, Tag, Timeline, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import StatusTag from '@components/common/StatusTag';
import TripHorseStatusTag from '@components/common/TripHorseStatusTag';
import StallMap from '@features/coordinator/components/StallMap';
// Đang sửa TripPlanSummary vì hiện vận đơn hàng không của chuyến cho mọi vai trò xem chuyến (FE-17)
import AirWaybillCard from '@components/common/AirWaybillCard';

const { Text } = Typography;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

const CHECKPOINT_TYPE_COLORS = {
  Origin: 'green',
  PickUp: 'cyan',
  RestStop: 'blue',
  DropOff: 'orange',
  BorderGate: 'purple',
  Destination: 'gold',
};

/**
 * Tóm tắt kế hoạch một chuyến (dạng GET /trips/{id}): xe, đoàn xe, ngựa theo ô chuồng, lộ trình, các đơn.
 * Dùng chung cho màn hình lập kế hoạch (điều phối) và duyệt kế hoạch (quản lý).
 *
 * @param {Object} props
 * @param {Object} props.trip - Chi tiết chuyến từ backend
 * @returns {JSX.Element}
 */
export default function TripPlanSummary({ trip }) {
  const { t } = useTranslation();
  if (!trip) return null;

  const drivers = (trip.crew || []).filter((c) => c.crewRole === 'Driver');
  const escorts = (trip.crew || []).filter((c) => c.crewRole === 'Escort');
  const escortList = [...escorts.filter((c) => c.isLead), ...escorts.filter((c) => !c.isLead)];
  const notCleared = (trip.horses || []).filter((h) => h.dossierStatus !== 'Cleared');

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {trip.planRejectionReason && (
        <Alert
          type="warning"
          showIcon
          message={t('tripPlan.summary.lastRejection', { count: trip.planRejectionCount })}
          description={trip.planRejectionReason}
        />
      )}
      {notCleared.length > 0 && (
        <Alert
          type="info"
          showIcon
          message={t('tripPlan.summary.dossiersPending', { count: notCleared.length })}
        />
      )}

      <Card size="small" style={{ borderRadius: 12 }}>
        <Descriptions size="small" column={{ xs: 1, md: 2 }} labelStyle={{ color: '#64748b' }}>
          <Descriptions.Item label={t('tripPlan.fields.status')}>
            <StatusTag status={trip.overallStatus} />
          </Descriptions.Item>
          <Descriptions.Item label={t('tripPlan.fields.vehicle')}>
            <Text strong>{trip.vehicleCode}</Text> · {trip.vehicleType}
            {trip.vehicleCapacity ? ` · ${t('tripPlan.fields.capacity', { count: trip.vehicleCapacity })}` : ''}
          </Descriptions.Item>
          <Descriptions.Item label={t('tripPlan.fields.plannedStart')}>{formatTime(trip.plannedStartDate)}</Descriptions.Item>
          <Descriptions.Item label={t('tripPlan.fields.plannedEnd')}>{formatTime(trip.plannedEndDate)}</Descriptions.Item>
          <Descriptions.Item label={t('tripPlan.fields.plannedCost')}>
            {Number(trip.plannedCost || 0).toLocaleString('en-US')} USD
          </Descriptions.Item>
          <Descriptions.Item label={t('tripPlan.fields.plannedBy')}>{trip.plannedByName || '—'}</Descriptions.Item>
          {trip.approvedByName && (
            <Descriptions.Item label={t('tripPlan.fields.approvedBy')}>
              {trip.approvedByName} · {formatTime(trip.approvedAt)}
            </Descriptions.Item>
          )}
          <Descriptions.Item label={t('tripPlan.fields.rejections')}>{trip.planRejectionCount || 0}/3</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title={t('tripPlan.sections.crew')} style={{ borderRadius: 12, height: '100%' }}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {[...drivers, ...escorts].map((c, idx) => (
                <div key={`${c.userId}-${c.crewRole}-${idx}`}>
                  <Tag color={c.crewRole === 'Driver' ? 'orange' : 'cyan'}>{t(`tripPlan.crewRole.${c.crewRole}`)}</Tag>
                  <Text strong>{c.fullName}</Text>
                  {c.isLead && <Tag style={{ marginLeft: 6 }}>{t('tripPlan.fields.lead')}</Tag>}
                  {c.crewRole === 'Escort' && c.assignedHorseCount != null && (
                    <Tag style={{ marginLeft: 6 }}>{t('tripPlan.stallMap.load', { count: c.assignedHorseCount, max: 3 })}</Tag>
                  )}
                  <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
                    {c.phoneNumber}
                    {c.duty ? ` · ${c.duty}` : ''}
                  </Text>
                </div>
              ))}
              {(trip.crew || []).length === 0 && <Text type="secondary">—</Text>}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title={t('tripPlan.sections.bookings')} style={{ borderRadius: 12, height: '100%' }}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {(trip.bookings || []).map((b) => (
                <div key={b.bookingId} style={{ fontSize: 13 }}>
                  <Text strong>{b.bookingCode}</Text> · {b.customerName} · {t('tripPlan.fields.horseCount', { count: b.horseCountOnTrip })}
                  <div style={{ color: '#64748b', fontSize: 12 }}>
                    {b.pickupAddress} → {b.dropoffAddress}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    {t('tripPlan.fields.eta')}:{' '}
                    <Text type={b.estimatedDeliveryAt && dayjs(b.estimatedDeliveryAt).isAfter(dayjs(b.deliveryDeadline)) ? 'danger' : undefined}>
                      {formatTime(b.estimatedDeliveryAt)}
                    </Text>{' '}
                    · {t('tripPlan.fields.deadline')}: {formatTime(b.deliveryDeadline)}
                    {b.deliveredHorseCount > 0 && (
                      <Tag color="success" style={{ marginLeft: 6 }}>
                        {t('tripPlan.fields.deliveredCount', { done: b.deliveredHorseCount, total: b.horseCountOnTrip })}
                      </Tag>
                    )}
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card size="small" title={t('tripPlan.sections.stallMap')} style={{ borderRadius: 12 }}>
        <StallMap
          readOnly
          capacity={trip.vehicleCapacity || 0}
          escorts={escortList}
          horses={(trip.horses || [])
            .filter((h) => h.status !== 'Cancelled' && h.status !== 'Offloaded')
            .map((h) => ({
              key: h.bookingHorseId,
              slot: h.stallSlotNumber,
              horseName: h.horseName,
              bookingCode: h.bookingCode,
              escortUserId: h.escortUserId,
            }))}
        />
      </Card>

      <Card size="small" title={t('tripPlan.sections.horses')} style={{ borderRadius: 12 }}>
        <Table
          size="small"
          rowKey="bookingHorseId"
          pagination={false}
          dataSource={[...(trip.horses || [])].sort((a, b) => a.stallSlotNumber - b.stallSlotNumber)}
          scroll={{ x: 560 }}
          columns={[
            { title: t('tripPlan.fields.slot'), dataIndex: 'stallSlotNumber', width: 70 },
            {
              title: t('tripPlan.fields.horse'),
              dataIndex: 'horseName',
              render: (name, h) => (
                <div>
                  <Text strong>{name}</Text>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{h.microchipNumber}</div>
                </div>
              ),
            },
            { title: t('tripPlan.fields.booking'), dataIndex: 'bookingCode' },
            { title: t('tripPlan.fields.escort'), dataIndex: 'escortName', render: (name) => name || '—' },
            { title: t('tripPlan.fields.stallClass'), dataIndex: 'stallClass', render: (s) => <Tag>{s}</Tag> },
            { title: t('tripPlan.fields.dossier'), dataIndex: 'dossierStatus', render: (s) => <StatusTag status={s} /> },
            {
              title: t('tripPlan.fields.horseStatus'),
              dataIndex: 'status',
              render: (s, h) => (
                <div>
                  <TripHorseStatusTag status={s} />
                  {h.offloadReason && <div style={{ fontSize: 12, color: '#64748b' }}>{h.offloadReason}</div>}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card size="small" title={t('tripPlan.sections.route')} style={{ borderRadius: 12 }}>
        <Timeline
          items={(trip.checkpoints || [])
            .filter((c) => c.isActive !== false)
            .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
            .map((c) => ({
              key: c.checkpointId,
              color: CHECKPOINT_TYPE_COLORS[c.checkpointType] || 'gray',
              children: (
                <div>
                  <Tag color={CHECKPOINT_TYPE_COLORS[c.checkpointType]}>{t(`tripPlan.checkpointType.${c.checkpointType}`)}</Tag>
                  {c.bookingCode && <Tag>{c.bookingCode}</Tag>}
                  <Text strong>{c.checkpointName}</Text>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {c.address} · {formatTime(c.plannedTime)}
                    {c.mandatoryRestMinutes ? ` · ${t('tripPlan.fields.restMinutes', { count: c.mandatoryRestMinutes })}` : ''}
                  </div>
                </div>
              ),
            }))}
        />
      </Card>

      <AirWaybillCard tripId={trip.tripId} tripStatus={trip.overallStatus} />
    </Space>
  );
}
