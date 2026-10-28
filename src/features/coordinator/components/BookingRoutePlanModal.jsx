// Đang sửa BookingRoutePlanModal vì FE-03: lập tuyến trên bản đồ, tính lại từng chặng, cảnh báo cửa khẩu, trình lại khi bị từ chối, xem phiên bản (R-10, BE-04)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AutoComplete,
  Button,
  Col,
  Empty,
  Flex,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, CompassOutlined, DeleteOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import RouteMap from '@components/common/map/RouteMap';
import routePlanService from '@services/routePlanService';
import { geoService } from '@services/geoService';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';

const { Text } = Typography;
const STOP_TYPES = ['RestStop', 'BorderGate'];
// Bản đang soạn / bị từ chối thì sửa được (PUT); chờ duyệt thì chỉ xem; đã duyệt thì lập phiên bản mới (POST)
const EDITABLE_STATUSES = ['Draft', 'Rejected'];
const PLAN_STATUS_COLORS = { Draft: 'default', Submitted: 'processing', Approved: 'success', Rejected: 'error', Superseded: 'default' };
const PREVIEW_DELAY_MS = 600;
const formatTime = (value) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—');

let stopSeq = 0;
const newKey = () => `stop-${Date.now()}-${(stopSeq += 1)}`;

/** Mốc giữa của một tuyến đã lưu (bỏ điểm đón / trả lấy từ đơn) */
const middleStopsOf = (plan) =>
  (plan?.stops || []).slice(1, -1).map((s) => ({
    key: newKey(),
    name: s.name,
    stopType: s.stopType,
    address: s.address || '',
    lat: Number(s.lat),
    lng: Number(s.lng),
    countryCode: s.countryCode || '',
    restMinutes: s.restMinutes ?? 0,
  }));

const toPayload = (stops, notes) => ({
  stops: stops.map((s) => ({
    name: s.name.trim(),
    stopType: s.stopType,
    address: s.address || undefined,
    lat: s.lat,
    lng: s.lng,
    countryCode: s.countryCode || undefined,
    restMinutes: Number(s.restMinutes) || 0,
  })),
  notes: notes?.trim() || undefined,
});

/**
 * Coordinator lập tuyến dự kiến cho một đơn (FE-03): điểm đón / trả lấy từ đơn (không sửa), thêm trạm nghỉ / cửa khẩu
 * bằng tìm địa chỉ hoặc bấm bản đồ, kéo ghim, đổi thứ tự; mỗi lần đổi gọi backend tính lại chặng, tổng km, giờ, nước quá cảnh
 * và cảnh báo cửa khẩu. Còn cảnh báo thì không trình được. Bị từ chối thì sửa và trình lại; xem được các phiên bản trước.
 *
 * @param {{ open: boolean, booking: Object|null, onClose: () => void, onSuccess?: () => void }} props
 * @returns {JSX.Element}
 */
export default function BookingRoutePlanModal({ open, booking, onClose, onSuccess }) {
  const { t } = useTranslation();
  const bookingId = booking?.bookingId || booking?.BookingID;
  const bookingCode = booking?.bookingCode || booking?.BookingCode || `#${bookingId}`;

  const [plans, setPlans] = useState([]);
  // Lần mở đầu tiên đang tải; tải lại sau khi lưu bật cờ ở nơi gọi
  const [loading, setLoading] = useState(true);
  const [stops, setStops] = useState([]);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Tuyến đã duyệt / đang chờ duyệt: bấm "Lập phiên bản mới" mới được sửa
  const [newVersion, setNewVersion] = useState(false);
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const searchPlaces = useRef([]);
  const searchTimer = useRef(null);
  const previewTimer = useRef(null);
  const previewSeq = useRef(0);

  const latest = plans[0] || null;
  const editingPlan = latest && EDITABLE_STATUSES.includes(latest.status) ? latest : null;
  const canEdit = !latest || Boolean(editingPlan) || (newVersion && latest.status === 'Approved');

  const runPreview = useCallback(
    async (nextStops, nextNotes) => {
      if (!bookingId) return;
      const seq = (previewSeq.current += 1);
      setPreviewing(true);
      try {
        const res = unwrapData(await routePlanService.previewRoutePlan(bookingId, toPayload(nextStops, nextNotes)));
        if (seq !== previewSeq.current) return;
        setPreview(res);
        setPreviewError(null);
        // Backend tra được nước của mốc: điền lại cho mốc chưa có
        setStops((prev) =>
          prev.map((s, i) => (s.countryCode ? s : { ...s, countryCode: res?.stops?.[i + 1]?.countryCode || '' })),
        );
      } catch (err) {
        if (seq === previewSeq.current) setPreviewError(getErrorMessage(err, t('routePlan.previewFailed')));
      } finally {
        if (seq === previewSeq.current) setPreviewing(false);
      }
    },
    [bookingId, t],
  );

  // Tính lại sau khi người dùng ngừng thao tác (tránh gọi theo từng lần kéo)
  const schedulePreview = (nextStops, nextNotes = notes) => {
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => runPreview(nextStops, nextNotes), PREVIEW_DELAY_MS);
  };

  // Đưa danh sách phiên bản vào màn: bản mới nhất làm bản đang xem / sửa, rồi tính lại để lấy điểm đón / trả + cảnh báo
  const applyPlans = useCallback(
    (list) => {
      setPlans(list);
      const current = list[0];
      const middle = middleStopsOf(current);
      setStops(middle);
      setNotes(current?.notes || '');
      setPreview(current || null);
      return runPreview(middle, current?.notes || '');
    },
    [runPreview],
  );

  const loadPlans = useCallback(async () => {
    try {
      await applyPlans(unwrapList(await routePlanService.getForBooking(bookingId)));
    } catch (err) {
      message.error(getErrorMessage(err, t('routePlan.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [applyPlans, bookingId, t]);

  useEffect(() => {
    if (!open || !bookingId) return undefined;
    let active = true;
    // Trạng thái sửa được làm mới theo từng đơn nhờ `key` ở RoutePlanningPage
    routePlanService
      .getForBooking(bookingId)
      .then((res) => active && applyPlans(unwrapList(res)))
      .catch((err) => active && message.error(getErrorMessage(err, t('routePlan.loadFailed'))))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      clearTimeout(previewTimer.current);
    };
  }, [open, bookingId, applyPlans, t]);

  const updateStops = (next, { recompute = true } = {}) => {
    setStops(next);
    if (recompute) schedulePreview(next);
  };

  // Điền địa chỉ / nước cho mốc vừa đặt trên bản đồ
  const resolvePlace = async (key, lat, lng) => {
    try {
      const place = unwrapData(await geoService.reverse(lat, lng));
      setStops((prev) =>
        prev.map((s) => (s.key === key ? { ...s, address: place?.displayName || s.address, countryCode: place?.countryCode || s.countryCode } : s)),
      );
    } catch {
      // Không lấy được địa chỉ: giữ tọa độ, backend vẫn tự tra nước
    }
  };

  const defaultName = (type, list) => `${t(`map.stopType.${type}`)} ${list.filter((s) => s.stopType === type).length + 1}`;

  const addStop = (point, place) => {
    const stopType = 'RestStop';
    const stop = {
      key: newKey(),
      name: place?.displayName?.split(',')[0] || defaultName(stopType, stops),
      stopType,
      address: place?.displayName || '',
      lat: Number(point.lat),
      lng: Number(point.lng),
      countryCode: place?.countryCode || '',
      restMinutes: 30,
    };
    updateStops([...stops, stop]);
    // Lấy địa chỉ chạy nền (resolvePlace tự bắt lỗi), không chặn thao tác thêm mốc
    if (!place) void resolvePlace(stop.key, stop.lat, stop.lng);
  };

  // Chỉ số trên bản đồ tính cả điểm đón ở đầu: mốc giữa thứ i nằm ở vị trí i + 1
  const mapStops = useMemo(() => {
    const first = preview?.stops?.[0];
    const last = preview?.stops?.[preview.stops.length - 1];
    if (!first || !last) return [];
    return [first, ...stops.map((s) => ({ ...s, lat: s.lat, lng: s.lng })), last];
  }, [preview, stops]);

  const legs = useMemo(
    () => (preview?.stops || []).slice(1).map((s) => ({ distanceKm: Number(s.distanceKmFromPrevious || 0), durationHours: s.durationHoursFromPrevious })),
    [preview],
  );

  const moveStop = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= stops.length) return;
    const next = [...stops];
    [next[index], next[target]] = [next[target], next[index]];
    updateStops(next);
  };

  const patchStop = (key, patch, recompute) => updateStops(stops.map((s) => (s.key === key ? { ...s, ...patch } : s)), { recompute });

  const handleSearch = (value) => {
    setSearchText(value);
    clearTimeout(searchTimer.current);
    if (!value || value.trim().length < 2) {
      setSearchOptions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const places = unwrapList(await geoService.search(value.trim()));
        searchPlaces.current = places;
        setSearchOptions(places.map((p, i) => ({ value: String(i), label: p.displayName })));
      } catch {
        setSearchOptions([]);
      }
    }, 400);
  };

  const handleSelectPlace = (value) => {
    const place = searchPlaces.current[Number(value)];
    if (place) addStop({ lat: place.lat, lng: place.lng }, place);
    setSearchText('');
    setSearchOptions([]);
  };

  const warnings = preview?.warnings || [];
  const nameMissing = stops.some((s) => !s.name?.trim());
  const blocked = previewing || Boolean(previewError) || warnings.length > 0 || nameMissing;

  // Lưu: sửa bản Draft / Rejected (PUT), không thì tạo phiên bản mới (POST). Trả về tuyến đã lưu.
  const savePlan = async () => {
    const payload = toPayload(stops, notes);
    const saved = editingPlan
      ? await routePlanService.updateRoutePlan(editingPlan.routePlanId, payload)
      : await routePlanService.createRoutePlan(bookingId, payload);
    return unwrapData(saved);
  };

  const handleSave = async (submit) => {
    if (nameMissing) {
      message.warning(t('routePlan.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const saved = await savePlan();
      if (submit) {
        if (saved?.warnings?.length) {
          setPreview(saved);
          message.warning(t('routePlan.hasWarnings'));
          setLoading(true);
          await loadPlans();
          return;
        }
        await routePlanService.submitRoutePlan(saved.routePlanId);
        message.success(t('routePlan.submitted', { code: bookingCode }));
        onSuccess?.();
        onClose();
        return;
      }
      message.success(t('routePlan.saved'));
      setNewVersion(false);
      setLoading(true);
      await loadPlans();
      onSuccess?.();
    } catch (err) {
      message.error(getErrorMessage(err, t('routePlan.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  // Tên mốc theo đúng lần tính đã sinh ra cảnh báo (danh sách đang sửa có thể đã đổi)
  const stopName = (index) => preview?.stops?.[index]?.name || `#${index + 1}`;

  const columns = [
    { title: '#', width: 44, render: (_, __, i) => i + 2 },
    {
      title: t('routePlan.fields.type'),
      dataIndex: 'stopType',
      width: 130,
      render: (value, s) =>
        canEdit ? (
          <Select
            size="small"
            value={value}
            style={{ width: '100%' }}
            options={STOP_TYPES.map((v) => ({ value: v, label: t(`map.stopType.${v}`) }))}
            onChange={(v) => patchStop(s.key, { stopType: v }, true)}
          />
        ) : (
          <Tag color={value === 'BorderGate' ? 'purple' : 'gold'}>{t(`map.stopType.${value}`)}</Tag>
        ),
    },
    {
      title: t('routePlan.fields.name'),
      dataIndex: 'name',
      render: (value, s) =>
        canEdit ? (
          <Input size="small" value={value} maxLength={100} status={value?.trim() ? undefined : 'error'} onChange={(e) => patchStop(s.key, { name: e.target.value }, false)} />
        ) : (
          <Text strong>{value}</Text>
        ),
    },
    {
      title: t('routePlan.fields.address'),
      dataIndex: 'address',
      render: (value, s) => (
        <span style={{ fontSize: 12 }}>
          {s.countryCode && <Tag style={{ marginRight: 4 }}>{s.countryCode}</Tag>}
          {value || `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`}
        </span>
      ),
    },
    {
      title: t('routePlan.fields.rest'),
      dataIndex: 'restMinutes',
      width: 110,
      render: (value, s) =>
        canEdit ? (
          <InputNumber size="small" min={0} max={1440} value={value} style={{ width: '100%' }} onChange={(v) => patchStop(s.key, { restMinutes: v ?? 0 }, false)} />
        ) : (
          value
        ),
    },
    ...(canEdit
      ? [
          {
            title: '',
            width: 110,
            render: (_, __, i) => (
              <Space size={2}>
                <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={i === 0} onClick={() => moveStop(i, -1)} />
                <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={i === stops.length - 1} onClick={() => moveStop(i, 1)} />
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => updateStops(stops.filter((_, idx) => idx !== i))} />
              </Space>
            ),
          },
        ]
      : []),
  ];

  const versionColumns = [
    { title: t('routePlan.fields.version'), dataIndex: 'version', width: 80, render: (v) => `v${v}` },
    { title: t('routePlan.fields.status'), dataIndex: 'status', width: 120, render: (v) => <Tag color={PLAN_STATUS_COLORS[v]}>{t(`routePlan.status.${v}`, v)}</Tag> },
    { title: t('routePlan.fields.stops'), render: (_, p) => <span style={{ fontSize: 12 }}>{(p.stops || []).map((s) => s.name).join(' → ')}</span> },
    { title: t('routePlan.fields.km'), dataIndex: 'totalDistanceKm', width: 90, render: (v) => (v != null ? Number(v).toFixed(0) : '—') },
    { title: t('routePlan.fields.createdAt'), dataIndex: 'createdAt', width: 140, render: formatTime },
    { title: t('routePlan.fields.rejection'), dataIndex: 'rejectionReason', render: (v) => v || '—' },
  ];

  return (
    <Modal
      title={
        <Space>
          <CompassOutlined style={{ color: '#2563EB' }} />
          {t('routePlan.title', { code: bookingCode })}
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1100}
      style={{ top: 24, maxWidth: 'calc(100vw - 16px)' }}
      destroyOnHidden
      footer={
        canEdit ? (
          <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {warnings.length > 0 ? t('routePlan.submitBlocked') : t('routePlan.submitHint')}
            </Text>
            <Space wrap>
              <Button onClick={onClose}>{t('common.cancel')}</Button>
              <Button icon={<SaveOutlined />} loading={saving} disabled={previewing || nameMissing} onClick={() => handleSave(false)}>
                {t('routePlan.saveDraft')}
              </Button>
              <Button type="primary" icon={<SendOutlined />} loading={saving} disabled={blocked} onClick={() => handleSave(true)}>
                {t('routePlan.submit')}
              </Button>
            </Space>
          </Flex>
        ) : (
          <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
            <Text type="secondary">{t(`routePlan.readOnly.${latest?.status}`, '')}</Text>
            <Space>
              <Button onClick={onClose}>{t('common.close')}</Button>
              {latest?.status === 'Approved' && (
                <Button type="primary" onClick={() => setNewVersion(true)}>
                  {t('routePlan.newVersion')}
                </Button>
              )}
            </Space>
          </Flex>
        )
      }
    >
      <Spin spinning={loading}>
        <Flex vertical gap={12}>
          {latest?.status === 'Rejected' && (
            <Alert type="error" showIcon title={t('routePlan.rejected', { version: latest.version })} description={latest.rejectionReason} />
          )}
          {newVersion && <Alert type="info" showIcon title={t('routePlan.newVersionHint')} />}

          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('routePlan.origin')}</Text>
              <div style={{ fontWeight: 600 }}>{booking?.pickupAddress} <Tag>{booking?.pickupCountryCode}</Tag></div>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('routePlan.destination')}</Text>
              <div style={{ fontWeight: 600 }}>{booking?.dropoffAddress} <Tag>{booking?.dropoffCountryCode}</Tag></div>
            </Col>
          </Row>

          {canEdit && (
            <AutoComplete
              value={searchText}
              options={searchOptions}
              onSearch={handleSearch}
              onSelect={handleSelectPlace}
              style={{ width: '100%' }}
            >
              <Input.Search placeholder={t('routePlan.searchPlaceholder')} allowClear />
            </AutoComplete>
          )}

          {mapStops.length >= 2 ? (
            <RouteMap
              stops={mapStops}
              polyline={preview?.polyline}
              legs={legs}
              totalDistanceKm={preview?.totalDistanceKm}
              totalDurationHours={preview?.estimatedHours}
              isEstimate={preview?.isEstimate}
              editable={canEdit}
              showList={false}
              height={380}
              onAddStop={(point) => addStop(point)}
              onMoveStop={(index, point) => {
                const target = stops[index - 1];
                if (!target) return;
                const next = stops.map((s) => (s.key === target.key ? { ...s, lat: point.lat, lng: point.lng, address: '', countryCode: '' } : s));
                updateStops(next);
                void resolvePlace(target.key, point.lat, point.lng);
              }}
              onReorder={(next) => updateStops(next.slice(1, -1).map((s) => stops.find((x) => x.key === s.key) || s))}
              onRemoveStop={(index) => updateStops(stops.filter((_, i) => i !== index - 1))}
            />
          ) : (
            !loading && <Alert type="warning" showIcon title={previewError || t('routePlan.noCoordinates')} />
          )}

          <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
            <Space size={4} wrap>
              <Text type="secondary">{t('routePlan.transitCountries')}:</Text>
              {(preview?.transitCountryCodes || []).length
                ? preview.transitCountryCodes.map((c, i) => (
                    <span key={`${c}-${i}`}>
                      {i > 0 && <Text type="secondary"> → </Text>}
                      <Tag color="geekblue">{c}</Tag>
                    </span>
                  ))
                : <Text type="secondary">{t('routePlan.noTransit')}</Text>}
            </Space>
            {previewing && <Text type="secondary"><Spin size="small" /> {t('routePlan.recalculating')}</Text>}
          </Flex>

          {previewError && mapStops.length >= 2 && <Alert type="error" showIcon title={previewError} />}
          {warnings.map((w, i) => (
            <Alert
              key={`w-${i}`}
              type="warning"
              showIcon
              title={t('routePlan.warningLeg', { from: stopName(w.fromIndex), to: stopName(w.toIndex), countries: (w.countryCodes || []).join(', ') })}
              description={w.message}
            />
          ))}

          <Table
            size="small"
            rowKey="key"
            columns={columns}
            dataSource={stops}
            pagination={false}
            scroll={{ x: 720 }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('routePlan.noStops')} /> }}
          />

          <Input.TextArea
            rows={2}
            maxLength={1000}
            value={notes}
            disabled={!canEdit}
            placeholder={t('routePlan.notesPlaceholder')}
            onChange={(e) => setNotes(e.target.value)}
          />

          {plans.length > 0 && (
            <div>
              <Text strong>{t('routePlan.versions')}</Text>
              <Table
                style={{ marginTop: 8 }}
                size="small"
                rowKey="routePlanId"
                columns={versionColumns}
                dataSource={plans}
                pagination={false}
                scroll={{ x: 800 }}
              />
            </div>
          )}
        </Flex>
      </Spin>
    </Modal>
  );
}
