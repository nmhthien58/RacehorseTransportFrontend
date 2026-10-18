import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Flex,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined, SendOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatDeliveryDeadline, formatPickupWindow } from '@utils/bookingSchedule';
import tripService from '@services/tripService';
import StatusTag from '@components/common/StatusTag';
import { unwrapData, unwrapList, getErrorMessage, toIsoString } from '@utils/apiHelpers';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const CHECKPOINT_TYPES = ['Origin', 'RestStop', 'BorderGate', 'Destination'];
// Backend: cứ 3 con ngựa cần ít nhất 1 Escort, và luôn cần ít nhất 1 Driver
const HORSES_PER_ESCORT = 3;

/**
 * Suy ra phương thức của chuyến từ loại xe (AirStall = hàng không).
 * @param {string} vehicleType
 * @returns {'Ground'|'Air'}
 */
const modeFromVehicleType = (vehicleType) => (vehicleType === 'AirStall' ? 'Air' : 'Ground');

/**
 * Tạo 2 mốc mặc định (Origin, Destination) từ địa chỉ của ngựa đầu tiên và khoảng thời gian chuyến.
 * @param {Array<any>} horses
 * @param {[any, any]} period
 * @returns {Array<any>}
 */
function buildDefaultCheckpoints(horses, period) {
  const first = horses[0];
  if (!first || !period?.[0] || !period?.[1]) return [];
  return [
    {
      key: `cp-o-${Date.now()}`,
      checkpointName: first.pickupAddress?.split(',')[0] || 'Origin',
      checkpointType: 'Origin',
      address: first.pickupAddress || '',
      plannedTime: period[0],
      mandatoryRestMinutes: 0,
    },
    {
      key: `cp-d-${Date.now()}`,
      checkpointName: first.dropoffAddress?.split(',')[0] || 'Destination',
      checkpointType: 'Destination',
      address: first.dropoffAddress || '',
      plannedTime: period[1],
      mandatoryRestMinutes: 0,
    },
  ];
}

/**
 * Form lập / sửa bản nháp chuyến (Flow 3): chọn ngựa từ hàng chờ, khoảng thời gian, xe, đoàn xe,
 * ô chuồng, các mốc lộ trình và chi phí dự kiến. Gọi POST /trips hoặc PUT /trips/{id}, rồi có thể trình duyệt.
 *
 * @param {Object} props
 * @param {Object|null} props.trip - Chi tiết chuyến đang sửa (null = tạo mới)
 * @param {Array<any>} props.queue - Hàng chờ GET /trips/unplanned-horses
 * @param {Array<number>} [props.preselected] - bookingHorseId chọn sẵn khi tạo mới
 * @param {(trip: any) => void} props.onSaved - Gọi sau khi lưu / trình duyệt thành công
 * @param {() => void} props.onCancel
 * @returns {JSX.Element}
 */
export default function TripPlanEditor({ trip, queue, preselected = [], onSaved, onCancel }) {
  const { t } = useTranslation();

  // Ngựa có thể chọn = ngựa đang trên chuyến (khi sửa) + hàng chờ
  const pool = useMemo(() => {
    const tripMode = trip ? modeFromVehicleType(trip.vehicleType) : null;
    const booking = (bookingId) => (trip?.bookings || []).find((b) => b.bookingId === bookingId) || {};
    const onTrip = (trip?.horses || []).map((h) => ({
      ...h,
      transportMode: tripMode,
      pickupAddress: booking(h.bookingId).pickupAddress,
      dropoffAddress: booking(h.bookingId).dropoffAddress,
      customerName: booking(h.bookingId).customerName,
    }));
    const ids = new Set(onTrip.map((h) => h.bookingHorseId));
    return [...onTrip, ...queue.filter((h) => !ids.has(h.bookingHorseId))];
  }, [trip, queue]);

  const [selectedIds, setSelectedIds] = useState(() =>
    trip ? (trip.horses || []).map((h) => h.bookingHorseId) : preselected,
  );
  const selectedHorses = useMemo(
    () => pool.filter((h) => selectedIds.includes(h.bookingHorseId)),
    [pool, selectedIds],
  );
  const mode = selectedHorses[0]?.transportMode || null;

  const [period, setPeriod] = useState(() => {
    if (trip) return [dayjs(trip.plannedStartDate), dayjs(trip.plannedEndDate)];
    const chosen = pool.filter((h) => preselected.includes(h.bookingHorseId));
    if (chosen.length === 0) return null;
    // Gợi ý: chạy ngày đầu khoảng pickup muộn nhất (để nằm trong khoảng pickup của mọi đơn),
    // kết thúc trước hạn giao sớm nhất trong các đơn đã chọn
    const start = chosen
      .map((h) => dayjs(h.pickupWindowStart).hour(6).minute(0))
      .sort((a, b) => b - a)[0];
    const end = chosen.map((h) => dayjs(h.deliveryDeadline)).sort((a, b) => a - b)[0];
    return [start, end];
  });

  const [vehicleId, setVehicleId] = useState(trip?.vehicleId || null);
  const [crew, setCrew] = useState(() =>
    (trip?.crew || []).map((c, idx) => ({ key: `c-${idx}`, userId: c.userId, crewRole: c.crewRole, isLead: c.isLead, duty: c.duty || '' })),
  );
  const [slots, setSlots] = useState(() =>
    Object.fromEntries((trip?.horses || []).map((h) => [h.bookingHorseId, h.stallSlotNumber])),
  );
  const [checkpoints, setCheckpoints] = useState(() =>
    trip
      ? (trip.checkpoints || [])
          .filter((c) => c.isActive !== false)
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
          .map((c) => ({ ...c, key: `cp-${c.checkpointId}`, plannedTime: dayjs(c.plannedTime) }))
      : buildDefaultCheckpoints(pool.filter((h) => preselected.includes(h.bookingHorseId)), period),
  );
  const [plannedCost, setPlannedCost] = useState(trip?.plannedCost || 0);

  const [vehicles, setVehicles] = useState([]);
  const [crewOptions, setCrewOptions] = useState([]);
  const [saving, setSaving] = useState(false);

  const periodValid = Boolean(period?.[0] && period?.[1] && period[1].isAfter(period[0]));
  const fromIso = periodValid ? toIsoString(period[0]) : null;
  const toIso = periodValid ? toIsoString(period[1]) : null;

  // Xe và người còn rảnh trong khoảng thời gian (backend loại các xe/người đã vướng chuyến khác)
  useEffect(() => {
    if (!fromIso || !toIso) return undefined;
    let active = true;
    Promise.all([
      tripService.getAvailableVehicles({ from: fromIso, to: toIso, transportMode: mode || undefined }),
      tripService.getAvailableCrew({ from: fromIso, to: toIso }),
    ])
      .then(([vRes, cRes]) => {
        if (!active) return;
        setVehicles(unwrapList(vRes));
        setCrewOptions(unwrapList(cRes));
      })
      .catch((err) => {
        if (active) message.error(getErrorMessage(err, t('tripPlan.messages.loadFailed')));
      });
    return () => {
      active = false;
    };
  }, [fromIso, toIso, mode, t]);

  // Xe / người đang gắn với chuyến này vẫn phải có trong danh sách chọn khi sửa
  const vehicleOptions = useMemo(() => {
    const list = [...vehicles];
    if (trip && !list.some((v) => v.assetId === trip.vehicleId)) {
      list.unshift({ assetId: trip.vehicleId, assetCode: trip.vehicleCode, assetType: trip.vehicleType, capacityHorses: trip.vehicleCapacity });
    }
    return list;
  }, [vehicles, trip]);
  const crewUserOptions = useMemo(() => {
    const list = [...crewOptions];
    (trip?.crew || []).forEach((c) => {
      if (!list.some((u) => u.userId === c.userId)) list.push({ userId: c.userId, fullName: c.fullName, phoneNumber: c.phoneNumber });
    });
    return list;
  }, [crewOptions, trip]);

  const selectedVehicle = vehicleOptions.find((v) => v.assetId === vehicleId);
  const capacity = selectedVehicle?.capacityHorses || 0;
  const driverCount = crew.filter((c) => c.crewRole === 'Driver' && c.userId).length;
  const escortCount = crew.filter((c) => c.crewRole === 'Escort' && c.userId).length;
  const escortsNeeded = Math.ceil(selectedHorses.length / HORSES_PER_ESCORT);

  // Ô chuồng: giữ số đã nhập, ngựa mới chọn được gán ô trống nhỏ nhất
  const slotOf = (bookingHorseId) => {
    if (slots[bookingHorseId]) return slots[bookingHorseId];
    const used = new Set(selectedIds.map((id) => slots[id]).filter(Boolean));
    let next = 1;
    for (const id of selectedIds) {
      if (slots[id]) continue;
      while (used.has(next)) next += 1;
      if (id === bookingHorseId) return next;
      used.add(next);
    }
    return next;
  };

  const toggleHorse = (horse, checked) => {
    if (checked && mode && horse.transportMode !== mode) {
      message.warning(t('tripPlan.messages.mixedMode'));
      return;
    }
    setSelectedIds((prev) => (checked ? [...prev, horse.bookingHorseId] : prev.filter((id) => id !== horse.bookingHorseId)));
    if (!checked) {
      setSlots((prev) => {
        const next = { ...prev };
        delete next[horse.bookingHorseId];
        return next;
      });
    }
  };

  const updateCrew = (key, patch) => setCrew((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const updateCheckpoint = (key, patch) =>
    setCheckpoints((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const addStop = () => {
    setCheckpoints((prev) => {
      const dest = prev.findIndex((c) => c.checkpointType === 'Destination');
      const before = prev[dest - 1] || prev[0];
      const after = prev[dest] || prev[prev.length - 1];
      const mid =
        before?.plannedTime && after?.plannedTime
          ? dayjs((before.plannedTime.valueOf() + after.plannedTime.valueOf()) / 2)
          : period?.[0];
      const stop = {
        key: `cp-n-${Date.now()}`,
        checkpointName: '',
        checkpointType: 'RestStop',
        address: '',
        plannedTime: mid,
        mandatoryRestMinutes: 30,
      };
      const next = [...prev];
      next.splice(dest >= 0 ? dest : next.length, 0, stop);
      return next;
    });
  };

  const buildPayload = () => ({
    vehicleId,
    plannedStartDate: fromIso,
    plannedEndDate: toIso,
    plannedCost: Number(plannedCost) || 0,
    crew: crew
      .filter((c) => c.userId)
      .map((c) => ({ userId: c.userId, crewRole: c.crewRole, isLead: Boolean(c.isLead), duty: c.duty?.trim() || null })),
    horses: selectedIds.map((id) => ({
      bookingHorseId: id,
      stallSlotNumber: slotOf(id),
      notes: pool.find((h) => h.bookingHorseId === id)?.notes || null,
    })),
    checkpoints: checkpoints.map((c) => ({
      checkpointName: c.checkpointName?.trim(),
      checkpointType: c.checkpointType,
      address: c.address?.trim(),
      plannedTime: toIsoString(c.plannedTime),
      mandatoryRestMinutes: Number(c.mandatoryRestMinutes) || 0,
    })),
  });

  const validate = () => {
    if (selectedIds.length === 0) return t('tripPlan.messages.needHorse');
    if (!periodValid) return t('tripPlan.messages.needPeriod');
    if (!vehicleId) return t('tripPlan.messages.needVehicle');
    if (driverCount < 1) return t('tripPlan.messages.needDriver');
    if (checkpoints.some((c) => !c.checkpointName?.trim() || !c.address?.trim() || !c.plannedTime)) {
      return t('tripPlan.messages.incompleteCheckpoint');
    }
    return null;
  };

  const save = async (submit) => {
    const problem = validate();
    if (problem) {
      message.warning(problem);
      return;
    }
    setSaving(true);
    let saved = null;
    try {
      const payload = buildPayload();
      saved = unwrapData(trip ? await tripService.updateTrip(trip.tripId, payload) : await tripService.createTrip(payload));
      if (!submit) {
        message.success(t('tripPlan.messages.saved', { code: saved.tripCode }));
        onSaved?.(saved);
        return;
      }
      const result = unwrapData(await tripService.submitPlan(saved.tripId));
      message.success(t('tripPlan.messages.submitted', { code: result.tripCode }));
      onSaved?.(result);
    } catch (err) {
      message.error(getErrorMessage(err, t('tripPlan.messages.saveFailed')));
      // Đã lưu nháp nhưng trình duyệt bị từ chối: tiếp tục sửa trên bản nháp đó (không tạo chuyến mới lần nữa)
      if (saved) onSaved?.(saved, { keepEditing: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {trip?.planRejectionReason && (
        <Alert
          type="warning"
          showIcon
          message={t('tripPlan.summary.lastRejection', { count: trip.planRejectionCount })}
          description={trip.planRejectionReason}
        />
      )}

      {/* 1. Ngựa trên chuyến */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>{t('tripPlan.sections.horses')}</Title>}
        extra={mode && <Tag color={mode === 'Air' ? 'blue' : 'orange'}>{mode}</Tag>}
        style={{ borderRadius: 14 }}
      >
        {pool.length === 0 ? (
          <Empty description={t('tripPlan.queueEmpty')} />
        ) : (
          <Table
            size="small"
            rowKey="bookingHorseId"
            pagination={false}
            dataSource={pool}
            scroll={{ x: 760 }}
            columns={[
              {
                title: '',
                width: 40,
                render: (_, h) => (
                  <Checkbox
                    checked={selectedIds.includes(h.bookingHorseId)}
                    onChange={(e) => toggleHorse(h, e.target.checked)}
                  />
                ),
              },
              {
                title: t('tripPlan.fields.horse'),
                dataIndex: 'horseName',
                render: (name, h) => (
                  <div>
                    <Text strong>{name}</Text>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {h.bookingCode} · {h.customerName}
                    </div>
                  </div>
                ),
              },
              { title: t('tripPlan.fields.mode'), dataIndex: 'transportMode', width: 80 },
              {
                title: t('tripPlan.fields.route'),
                render: (_, h) => (
                  <span style={{ fontSize: 12 }}>
                    {h.pickupAddress} → {h.dropoffAddress}
                  </span>
                ),
              },
              {
                title: t('tripPlan.fields.window'),
                width: 150,
                render: (_, h) =>
                  h.pickupWindowStart ? (
                    <span style={{ fontSize: 12 }}>
                      {formatPickupWindow(h)} · {t('bookings.fields.deliveryDeadline')}: {formatDeliveryDeadline(h)}
                    </span>
                  ) : (
                    '—'
                  ),
              },
              { title: t('tripPlan.fields.stallClass'), dataIndex: 'stallClass', width: 90, render: (s) => <Tag>{s}</Tag> },
              { title: t('tripPlan.fields.dossier'), dataIndex: 'dossierStatus', width: 120, render: (s) => <StatusTag status={s} /> },
              {
                title: t('tripPlan.fields.slot'),
                width: 90,
                render: (_, h) =>
                  selectedIds.includes(h.bookingHorseId) ? (
                    <InputNumber
                      size="small"
                      min={1}
                      max={capacity || 12}
                      value={slotOf(h.bookingHorseId)}
                      onChange={(v) => setSlots((prev) => ({ ...prev, [h.bookingHorseId]: v }))}
                    />
                  ) : null,
              },
            ]}
          />
        )}
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          {t('tripPlan.hints.dossier')}
        </Text>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 2. Thời gian + xe */}
        <Col xs={24} lg={12}>
          <Card title={<Title level={5} style={{ margin: 0 }}>{t('tripPlan.sections.vehicle')}</Title>} style={{ borderRadius: 14, height: '100%' }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div>
                <Text strong>{t('tripPlan.fields.period')}</Text>
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: '100%', marginTop: 6 }}
                  value={period}
                  onChange={(v) => {
                    setPeriod(v);
                    setVehicleId((prev) => (trip && prev === trip.vehicleId ? prev : null));
                  }}
                  disabledDate={(d) => d && d.isBefore(dayjs(), 'day')}
                />
              </div>
              <div>
                <Text strong>{t('tripPlan.fields.vehicle')}</Text>
                <Select
                  style={{ width: '100%', marginTop: 6 }}
                  placeholder={periodValid ? t('tripPlan.placeholders.vehicle') : t('tripPlan.placeholders.choosePeriod')}
                  disabled={!periodValid}
                  value={vehicleId}
                  onChange={setVehicleId}
                  options={vehicleOptions.map((v) => ({
                    value: v.assetId,
                    label: `${v.assetCode} · ${v.assetType} · ${t('tripPlan.fields.capacity', { count: v.capacityHorses })}${v.hasClimateControl ? ' · ❄' : ''}`,
                  }))}
                />
                {capacity > 0 && selectedHorses.length > capacity && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    {t('tripPlan.messages.overCapacity', { capacity })}
                  </Text>
                )}
              </div>
              <div>
                <Text strong>{t('tripPlan.fields.plannedCost')}</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 6 }}
                  min={0}
                  value={plannedCost}
                  onChange={setPlannedCost}
                  formatter={(v) => (v ? `$ ${Number(v).toLocaleString('en-US')}` : '')}
                  parser={(v) => (v ? String(v).replace(/[^\d.]/g, '') : '')}
                />
              </div>
            </Space>
          </Card>
        </Col>

        {/* 3. Đoàn xe */}
        <Col xs={24} lg={12}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>{t('tripPlan.sections.crew')}</Title>}
            extra={
              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={!periodValid}
                onClick={() =>
                  setCrew((prev) => [
                    ...prev,
                    { key: `c-${Date.now()}`, userId: null, crewRole: prev.some((c) => c.crewRole === 'Driver') ? 'Escort' : 'Driver', isLead: false, duty: '' },
                  ])
                }
              >
                {t('tripPlan.actions.addCrew')}
              </Button>
            }
            style={{ borderRadius: 14, height: '100%' }}
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {crew.map((c) => (
                <Flex key={c.key} gap={6} wrap="wrap" align="center">
                  <Select
                    style={{ minWidth: 170, flex: 1 }}
                    placeholder={t('tripPlan.placeholders.crew')}
                    value={c.userId}
                    onChange={(v) => updateCrew(c.key, { userId: v })}
                    options={crewUserOptions.map((u) => ({ value: u.userId, label: `${u.fullName} · ${u.phoneNumber || ''}` }))}
                  />
                  <Select
                    style={{ width: 110 }}
                    value={c.crewRole}
                    onChange={(v) => updateCrew(c.key, { crewRole: v })}
                    options={['Driver', 'Escort'].map((r) => ({ value: r, label: t(`tripPlan.crewRole.${r}`) }))}
                  />
                  <Switch
                    size="small"
                    checked={c.isLead}
                    onChange={(v) => updateCrew(c.key, { isLead: v })}
                    checkedChildren={t('tripPlan.fields.lead')}
                    unCheckedChildren={t('tripPlan.fields.lead')}
                  />
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => setCrew((prev) => prev.filter((x) => x.key !== c.key))} />
                  <Input
                    size="small"
                    style={{ width: '100%' }}
                    maxLength={200}
                    placeholder={t('tripPlan.placeholders.duty')}
                    value={c.duty}
                    onChange={(e) => updateCrew(c.key, { duty: e.target.value })}
                  />
                </Flex>
              ))}
              {crew.length === 0 && <Text type="secondary">{t('tripPlan.placeholders.noCrew')}</Text>}
              <Text type={driverCount >= 1 && escortCount >= escortsNeeded ? 'secondary' : 'warning'} style={{ fontSize: 12 }}>
                {t('tripPlan.hints.crewRule', { drivers: driverCount, escorts: escortCount, needed: escortsNeeded })}
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 4. Lộ trình */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>{t('tripPlan.sections.route')}</Title>}
        extra={
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => setCheckpoints(buildDefaultCheckpoints(selectedHorses, period))}>
              {t('tripPlan.actions.resetRoute')}
            </Button>
            <Button size="small" icon={<PlusOutlined />} onClick={addStop}>
              {t('tripPlan.actions.addStop')}
            </Button>
          </Space>
        }
        style={{ borderRadius: 14 }}
      >
        <Table
          size="small"
          rowKey="key"
          pagination={false}
          dataSource={checkpoints}
          scroll={{ x: 860 }}
          columns={[
            { title: '#', width: 40, render: (_, __, idx) => idx + 1 },
            {
              title: t('tripPlan.fields.checkpointType'),
              width: 130,
              render: (_, c) => (
                <Select
                  size="small"
                  style={{ width: 120 }}
                  value={c.checkpointType}
                  onChange={(v) => updateCheckpoint(c.key, { checkpointType: v })}
                  options={CHECKPOINT_TYPES.map((v) => ({ value: v, label: t(`tripPlan.checkpointType.${v}`) }))}
                />
              ),
            },
            {
              title: t('tripPlan.fields.checkpointName'),
              render: (_, c) => (
                <Input size="small" maxLength={100} value={c.checkpointName} onChange={(e) => updateCheckpoint(c.key, { checkpointName: e.target.value })} />
              ),
            },
            {
              title: t('tripPlan.fields.address'),
              render: (_, c) => (
                <Input size="small" maxLength={255} value={c.address} onChange={(e) => updateCheckpoint(c.key, { address: e.target.value })} />
              ),
            },
            {
              title: t('tripPlan.fields.plannedTime'),
              width: 180,
              render: (_, c) => (
                <DatePicker
                  size="small"
                  showTime={{ format: 'HH:mm' }}
                  format="DD/MM/YYYY HH:mm"
                  value={c.plannedTime}
                  onChange={(v) => updateCheckpoint(c.key, { plannedTime: v })}
                />
              ),
            },
            {
              title: t('tripPlan.fields.restMinutesShort'),
              width: 90,
              render: (_, c) => (
                <InputNumber
                  size="small"
                  min={0}
                  max={2880}
                  value={c.mandatoryRestMinutes}
                  onChange={(v) => updateCheckpoint(c.key, { mandatoryRestMinutes: v })}
                />
              ),
            },
            {
              title: '',
              width: 40,
              render: (_, c) => (
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => setCheckpoints((prev) => prev.filter((x) => x.key !== c.key))} />
              ),
            },
          ]}
        />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          {t('tripPlan.hints.route')}
        </Text>
      </Card>

      <Flex justify="flex-end" gap={8} wrap="wrap">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button icon={<SaveOutlined />} loading={saving} onClick={() => save(false)}>
          {t('tripPlan.actions.saveDraft')}
        </Button>
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={saving}
          onClick={() => save(true)}
          style={{ backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: '#0f172a', fontWeight: 700 }}
        >
          {t('tripPlan.actions.saveAndSubmit')}
        </Button>
      </Flex>
    </Space>
  );
}
