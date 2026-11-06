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
  Checkbox,
  DatePicker,
  Upload,
  message,
} from 'antd';
import { ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import incidentService from '@services/incidentService';
import tripService from '@services/tripService';
import userService from '@services/userService';
import assetService from '@services/assetService';
import { unwrapList, unwrapData, getErrorMessage } from '@utils/apiHelpers';
import {
  SEVERITY_COLOR,
  INCIDENT_STATUS_COLOR,
  RESPONSE_ACTIONS,
  RESPONSE_ACTION_COLOR,
  REPLACEMENT_ACTIONS,
  OFFLOAD_OUTCOMES,
  FAULT_PARTIES,
  formatUsd,
  toRouteChangePayload,
  buildIncidentLookup,
} from '@utils/incidents';
import IncidentRouteChange from '@components/common/IncidentRouteChange';
// Đang sửa IncidentBoard vì FE-10: hướng xử lý ngựa rời chuyến, quay về / chuồng tạm, phí đi vòng chờ khách đồng ý, nguyên nhân khi đóng
import IncidentOutcome from '@components/common/IncidentOutcome';
// Sức khỏe ngựa: tài liệu sự cố (biên bản thú y, giấy chứng tử, giấy đủ sức đi tiếp)
import IncidentDocuments from '@components/common/IncidentDocuments';
import { useAuthStore } from '@features/auth/store/authStore';
import RerouteModal from './RerouteModal';
import RouteChangeFields from './RouteChangeFields';

const { Text } = Typography;
const { TextArea } = Input;

const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

// Phương án ngựa chết cần ít nhất một biên bản thú y hoặc giấy chứng tử đã đính kèm vào sự cố
const hasVetDocument = (incident) => (incident?.documents || []).some((d) => d.documentType === 'VetReport' || d.documentType === 'DeathCertificate');
const hasDocument = (incident, type) => (incident?.documents || []).some((d) => d.documentType === type);

// Ngựa còn phải chở (TripHorseStatuses.OnBoard của backend): xe thay thế phải đủ chỗ cho số này
const ONBOARD_HORSE_STATUSES = ['Planned', 'InTransit'];

// Một người có thể giữ cả hai vai trò trên chuyến nên lựa chọn "người bị thay" là cặp userId + vai trò
const toCrewKey = (userId, crewRole) => `${userId}|${crewRole}`;

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
  // Ủy quyền khẩn cấp / viện phí / ngựa chết tại phòng khám / đơn nối tiếp
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [deathOpen, setDeathOpen] = useState(false);
  const [deathFile, setDeathFile] = useState(null);
  const [continuationOpen, setContinuationOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const currentUser = useAuthStore((st) => st.user);
  const [emergencyForm] = Form.useForm();
  const [expenseForm] = Form.useForm();
  const [deathForm] = Form.useForm();
  const [continuationForm] = Form.useForm();
  const [proposeForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const responseAction = Form.useWatch('responseAction', proposeForm);
  const offloadOutcome = Form.useWatch('offloadOutcome', proposeForm);
  const removeCrewKey = Form.useWatch('removeCrewKey', proposeForm);
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

  // Danh mục xe và nhân sự đoàn xe: để hiện biển số xe mới, tên người cũ → người mới của phương án đổi xe / đổi người
  const [directory, setDirectory] = useState({ assets: [], users: [] });
  useEffect(() => {
    let active = true;
    Promise.all([assetService.getAssets({ size: 100 }), userService.getStaff('DriverEscort')])
      .then(([assetRes, staffRes]) => active && setDirectory({ assets: unwrapList(assetRes), users: unwrapList(staffRes) }))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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
  const currentTrip = selectedTripId && trip?.tripId === selectedTripId ? trip : null;

  // Đổi xe / đổi người: xe / người còn rảnh trong khung giờ kế hoạch của chuyến (backend kiểm tra trùng lịch theo đúng khung này)
  const [availability, setAvailability] = useState({ tripId: null, vehicles: [], crew: [] });
  const needsAvailability = role === 'coordinator' && REPLACEMENT_ACTIONS.includes(responseAction);
  const plannedStart = currentTrip?.plannedStartDate;
  const plannedEnd = currentTrip?.plannedEndDate;
  const currentTripId = currentTrip?.tripId;
  useEffect(() => {
    if (!needsAvailability || !currentTripId || !plannedStart || !plannedEnd) return undefined;
    let active = true;
    Promise.all([
      tripService.getAvailableVehicles({ from: plannedStart, to: plannedEnd }),
      tripService.getAvailableCrew({ from: plannedStart, to: plannedEnd }),
    ])
      .then(([vRes, cRes]) => active && setAvailability({ tripId: currentTripId, vehicles: unwrapList(vRes), crew: unwrapList(cRes) }))
      .catch((err) => active && message.error(getErrorMessage(err)));
    return () => {
      active = false;
    };
  }, [needsAvailability, currentTripId, plannedStart, plannedEnd]);
  const available = availability.tripId === currentTripId ? availability : { vehicles: [], crew: [] };

  // Xe thay thế: khác xe hiện tại, cùng loại, đang Available, đủ chỗ cho số ngựa còn trên xe (điều hòa: backend kiểm tra theo đơn)
  // available-vehicles không trả trạng thái nên đối chiếu thêm với danh mục xe
  const onboardCount = (currentTrip?.horses || []).filter((h) => ONBOARD_HORSE_STATUSES.includes(h.status)).length;
  const assetStatus = (id) => directory.assets.find((a) => a.assetId === id)?.status;
  const vehicleOptions = available.vehicles
    .filter(
      (v) =>
        v.assetId !== currentTrip?.vehicleId &&
        v.assetType === currentTrip?.vehicleType &&
        v.capacityHorses >= onboardCount &&
        (assetStatus(v.assetId) ?? 'Available') === 'Available',
    )
    .map((v) => ({
      value: v.assetId,
      label: [v.assetCode, v.assetType, t('tripPlan.fields.capacity', { count: v.capacityHorses }), v.hasClimateControl ? t('incidentPlan.climate') : null]
        .filter(Boolean)
        .join(' · '),
    }));
  const tripCrew = currentTrip?.crew || [];
  const removedMember = tripCrew.find((c) => toCrewKey(c.userId, c.crewRole) === removeCrewKey);
  const crewOptions = available.crew
    .filter((u) => !tripCrew.some((c) => c.userId === u.userId))
    .map((u) => ({ value: u.userId, label: u.phoneNumber ? `${u.fullName} · ${u.phoneNumber}` : u.fullName }));
  const lookup = buildIncidentLookup({
    trip: currentTrip,
    assets: [...directory.assets, ...available.vehicles],
    users: [...directory.users, ...available.crew],
  });

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
    if (isOffload && values.offloadOutcome === 'Deceased' && !hasVetDocument(selected)) {
      message.warning(t('incidentHealth.plan.vetDocRequired'));
      return;
    }
    const isReplaceVehicle = values.responseAction === 'ReplaceVehicle';
    const isReplaceCrew = values.responseAction === 'ReplaceCrew';
    // Vai trò cần thay lấy theo vai trò của người bị thay trên chuyến
    const removed = isReplaceCrew ? tripCrew.find((c) => toCrewKey(c.userId, c.crewRole) === values.removeCrewKey) : undefined;
    if (isReplaceCrew && !removed) {
      message.warning(t('incidentPlan.removeCrewRequired'));
      return;
    }
    const isWaitRecover = isOffload && values.offloadOutcome === 'WaitRecover';
    await run(async () => {
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
        // Ngựa còn sống, bác sĩ khuyến nghị an tử: duyệt xong chờ chủ ngựa đồng ý (Chính sách 9.6)
        requiresEuthanasiaConsent: isOffload && values.offloadOutcome === 'Deceased' ? Boolean(values.requiresEuthanasiaConsent) : undefined,
        // Ở lại phòng khám: bắt buộc tên + địa chỉ phòng khám
        vetClinic: isWaitRecover
          ? {
              name: values.vetClinic.name.trim(),
              address: values.vetClinic.address.trim(),
              phone: values.vetClinic.phone?.trim() || undefined,
              attendingVetName: values.vetClinic.attendingVetName?.trim() || undefined,
            }
          : undefined,
        // Chỉ gửi kèm đúng hành động, gửi với hành động khác backend trả 400
        replacementVehicleId: isReplaceVehicle ? values.replacementVehicleId : undefined,
        removeUserId: removed?.userId,
        addUserId: isReplaceCrew ? values.addUserId : undefined,
        crewRole: removed?.crewRole,
      });
    }, t('incidents.actions.proposed'));
  };

  // Quá hạn chờ chủ ngựa trả lời khuyến nghị an tử: áp dụng ủy quyền khẩn cấp
  const handleEmergency = async () => {
    let values;
    try {
      values = await emergencyForm.validateFields();
    } catch {
      return;
    }
    const ok = await run(
      () => incidentService.emergencyAuthorize(selected.incidentId, { note: values.note.trim() }),
      t('incidentHealth.euthanasia.emergencyDone'),
    );
    if (ok) setEmergencyOpen(false);
  };

  const handleVetExpense = async () => {
    let values;
    try {
      values = await expenseForm.validateFields();
    } catch {
      return;
    }
    const ok = await run(
      () => incidentService.recordVetExpense(selected.tripId, selected.affectedTripHorseId, { amount: values.amount, note: values.note?.trim() || undefined }),
      t('incidentHealth.clinic.expenseSaved'),
    );
    if (ok) setExpenseOpen(false);
  };

  const handleDeath = async () => {
    let values;
    try {
      values = await deathForm.validateFields();
    } catch {
      return;
    }
    if (!deathFile) {
      message.warning(t('incidentHealth.documents.fileRequired'));
      return;
    }
    const ok = await run(
      () => incidentService.recordPostOffloadDeath(selected.tripId, selected.affectedTripHorseId, { file: deathFile, note: values.note?.trim() }),
      t('incidentHealth.clinic.deathSaved'),
    );
    if (ok) {
      setDeathOpen(false);
      setDeathFile(null);
    }
  };

  const handleContinuation = async () => {
    let values;
    try {
      values = await continuationForm.validateFields();
    } catch {
      return;
    }
    setActing(true);
    try {
      const res = await incidentService.createContinuationBooking(selected.tripId, selected.affectedTripHorseId, {
        pickupCountryCode: values.pickupCountryCode.trim().toUpperCase(),
        pickupWindowStart: values.pickupWindow[0].startOf('day').toISOString(),
        pickupWindowEnd: values.pickupWindow[1].endOf('day').toISOString(),
        deliveryDeadline: values.deliveryDeadline.endOf('day').toISOString(),
        specialInstructions: values.specialInstructions?.trim() || undefined,
      });
      const booking = unwrapData(res);
      message.success(t('incidentHealth.continuation.created', { code: booking?.bookingCode || '' }));
      setContinuationOpen(false);
      await load();
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setActing(false);
    }
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
            <div style={{ marginTop: 12 }}>
              <IncidentDocuments
                incident={selected}
                canUpload
                defaultType={selected.offloadOutcome === 'WaitRecover' ? 'FitToTravel' : 'VetReport'}
                currentUserId={currentUser?.userId}
                canDeleteAny={role === 'manager'}
                onChanged={load}
              />
            </div>

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
                  vetClinic: selected.actionPayload?.vetClinic || undefined,
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
                  // Đề xuất lại phương án đổi xe / đổi người: điền sẵn lựa chọn lần trước
                  replacementVehicleId: selected.actionPayload?.replacementVehicleId || undefined,
                  requiresEuthanasiaConsent: selected.requiresEuthanasiaConsent || false,
                  removeCrewKey: selected.actionPayload?.removeUserId
                    ? toCrewKey(selected.actionPayload.removeUserId, selected.actionPayload.crewRole)
                    : undefined,
                  addUserId: selected.actionPayload?.addUserId || undefined,
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
                          <Radio key={value} value={value}>
                            {t(`incidentOutcome.outcome.${value}`)}
                            <div style={{ fontSize: 12, color: '#6B7280' }}>
                              {value === 'Deceased' ? t('incidentHealth.plan.deceasedHint') : t(`incidentPlan.outcomeHint.${value}`)}
                            </div>
                          </Radio>
                        ))}
                      </Radio.Group>
                    </Form.Item>
                    {offloadOutcome === 'Deceased' && (
                      <>
                        {!hasVetDocument(selected) && (
                          <Alert type="error" showIcon style={{ marginBottom: 12 }} title={t('incidentHealth.plan.vetDocRequired')} />
                        )}
                        <Form.Item name="requiresEuthanasiaConsent" valuePropName="checked" extra={t('incidentHealth.plan.euthanasiaHint')}>
                          <Checkbox>{t('incidentHealth.plan.euthanasiaConsent')}</Checkbox>
                        </Form.Item>
                      </>
                    )}
                    {offloadOutcome === 'WaitRecover' && (
                      <>
                        <Form.Item
                          name={['vetClinic', 'name']}
                          label={t('incidentHealth.clinic.name')}
                          rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 150 }]}
                        >
                          <Input placeholder={t('incidentHealth.clinic.namePlaceholder')} />
                        </Form.Item>
                        <Form.Item
                          name={['vetClinic', 'address']}
                          label={t('incidentHealth.clinic.address')}
                          rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 255 }]}
                        >
                          <Input />
                        </Form.Item>
                        <Space.Compact block style={{ marginBottom: 12, gap: 8 }}>
                          <Form.Item name={['vetClinic', 'phone']} label={t('incidentHealth.clinic.phone')} rules={[{ max: 30 }]} style={{ flex: 1, marginBottom: 0 }}>
                            <Input />
                          </Form.Item>
                          <Form.Item name={['vetClinic', 'attendingVetName']} label={t('incidentHealth.clinic.vet')} rules={[{ max: 100 }]} style={{ flex: 1, marginBottom: 0 }}>
                            <Input />
                          </Form.Item>
                        </Space.Compact>
                      </>
                    )}
                  </div>
                )}
                {responseAction === 'ReplaceVehicle' && (
                  <Form.Item
                    name="replacementVehicleId"
                    label={t('incidentPlan.replacementVehicle')}
                    rules={[{ required: true, message: t('handover.form.required') }]}
                    extra={t('incidentPlan.replacementVehicleHint', { type: currentTrip?.vehicleType || '—', count: onboardCount })}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder={t('incidentPlan.replacementVehiclePlaceholder')}
                      notFoundContent={t('incidentPlan.noVehicle')}
                      options={vehicleOptions}
                    />
                  </Form.Item>
                )}
                {responseAction === 'ReplaceCrew' && (
                  <>
                    <Form.Item
                      name="removeCrewKey"
                      label={t('incidentPlan.removeCrew')}
                      rules={[{ required: true, message: t('handover.form.required') }]}
                    >
                      <Select
                        placeholder={t('incidentPlan.removeCrewPlaceholder')}
                        options={tripCrew.map((c) => ({ value: toCrewKey(c.userId, c.crewRole), label: `${c.fullName} · ${t(`tripPlan.crewRole.${c.crewRole}`)}` }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="addUserId"
                      label={t('incidentPlan.addCrew')}
                      rules={[{ required: true, message: t('handover.form.required') }]}
                      extra={removedMember ? t('incidentPlan.addCrewHint', { role: t(`tripPlan.crewRole.${removedMember.crewRole}`) }) : undefined}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder={t('incidentPlan.addCrewPlaceholder')}
                        notFoundContent={t('incidentPlan.noCrew')}
                        options={crewOptions}
                      />
                    </Form.Item>
                  </>
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
                <IncidentOutcome incident={selected} lookup={lookup} />
              </div>
            )}
            {selected.status === 'AwaitingConsent' && selected.pendingConsentType !== 'Euthanasia' && (
              <Alert type="info" showIcon style={{ marginTop: 12 }} title={t('incidentPlan.awaitingConsent')} />
            )}
            {selected.status === 'AwaitingConsent' && selected.pendingConsentType === 'Euthanasia' && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 12 }}
                title={t('incidentHealth.euthanasia.boardWaiting', { horse: selected.affectedHorseName || '' })}
                description={
                  <Space direction="vertical" size={6}>
                    <Text>
                      {now >= dayjs(selected.consentDeadline).valueOf()
                        ? t('incidentHealth.euthanasia.deadlinePassed', { time: formatTime(selected.consentDeadline) })
                        : t('incidentHealth.euthanasia.minutesLeft', {
                            minutes: Math.max(1, Math.ceil((dayjs(selected.consentDeadline).valueOf() - now) / 60000)),
                            time: formatTime(selected.consentDeadline),
                          })}
                    </Text>
                    <Space>
                      <Button size="small" onClick={() => setNow(Date.now())}>
                        {t('customerTrips.refresh')}
                      </Button>
                      <Button
                        size="small"
                        danger
                        disabled={now < dayjs(selected.consentDeadline).valueOf()}
                        onClick={() => {
                          emergencyForm.resetFields();
                          setEmergencyOpen(true);
                        }}
                      >
                        {t('incidentHealth.euthanasia.emergencyButton')}
                      </Button>
                    </Space>
                  </Space>
                }
              />
            )}
            {selected.responseAction === 'OffloadHorse' &&
              selected.offloadOutcome === 'WaitRecover' &&
              ['Approved', 'Resolved'].includes(selected.status) &&
              (() => {
                const clinicHorse = (currentTrip?.horses || []).find((h) => h.tripHorseId === selected.affectedTripHorseId);
                const atClinic = clinicHorse?.status === 'Offloaded';
                const resolved = selected.status === 'Resolved';
                return (
                  <div style={{ marginTop: 16, border: '1px solid #FDE68A', background: '#FFFBEB', borderRadius: 8, padding: 12 }}>
                    <Text strong>{t('incidentHealth.clinic.title', { horse: selected.affectedHorseName || '' })}</Text>
                    {clinicHorse?.vetClinic && (
                      <div style={{ fontSize: 13, color: '#57534E', marginTop: 4 }}>
                        {clinicHorse.vetClinic.name} · {clinicHorse.vetClinic.address}
                        {clinicHorse.vetClinic.phone ? ` · ${clinicHorse.vetClinic.phone}` : ''}
                      </div>
                    )}
                    {clinicHorse?.vetExpenseAmount != null && (
                      <div style={{ fontSize: 13, marginTop: 4 }}>
                        {t('incidentHealth.clinic.expenseLine', { amount: formatUsd(clinicHorse.vetExpenseAmount) })}{' '}
                        <Tag color={clinicHorse.vetExpenseBearer === 'Company' ? 'green' : 'orange'}>
                          {t(`incidentHealth.clinic.bearer.${clinicHorse.vetExpenseBearer}`)}
                        </Tag>
                      </div>
                    )}
                    {clinicHorse?.status === 'Deceased' && <Tag color="red" style={{ marginTop: 6 }}>{t('incidentHealth.clinic.diedAtClinic')}</Tag>}
                    {!resolved && <div style={{ fontSize: 12, color: '#92400E', marginTop: 6 }}>{t('incidentHealth.clinic.resolveFirst')}</div>}
                    <Space wrap style={{ marginTop: 8 }}>
                      <Button
                        size="small"
                        disabled={!resolved}
                        onClick={() => {
                          expenseForm.setFieldsValue({ amount: clinicHorse?.vetExpenseAmount ?? undefined, note: clinicHorse?.vetExpenseNote || '' });
                          setExpenseOpen(true);
                        }}
                      >
                        {t('incidentHealth.clinic.recordExpense')}
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        disabled={!resolved || !atClinic || !hasDocument(selected, 'FitToTravel')}
                        title={!hasDocument(selected, 'FitToTravel') ? t('incidentHealth.continuation.needFit') : undefined}
                        onClick={() => {
                          continuationForm.resetFields();
                          setContinuationOpen(true);
                        }}
                      >
                        {t('incidentHealth.continuation.create')}
                      </Button>
                      <Button size="small" danger disabled={!atClinic} onClick={() => setDeathOpen(true)}>
                        {t('incidentHealth.clinic.recordDeath')}
                      </Button>
                    </Space>
                    {resolved && atClinic && !hasDocument(selected, 'FitToTravel') && (
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{t('incidentHealth.continuation.needFit')}</div>
                    )}
                  </div>
                );
              })()}
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

      <Modal
        title={t('incidentHealth.euthanasia.emergencyTitle', { code: selected?.incidentCode || '' })}
        open={emergencyOpen}
        onCancel={() => setEmergencyOpen(false)}
        onOk={handleEmergency}
        okText={t('incidentHealth.euthanasia.emergencyButton')}
        okButtonProps={{ danger: true, loading: acting }}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} title={t('incidentHealth.euthanasia.emergencyWarning')} />
        <Form form={emergencyForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="note"
            label={t('incidentHealth.euthanasia.emergencyNote')}
            rules={[{ required: true, whitespace: true, message: t('handover.form.required') }, { max: 500 }]}
          >
            <TextArea rows={3} placeholder={t('incidentHealth.euthanasia.emergencyNotePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('incidentHealth.clinic.recordExpense')}
        open={expenseOpen}
        onCancel={() => setExpenseOpen(false)}
        onOk={handleVetExpense}
        okButtonProps={{ loading: acting }}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <Alert type="info" showIcon style={{ marginBottom: 12 }} title={t('incidentHealth.clinic.bearerRule')} />
        <Form form={expenseForm} layout="vertical" requiredMark={false}>
          <Form.Item name="amount" label={t('incidentHealth.clinic.amount')} rules={[{ required: true, message: t('handover.form.required') }]}>
            <InputNumber min={0} max={1000000} prefix="$" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="note" label={t('incidentHealth.documents.note')} rules={[{ max: 500 }]}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('incidentHealth.clinic.recordDeath')}
        open={deathOpen}
        onCancel={() => setDeathOpen(false)}
        onOk={handleDeath}
        okButtonProps={{ danger: true, loading: acting }}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} title={t('incidentHealth.clinic.deathWarning')} />
        <Form form={deathForm} layout="vertical" requiredMark={false}>
          <Form.Item label={t('incidentHealth.documentType.DeathCertificate')} required extra={t('incidentHealth.documents.fileHint')}>
            <Upload
              maxCount={1}
              accept="image/*,.pdf"
              fileList={deathFile ? [{ uid: '-1', name: deathFile.name, status: 'done' }] : []}
              beforeUpload={(file) => {
                setDeathFile(file);
                return false;
              }}
              onRemove={() => setDeathFile(null)}
            >
              <Button icon={<UploadOutlined />}>{t('incidentHealth.documents.choose')}</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="note" label={t('incidentHealth.documents.note')} rules={[{ max: 500 }]}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('incidentHealth.continuation.title', { horse: selected?.affectedHorseName || '' })}
        open={continuationOpen}
        onCancel={() => setContinuationOpen(false)}
        onOk={handleContinuation}
        okText={t('incidentHealth.continuation.create')}
        okButtonProps={{ loading: acting }}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <Alert
          type={selected?.faultParty === 'Company' ? 'success' : 'info'}
          showIcon
          style={{ marginBottom: 12 }}
          title={selected?.faultParty === 'Company' ? t('incidentHealth.continuation.free') : t('incidentHealth.continuation.paid')}
        />
        <Form form={continuationForm} layout="vertical" requiredMark={false} initialValues={{ pickupCountryCode: 'VN' }}>
          <Form.Item
            name="pickupCountryCode"
            label={t('incidentHealth.continuation.country')}
            rules={[{ required: true, message: t('handover.form.required') }, { pattern: /^[A-Za-z]{2}$/, message: t('incidentHealth.continuation.countryFormat') }]}
          >
            <Input maxLength={2} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item
            name="pickupWindow"
            label={t('incidentHealth.continuation.pickupWindow')}
            rules={[{ required: true, message: t('handover.form.required') }]}
            extra={t('incidentHealth.continuation.leadHint')}
          >
            <DatePicker.RangePicker format="DD/MM/YYYY" disabledDate={(d) => d && d < dayjs().startOf('day')} />
          </Form.Item>
          <Form.Item name="deliveryDeadline" label={t('incidentHealth.continuation.deadline')} rules={[{ required: true, message: t('handover.form.required') }]}>
            <DatePicker format="DD/MM/YYYY" disabledDate={(d) => d && d < dayjs().startOf('day')} />
          </Form.Item>
          <Form.Item name="specialInstructions" label={t('incidentHealth.continuation.notes')} rules={[{ max: 1000 }]}>
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
