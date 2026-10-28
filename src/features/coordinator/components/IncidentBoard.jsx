import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  Tag,
  Segmented,
  Drawer,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Button,
  Popconfirm,
  Modal,
  Alert,
  Typography,
  Space,
  Select,
  Radio,
  Upload,
  message,
} from 'antd';
import { ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import incidentService from '@services/incidentService';
import tripService from '@services/tripService';
import fileService from '@services/fileService';
import { unwrapList, unwrapData, getErrorMessage } from '@utils/apiHelpers';
import {
  SEVERITY_COLOR,
  INCIDENT_STATUS_COLOR,
  RESPONSE_ACTIONS,
  RESPONSE_ACTION_COLOR,
  OFFLOAD_OUTCOMES,
  FAULT_PARTIES,
  formatUsd,
  toRouteChangePayload,
} from '@utils/incidents';
import IncidentRouteChange from '@components/common/IncidentRouteChange';
// Đang sửa IncidentBoard vì FE-10: hướng xử lý ngựa rời chuyến, quay về / chuồng tạm, phí đi vòng chờ khách đồng ý, nguyên nhân khi đóng
import IncidentOutcome from '@components/common/IncidentOutcome';
import RerouteModal from './RerouteModal';
import RouteChangeFields from './RouteChangeFields';

const { Text } = Typography;
const { TextArea } = Input;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

// Nhóm lọc theo việc của từng vai trò
const FILTERS = {
  coordinator: {
    todo: ['Reported', 'Rejected', 'Approved'],
    waiting: ['PlanProposed', 'AwaitingConsent'],
    resolved: ['Resolved'],
  },
  manager: {
    todo: ['PlanProposed'],
    open: ['Reported', 'Rejected', 'AwaitingConsent', 'Approved'],
    resolved: ['Resolved'],
  },
};

/**
 * Bảng sự cố Flow 5 dùng chung cho điều phối viên và quản lý.
 * - coordinator: đề xuất phương án (Reported/Rejected), nắn tuyến và đóng sự cố (Approved)
 * - manager: duyệt / từ chối phương án (PlanProposed)
 * @param {{ role: 'coordinator' | 'manager' }} props
 */
export default function IncidentBoard({ role }) {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todo');
  const [selectedId, setSelectedId] = useState(null);
  const [acting, setActing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rerouteOpen, setRerouteOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [vetReport, setVetReport] = useState(null);
  const [proposeForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const responseAction = Form.useWatch('responseAction', proposeForm);
  const offloadOutcome = Form.useWatch('offloadOutcome', proposeForm);
  const faultParty = Form.useWatch('faultParty', resolveForm);

  // Chỉ cập nhật state trong callback của promise (không setState đồng bộ trong effect)
  const load = useCallback(
    () =>
      incidentService
        .getIncidents({ size: 100, sort: '-reportedAt' })
        .then((res) => setIncidents(unwrapList(res)))
        .catch((err) => message.error(getErrorMessage(err)))
        .finally(() => setLoading(false)),
    [],
  );

  const reload = () => {
    setLoading(true);
    load();
  };

  useEffect(() => {
    load();
  }, [load]);

  const groups = FILTERS[role];
  const filtered = useMemo(
    () => (filter === 'all' ? incidents : incidents.filter((i) => groups[filter].includes(i.status))),
    [incidents, filter, groups],
  );
  const selected = incidents.find((i) => i.incidentId === selectedId) || null;

  // Lộ trình hiện tại của chuyến: để Coordinator chọn mốc khi đề xuất và Manager xem trước tuyến mới
  const [trip, setTrip] = useState(null);
  const selectedTripId = selected?.tripId;
  useEffect(() => {
    if (!selectedTripId) return undefined;
    let active = true;
    tripService
      .getTripById(selectedTripId)
      .then((res) => active && setTrip(unwrapData(res)))
      .catch(() => active && setTrip(null));
    return () => {
      active = false;
    };
  }, [selectedTripId, incidents]);
  const routeCheckpoints =
    selectedTripId && trip?.tripId === selectedTripId
      ? (trip.checkpoints || []).filter((c) => c.isActive !== false).sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      : [];

  /**
   * Chạy một thao tác trên sự cố đang chọn rồi cập nhật lại dòng đó trong bảng.
   * @param {() => Promise<any>} call
   * @param {string} successText
   */
  const run = async (call, successText) => {
    setActing(true);
    try {
      await call();
      message.success(successText);
      await load();
      return true;
    } catch (err) {
      message.error(getErrorMessage(err));
      return false;
    } finally {
      setActing(false);
    }
  };

  const openDetail = (incident) => setSelectedId(incident.incidentId);

  const handlePropose = async () => {
    let values;
    try {
      values = await proposeForm.validateFields();
    } catch {
      return;
    }
    const routeChange = toRouteChangePayload(values.routeChange);
    if (values.responseAction === 'Reroute' && !routeChange) {
      message.warning(t('incidents.route.requiredForReroute'));
      return;
    }
    const isOffload = values.responseAction === 'OffloadHorse';
    if (isOffload && values.offloadOutcome === 'Deceased' && !vetReport) {
      message.warning(t('incidentPlan.vetReportRequired'));
      return;
    }
    const ok = await run(async () => {
      // Biên bản thú y tải lên trước (POST /files, documents) rồi gửi path
      const uploaded = isOffload && vetReport ? unwrapData(await fileService.upload(vetReport, 'documents')) : null;
      return incidentService.proposePlan(selected.incidentId, {
        responseAction: values.responseAction,
        proposedAction: values.proposedAction.trim(),
        // Quay về: hệ thống tự dựng tuyến về, không gửi routeChange
        routeChange: values.responseAction === 'ReturnToOrigin' ? null : routeChange,
        revisedRouteNotes: values.revisedRouteNotes?.trim() || null,
        additionalCost: values.additionalCost || 0,
        extraCostForCustomer: values.responseAction === 'Reroute' ? values.extraCostForCustomer || 0 : undefined,
        affectedTripHorseId: isOffload ? values.affectedTripHorseId || undefined : undefined,
        offloadOutcome: isOffload ? values.offloadOutcome : undefined,
        vetReportPath: uploaded?.path,
      });
    }, t('incidents.actions.proposed'));
    if (ok) setVetReport(null);
  };

  const handleResolve = async () => {
    let values;
    try {
      values = await resolveForm.validateFields();
    } catch {
      return;
    }
    const ok = await run(
      () => incidentService.resolveIncident(selected.incidentId, { faultParty: values.faultParty, faultNote: values.faultNote?.trim() || undefined }),
      t('incidents.actions.resolved'),
    );
    if (ok) {
      setResolveOpen(false);
      resolveForm.resetFields();
    }
  };

  const handleReject = async () => {
    let values;
    try {
      values = await rejectForm.validateFields();
    } catch {
      return;
    }
    const ok = await run(() => incidentService.rejectPlan(selected.incidentId, { reason: values.reason.trim() }), t('incidents.actions.rejected'));
    if (ok) setRejectOpen(false);
  };

  const columns = [
    {
      title: t('incidents.columns.code'),
      key: 'code',
      render: (_, r) => (
        <div>
          <Text strong>{r.incidentCode}</Text>
          <div style={{ fontSize: 12, color: '#78716C' }}>{r.tripCode}</div>
        </div>
      ),
    },
    {
      title: t('incidents.fields.type'),
      dataIndex: 'incidentType',
      render: (v) => t(`incidents.type.${v}`, v),
    },
    {
      title: t('incidents.fields.severity'),
      dataIndex: 'severity',
      render: (v) => <Tag color={SEVERITY_COLOR[v]}>{t(`incidents.severity.${v}`, v)}</Tag>,
    },
    { title: t('incidents.fields.location'), dataIndex: 'location', ellipsis: true },
    { title: t('incidents.columns.reportedAt'), dataIndex: 'reportedAt', render: formatTime },
    {
      title: t('incidents.columns.cost'),
      dataIndex: 'additionalCost',
      render: (v, r) => (r.proposedAction ? formatUsd(v) : '—'),
    },
    {
      title: t('incidents.columns.status'),
      dataIndex: 'status',
      render: (v) => <Tag color={INCIDENT_STATUS_COLOR[v]}>{t(`incidents.status.${v}`, v)}</Tag>,
    },
  ];

  const canPropose = role === 'coordinator' && selected && ['Reported', 'Rejected'].includes(selected.status);
  const canReview = role === 'manager' && selected?.status === 'PlanProposed';
  const canFinish = role === 'coordinator' && selected?.status === 'Approved';
  const count = (key) => incidents.filter((i) => groups[key].includes(i.status)).length;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            ...Object.keys(groups).map((key) => ({ value: key, label: `${t(`incidents.filters.${role}.${key}`)} (${count(key)})` })),
            { value: 'all', label: `${t('customerTrips.filters.all')} (${incidents.length})` },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={reload}>
          {t('customerTrips.refresh')}
        </Button>
      </div>

      <Table
        rowKey="incidentId"
        loading={loading}
        dataSource={filtered}
        columns={columns}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{ emptyText: t('incidents.empty') }}
        onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
      />

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        width={560}
        title={
          selected && (
            <Space size={8}>
              <span>{selected.incidentCode}</span>
              <Tag color={INCIDENT_STATUS_COLOR[selected.status]}>{t(`incidents.status.${selected.status}`)}</Tag>
            </Space>
          )
        }
      >
        {selected && (
          <>
            <Descriptions column={1} size="small" styles={{ label: { width: 150 } }}>
              <Descriptions.Item label={t('incidents.columns.trip')}>
                {selected.tripCode} · {t(`status.${selected.tripStatus.charAt(0).toLowerCase()}${selected.tripStatus.slice(1)}`, selected.tripStatus)}
              </Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.type')}>{t(`incidents.type.${selected.incidentType}`)}</Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.severity')}>
                <Tag color={SEVERITY_COLOR[selected.severity]}>{t(`incidents.severity.${selected.severity}`)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.location')}>{selected.location}</Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.horse')}>{selected.affectedHorseName || '—'}</Descriptions.Item>
              <Descriptions.Item label={t('incidents.columns.reportedBy')}>
                {selected.reportedByName} · {formatTime(selected.reportedAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('incidents.fields.description')}>{selected.description}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ margin: '20px 0 8px' }}>{t('incidents.planTitle')}</h4>
            {selected.status === 'Rejected' && selected.rejectionReason && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message={t('incidents.rejectedBecause')}
                description={selected.rejectionReason}
              />
            )}

            {canPropose ? (
              <Form
                form={proposeForm}
                key={selected.incidentId}
                layout="vertical"
                requiredMark={false}
                initialValues={{
                  // Ngựa đã dỡ khẩn cấp: phương án bắt buộc là cho ngựa rời chuyến
                  responseAction: selected.emergencyOffload ? 'OffloadHorse' : selected.responseAction || undefined,
                  affectedTripHorseId: selected.affectedTripHorseId || undefined,
                  offloadOutcome: selected.offloadOutcome || undefined,
                  extraCostForCustomer: selected.extraCostForCustomer || 0,
                  proposedAction: selected.proposedAction || '',
                  // Đề xuất lại sau khi bị từ chối: điền sẵn tuyến của lần trước
                  routeChange: selected.routeChange
                    ? {
                        deactivateCheckpointIds: selected.routeChange.removedCheckpoints.map((c) => c.checkpointId),
                        insertAfterCheckpointId: selected.routeChange.insertAfterCheckpointId || undefined,
                        newCheckpoints: selected.routeChange.newCheckpoints.map((c) => ({ ...c, plannedTime: dayjs(c.plannedTime) })),
                      }
                    : undefined,
                  revisedRouteNotes: selected.revisedRouteNotes || '',
                  additionalCost: selected.additionalCost || 0,
                }}
              >
                <Form.Item
                  name="responseAction"
                  label={t('incidents.fields.action')}
                  rules={[{ required: true, message: t('handover.form.required') }]}
                >
                  <Select
                    placeholder={t('incidents.actionPlaceholder')}
                    disabled={selected.emergencyOffload}
                    options={RESPONSE_ACTIONS.map((value) => ({ value, label: t(`incidents.action.${value}`) }))}
                  />
                </Form.Item>
                {selected.emergencyOffload && (
                  <Alert type="warning" showIcon style={{ marginBottom: 12 }} title={t('incidentPlan.emergencyOffload', { horse: selected.affectedHorseName || '' })} />
                )}
                {responseAction && t(`incidentPlan.actionHint.${responseAction}`, '') && (
                  <Alert type="info" showIcon style={{ marginBottom: 12 }} title={t(`incidentPlan.actionHint.${responseAction}`)} />
                )}
                {responseAction === 'OffloadHorse' && (
                  <div style={{ border: '1px solid #FECACA', borderRadius: 8, padding: '12px 12px 0', marginBottom: 16, background: '#FEF2F2' }}>
                    <Form.Item
                      name="affectedTripHorseId"
                      label={t('incidentPlan.horse')}
                      rules={[{ required: true, message: t('handover.form.required') }]}
                    >
                      <Select
                        disabled={selected.emergencyOffload}
                        placeholder={t('incidentPlan.horsePlaceholder')}
                        options={(trip?.tripId === selected.tripId ? trip.horses || [] : [])
                          .filter((h) => ['InTransit', 'Planned', 'Offloaded'].includes(h.status) || h.tripHorseId === selected.affectedTripHorseId)
                          .map((h) => ({ value: h.tripHorseId, label: `${h.horseName} · ${h.bookingCode}` }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="offloadOutcome"
                      label={t('incidentPlan.outcome')}
                      rules={[{ required: true, message: t('handover.form.required') }]}
                    >
                      <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {OFFLOAD_OUTCOMES.map((value) => (
                          <Radio key={value} value={value} disabled={value === 'Deceased' && selected.severity !== 'Critical'}>
                            {t(`incidentOutcome.outcome.${value}`)}
                            <div style={{ fontSize: 12, color: '#6B7280' }}>
                              {value === 'Deceased' && selected.severity !== 'Critical'
                                ? t('incidentPlan.deceasedNeedsCritical')
                                : t(`incidentPlan.outcomeHint.${value}`)}
                            </div>
                          </Radio>
                        ))}
                      </Radio.Group>
                    </Form.Item>
                    {offloadOutcome === 'Deceased' && (
                      <Form.Item label={t('incidentPlan.vetReport')} required>
                        <Upload
                          maxCount={1}
                          accept=".pdf,image/*"
                          beforeUpload={(file) => {
                            setVetReport(file);
                            return false;
                          }}
                          onRemove={() => setVetReport(null)}
                          fileList={vetReport ? [{ uid: '-1', name: vetReport.name, status: 'done' }] : []}
                        >
                          <Button icon={<UploadOutlined />}>{t('incidentPlan.chooseVetReport')}</Button>
                        </Upload>
                      </Form.Item>
                    )}
                  </div>
                )}
                <Form.Item
                  name="proposedAction"
                  label={t('incidents.fields.plan')}
                  rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 255 }]}
                >
                  <Input placeholder={t('incidents.planPlaceholder')} />
                </Form.Item>
                {responseAction !== 'ReturnToOrigin' && (
                  <div style={{ border: '1px dashed #E5E7EB', borderRadius: 8, padding: '12px 12px 0', marginBottom: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{t('incidents.route.title')}</Text>{' '}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('incidents.route.editHint')}
                      </Text>
                    </div>
                    <RouteChangeFields checkpoints={routeCheckpoints} prefix={['routeChange']} />
                  </div>
                )}
                <Form.Item name="revisedRouteNotes" label={t('incidents.fields.routeNotes')} rules={[{ max: 2000 }]}>
                  <TextArea rows={3} />
                </Form.Item>
                <Form.Item name="additionalCost" label={t('incidents.fields.cost')}>
                  <InputNumber min={0} prefix="$" style={{ width: 200 }} />
                </Form.Item>
                {responseAction === 'Reroute' && (
                  <Form.Item name="extraCostForCustomer" label={t('incidentPlan.extraCostForCustomer')} extra={t('incidentPlan.extraCostHint')}>
                    <InputNumber min={0} prefix="$" style={{ width: 200 }} />
                  </Form.Item>
                )}
                <Button type="primary" loading={acting} onClick={handlePropose}>
                  {selected.status === 'Rejected' ? t('incidents.actions.repropose') : t('incidents.actions.propose')}
                </Button>
              </Form>
            ) : selected.proposedAction ? (
              <Descriptions column={1} size="small" styles={{ label: { width: 150 } }}>
                {selected.responseAction && (
                  <Descriptions.Item label={t('incidents.fields.action')}>
                    <Tag color={RESPONSE_ACTION_COLOR[selected.responseAction]}>{t(`incidents.action.${selected.responseAction}`)}</Tag>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label={t('incidents.fields.plan')}>{selected.proposedAction}</Descriptions.Item>
                <Descriptions.Item label={t('incidents.fields.routeNotes')}>{selected.revisedRouteNotes || '—'}</Descriptions.Item>
                <Descriptions.Item label={t('incidents.fields.cost')}>{formatUsd(selected.additionalCost)}</Descriptions.Item>
                {selected.approvedByName && (
                  <Descriptions.Item label={t('incidents.columns.approvedBy')}>
                    {selected.approvedByName} · {formatTime(selected.approvedAt)}
                  </Descriptions.Item>
                )}
                {selected.resolvedAt && (
                  <Descriptions.Item label={t('incidents.columns.resolvedAt')}>{formatTime(selected.resolvedAt)}</Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <Text type="secondary">{t('incidents.noPlan')}</Text>
            )}

            {!canPropose && (
              <div style={{ marginTop: 12 }}>
                <IncidentOutcome incident={selected} />
              </div>
            )}
            {selected.status === 'AwaitingConsent' && (
              <Alert type="info" showIcon style={{ marginTop: 12 }} title={t('incidentPlan.awaitingConsent')} />
            )}
            {!canPropose && selected.routeChange && (
              <div style={{ marginTop: 12 }}>
                <IncidentRouteChange routeChange={selected.routeChange} checkpoints={routeCheckpoints} />
              </div>
            )}
            {canReview && (
              <Space style={{ marginTop: 20 }}>
                <Popconfirm
                  title={t('incidents.actions.approveConfirm')}
                  onConfirm={() => run(() => incidentService.approvePlan(selected.incidentId), t('incidents.actions.approved'))}
                >
                  <Button type="primary" loading={acting}>
                    {t('incidents.actions.approve')}
                  </Button>
                </Popconfirm>
                <Button danger onClick={() => setRejectOpen(true)}>
                  {t('incidents.actions.reject')}
                </Button>
              </Space>
            )}

            {canFinish && (
              <div style={{ marginTop: 20 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {t('incidents.finishHint')}
                </Text>
                <Space>
                  <Button onClick={() => setRerouteOpen(true)}>{t('incidents.actions.reroute')}</Button>
                  <Button type="primary" loading={acting} onClick={() => setResolveOpen(true)}>
                    {t('incidents.actions.resolve')}
                  </Button>
                </Space>
              </div>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title={t('incidents.actions.rejectTitle')}
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={handleReject}
        okText={t('incidents.actions.reject')}
        okButtonProps={{ danger: true, loading: acting }}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <Form form={rejectForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="reason"
            label={t('incidents.fields.rejectReason')}
            rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 500 }]}
          >
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Đóng sự cố: bắt buộc chọn nguyên nhân, hiện hệ quả tiền của từng lựa chọn (Chính sách 9.1) */}
      <Modal
        title={t('incidentPlan.resolveTitle', { code: selected?.incidentCode || '' })}
        open={resolveOpen}
        onCancel={() => setResolveOpen(false)}
        onOk={handleResolve}
        okText={t('incidents.actions.resolve')}
        okButtonProps={{ loading: acting }}
        cancelText={t('common.cancel')}
        width={620}
        destroyOnHidden
      >
        <Form form={resolveForm} layout="vertical" requiredMark={false}>
          <Form.Item name="faultParty" label={t('incidentOutcome.faultParty')} rules={[{ required: true, message: t('incidentPlan.faultRequired') }]}>
            <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAULT_PARTIES.map((value) => (
                <Radio key={value} value={value}>
                  <Text strong>{t(`incidentOutcome.fault.${value}.title`)}</Text>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{t(`incidentOutcome.fault.${value}.example`)}</div>
                  <div style={{ fontSize: 12 }}>{t(`incidentOutcome.fault.${value}.money`)}</div>
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          {faultParty && selected?.responseAction && t(`incidentPlan.resolveEffect.${selected.responseAction}.${faultParty}`, '') && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              title={t(`incidentPlan.resolveEffect.${selected.responseAction}.${faultParty}`, { cost: formatUsd(selected.additionalCost) })}
            />
          )}
          <Form.Item name="faultNote" label={t('incidentPlan.faultNote')} rules={[{ max: 500 }]}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <RerouteModal
        open={rerouteOpen}
        incident={selected}
        onClose={() => setRerouteOpen(false)}
        onDone={() => {
          setRerouteOpen(false);
          load();
        }}
      />
    </>
  );
}
