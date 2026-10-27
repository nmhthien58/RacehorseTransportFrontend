import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Segmented,
  Drawer,
  Descriptions,
  Input,
  Button,
  Alert,
  Image,
  Typography,
  Empty,
  Popconfirm,
  Spin,
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import PageHeader from '@components/layout/PageHeader';
import tripService from '@services/tripService';
import handoverService from '@services/handoverService';
// Đang sửa TripClosurePage vì bổ sung xét duyệt và điều chỉnh bồi thường giao trễ theo FE-12 (R-09, BE-13)
import incidentService from '@services/incidentService';
import delayCompensationService from '@services/delayCompensationService';
import { Modal, InputNumber, Space } from 'antd';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import {
  HANDOVER_CONDITION_COLOR,
  ON_TIME_COLOR,
  INCIDENT_STATUS_COLOR,
  formatUsd,
} from '@utils/incidents';

const { Text } = Typography;
const { TextArea } = Input;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

/**
 * Đóng chuyến và chốt KPI (Flow 6) cho quản lý.
 * - Tab "Chờ đóng": chuyến ArrivedDestination; đóng được khi mọi đơn đã có biên bản bàn giao (POST /trips/{id}/close)
 * - Tab "Đã đóng": chuyến Completed kèm điểm KPI, kết quả đúng giờ, chi phí thực tế
 * @returns {JSX.Element}
 */
export default function TripClosurePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('ArrivedDestination');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [extra, setExtra] = useState({ handovers: [], incidents: [], loading: false });
  const [remarks, setRemarks] = useState('');
  const [closing, setClosing] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState(null);
  const [newAmount, setNewAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [actionCompLoading, setActionCompLoading] = useState(false);

  // Danh sách chuyến chỉ có tóm tắt; tải chi tiết để có đơn, KPI, chi phí
  const load = useCallback(
    () =>
      tripService
        .getTrips({ status: tab, size: 100 })
        .then((res) =>
          Promise.all(
            unwrapList(res).map((trip) =>
              tripService
                .getTripById(trip.tripId)
                .then(unwrapData)
                .catch(() => trip),
            ),
          ),
        )
        .then(setTrips)
        .catch((err) => message.error(getErrorMessage(err)))
        .finally(() => setLoading(false)),
    [tab],
  );

  const changeTab = (value) => {
    setLoading(true);
    setTrips([]);
    setTab(value);
  };

  useEffect(() => {
    load();
  }, [load]);

  const openTrip = async (trip) => {
    setSelected(trip);
    setRemarks('');
    setExtra({ handovers: [], incidents: [], compensations: [], loading: true });
    const [handovers, incidents] = await Promise.all([
      handoverService.getTripHandovers(trip.tripId).then(unwrapList).catch(() => []),
      incidentService.getTripIncidents(trip.tripId).then(unwrapList).catch(() => []),
    ]);
    setExtra({ handovers, incidents, loading: false });
  };


  const handleApproveCompensation = async (compId) => {
    setActionCompLoading(true);
    try {
      await delayCompensationService.approve(compId);
      message.success(t('delayCompensation.messages.approved', 'Đã duyệt bồi thường giao trễ'));
      if (selected) openTrip(selected);
    } catch (err) {
      message.error(getErrorMessage(err, t('delayCompensation.messages.approveFailed', 'Duyệt thất bại')));
    } finally {
      setActionCompLoading(false);
    }
  };

  const handleOpenAdjustModal = (comp) => {
    setSelectedComp(comp);
    setNewAmount(Number(comp.amountUsd || comp.amount || 0));
    setAdjustReason('');
    setAdjustModalOpen(true);
  };

  const handleSaveAdjustedCompensation = async () => {
    if (!adjustReason.trim()) {
      message.warning(t('delayCompensation.messages.reasonRequired', 'Vui lòng nhập lý do điều chỉnh số tiền'));
      return;
    }
    setActionCompLoading(true);
    try {
      await delayCompensationService.approve(selectedComp.compensationId, {
        approvedAmount: Number(newAmount),
        reason: adjustReason.trim(),
      });
      message.success(t('delayCompensation.messages.adjustedSuccess', 'Đã điều chỉnh và duyệt số tiền bồi thường'));
      setAdjustModalOpen(false);
      if (selected) openTrip(selected);
    } catch (err) {
      message.error(getErrorMessage(err, t('delayCompensation.messages.adjustFailed', 'Điều chỉnh thất bại')));
    } finally {
      setActionCompLoading(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      const closed = unwrapData(await tripService.closeTrip(selected.tripId, remarks.trim() ? { executiveRemarks: remarks.trim() } : {}));
      message.success(t('tripClose.success', { code: selected.tripCode, score: closed.kpiScore }));
      setSelected(closed);
      load();
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setClosing(false);
    }
  };

  const bookings = selected?.bookings || [];
  const pendingHandovers = bookings.filter((b) => !b.handoverCompleted);
  const isClosed = selected?.overallStatus === 'Completed';

  const columns = [
    {
      title: t('customerTrips.columns.trip'),
      key: 'trip',
      render: (_, r) => (
        <div>
          <Text strong>{r.tripCode}</Text>
          <div style={{ fontSize: 12, color: '#78716C' }}>{r.vehicleCode}</div>
        </div>
      ),
    },
    {
      title: t('tripClose.columns.bookings'),
      key: 'bookings',
      render: (_, r) => (r.bookings || []).map((b) => b.bookingCode).join(', ') || '—',
    },
    { title: t('tripClose.columns.horses'), dataIndex: 'horseCount' },
    {
      title: t('tripClose.columns.handover'),
      key: 'handover',
      render: (_, r) => {
        const list = r.bookings || [];
        const done = list.filter((b) => b.handoverCompleted).length;
        return <Tag color={done === list.length ? 'green' : 'default'}>{`${done}/${list.length}`}</Tag>;
      },
    },
    ...(tab === 'Completed'
      ? [
          { title: t('tripClose.kpi'), dataIndex: 'kpiScore', render: (v) => <Text strong>{v}</Text> },
          {
            title: t('tripClose.onTime'),
            dataIndex: 'onTimeStatus',
            render: (v) => <Tag color={ON_TIME_COLOR[v]}>{t(`tripClose.onTimeStatus.${v}`, v)}</Tag>,
          },
          { title: t('tripClose.actualCost'), dataIndex: 'actualCost', render: formatUsd },
          { title: t('tripClose.closedAt'), dataIndex: 'closedAt', render: formatTime },
        ]
      : [{ title: t('tripClose.columns.plannedEnd'), dataIndex: 'plannedEndDate', render: formatTime }]),
  ];

  return (
    <div style={{ paddingBottom: 40 }}>
      <PageHeader title={t('tripClose.title')} subtitle={t('tripClose.subtitle')} />
      <Card>
        <Segmented
          value={tab}
          onChange={changeTab}
          style={{ marginBottom: 16 }}
          options={[
            { value: 'ArrivedDestination', label: t('tripClose.tabs.toClose') },
            { value: 'Completed', label: t('tripClose.tabs.closed') },
          ]}
        />
        <Table
          rowKey="tripId"
          loading={loading}
          dataSource={trips}
          columns={columns}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={{ emptyText: tab === 'Completed' ? t('tripClose.emptyClosed') : t('tripClose.emptyToClose') }}
          onRow={(record) => ({ onClick: () => openTrip(record), style: { cursor: 'pointer' } })}
        />
      </Card>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} width={620} title={selected?.tripCode}>
        {selected && (
          <>
            <Descriptions column={2} size="small">
              <Descriptions.Item label={t('customerTrips.info.vehicle')}>{selected.vehicleCode}</Descriptions.Item>
              <Descriptions.Item label={t('tripClose.columns.horses')}>{selected.horseCount}</Descriptions.Item>
              <Descriptions.Item label={t('tripReport.started')}>{formatTime(selected.actualStartDate)}</Descriptions.Item>
              <Descriptions.Item label={t('tripReport.ended')}>{formatTime(selected.actualEndDate)}</Descriptions.Item>
              <Descriptions.Item label={t('tripClose.plannedCost')}>{formatUsd(selected.plannedCost)}</Descriptions.Item>
              {isClosed && <Descriptions.Item label={t('tripClose.actualCost')}>{formatUsd(selected.actualCost)}</Descriptions.Item>}
            </Descriptions>

            {isClosed && (
              <div style={{ background: '#FAFAF9', borderRadius: 8, padding: 16, marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{selected.kpiScore}</span>
                  <Text type="secondary">{t('tripClose.kpiOutOf')}</Text>
                  <Tag color={ON_TIME_COLOR[selected.onTimeStatus]}>{t(`tripClose.onTimeStatus.${selected.onTimeStatus}`)}</Tag>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: '#57534E' }}>
                  {selected.delayMinutes > 0 ? t('tracking.delay', { minutes: selected.delayMinutes }) : t('tracking.onTime')} ·{' '}
                  {t('tripClose.closedBy')}: {selected.closedByName} · {formatTime(selected.closedAt)}
                </div>
                {selected.executiveRemarks && <div style={{ marginTop: 6, fontSize: 13 }}>{selected.executiveRemarks}</div>}
              </div>
            )}

            <h4 style={{ margin: '20px 0 8px' }}>{t('handover.listTitle')}</h4>
            {extra.loading ? (
              <Spin />
            ) : (
              bookings.map((b) => {
                const record = extra.handovers.find((h) => h.bookingId === b.bookingId);
                return (
                  <div key={b.bookingId} style={{ padding: '10px 0', borderBottom: '1px solid #F5F5F4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <Text strong>{b.bookingCode}</Text> <Text type="secondary">· {b.customerName}</Text>
                        {record ? (
                          <div style={{ fontSize: 13, color: '#57534E' }}>
                            {record.recipientName} · {formatTime(record.handoverDateTime)} ·{' '}
                            <Tag color={HANDOVER_CONDITION_COLOR[record.overallCondition]}>
                              {t(`handover.condition.${record.overallCondition}`)}
                            </Tag>
                          </div>
                        ) : (
                          <div>
                            <Tag>{t('handover.pending')}</Tag>
                          </div>
                        )}
                      </div>
                      {record?.signatureUrl && <Image src={record.signatureUrl} height={44} />}
                    </div>
                  </div>
                );
              })
            )}

            
            <h4 style={{ margin: '20px 0 8px' }}>{t('delayCompensation.title', 'Bồi thường giao trễ (R-09)')}</h4>
            {!extra.loading && extra.compensations.length === 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('delayCompensation.none', 'Không có đơn nào bị giao trễ')} />
            )}
            {extra.compensations.map((comp) => (
              <div key={comp.compensationId} style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, marginBottom: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <Text strong>{comp.bookingCode || '#' + comp.bookingId}</Text>
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      {t('delayCompensation.delayHours', 'Trễ')}: <Text strong style={{ color: '#DC2626' }}>{comp.delayHours} {t('common.hours', 'giờ')}</Text> · {t('delayCompensation.amount', 'Bồi thường')}: <Text strong style={{ color: '#047857' }}>{Number(comp.amountUsd || comp.amount || 0).toLocaleString()} USD</Text>
                    </div>
                  </div>
                  <Space>
                    <Tag color={comp.status === 'Approved' ? 'green' : 'orange'}>{comp.status}</Tag>
                    {comp.status === 'Pending' && (
                      <>
                        <Button
                          size="small"
                          type="primary"
                          loading={actionCompLoading}
                          onClick={() => handleApproveCompensation(comp.compensationId)}
                          style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                        >
                          {t('common.approve', 'Duyệt')}
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleOpenAdjustModal(comp)}
                        >
                          {t('delayCompensation.actions.adjust', 'Sửa số tiền')}
                        </Button>
                      </>
                    )}
                  </Space>
                </div>
              </div>
            ))}

            <h4 style={{ margin: '20px 0 8px' }}>{t('incidents.title')}</h4>
            {!extra.loading && extra.incidents.length === 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('incidents.none')} />
            )}
            {extra.incidents.map((inc) => (
              <div key={inc.incidentId} style={{ padding: '8px 0', borderBottom: '1px solid #F5F5F4', fontSize: 13 }}>
                <Text strong>{inc.incidentCode}</Text> · {t(`incidents.type.${inc.incidentType}`)}{' '}
                <Tag color={INCIDENT_STATUS_COLOR[inc.status]}>{t(`incidents.status.${inc.status}`)}</Tag>
                {inc.proposedAction && (
                  <div style={{ color: '#57534E' }}>
                    {inc.proposedAction} · {formatUsd(inc.additionalCost)}
                  </div>
                )}
              </div>
            ))}

            {!isClosed && (
              <div style={{ marginTop: 24 }}>
                {pendingHandovers.length > 0 ? (
                  <Alert
                    type="warning"
                    showIcon
                    message={t('tripClose.missingHandover', { codes: pendingHandovers.map((b) => b.bookingCode).join(', ') })}
                  />
                ) : (
                  <Text type="secondary">{t('tripClose.closeHint')}</Text>
                )}
                <TextArea
                  rows={3}
                  maxLength={2000}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={t('tripClose.remarksPlaceholder')}
                  style={{ margin: '12px 0' }}
                />
                <Popconfirm title={t('tripClose.confirm')} onConfirm={handleClose} disabled={pendingHandovers.length > 0}>
                  <Button type="primary" loading={closing} disabled={pendingHandovers.length > 0}>
                    {t('tripClose.closeButton')}
                  </Button>
                </Popconfirm>
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title={t('delayCompensation.adjustModal.title', 'Điều chỉnh số tiền bồi thường giao trễ')}
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        onOk={handleSaveAdjustedCompensation}
        confirmLoading={actionCompLoading}
        okText={t('common.save', 'Lưu & Duyệt')}
        destroyOnClose
      >
        <div style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 8 }}>
            {t('delayCompensation.adjustModal.currentAmount', 'Số tiền hệ thống tính')}: <Text strong>{Number(selectedComp?.amountUsd || selectedComp?.amount || 0).toLocaleString()} USD</Text>
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              {t('delayCompensation.adjustModal.newAmount', 'Số tiền duyệt mới (USD)')}:
            </label>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              prefix="$"
              value={newAmount}
              onChange={setNewAmount}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              {t('delayCompensation.adjustModal.reason', 'Lý do điều chỉnh (bắt buộc)')}:
            </label>
            <TextArea
              rows={3}
              placeholder={t('delayCompensation.adjustModal.reasonPlaceholder', 'Ghi rõ căn cứ / thỏa thuận với khách hàng...')}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
