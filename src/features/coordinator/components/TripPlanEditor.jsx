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
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
  ReloadOutlined,
  CopyOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { formatDeliveryDeadline, formatPickupWindow } from '@utils/bookingSchedule';
import tripService from '@services/tripService';
import RouteMap from '@components/common/map/RouteMap';
import routePlanService from '@services/routePlanService';
import StatusTag from '@components/common/StatusTag';
import RouteSuggestionPanel from '@features/coordinator/components/RouteSuggestionPanel';
import StallMap from '@features/coordinator/components/StallMap';
import { unwrapData, unwrapList, getErrorMessage, toIsoString } from '@utils/apiHelpers';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const CHECKPOINT_TYPES = ['Origin', 'PickUp', 'RestStop', 'BorderGate', 'DropOff', 'Destination'];
// Mốc gắn với một đơn (R-04): đơn được đón / trả ở mốc này
const BOOKING_STOP_TYPES = ['PickUp', 'DropOff'];
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
 * Chuyển tuyến đã duyệt (routePlan của BE-04) sang dạng màn lập chuyến dùng để hiện / chép mốc (FE-07).
 * @param {Object} plan - routePlan: stops[] gồm name, stopType, address, countryCode, restMinutes
 * @returns {Object}
 */
function toApprovedRoute(plan) {
  return {
    bookingId: plan.bookingId,
    bookingCode: plan.bookingCode,
    totalDistanceKm: plan.totalDistanceKm,
    estimatedHours: plan.estimatedHours,
    transitCountryCodes: plan.transitCountryCodes || [],
    // Giữ mốc gốc + đường vẽ để xem lại bản đồ tuyến đã duyệt
    stops: plan.stops || [],
    polyline: plan.polyline,
    isEstimate: plan.isEstimate,
    checkpoints: (plan.stops || []).map((stop) => ({
      checkpointName: stop.name,
      checkpointType: stop.stopType,
      address: stop.address,
      countryCode: stop.countryCode,
      mandatoryRestMinutes: stop.restMinutes || 0,
    })),
  };
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
  // Escort phụ trách từng con (R-06): bookingHorseId -> userId; bỏ trống = backend tự phân theo ô chuồng
  const [escortOf, setEscortOf] = useState(() =>
    Object.fromEntries((trip?.horses || []).filter((h) => h.escortUserId).map((h) => [h.bookingHorseId, h.escortUserId])),
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
  const [suggestion, setSuggestion] = useState(null);
  const [suggesting, setSuggesting] = useState(false);

  // Các đơn có ngựa đang được chọn: dùng cho cột "Đơn" của mốc Điểm đón / Điểm trả
  const selectedBookings = useMemo(() => {
    const map = new Map();
    selectedHorses.forEach((h) => {
      if (!map.has(h.bookingId)) map.set(h.bookingId, { bookingId: h.bookingId, bookingCode: h.bookingCode });
    });
    return [...map.values()];
  }, [selectedHorses]);

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

  // Cảnh báo quy tắc tài xế (R-14): Chuyến có thời gian chạy dự kiến > 9 giờ bắt buộc ít nhất 2 tài xế
  const estimatedTripHours = periodValid ? period[1].diff(period[0], 'hour', true) : 0;
  const requiresTwoDrivers = estimatedTripHours > 9;
  const hasEnoughDrivers = driverCount >= 2;
  const isDriverWarning = requiresTwoDrivers && !hasEnoughDrivers;

  // Quản lý tuyến đã duyệt của các đơn đang được chọn (FE-07 / R-10)
  const [approvedRoutes, setApprovedRoutes] = useState({});
  const [loadingApprovedRoutes, setLoadingApprovedRoutes] = useState(false);
  const [selectedRouteBookingId, setSelectedRouteBookingId] = useState(null);
  const [routeBackendError, setRouteBackendError] = useState(null);

  useEffect(() => {
    let active = true;

    if (selectedBookings.length === 0) {
      return undefined;
    }

    const loadRoutes = async () => {
      setLoadingApprovedRoutes(true);
      try {
        const results = await Promise.all(
          selectedBookings.map(async (b) => {
            try {
              // Tuyến đã duyệt của đơn (BE-04): GET /bookings/{id}/route-plans, lấy bản Approved
              const res = await routePlanService.getForBooking(b.bookingId);
              const approved = unwrapList(res).find((p) => p.status === 'Approved');
              return { bookingId: b.bookingId, plan: approved ? toApprovedRoute(approved) : null };
            } catch {
              return { bookingId: b.bookingId, plan: null };
            }
          }),
        );
        if (!active) return;
        const map = {};
        results.forEach((r) => {
          if (r.plan) map[r.bookingId] = r.plan;
        });
        setApprovedRoutes(map);
        setSelectedRouteBookingId((prev) =>
          prev && map[prev] ? prev : selectedBookings[0]?.bookingId || null,
        );
      } finally {
        if (active) setLoadingApprovedRoutes(false);
      }
    };

    void loadRoutes();

    return () => {
      active = false;
    };
  }, [selectedBookings]);

  const currentApprovedRoutes = selectedBookings.length === 0 ? {} : approvedRoutes;
  const selectedRoutePlan =
    selectedBookings.length > 0 && selectedRouteBookingId
      ? currentApprovedRoutes[selectedRouteBookingId]
      : null;

  // Áp dụng tuyến đã duyệt vào danh sách mốc của chuyến (FE-07 / R-10)
  const applyApprovedRoute = (bookingId) => {
    const plan = approvedRoutes[bookingId];
    if (!plan || !plan.checkpoints || plan.checkpoints.length === 0) {
      message.warning('Không tìm thấy dữ liệu mốc của tuyến đã duyệt.');
      return;
    }

    const start = period?.[0] || dayjs();
    const end = period?.[1] || start.add(plan.estimatedHours || 14, 'hour');
    const totalMs = end.diff(start);
    const count = plan.checkpoints.length;

    const newCheckpoints = plan.checkpoints.map((cp, idx) => {
      const frac = count > 1 ? idx / (count - 1) : 0;
      const plannedTime = dayjs(start.valueOf() + totalMs * frac);

      let type = cp.checkpointType || 'RestStop';
      if (idx === 0) type = 'Origin';
      else if (idx === count - 1) type = 'Destination';

      return {
        key: `cp-app-${Date.now()}-${idx}`,
        checkpointName: cp.checkpointName || `Mốc ${idx + 1}`,
        checkpointType: type,
        address: cp.address || '',
        plannedTime,
        mandatoryRestMinutes: Number(cp.mandatoryRestMinutes) || 0,
        bookingId: BOOKING_STOP_TYPES.includes(type) ? bookingId : null,
      };
    });

    setCheckpoints(newCheckpoints);
    message.success(
      t('tripPlan.messages.routeCopied', {
        code: plan.bookingCode || `#${bookingId}`,
        defaultValue: `Đã sao chép các mốc từ tuyến đã duyệt của đơn ${plan.bookingCode || `#${bookingId}`} vào kế hoạch chuyến!`,
      }),
    );
  };

  // Escort của chuyến theo thứ tự backend dùng khi tự phân: trưởng nhóm trước, rồi theo thứ tự trong đoàn
  const tripEscorts = useMemo(() => {
    const rows = crew.filter((c) => c.crewRole === 'Escort' && c.userId);
    const ordered = [...rows.filter((c) => c.isLead), ...rows.filter((c) => !c.isLead)];
    const seen = new Set();
    return ordered
      .filter((c) => !seen.has(c.userId) && seen.add(c.userId))
      .map((c) => ({
        userId: c.userId,
        isLead: c.isLead,
        fullName: crewUserOptions.find((u) => u.userId === c.userId)?.fullName || `#${c.userId}`,
      }));
  }, [crew, crewUserOptions]);
  // Escort đã bị gỡ khỏi đoàn thì coi như chưa phân
  const escortIdOf = (bookingHorseId) => {
    const userId = escortOf[bookingHorseId];
    return tripEscorts.some((e) => e.userId === userId) ? userId : null;
  };

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

  // Sơ đồ chuồng: đổi chỗ hai ô (ô đích trống thì chỉ chuyển sang)
  const moveHorse = (fromSlot, toSlot) => {
    const current = Object.fromEntries(selectedIds.map((id) => [id, slotOf(id)]));
    const fromId = selectedIds.find((id) => current[id] === fromSlot);
    const toId = selectedIds.find((id) => current[id] === toSlot);
    if (!fromId) return;
    setSlots({ ...current, [fromId]: toSlot, ...(toId ? { [toId]: fromSlot } : {}) });
  };

  // Tự phân công giống backend: xếp theo ô chuồng, ô 1-3 cho escort đầu tiên, 4-6 cho escort thứ hai...
  const autoAssignEscorts = () => {
    const ordered = [...selectedIds].sort((a, b) => slotOf(a) - slotOf(b));
    setEscortOf(
      Object.fromEntries(ordered.map((id, idx) => [id, tripEscorts[Math.floor(idx / HORSES_PER_ESCORT)]?.userId ?? null])),
    );
  };

  const updateCrew = (key, patch) => setCrew((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const updateCheckpoint = (key, patch) =>
    setCheckpoints((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  // Đổi loại mốc: chỉ Điểm đón / Điểm trả mới gắn đơn
  const changeCheckpointType = (key, type) =>
    updateCheckpoint(key, BOOKING_STOP_TYPES.includes(type) ? { checkpointType: type } : { checkpointType: type, bookingId: null });

  // Gợi ý lộ trình từ backend: thay danh sách mốc, đặt giờ kết thúc theo giờ tới mốc cuối (giữ giờ khởi hành)
  const suggestRoute = async () => {
    if (selectedIds.length === 0 || !period?.[0]) {
      message.warning(t('tripPlan.messages.suggestNeedInput'));
      return;
    }
    setSuggesting(true);
    try {
      const result = unwrapData(
        await tripService.suggestRoute({
          bookingHorseIds: selectedIds,
          plannedStartDate: toIsoString(period[0]),
          driverCount: Math.max(1, driverCount),
        }),
      );
      setSuggestion(result);
      setCheckpoints(
        (result.checkpoints || []).map((c, idx) => ({
          key: `cp-s-${Date.now()}-${idx}`,
          checkpointName: c.checkpointName,
          checkpointType: c.checkpointType,
          address: c.address,
          plannedTime: dayjs(c.plannedTime),
          mandatoryRestMinutes: c.mandatoryRestMinutes,
          bookingId: c.bookingId,
        })),
      );
      if (result.suggestedEndDate) setPeriod([period[0], dayjs(result.suggestedEndDate)]);
      message.success(t('tripPlan.messages.suggested'));
    } catch (err) {
      message.error(getErrorMessage(err, t('tripPlan.messages.suggestFailed')));
    } finally {
      setSuggesting(false);
    }
  };

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
      escortUserId: escortIdOf(id),
      notes: pool.find((h) => h.bookingHorseId === id)?.notes || null,
    })),
    checkpoints: checkpoints.map((c) => ({
      checkpointName: c.checkpointName?.trim(),
      checkpointType: c.checkpointType,
      address: c.address?.trim(),
      plannedTime: toIsoString(c.plannedTime),
      mandatoryRestMinutes: Number(c.mandatoryRestMinutes) || 0,
      bookingId: BOOKING_STOP_TYPES.includes(c.checkpointType) ? c.bookingId || null : null,
    })),
  });

  const validate = (submit = false) => {
    if (selectedIds.length === 0) return t('tripPlan.messages.needHorse');
    if (!periodValid) return t('tripPlan.messages.needPeriod');
    if (!vehicleId) return t('tripPlan.messages.needVehicle');
    if (driverCount < 1) return t('tripPlan.messages.needDriver');
    if (submit && isDriverWarning) {
      return t('tripPlan.messages.needTwoDrivers', {
        hours: Math.round(estimatedTripHours * 10) / 10,
        defaultValue: `Thời gian lái dự kiến ${Math.round(estimatedTripHours * 10) / 10} giờ (vượt quá 9 giờ). Bắt buộc cần ít nhất 2 tài xế thay phiên để trình duyệt chuyến theo quy chuẩn an toàn R-14.`,
      });
    }
    if (checkpoints.some((c) => !c.checkpointName?.trim() || !c.address?.trim() || !c.plannedTime)) {
      return t('tripPlan.messages.incompleteCheckpoint');
    }
    if (checkpoints.some((c) => BOOKING_STOP_TYPES.includes(c.checkpointType) && !c.bookingId)) {
      return t('tripPlan.messages.needBookingForStop');
    }
    return null;
  };

  const save = async (submit) => {
    const problem = validate(submit);
    if (problem) {
      message.warning(problem);
      return;
    }
    setSaving(true);
    setRouteBackendError(null);
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
      const errorMsg = getErrorMessage(err, t('tripPlan.messages.saveFailed'));
      if (
        errorMsg.toLowerCase().includes('ngoài tuyến') ||
        errorMsg.toLowerCase().includes('nước ngoài tuyến') ||
        errorMsg.toLowerCase().includes('unapproved country') ||
        errorMsg.toLowerCase().includes('not approved') ||
        errorMsg.toLowerCase().includes('transit') ||
        errorMsg.toLowerCase().includes('lộ trình')
      ) {
        setRouteBackendError(errorMsg);
      }
      message.error(errorMsg);
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
                width: 80,
                render: (_, h) => (selectedIds.includes(h.bookingHorseId) ? slotOf(h.bookingHorseId) : null),
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
              {isDriverWarning && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginTop: 6, borderRadius: 8 }}
                  message={t('tripPlan.warnings.twoDriversRequiredTitle', {
                    defaultValue: 'Cảnh báo: Yêu cầu ít nhất 2 tài xế (R-14)',
                  })}
                  description={t('tripPlan.warnings.twoDriversRequiredDesc', {
                    hours: Math.round(estimatedTripHours * 10) / 10,
                    defaultValue: `Thời gian chạy dự kiến ${Math.round(estimatedTripHours * 10) / 10} giờ (vượt quá 9 giờ). Bắt buộc phải có ít nhất 2 tài xế thay phiên để trình duyệt chuyến.`,
                  })}
                />
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 4. Sơ đồ chuồng + escort phụ trách (R-06) */}
      <Card title={<Title level={5} style={{ margin: 0 }}>{t('tripPlan.sections.stallMap')}</Title>} style={{ borderRadius: 14 }}>
        <StallMap
          capacity={capacity}
          escorts={tripEscorts}
          horses={selectedHorses.map((h) => ({
            key: h.bookingHorseId,
            slot: slotOf(h.bookingHorseId),
            horseName: h.horseName,
            bookingCode: h.bookingCode,
            escortUserId: escortIdOf(h.bookingHorseId),
          }))}
          onMove={moveHorse}
          onAssign={(key, userId) => setEscortOf((prev) => ({ ...prev, [key]: userId }))}
          onAutoAssign={autoAssignEscorts}
        />
      </Card>

      {/* 5. Lộ trình */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>{t('tripPlan.sections.route')}</Title>}
        extra={
          <Space wrap>
            <Button size="small" type="primary" ghost icon={<NodeIndexOutlined />} loading={suggesting} onClick={suggestRoute}>
              {t('tripPlan.actions.suggestRoute')}
            </Button>
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
        {routeBackendError && (
          <Alert
            type="error"
            showIcon
            closable
            onClose={() => setRouteBackendError(null)}
            style={{ marginBottom: 12, borderRadius: 8 }}
            message={t('tripPlan.errors.unapprovedCountryTitle', {
              defaultValue: 'Lỗi lộ trình: Đi qua nước ngoài tuyến đã duyệt',
            })}
            description={routeBackendError}
          />
        )}

        {/* Tuyến đã duyệt của các đơn đang chọn (FE-07 / R-10) */}
        {selectedBookings.length > 0 && (
          <Card
            type="inner"
            size="small"
            title={
              <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <Space>
                  <CompassOutlined style={{ color: '#d97706' }} />
                  <Text strong>{t('tripPlan.approvedRoute.title', { defaultValue: 'Tuyến đường đã được phê duyệt của đơn' })}</Text>
                </Space>
                {selectedBookings.length > 1 && (
                  <Select
                    size="small"
                    value={selectedRouteBookingId}
                    onChange={setSelectedRouteBookingId}
                    style={{ minWidth: 160 }}
                    options={selectedBookings.map((b) => ({
                      value: b.bookingId,
                      label: `Đơn ${b.bookingCode}`,
                    }))}
                  />
                )}
              </Flex>
            }
            style={{ marginBottom: 16, backgroundColor: '#fdfcfb', borderColor: '#fed7aa', borderRadius: 10 }}
          >
            {loadingApprovedRoutes ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Spin size="small" /> <Text type="secondary"> {t('tripPlan.approvedRoute.loading', { defaultValue: 'Đang tải tuyến đã duyệt...' })}</Text>
              </div>
            ) : selectedRoutePlan ? (
              <div>
                <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginBottom: 12 }}>
                  <div>
                    <Text strong style={{ fontSize: 13, color: '#0f172a' }}>
                      {t('tripPlan.approvedRoute.planSummary', {
                        code: selectedRoutePlan.bookingCode,
                        km: selectedRoutePlan.totalDistanceKm || 0,
                        hours: selectedRoutePlan.estimatedHours || 0,
                        defaultValue: `Đơn ${selectedRoutePlan.bookingCode}: ${selectedRoutePlan.totalDistanceKm || 0} km · ~${selectedRoutePlan.estimatedHours || 0} giờ chạy`,
                      })}
                    </Text>
                    {selectedRoutePlan.transitCountryCodes?.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('tripPlan.approvedRoute.transitCountries', { defaultValue: 'Quá cảnh qua:' })}{' '}
                        </Text>
                        {selectedRoutePlan.transitCountryCodes.map((code) => (
                          <Tag key={code} color="blue" style={{ fontSize: 11 }}>
                            {code}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => applyApprovedRoute(selectedRoutePlan.bookingId)}
                    style={{ backgroundColor: '#d97706', borderColor: '#d97706', fontWeight: 600 }}
                  >
                    {t('tripPlan.approvedRoute.useThisRoute', { defaultValue: 'Dùng tuyến này' })}
                  </Button>
                </Flex>

                {/* Sơ đồ các mốc tuyến đã duyệt */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflowX: 'auto',
                    padding: '8px 6px',
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    border: '1px solid #f1f5f9',
                  }}
                >
                  {(selectedRoutePlan.checkpoints || []).map((cp, idx) => (
                    <Flex key={idx} align="center" gap={8} style={{ flexShrink: 0 }}>
                      <div
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          backgroundColor:
                            cp.checkpointType === 'PickUp'
                              ? '#ecfdf5'
                              : cp.checkpointType === 'DropOff'
                              ? '#eff6ff'
                              : cp.checkpointType === 'BorderGate'
                              ? '#fef2f2'
                              : '#f8fafc',
                          border: '1px solid #e2e8f0',
                          fontSize: 11.5,
                        }}
                      >
                        <Tag
                          color={
                            cp.checkpointType === 'PickUp'
                              ? 'green'
                              : cp.checkpointType === 'DropOff'
                              ? 'blue'
                              : cp.checkpointType === 'BorderGate'
                              ? 'red'
                              : 'default'
                          }
                          style={{ margin: 0, marginRight: 4, fontSize: 10 }}
                        >
                          {cp.checkpointType}
                        </Tag>
                        <strong>{cp.checkpointName}</strong>
                        {cp.countryCode && <span style={{ color: '#64748b', marginLeft: 4 }}>({cp.countryCode})</span>}
                      </div>
                      {idx < (selectedRoutePlan.checkpoints || []).length - 1 && (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>→</span>
                      )}
                    </Flex>
                  ))}
                </div>

                {selectedRoutePlan.stops.length >= 2 && (
                  <div style={{ marginTop: 12 }}>
                    <RouteMap
                      stops={selectedRoutePlan.stops}
                      polyline={selectedRoutePlan.polyline}
                      legs={selectedRoutePlan.stops.slice(1).map((st) => ({
                        distanceKm: Number(st.distanceKmFromPrevious || 0),
                        durationHours: st.durationHoursFromPrevious,
                      }))}
                      totalDistanceKm={selectedRoutePlan.totalDistanceKm}
                      totalDurationHours={selectedRoutePlan.estimatedHours}
                      isEstimate={selectedRoutePlan.isEstimate}
                      height={300}
                    />
                  </div>
                )}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('tripPlan.approvedRoute.empty', { defaultValue: 'Chưa có thông tin tuyến được duyệt cho đơn này.' })}
              </Text>
            )}
          </Card>
        )}

        {suggestion && (
          <div style={{ marginBottom: 12 }}>
            <RouteSuggestionPanel suggestion={suggestion} />
          </div>
        )}
        <Table
          size="small"
          rowKey="key"
          pagination={false}
          dataSource={checkpoints}
          scroll={{ x: 1000 }}
          columns={[
            { title: '#', width: 40, render: (_, __, idx) => idx + 1 },
            {
              title: t('tripPlan.fields.checkpointType'),
              width: 140,
              render: (_, c) => (
                <Select
                  size="small"
                  style={{ width: 130 }}
                  value={c.checkpointType}
                  onChange={(v) => changeCheckpointType(c.key, v)}
                  options={CHECKPOINT_TYPES.map((v) => ({ value: v, label: t(`tripPlan.checkpointType.${v}`) }))}
                />
              ),
            },
            {
              title: t('tripPlan.fields.stopBooking'),
              width: 150,
              render: (_, c) =>
                BOOKING_STOP_TYPES.includes(c.checkpointType) ? (
                  <Select
                    size="small"
                    style={{ width: 140 }}
                    status={c.bookingId ? undefined : 'warning'}
                    value={c.bookingId || undefined}
                    onChange={(v) => updateCheckpoint(c.key, { bookingId: v })}
                    options={selectedBookings.map((b) => ({ value: b.bookingId, label: b.bookingCode }))}
                  />
                ) : (
                  <Text type="secondary">—</Text>
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
