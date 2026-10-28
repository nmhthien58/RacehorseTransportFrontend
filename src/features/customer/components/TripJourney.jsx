import { useEffect, useState } from 'react';
import { Row, Col, Typography, Tag, Button, Segmented, Image, Space, Empty, Progress, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  TRIP_STATUS_COLOR,
  FEED_COLOR,
  STRESS_COLOR,
  tripStatusKey,
} from '@features/customer/constants/tripTracking';
import incidentService from '@services/incidentService';
import handoverService from '@services/handoverService';
import { unwrapList } from '@utils/apiHelpers';
import {
  SEVERITY_COLOR,
  INCIDENT_STATUS_COLOR,
  HANDOVER_CONDITION_COLOR,
} from '@utils/incidents';
import TripHorseStatusTag from '@components/common/TripHorseStatusTag';
// Đang sửa TripJourney vì khách cần thấy kết quả sự cố: ngựa rời chuyến, quay về, phí đi vòng, nguyên nhân (FE-10)
import IncidentOutcome from '@components/common/IncidentOutcome';
import styles from './TripJourney.module.css';

const { Text } = Typography;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

/**
 * Tình trạng một mốc trên lộ trình để chọn kiểu chấm tròn.
 * @param {Object} cp - checkpoint từ backend
 * @param {boolean} isNext - là mốc xe đang tới
 * @returns {'done'|'current'|'cancelled'|'upcoming'}
 */
function stopState(cp, isNext) {
  if (cp.status === 'Cancelled') return 'cancelled';
  if (cp.status === 'Departed' || (cp.checkpointType === 'Destination' && cp.actualArrivalTime)) return 'done';
  if (cp.status === 'Arrived' || cp.status === 'Cleared' || isNext) return 'current';
  return 'upcoming';
}

/**
 * Hành trình một chuyến chở ngựa của khách: tổng quan, lộ trình các mốc, sự cố, nhật ký sức khỏe từng con, biên bản bàn giao.
 * Dùng ở tab "Hành trình" của chi tiết đơn (R-07) và màn theo dõi chuyến cũ.
 *
 * @param {Object} props
 * @param {Object} props.trip - Một chuyến dạng toCustomerTrip (useCustomerTrips / useBookingJourney)
 * @param {Date|null} [props.lastLoadedAt] - Lần tải dữ liệu gần nhất
 * @param {() => void} [props.onRefresh]
 * @returns {JSX.Element}
 */
export default function TripJourney({ trip, lastLoadedAt, onRefresh }) {
  const { t } = useTranslation();
  const [selectedHorseId, setSelectedHorseId] = useState(null);
  const tripId = trip.tripId;
  const horse = trip.horses.find((h) => h.tripHorseId === selectedHorseId) || trip.horses[0];
  const [incidents, setIncidents] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const bookingId = trip.bookingId;

  // Sự cố của chuyến (khách dùng GET /incidents?tripId=) và biên bản bàn giao của đơn trên chuyến này
  useEffect(() => {
    if (!bookingId) return undefined;
    let active = true;
    Promise.all([
      incidentService.getIncidents({ tripId, size: 100 }).then(unwrapList).catch(() => []),
      handoverService.getBookingHandovers(bookingId).then(unwrapList).catch(() => []),
    ]).then(([incidentList, handoverList]) => {
      if (!active) return;
      setIncidents(incidentList);
      setHandovers(handoverList.filter((h) => String(h.tripId) === String(tripId)));
    });
    return () => {
      active = false;
    };
  }, [tripId, bookingId, lastLoadedAt]);

  // Mốc xe đang hướng tới: mốc đầu tiên chưa tới, chỉ khi chuyến đang chạy và xe không dừng ở mốc nào
  const stoppedSomewhere = trip.checkpoints.some((c) => c.status === 'Arrived' || c.status === 'Cleared');
  const nextStop =
    trip.overallStatus === 'InTransit' && !stoppedSomewhere
      ? trip.checkpoints.find((c) => !c.actualArrivalTime && c.status !== 'Cancelled')
      : null;
  const progressPercent = trip.checkpointsTotal ? Math.round((trip.checkpointsReached / trip.checkpointsTotal) * 100) : 0;
  const latestLog = horse?.logs[0];
  const lastStop = [...trip.checkpoints].reverse().find((c) => c.status !== 'Cancelled');

  const facts = [
    { label: t('customerTrips.info.vehicle'), value: trip.vehicleCode || '—' },
    { label: t('customerTrips.info.driver'), value: trip.leadDriverName || '—' },
    {
      label: t('customerTrips.info.departure'),
      value: trip.actualStartDate ? formatTime(trip.actualStartDate) : `${formatTime(trip.plannedStartDate)} (${t('customerTrips.planned')})`,
    },
    {
      label: t('customerTrips.info.arrival'),
      // Chưa tới: giờ dự kiến của mốc cuối đã cập nhật theo check-in (R-08), không có thì giờ kế hoạch
      value: trip.actualEndDate
        ? formatTime(trip.actualEndDate)
        : `${formatTime(lastStop?.estimatedArrivalTime || trip.plannedEndDate)} (${t('customerTrips.planned')})`,
    },
    // R-08: giờ giao dự kiến cập nhật theo check-in thực tế; khác kế hoạch thì ghi kèm giờ kế hoạch
    ...(trip.liveEstimatedDeliveryAt || trip.estimatedDeliveryAt
      ? [
          {
            label: t('customerTrips.info.eta'),
            value: (
              <span>
                <Text type={trip.deliveryAtRisk ? 'danger' : undefined}>
                  {formatTime(trip.liveEstimatedDeliveryAt || trip.estimatedDeliveryAt)}
                </Text>
                {trip.liveEstimatedDeliveryAt &&
                  trip.estimatedDeliveryAt &&
                  !dayjs(trip.liveEstimatedDeliveryAt).isSame(dayjs(trip.estimatedDeliveryAt), 'minute') && (
                    <div className={styles.muted}>{t('customerTrips.plannedShort', { time: formatTime(trip.estimatedDeliveryAt) })}</div>
                  )}
              </span>
            ),
          },
        ]
      : []),
    {
      label: t('customerTrips.info.delay'),
      value:
        trip.delayMinutes > 0 ? (
          <Text type="danger">{t('tracking.delay', { minutes: trip.delayMinutes })}</Text>
        ) : (
          t('tracking.onTime')
        ),
    },
    {
      label: t('customerTrips.info.handover'),
      value: trip.handoverCompleted ? t('customerTrips.handoverDone') : t('customerTrips.handoverPending'),
    },
  ];

  return (
    <div>
      {trip.deliveryAtRisk && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('customerTrips.atRiskTitle')}
          description={t('customerTrips.atRiskDescription', { time: formatTime(trip.liveEstimatedDeliveryAt) })}
        />
      )}

      {/* Tổng quan chuyến */}
      <div className={`${styles.panel} ${styles.header}`}>
        <div className={styles.headerTop}>
          <div>
            <Space align="center" size={10}>
              <h1 className={styles.tripCode}>{trip.tripCode}</h1>
              <Tag color={TRIP_STATUS_COLOR[trip.overallStatus] || 'default'} style={{ margin: 0 }}>
                {t(`status.${tripStatusKey(trip.overallStatus)}`)}
              </Tag>
            </Space>
            <div className={styles.route}>
              {trip.pickupAddress}
              <span className={styles.routeArrow}>→</span>
              {trip.dropoffAddress}
            </div>
            <div className={styles.muted} style={{ marginTop: 2 }}>
              {t('customerTrips.bookingRef', { code: trip.bookingCode })}
            </div>
          </div>
          <Space size={8} align="center">
            <span className={styles.muted}>
              {t('customerTrips.updatedAt', { time: lastLoadedAt ? dayjs(lastLoadedAt).format('HH:mm:ss') : '—' })}
            </span>
            <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh}>
              {t('customerTrips.refresh')}
            </Button>
          </Space>
        </div>

        <div className={styles.progressRow}>
          <div className={styles.progressLabel}>
            <span>{t('customerTrips.info.progress')}</span>
            <span>{t('customerTrips.checkpointProgress', { reached: trip.checkpointsReached, total: trip.checkpointsTotal })}</span>
          </div>
          <Progress percent={progressPercent} showInfo={false} size="small" strokeColor="#F59E0B" />
        </div>

        <div className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.label}>
              <div className={styles.factLabel}>{fact.label}</div>
              <div className={styles.factValue}>{fact.value}</div>
            </div>
          ))}
        </div>
      </div>

      <Row gutter={[20, 20]}>
        {/* Lộ trình */}
        <Col xs={24} lg={8}>
          <div className={styles.panel}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('customerTrips.routeTitle')}</h2>
            </div>
            <div className={styles.sectionBody}>
              {trip.checkpoints.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                trip.checkpoints.map((cp) => {
                  const state = stopState(cp, nextStop?.checkpointId === cp.checkpointId);
                  const dotClass = {
                    done: styles.dotDone,
                    current: styles.dotCurrent,
                    cancelled: styles.dotCancelled,
                    upcoming: '',
                  }[state];
                  return (
                    <div key={cp.checkpointId} className={`${styles.stop} ${state === 'done' ? styles.stopDone : ''}`}>
                      <span className={`${styles.dot} ${dotClass}`} />
                      <div className={`${styles.stopName} ${state === 'cancelled' || cp.isOtherBookingStop ? styles.stopNameMuted : ''}`}>
                        {cp.isOtherBookingStop ? t('customerTrips.otherStop') : cp.checkpointName}
                        {cp.isMyPickup && cp.checkpointType === 'PickUp' && (
                          <Tag color="cyan" style={{ marginLeft: 6 }}>{t('customerTrips.myPickup')}</Tag>
                        )}
                        {cp.isMyDropoff && (
                          <Tag color="orange" style={{ marginLeft: 6 }}>{t('customerTrips.myDropoff')}</Tag>
                        )}
                      </div>
                      <div className={styles.stopMeta}>
                        {cp.address && <div>{cp.address}</div>}
                        <div>
                          {cp.actualArrivalTime
                            ? t('customerTrips.arrivedAt', { time: formatTime(cp.actualArrivalTime) })
                            : cp.estimatedArrivalTime && !dayjs(cp.estimatedArrivalTime).isSame(dayjs(cp.plannedTime), 'minute')
                              ? t('customerTrips.revisedAt', { time: formatTime(cp.estimatedArrivalTime), planned: formatTime(cp.plannedTime) })
                              : t('customerTrips.plannedAt', { time: formatTime(cp.plannedTime) })}
                          {cp.actualDepartureTime && cp.checkpointType !== 'Destination' && (
                            <> · {t('customerTrips.departedAt', { time: dayjs(cp.actualDepartureTime).format('HH:mm') })}</>
                          )}
                        </div>
                        {state === 'current' && !cp.actualArrivalTime && (
                          <Text style={{ fontSize: 12, color: '#B45309' }}>{t('customerTrips.headingHere')}</Text>
                        )}
                        {(cp.status === 'Arrived' || cp.status === 'Cleared') && (
                          <Text style={{ fontSize: 12, color: '#B45309' }}>{t('customerTrips.stoppedHere')}</Text>
                        )}
                        {cp.delayMinutes > 0 && (
                          <div>
                            <Text type="danger" style={{ fontSize: 12 }}>{t('tracking.delay', { minutes: cp.delayMinutes })}</Text>
                          </div>
                        )}
                        {state === 'cancelled' && <div>{t('customerTrips.checkpointCancelled')}</div>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sự cố trên chuyến */}
          <div className={styles.panel} style={{ marginTop: 20 }}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('incidents.title')}</h2>
            </div>
            <div className={styles.sectionBody}>
              {incidents.length === 0 ? (
                <span className={styles.muted}>{t('incidents.none')}</span>
              ) : (
                incidents.map((inc) => (
                  <div key={inc.incidentId} style={{ marginBottom: 14 }}>
                    <div className={styles.stopName}>{t(`incidents.type.${inc.incidentType}`)}</div>
                    <Space size={4} wrap style={{ margin: '4px 0' }}>
                      <Tag color={SEVERITY_COLOR[inc.severity]}>{t(`incidents.severity.${inc.severity}`)}</Tag>
                      <Tag color={INCIDENT_STATUS_COLOR[inc.status]}>{t(`incidents.status.${inc.status}`)}</Tag>
                    </Space>
                    <div className={styles.stopMeta}>
                      {formatTime(inc.reportedAt)} · {inc.location}
                      {inc.affectedHorseName && <div>{inc.affectedHorseName}</div>}
                      {inc.status !== 'Reported' && inc.status !== 'Rejected' && inc.proposedAction && (
                        <div>
                          {t('incidents.fields.plan')}: {inc.proposedAction}
                        </div>
                      )}
                    </div>
                    {inc.status !== 'Reported' && inc.status !== 'Rejected' && (
                      <div style={{ marginTop: 4 }}>
                        <IncidentOutcome incident={inc} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </Col>

        {/* Nhật ký sức khỏe */}
        <Col xs={24} lg={16}>
          <div className={styles.panel}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>{t('customerTrips.healthTitle')}</h2>
                {horse && (
                  <div className={styles.muted}>
                    {horse.horseName} · {t('customerTrips.stall', { number: horse.stallSlotNumber })} ·{' '}
                    {t('customerTrips.logCount', { count: horse.logs.length })} <TripHorseStatusTag status={horse.status} />
                    {horse.deliveredAt && <div>{t('customerTrips.deliveredAt', { time: formatTime(horse.deliveredAt) })}</div>}
                    {horse.offloadReason && <div>{t('customerTrips.offloadReason', { reason: horse.offloadReason })}</div>}
                  </div>
                )}
              </div>
              {trip.horses.length > 1 && (
                <Segmented
                  value={horse?.tripHorseId}
                  onChange={setSelectedHorseId}
                  options={trip.horses.map((h) => ({ value: h.tripHorseId, label: h.horseName }))}
                />
              )}
            </div>

            <div className={styles.sectionBody}>
              {!latestLog ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('customerTrips.noLogs')} />
              ) : (
                <>
                  {/* Lần ghi gần nhất */}
                  <div className={styles.muted} style={{ marginBottom: 8 }}>
                    {t('customerTrips.latestAt', { time: formatTime(latestLog.loggedAt) })}
                  </div>
                  <div className={styles.latest}>
                    <div className={styles.latestItem}>
                      <div className={styles.factLabel}>{t('customerTrips.log.cabinTemp')}</div>
                      <div className={styles.latestValue}>{latestLog.cabinTemp} °C</div>
                    </div>
                    <div className={styles.latestItem}>
                      <div className={styles.factLabel}>{t('customerTrips.log.water')}</div>
                      <div className={styles.latestValue}>{latestLog.waterIntakeLiters} L</div>
                    </div>
                    <div className={styles.latestItem}>
                      <div className={styles.factLabel}>{t('customerTrips.log.feed')}</div>
                      <div className={styles.latestValue}>{t(`customerTrips.feed.${latestLog.feedStatus}`, latestLog.feedStatus)}</div>
                    </div>
                    <div className={styles.latestItem}>
                      <div className={styles.factLabel}>{t('customerTrips.log.stress')}</div>
                      <div className={styles.latestValue}>{t(`customerTrips.stress.${latestLog.stressLevel}`, latestLog.stressLevel)}</div>
                    </div>
                  </div>

                  {/* Toàn bộ các lần ghi, mới nhất trước */}
                  <div className={styles.logList}>
                    <div className={styles.factLabel} style={{ marginBottom: 4 }}>{t('customerTrips.allLogs')}</div>
                    {horse.logs.map((log) => (
                      <div key={log.logId} className={`${styles.log} ${log.needsAttention ? styles.logAlert : ''}`}>
                        <div>
                          <div className={styles.logTime}>{dayjs(log.loggedAt).format('HH:mm')}</div>
                          <div className={styles.logDate}>{dayjs(log.loggedAt).format('DD/MM/YYYY')}</div>
                        </div>
                        <div>
                          <div className={styles.logWhere}>
                            {log.checkpointName || t('customerTrips.log.onRoad')}
                            {log.needsAttention && (
                              <Tag color="red" style={{ marginLeft: 8 }}>{t('driver.activeTrip.needsAttention')}</Tag>
                            )}
                          </div>
                          <div className={styles.logStats}>
                            <span>{log.cabinTemp} °C</span>
                            <span>{t('customerTrips.waterShort', { liters: log.waterIntakeLiters })}</span>
                            <Tag color={FEED_COLOR[log.feedStatus]} style={{ margin: 0 }}>
                              {t(`customerTrips.feed.${log.feedStatus}`, log.feedStatus)}
                            </Tag>
                            <Tag color={STRESS_COLOR[log.stressLevel]} style={{ margin: 0 }}>
                              {t(`customerTrips.stress.${log.stressLevel}`, log.stressLevel)}
                            </Tag>
                          </div>
                          {log.notes && <div className={styles.logNotes}>{log.notes}</div>}
                        </div>
                        <div className={styles.logSide}>
                          <div>{log.recordedByName}</div>
                          {log.photoUrl && (
                            <Image
                              src={log.photoUrl}
                              width={56}
                              height={56}
                              style={{ objectFit: 'cover', borderRadius: 6, marginTop: 6 }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {handovers.length > 0 && (
        <div className={styles.panel} style={{ marginTop: 20 }}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('handover.listTitle')}</h2>
          </div>
          <div className={styles.sectionBody}>
            {handovers.map((h) => (
              <Row key={h.handoverId} gutter={[16, 12]} align="middle">
                <Col xs={24} md={16}>
                  <div className={styles.facts} style={{ borderTop: 'none', paddingTop: 0 }}>
                    <div>
                      <div className={styles.factLabel}>{t('handover.receivedBy')}</div>
                      <div className={styles.factValue}>{h.recipientName}</div>
                    </div>
                    <div>
                      <div className={styles.factLabel}>{t('handover.at')}</div>
                      <div className={styles.factValue}>{formatTime(h.handoverDateTime)}</div>
                    </div>
                    <div>
                      <div className={styles.factLabel}>{t('handover.condition.label')}</div>
                      <Tag color={HANDOVER_CONDITION_COLOR[h.overallCondition]}>{t(`handover.condition.${h.overallCondition}`)}</Tag>
                    </div>
                    <div>
                      <div className={styles.factLabel}>{t('handover.by')}</div>
                      <div className={styles.factValue}>{h.driverName}</div>
                    </div>
                  </div>
                  {h.remarks && <div className={styles.logNotes}>{h.remarks}</div>}
                </Col>
                <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                  {h.signatureUrl && <Image src={h.signatureUrl} height={80} />}
                </Col>
              </Row>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
