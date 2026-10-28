import { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  EnvironmentOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SendOutlined,
  CalendarOutlined,
  DollarOutlined,
  PlusOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import horseService from '@services/horseService';
import bookingService from '@services/bookingService';
import { geoService } from '@services/geoService';
import { fileService } from '@services/fileService';
import usePolicy from '@hooks/usePolicy';
import MapPicker from '@components/common/map/MapPicker';
import RouteMap from '@components/common/map/RouteMap';
import PolicyAgreement, { POLICY_PAGE_PATH } from '@components/common/PolicyAgreement';
import RecipientForm from '@components/common/RecipientForm';
import { isRecipientValid } from '@utils/recipient';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { formatDeliveryDeadline, formatPickupWindow, toLocalDateTimeString } from '@utils/bookingSchedule';
import { formatCountryRoute } from '@utils/bookingRoute';
import { checkHorseTransportEligibility } from '@utils/horseHealth';
import { ROUTES } from '@routes/routes';

const formatUsdPlain = (v) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 });

// Ô thông tin tuyến (thời gian lái / quãng đường) cạnh bản đồ ở bước 1
const ROUTE_STAT_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 8,
  background: '#fef3c7',
  color: '#78350f',
  fontSize: 13.5,
};

/** Số giờ một chữ số lẻ theo ngôn ngữ đang dùng (vi: 8,2 · en: 8.2) */
const formatHoursNumber = (value, lang) =>
  Number(value || 0).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 1 });

/**
 * Thời gian lái dạng "41 giờ 47 phút" từ số giờ backend trả về.
 * @param {number|null|undefined} hours
 * @param {(key: string, opts?: Object) => string} t
 * @returns {string}
 */
function formatDriveTime(hours, t) {
  const totalMinutes = Math.round((Number(hours) || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? t('bookingForm.driveTimeHours', { hours: h }) : t('bookingForm.driveTimeValue', { hours: h, minutes: m });
}
import {
  TRANSPORT_MODES,
  SUPPORTED_COUNTRIES,
  AIRPORTS_BY_COUNTRY,
  STALL_CLASSES,
  CITIES_BY_COUNTRY,
} from '@features/customer/constants/bookingOptions';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Component Wizard 4 bước đặt chuyến vận chuyển ngựa đua
 *
 * @param {Object} props
 * @param {(payload: Partial<import('@types/database').Booking>) => Promise<void> | void} props.onSubmit
 * @param {() => void} props.onCancel
 * @param {boolean} [props.loading]
 * @param {Object} [props.initialValues]
 * @returns {JSX.Element}
 */
export default function BookingWizard({
  onSubmit,
  onCancel,
  loading = false,
  initialValues = {},
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // Danh sách ngựa của khách hàng
  const [availableHorses, setAvailableHorses] = useState([]);
  const [loadingHorses, setLoadingHorses] = useState(true);

  // Xác định phương thức vận chuyển ban đầu (mặc định Ground nếu đi các nước láng giềng, ngược lại Air)
  const initialMode = (() => {
    const rawMode = (initialValues?.transportMode || initialValues?.modes || '').toLowerCase();
    if (rawMode.includes('ground') || rawMode.includes('road')) return 'Ground';
    if (rawMode.includes('air') || rawMode.includes('flight')) return 'Air';
    return 'Ground';
  })();

  const initialPickupCountry = initialValues?.pickupCountryCode || 'VN';
  const initialDropoffCountry =
    initialValues?.dropoffCountryCode ||
    (initialMode === 'Ground' ? 'CN' : 'JP');


  // State các ngựa được chọn và cấu hình chuồng
  const [selectedHorseIds, setSelectedHorseIds] = useState([]);
  const [stallClasses, setStallClasses] = useState({});
  const [horseNotes, setHorseNotes] = useState({});
  const [horseConditionErrors, setHorseConditionErrors] = useState({});
  // R-12 / R-13: giá trị khai báo, chứng từ, gói bảo hiểm của từng con
  const [horseValues, setHorseValues] = useState({});
  const [uploadingHorseId, setUploadingHorseId] = useState(null);
  // R-10: khách phải tích đồng ý Chính sách dịch vụ đúng phiên bản hiện hành
  const [policyAgreement, setPolicyAgreement] = useState({ accepted: false, policyVersion: null });
  // R-16 (BE-15): người nhận ngựa; mặc định khách tự nhận. TODO(FE-13): thay bằng RecipientForm dùng chung
  const [recipient, setRecipient] = useState({ isCustomer: true, name: '', phone: '', email: '', idNumber: '' });
  // Đang sửa BookingWizard vì tích hợp RecipientForm dùng chung theo FE-13 (R-16)
  const recipientValid = isRecipientValid(recipient);
  const { policy } = usePolicy();
  const proofThreshold = Number(policy?.insurance?.proofThresholdUsd ?? 50000);
  const usdVndRate = Number(policy?.payment?.usdVndRate ?? 0);

  // R-11: điểm đón / trả chọn trên bản đồ { address, lat, lng, countryCode }
  const toPlace = (address, lat, lng, countryCode) =>
    lat != null && lng != null ? { address: address || '', lat: Number(lat), lng: Number(lng), countryCode: countryCode || '' } : null;
  const [pickupPlace, setPickupPlace] = useState(() =>
    toPlace(initialValues?.pickupAddress, initialValues?.pickupLat, initialValues?.pickupLng, initialValues?.pickupCountryCode));
  const [dropoffPlace, setDropoffPlace] = useState(() =>
    toPlace(initialValues?.dropoffAddress, initialValues?.dropoffLat, initialValues?.dropoffLng, initialValues?.dropoffCountryCode));
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  // R-12: tuổi tối thiểu lấy từ chính sách (GET /api/policy)
  const minAgeMonths = Number(policy?.horse?.minAgeMonths ?? 6);

  const {
    control,
    getValues,
    setValue,
  } = useForm({
    defaultValues: {
      TransportMode: initialMode,
      PickupCountryCode: initialPickupCountry,
      PickupCity: initialValues?.pickupCity || 'TP. Hồ Chí Minh',
      PickupAddress: initialValues?.pickupAddress || '',
      DropoffCountryCode: initialDropoffCountry,
      DropoffCity:
        initialValues?.dropoffCity ||
        (initialDropoffCountry === 'KH'
          ? 'Phnom Penh'
          : initialDropoffCountry === 'TH'
          ? 'Bangkok'
          : initialDropoffCountry === 'LA'
          ? 'Vientiane'
          : 'Nam Ninh'),
      DropoffAddress:
        initialValues?.dropoffAddress ||
        (initialDropoffCountry === 'KH'
          ? 'Trường đua Chroy Changvar'
          : 'Trang trại ngựa đích'),
      PickupAirportCode: initialValues?.pickupAirportCode || AIRPORTS_BY_COUNTRY[initialPickupCountry]?.[0]?.code || 'HAN',
      DropoffAirportCode: initialValues?.dropoffAirportCode || AIRPORTS_BY_COUNTRY[initialDropoffCountry]?.[0]?.code || 'NRT',
      // Chưa chọn đủ điểm đón / giao thì chưa có quãng đường (không gán số mặc định)
      DistanceKm: initialValues?.distanceKm || null,
      // Khoảng ngày sẵn sàng đón [đầu, cuối] và hạn giao; điền mặc định khi đã biết ngày sớm nhất từ backend
      PickupWindow: null,
      DeliveryDeadline: null,
      RequiresClimateControl: initialValues?.requiresClimateControl ?? true,
      SpecialInstructions: initialValues?.specialInstructions || '',
    },
    mode: 'onTouched',
  });

  const transportMode = useWatch({ control, name: 'TransportMode' });
  const pickupCountry = useWatch({ control, name: 'PickupCountryCode' });
  const dropoffCountry = useWatch({ control, name: 'DropoffCountryCode' });
  const pickupAirportCode = useWatch({ control, name: 'PickupAirportCode' });
  const dropoffAirportCode = useWatch({ control, name: 'DropoffAirportCode' });
  const pickupWindow = useWatch({ control, name: 'PickupWindow' });
  const deliveryDeadline = useWatch({ control, name: 'DeliveryDeadline' });
  const pickupWindowStart = pickupWindow?.[0] || null;
  const pickupWindowEnd = pickupWindow?.[1] || null;
  const distanceKm = useWatch({ control, name: 'DistanceKm' });
  const requiresClimateControl = useWatch({ control, name: 'RequiresClimateControl' });

  // Tọa độ gửi kèm xem giá / tạo đơn (chỉ đường bộ): đủ 4 số thì backend lấy quãng đường + nước đi qua từ bản đồ
  const coordinates = useMemo(
    () =>
      transportMode === 'Ground' && pickupPlace && dropoffPlace
        ? { pickupLat: pickupPlace.lat, pickupLng: pickupPlace.lng, dropoffLat: dropoffPlace.lat, dropoffLng: dropoffPlace.lng }
        : {},
    [transportMode, pickupPlace, dropoffPlace],
  );

  // Giá trị của đơn = tổng giá trị khai báo khi khai đủ mọi con (backend tính giống vậy khi tạo đơn)
  const orderDeclaredValue = useMemo(() => {
    if (selectedHorseIds.length === 0) return null;
    const values = selectedHorseIds.map((id) => Number(horseValues[id]?.declaredValue) || 0);
    return values.every((v) => v > 0) ? values.reduce((a, b) => a + b, 0) : null;
  }, [selectedHorseIds, horseValues]);

  const updateHorseValue = (horseId, patch) =>
    setHorseValues((prev) => ({ ...prev, [horseId]: { insurancePlan: 'None', ...prev[horseId], ...patch } }));

  // Chọn điểm trên bản đồ: điền địa chỉ + nước theo điểm đã chọn
  const handlePickupPick = (place) => {
    setPickupPlace(place);
    setValue('PickupAddress', place.address);
    if (place.countryCode && SUPPORTED_COUNTRIES.some((c) => c.code === place.countryCode)) {
      setValue('PickupCountryCode', place.countryCode);
    }
  };
  const handleDropoffPick = (place) => {
    setDropoffPlace(place);
    setValue('DropoffAddress', place.address);
    if (place.countryCode && SUPPORTED_COUNTRIES.some((c) => c.code === place.countryCode)) {
      setValue('DropoffCountryCode', place.countryCode);
    }
  };

  // Kiểm tra quốc gia đến có hỗ trợ đường bộ không
  const dropoffCountryObj = SUPPORTED_COUNTRIES.find((c) => c.code === dropoffCountry);
  const isGroundAvailable = Boolean(dropoffCountryObj?.ground);

  // Tự động chuyển mode nếu chọn quốc gia không hỗ trợ đường bộ
  useEffect(() => {
    if (!isGroundAvailable && transportMode === 'Ground') {
      setValue('TransportMode', 'Air');
      message.info(`Tuyến đến ${dropoffCountryObj?.name || dropoffCountry} chỉ hỗ trợ vận chuyển hàng không.`);
    }
  }, [dropoffCountry, isGroundAvailable, transportMode, dropoffCountryObj, setValue]);

  // Cập nhật thành phố mặc định khi đổi quốc gia đích đường bộ
  useEffect(() => {
    if (transportMode === 'Ground' && dropoffCountry) {
      const cities = CITIES_BY_COUNTRY[dropoffCountry] || [];
      if (cities.length > 0) {
        const curCity = getValues('DropoffCity');
        if (!curCity || !cities.includes(curCity)) {
          setValue('DropoffCity', cities[0]);
        }
      }
    }
  }, [dropoffCountry, transportMode, setValue, getValues]);

  // Quãng đường đường bộ A -> B từ bản đồ (BE-01) mỗi khi đổi điểm đón / trả
  useEffect(() => {
    if (transportMode !== 'Ground' || !pickupPlace || !dropoffPlace) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setRouteLoading(true);
      try {
        const res = await geoService.route([
          { lat: pickupPlace.lat, lng: pickupPlace.lng, countryCode: pickupPlace.countryCode || undefined },
          { lat: dropoffPlace.lat, lng: dropoffPlace.lng, countryCode: dropoffPlace.countryCode || undefined },
        ]);
        const data = unwrapData(res);
        if (!cancelled && data) {
          setRoute(data);
          setValue('DistanceKm', Math.ceil(Number(data.totalDistanceKm) || 0));
        }
      } catch {
        if (!cancelled) setRoute(null);
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [transportMode, pickupPlace, dropoffPlace, setValue]);

  // Cập nhật địa chỉ mẫu khi chuyển đổi giữa Hàng không và Đường bộ
  useEffect(() => {
    if (transportMode === 'Air') {
      const pAirports = AIRPORTS_BY_COUNTRY[pickupCountry] || [];
      const chosenP = pAirports.find((a) => a.code === pickupAirportCode) || pAirports[0];
      const dAirports = AIRPORTS_BY_COUNTRY[dropoffCountry] || [];
      const chosenD = dAirports.find((a) => a.code === dropoffAirportCode) || dAirports[0];

      if (chosenP) {
        setValue('PickupAddress', chosenP.name);
      }
      if (chosenD) {
        setValue('DropoffAddress', chosenD.name);
      }
    } else {
      setValue('PickupAddress', pickupPlace?.address || '');
      setValue('DropoffAddress', dropoffPlace?.address || '');
    }
  }, [transportMode, pickupCountry, dropoffCountry, pickupAirportCode, dropoffAirportCode, setValue, pickupPlace, dropoffPlace]);

  // Tải danh sách ngựa của khách hàng
  useEffect(() => {
    let isSubscribed = true;

    const loadHorsesData = async () => {
      setLoadingHorses(true);
      try {
        const res = await horseService.getHorses({ size: 100 });
        const horsesList = unwrapList(res).filter((h) => h.isActive !== false);

        if (!isSubscribed) return;
        setAvailableHorses(horsesList);

        const specificHorseId = initialValues?.horseId || initialValues?.horseIds?.[0];
        // Gửi lại yêu cầu từ đơn có báo giá hết hạn (FE-05): chọn sẵn mọi ngựa còn hoạt động + hạng chuồng cũ
        const prefillHorses = (initialValues?.horses || []).filter((ph) =>
          horsesList.some((h) => String(h.horseId || h.HorseID) === String(ph.horseId)));
        if (prefillHorses.length > 0) {
          setSelectedHorseIds(prefillHorses.map((ph) => ph.horseId));
          setStallClasses(Object.fromEntries(prefillHorses.map((ph) => [ph.horseId, ph.stallClass || 'Comfort'])));
        } else if (specificHorseId && horsesList.some((h) => String(h.horseId || h.HorseID) === String(specificHorseId))) {
          setSelectedHorseIds([specificHorseId]);
          setStallClasses({ [specificHorseId]: 'Comfort' });
        }
      } catch (err) {
        if (isSubscribed) {
          message.error(getErrorMessage(err, 'Không thể tải danh sách hồ sơ ngựa'));
        }
      } finally {
        if (isSubscribed) {
          setLoadingHorses(false);
        }
      }
    };

    void loadHorsesData();

    return () => {
      isSubscribed = false;
    };
  }, [initialValues]);

  // Toggle chọn cá thể ngựa
  const handleToggleHorse = (horseId) => {
    const targetHorse = availableHorses.find(
      (h) => String(h.horseId || h.HorseID) === String(horseId),
    );
    if (!targetHorse) return;

    const targetPickupDate = pickupWindowEnd || pickupWindowStart || null;
    const eligibility = checkHorseTransportEligibility(targetHorse, i18n?.language || 'vi', {
      pickupDate: targetPickupDate,
      minAgeMonths,
    });

    if (!eligibility.eligible) {
      message.error(eligibility.message);
      setHorseConditionErrors((prev) => ({
        ...prev,
        [horseId]: eligibility.message,
      }));
      return;
    }

    setSelectedHorseIds((prev) => {
      const exists = prev.some((id) => String(id) === String(horseId));
      if (exists) {
        return prev.filter((id) => String(id) !== String(horseId));
      }
      setStallClasses((s) => ({ ...s, [horseId]: s[horseId] || 'Comfort' }));
      return [...prev, horseId];
    });

    // Làm sạch lỗi nếu ngựa đủ điều kiện
    setHorseConditionErrors((prev) => {
      const copy = { ...prev };
      delete copy[horseId];
      delete copy[String(horseId)];
      return copy;
    });
  };

  // Lịch sớm nhất của tuyến (ngày đón sớm nhất, mốc Express, thời gian vận chuyển) lấy từ API xem giá.
  // Lịch không phụ thuộc số ngựa nên gửi tạm một con hạng Shared, chưa gửi ngày.
  const [schedule, setSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  useEffect(() => {
    // Bước 1 (đã có quãng đường) và bước 2 (chọn ngày) cùng dùng ước tính này
    if (currentStep > 1 || !dropoffCountry) return undefined;
    if (transportMode === 'Ground' && !(Number(distanceKm) > 0)) return undefined;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const res = await bookingService.previewQuote({
          transportMode,
          pickupCountryCode: pickupCountry,
          dropoffCountryCode: dropoffCountry,
          distanceKm: transportMode === 'Ground' ? Number(distanceKm) : null,
          ...coordinates,
          horses: [{ stallClass: 'Shared' }],
        });
        if (!cancelled) setSchedule(unwrapData(res));
      } catch (err) {
        if (!cancelled) {
          setSchedule(null);
          setScheduleError(getErrorMessage(err, ''));
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentStep, transportMode, pickupCountry, dropoffCountry, distanceKm, coordinates]);

  const earliestPickup = schedule?.earliestPickupDate ? dayjs(schedule.earliestPickupDate) : null;
  const maxTransitHours = Number(schedule?.transit?.maxHours || 0);
  // Hạn giao sớm nhất = hết ngày cuối của khoảng đón (đón muộn nhất) + thời gian vận chuyển chậm nhất (khớp backend)
  const latestPickup = pickupWindowEnd || pickupWindowStart;
  const earliestDeadline = latestPickup
    ? dayjs(latestPickup).add(1, 'day').startOf('day').add(maxTransitHours, 'hour')
    : null;

  // Đổi khoảng đón làm hạn giao đang chọn không còn đủ thời gian: tự lùi hạn giao về ngày sớm nhất hợp lệ
  useEffect(() => {
    if (!earliestDeadline) return;
    const current = getValues('DeliveryDeadline');
    if (current && dayjs(current).isBefore(earliestDeadline)) {
      setValue('DeliveryDeadline', toLocalDateTimeString(earliestDeadline.endOf('day')));
    }
  }, [earliestDeadline?.valueOf(), getValues, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Có lịch rồi mà khách chưa chọn ngày: dùng ngày khách chọn nhanh ở trang chủ nếu hợp lệ,
  // nếu không thì gợi ý khoảng đón ngay sau mốc Express (không bị phụ phí gấp)
  const preferredPickup = initialValues?.pickupWindowStart;
  useEffect(() => {
    if (!schedule || getValues('PickupWindow')) return;
    const preferred = preferredPickup ? dayjs(preferredPickup).startOf('day') : null;
    const start =
      preferred && !preferred.isBefore(dayjs(schedule.earliestPickupDate), 'day')
        ? preferred
        : dayjs(schedule.expressUntilDate).startOf('day');
    setValue('PickupWindow', [toLocalDateTimeString(start), toLocalDateTimeString(start.add(3, 'day'))]);
    setValue(
      'DeliveryDeadline',
      toLocalDateTimeString(start.add(Number(schedule.transit?.maxHours || 0), 'hour').add(3, 'day').endOf('day')),
    );
  }, [schedule, preferredPickup, getValues, setValue]);

  // Kiểm tra lịch khách chọn; trả về thông báo lỗi hoặc null
  const validateSchedule = () => {
    const [start, end] = getValues('PickupWindow') || [];
    const deadline = getValues('DeliveryDeadline');
    if (!start || !end) return t('bookings.schedule.pickupRequired');
    if (!deadline) return t('bookings.schedule.deadlineRequired');
    if (earliestPickup && dayjs(start).isBefore(earliestPickup, 'day')) {
      return t('bookings.schedule.tooEarly', { date: earliestPickup.format('DD/MM/YYYY') });
    }
    const minDeadline = dayjs(end).add(1, 'day').startOf('day').add(maxTransitHours, 'hour');
    if (dayjs(deadline).isBefore(minDeadline)) {
      return t('bookings.schedule.deadlineTooEarly', { date: minDeadline.format('DD/MM/YYYY HH:mm') });
    }
    return null;
  };

  // Quy tắc giá trị từng con (khớp backend BE-09): khai cho một con thì phải khai mọi con; từ ngưỡng phải có chứng từ;
  // gói Toàn giá trị cần có giá trị để tính phí và bồi thường
  const horseName = (id) => {
    const h = availableHorses.find((x) => String(x.horseId || x.HorseID) === String(id));
    return h?.name || h?.Name || `#${id}`;
  };
  const validateHorseValues = () => {
    const declared = selectedHorseIds.filter((id) => Number(horseValues[id]?.declaredValue) > 0);
    if (declared.length > 0 && declared.length < selectedHorseIds.length) {
      const missing = selectedHorseIds.filter((id) => !declared.includes(id)).map(horseName).join(', ');
      return t('bookingForm.values.allOrNone', { names: missing });
    }
    for (const id of selectedHorseIds) {
      const v = horseValues[id] || {};
      if (v.insurancePlan === 'Full' && !(Number(v.declaredValue) > 0)) {
        return t('bookingForm.values.fullNeedsValue', { name: horseName(id) });
      }
      if (Number(v.declaredValue) >= proofThreshold && !v.valueProofPath) {
        return t('bookingForm.values.proofRequired', { name: horseName(id), threshold: formatUsdPlain(proofThreshold) });
      }
    }
    return null;
  };

  // Tải chứng từ giá trị (hóa đơn, giấy định giá, kết quả đấu giá) lên storage, giữ path để gửi kèm đơn
  const uploadProof = async (horseId, file) => {
    setUploadingHorseId(horseId);
    try {
      const res = await fileService.upload(file, 'documents');
      const data = unwrapData(res);
      updateHorseValue(horseId, { valueProofPath: data?.path, valueProofName: data?.fileName || file.name });
    } catch (err) {
      message.error(getErrorMessage(err, t('bookingForm.values.uploadFailed')));
    } finally {
      setUploadingHorseId(null);
    }
  };

  // State báo giá tính từ backend
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const quoteRequest = useMemo(() => {
    if (selectedHorseIds.length === 0 || !pickupWindowStart || !deliveryDeadline || !dropoffCountry) return null;
    if (transportMode === 'Ground' && !(Number(distanceKm) > 0)) return null;

    return {
      transportMode,
      pickupCountryCode: pickupCountry,
      dropoffCountryCode: dropoffCountry,
      distanceKm: transportMode === 'Ground' ? Number(distanceKm) : null,
      requiresClimateControl: Boolean(requiresClimateControl),
      declaredValue: orderDeclaredValue,
      pickupWindowStart: toLocalDateTimeString(pickupWindowStart),
      pickupWindowEnd: toLocalDateTimeString(pickupWindowEnd),
      deliveryDeadline: toLocalDateTimeString(deliveryDeadline),
      ...coordinates,
      horses: selectedHorseIds.map((hId) => ({ stallClass: stallClasses[hId] || 'Comfort' })),
    };
  }, [
    selectedHorseIds,
    stallClasses,
    transportMode,
    pickupCountry,
    dropoffCountry,
    distanceKm,
    requiresClimateControl,
    orderDeclaredValue,
    pickupWindowStart,
    pickupWindowEnd,
    deliveryDeadline,
    coordinates,
  ]);

  // Gọi API tính báo giá ở bước Review
  useEffect(() => {
    if (currentStep !== 3 || !quoteRequest) return undefined;
    let cancelled = false;

    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const res = await bookingService.previewQuote(quoteRequest);
        if (!cancelled) setQuote(unwrapData(res));
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(getErrorMessage(err, 'Không tính được báo giá cho tuyến đường này'));
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentStep, quoteRequest]);

  const quoteItems = (quote?.lines || []).map((line, idx) => ({ key: `${line.code}-${idx}`, ...line }));
  const currencyCode = quote?.currencyCode || 'USD';
  // R-10: khoảng giá ước tính (giá chốt gửi sau khi công ty lập tuyến)
  const quoteMin = Number(quote?.quoteMin ?? quote?.total ?? 0);
  const quoteMax = Number(quote?.quoteMax ?? quote?.total ?? 0);
  const formatUsd = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const formatVnd = (v) => Math.round(v * usdVndRate).toLocaleString('vi-VN');

  // Kiểm tra điều kiện khi nhảy bước
  const handleStepClick = async (targetStep) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }

    if (currentStep === 0 || targetStep >= 1) {
      if (getValues('PickupCountryCode') === getValues('DropoffCountryCode')) {
        message.error('Quốc gia xuất phát và quốc gia đích không được trùng nhau.');
        return;
      }
      if (transportMode === 'Ground' && (!pickupPlace || !dropoffPlace)) {
        message.warning(t('bookingForm.pickBothPoints'));
        return;
      }
    }

    if (targetStep >= 2) {
      const scheduleProblem = validateSchedule();
      if (scheduleProblem) {
        message.warning(scheduleProblem);
        return;
      }
    }

    if (targetStep >= 3) {
      if (selectedHorseIds.length === 0) {
        message.warning('Vui lòng chọn ít nhất 1 cá thể ngựa đủ điều kiện.');
        return;
      }
      const targetPickupDate = pickupWindowEnd || pickupWindowStart || null;
      const conditionErrors = {};
      let hasError = false;

      for (const hId of selectedHorseIds) {
        const targetHorse = availableHorses.find(
          (h) => String(h.horseId || h.HorseID) === String(hId),
        );
        if (targetHorse) {
          const eligibility = checkHorseTransportEligibility(targetHorse, i18n?.language || 'vi', {
            pickupDate: targetPickupDate,
            minAgeMonths,
          });
          if (!eligibility.eligible) {
            conditionErrors[hId] = eligibility.message;
            hasError = true;
          }
        }
      }

      if (hasError) {
        setHorseConditionErrors((prev) => ({ ...prev, ...conditionErrors }));
        message.error('Có cá thể ngựa chưa đạt điều kiện vận chuyển theo chính sách. Vui lòng kiểm tra lại!');
        return;
      }
      const valueProblem = validateHorseValues();
      if (valueProblem) {
        message.warning(valueProblem);
        return;
      }
    }

    setCurrentStep(targetStep);
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      if (getValues('PickupCountryCode') === getValues('DropoffCountryCode')) {
        message.error('Quốc gia xuất phát và quốc gia đích không được trùng nhau.');
        return;
      }
      if (transportMode === 'Ground' && (!pickupPlace || !dropoffPlace)) {
        message.warning(t('bookingForm.pickBothPoints'));
        return;
      }
    }

    if (currentStep === 1) {
      const scheduleProblem = validateSchedule();
      if (scheduleProblem) {
        message.warning(scheduleProblem);
        return;
      }
    }

    if (currentStep === 2) {
      if (selectedHorseIds.length === 0) {
        message.warning('Vui lòng chọn ít nhất 1 cá thể ngựa để tiếp tục.');
        return;
      }
      const targetPickupDate = pickupWindowEnd || pickupWindowStart || null;
      const conditionErrors = {};
      let hasError = false;

      for (const hId of selectedHorseIds) {
        const targetHorse = availableHorses.find(
          (h) => String(h.horseId || h.HorseID) === String(hId),
        );
        if (targetHorse) {
          const eligibility = checkHorseTransportEligibility(targetHorse, i18n?.language || 'vi', {
            pickupDate: targetPickupDate,
            minAgeMonths,
          });
          if (!eligibility.eligible) {
            conditionErrors[hId] = eligibility.message;
            hasError = true;
          }
        }
      }

      if (hasError) {
        setHorseConditionErrors((prev) => ({ ...prev, ...conditionErrors }));
        message.error('Có cá thể ngựa chưa đạt điều kiện vận chuyển theo chính sách. Vui lòng kiểm tra lại!');
        return;
      }
      const valueProblem = validateHorseValues();
      if (valueProblem) {
        message.warning(valueProblem);
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Submit toàn bộ yêu cầu đặt chuyến
  const handleFinalSubmit = async () => {
    const values = getValues();
    const mode = values.TransportMode;
    const pCode = values.PickupCountryCode;
    const dCode = values.DropoffCountryCode;

    let finalPickup = values.PickupAddress?.trim();
    let finalDropoff = values.DropoffAddress?.trim();

    if (mode === 'Air') {
      const pAirports = AIRPORTS_BY_COUNTRY[pCode] || [];
      const chosenP = pAirports.find((a) => a.code === values.PickupAirportCode) || pAirports[0];
      finalPickup = chosenP?.name || finalPickup || `${pCode} International Terminal`;

      const dAirports = AIRPORTS_BY_COUNTRY[dCode] || [];
      const chosenD = dAirports.find((a) => a.code === values.DropoffAirportCode) || dAirports[0];
      finalDropoff = chosenD?.name || finalDropoff || `${dCode} International Terminal`;
    }

    const instructions = (values.SpecialInstructions || '').trim().slice(0, 2000);

    const payload = {
      pickupAddress: finalPickup,
      pickupCity: null,
      pickupCountryCode: pCode,
      dropoffAddress: finalDropoff,
      dropoffCity: null,
      dropoffCountryCode: dCode,
      pickupWindowStart: toLocalDateTimeString(values.PickupWindow?.[0]),
      pickupWindowEnd: toLocalDateTimeString(values.PickupWindow?.[1]),
      deliveryDeadline: toLocalDateTimeString(values.DeliveryDeadline),
      transportMode: mode,
      // Không có quãng đường từ bản đồ thì để backend tự tính
      distanceKm: mode === 'Ground' && Number(values.DistanceKm) > 0 ? Number(values.DistanceKm) : null,
      requiresClimateControl: Boolean(values.RequiresClimateControl),
      specialInstructions: instructions || null,
      ...coordinates,
      // R-10: đồng ý Chính sách dịch vụ đúng phiên bản đang hiển thị
      recipientIsCustomer: recipient.isCustomer,
      recipientName: recipient.isCustomer ? null : recipient.name.trim(),
      recipientPhone: recipient.isCustomer ? null : recipient.phone.trim(),
      recipientEmail: recipient.isCustomer ? null : recipient.email.trim() || null,
      recipientIdNumber: recipient.idNumber.trim() || null,
      acceptPolicy: policyAgreement.accepted,
      policyVersion: policyAgreement.policyVersion,
      horses: selectedHorseIds.map((hId) => {
        const v = horseValues[hId] || {};
        return {
          horseId: Number(hId),
          stallClass: stallClasses[hId] || 'Comfort',
          notes: horseNotes[hId]?.trim().slice(0, 300) || null,
          declaredValue: Number(v.declaredValue) > 0 ? Number(v.declaredValue) : null,
          valueProofPath: v.valueProofPath || null,
          insurancePlan: v.insurancePlan || 'None',
        };
      }),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      const errorMsg = getErrorMessage(err, '');
      const responseData = err?.response?.data;
      const validationErrors = responseData?.errors;
      const horseErrorsFound = {};

      if (validationErrors && typeof validationErrors === 'object') {
        Object.keys(validationErrors).forEach((key) => {
          const lowerKey = key.toLowerCase();
          if (
            lowerKey.includes('horse') ||
            lowerKey.includes('age') ||
            lowerKey.includes('pregnant') ||
            lowerKey.includes('foal')
          ) {
            const val = Array.isArray(validationErrors[key])
              ? validationErrors[key].join('; ')
              : String(validationErrors[key]);
            selectedHorseIds.forEach((hId) => {
              horseErrorsFound[hId] = val;
            });
          }
        });
      } else if (
        errorMsg &&
        (errorMsg.toLowerCase().includes('ngựa') ||
          errorMsg.toLowerCase().includes('horse') ||
          errorMsg.toLowerCase().includes('mang thai') ||
          errorMsg.toLowerCase().includes('tuổi') ||
          errorMsg.toLowerCase().includes('pregnant') ||
          errorMsg.toLowerCase().includes('foal') ||
          errorMsg.toLowerCase().includes('age') ||
          errorMsg.toLowerCase().includes('fit-to-travel'))
      ) {
        selectedHorseIds.forEach((hId) => {
          horseErrorsFound[hId] = errorMsg;
        });
      }

      if (Object.keys(horseErrorsFound).length > 0) {
        setHorseConditionErrors((prev) => ({ ...prev, ...horseErrorsFound }));
        setCurrentStep(2);
      }
      throw err;
    }
  };

  const stepItems = [
    { title: 'Lộ trình & Phương thức', icon: <EnvironmentOutlined /> },
    { title: 'Lịch trình & Dịch vụ', icon: <CalendarOutlined /> },
    { title: 'Ngựa & Hạng chuồng', icon: <CheckOutlined /> },
    { title: 'Xem lại & Báo giá', icon: <DollarOutlined /> },
  ];

  return (
    <Card
      bordered
      style={{
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        borderColor: '#e2e8f0',
      }}
      styles={{ body: { padding: '24px 28px' } }}
    >
      {/* Header Wizard */}
      <div style={{ marginBottom: 20 }}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
              Đặt chuyến vận chuyển ngựa
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {currentStep === 0 && 'Lựa chọn phương thức vận chuyển và địa điểm giao nhận'}
              {currentStep === 1 && 'Thiết lập thời gian khởi hành và dịch vụ chăm sóc'}
              {currentStep === 2 && 'Chọn danh sách ngựa vận chuyển và đăng ký hạng chuồng'}
              {currentStep === 3 && 'Kiểm tra bảng báo giá ước tính và xác nhận gửi đơn'}
            </Text>
          </div>
          <Tag color="gold" style={{ fontWeight: 600, borderRadius: 20, padding: '2px 12px' }}>
            Bước {currentStep + 1} / 4
          </Tag>
        </Flex>
      </div>

      {/* Stepper Navigation */}
      <Steps
        current={currentStep}
        onChange={handleStepClick}
        items={stepItems.map((item) => ({
          ...item,
          style: { cursor: 'pointer' },
        }))}
        style={{ marginBottom: 28 }}
      />

      {/* ======================================================== */}
      {/* BƯỚC 1: LỘ TRÌNH & PHƯƠNG THỨC VẬN CHUYỂN */}
      {/* ======================================================== */}
      {currentStep === 0 && (
        <div>
          {/* PHẦN 1: CHỌN PHƯƠNG THỨC VẬN CHUYỂN */}
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 10 }}>
              1. Chọn phương thức vận chuyển
            </Text>
            <Row gutter={[16, 16]}>
              {TRANSPORT_MODES.map((mode) => {
                const isSelected = transportMode === mode.value;
                const isModeDisabled = mode.value === 'Ground' && !isGroundAvailable;

                return (
                  <Col xs={24} md={12} key={mode.value}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (isModeDisabled) return;
                        setValue('TransportMode', mode.value);
                      }}
                      onKeyDown={(e) => {
                        if (isModeDisabled) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          setValue('TransportMode', mode.value);
                        }
                      }}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 12,
                        border: isSelected ? '2px solid #d97706' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#fffdf7' : '#ffffff',
                        cursor: isModeDisabled ? 'not-allowed' : 'pointer',
                        opacity: isModeDisabled ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(217, 119, 6, 0.08)' : 'none',
                        height: '100%',
                      }}
                    >
                      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                        <Flex align="center" gap={8}>
                          {mode.value === 'Ground' ? (
                            <CarOutlined style={{ fontSize: 18, color: '#d97706' }} />
                          ) : (
                            <SendOutlined style={{ fontSize: 18, color: '#2563eb' }} />
                          )}
                          <strong style={{ fontSize: 15, color: '#0f172a' }}>{mode.label}</strong>
                        </Flex>
                        {isSelected && (
                          <Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>
                            Đang chọn
                          </Tag>
                        )}
                      </Flex>
                      <Text type="secondary" style={{ fontSize: 12.5, lineHeight: 1.5, display: 'block' }}>
                        {mode.description}
                      </Text>
                      {isModeDisabled && (
                        <Text type="danger" style={{ fontSize: 11.5, display: 'block', marginTop: 6 }}>
                          Không hỗ trợ đường bộ tới quốc gia này (quốc đảo / liên lục địa).
                        </Text>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>

          <Divider style={{ margin: '20px 0' }} />

          {/* PHẦN 2: QUỐC GIA & ĐỊA ĐIỂM GIAO NHẬN */}
          <div>
            <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 12 }}>
              2. Lộ trình giao nhận
            </Text>

            <Row gutter={16}>
              {/* Cột xuất phát */}
              <Col xs={24} md={12}>
                <Card
                  bordered
                  style={{
                    borderRadius: 12,
                    backgroundColor: '#fafafa',
                    borderColor: '#e2e8f0',
                    marginBottom: 16,
                  }}
                  styles={{ body: { padding: '16px 18px' } }}
                >
                  <Tag color="orange" style={{ marginBottom: 12, fontWeight: 600 }}>
                    ĐIỂM XUẤT PHÁT
                  </Tag>

                  <Controller
                    name="PickupCountryCode"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Form.Item label="Quốc gia xuất phát" required style={{ marginBottom: 12 }}>
                        <Select
                          {...field}
                          size="large"
                          options={SUPPORTED_COUNTRIES.map((c) => ({
                            value: c.code,
                            label: `${c.name} (${c.code})`,
                          }))}
                          onChange={(val) => {
                            field.onChange(val);
                            if (transportMode === 'Air') {
                              const airports = AIRPORTS_BY_COUNTRY[val] || [];
                              setValue('PickupAirportCode', airports[0]?.code || 'HAN');
                            }
                          }}
                        />
                      </Form.Item>
                    )}
                  />

                  {transportMode === 'Air' ? (
                    <Controller
                      name="PickupAirportCode"
                      control={control}
                      render={({ field }) => {
                        const airports = AIRPORTS_BY_COUNTRY[pickupCountry] || [];
                        return (
                          <Form.Item label="Sân bay / Cảng xuất phát" required style={{ marginBottom: 0 }}>
                            <Select
                              {...field}
                              size="large"
                              options={airports.map((a) => ({
                                value: a.code,
                                label: a.name,
                              }))}
                              onChange={(val) => {
                                field.onChange(val);
                                const chosen = airports.find((a) => a.code === val);
                                if (chosen) setValue('PickupAddress', chosen.name);
                              }}
                            />
                          </Form.Item>
                        );
                      }}
                    />
                  ) : (
                    <Form.Item label={t('bookingForm.pickupOnMap')} required labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} style={{ marginBottom: 0 }}>
                      <MapPicker value={pickupPlace} onChange={handlePickupPick} height={280} />
                    </Form.Item>
                  )}
                </Card>
              </Col>

              {/* Cột đích đến */}
              <Col xs={24} md={12}>
                <Card
                  bordered
                  style={{
                    borderRadius: 12,
                    backgroundColor: '#fafafa',
                    borderColor: '#e2e8f0',
                    marginBottom: 16,
                  }}
                  styles={{ body: { padding: '16px 18px' } }}
                >
                  <Tag color="green" style={{ marginBottom: 12, fontWeight: 600 }}>
                    ĐIỂM ĐÍCH ĐẾN
                  </Tag>

                  <Controller
                    name="DropoffCountryCode"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Form.Item label="Quốc gia đến" required style={{ marginBottom: 12 }}>
                        <Select
                          {...field}
                          size="large"
                          options={SUPPORTED_COUNTRIES.filter((c) => c.code !== pickupCountry).map((c) => ({
                            value: c.code,
                            label: `${c.name} (${c.code})${transportMode === 'Ground' && !c.ground ? ' - Chỉ có đường bay' : ''}`,
                          }))}
                          onChange={(val) => {
                            field.onChange(val);
                            if (transportMode === 'Air') {
                              const airports = AIRPORTS_BY_COUNTRY[val] || [];
                              setValue('DropoffAirportCode', airports[0]?.code || 'NRT');
                            }
                          }}
                        />
                      </Form.Item>
                    )}
                  />

                  {transportMode === 'Air' ? (
                    <Controller
                      name="DropoffAirportCode"
                      control={control}
                      render={({ field }) => {
                        const airports = AIRPORTS_BY_COUNTRY[dropoffCountry] || [];
                        return (
                          <Form.Item label="Sân bay / Cảng tiếp nhận" required style={{ marginBottom: 0 }}>
                            <Select
                              {...field}
                              size="large"
                              options={airports.map((a) => ({
                                value: a.code,
                                label: a.name,
                              }))}
                              onChange={(val) => {
                                field.onChange(val);
                                const chosen = airports.find((a) => a.code === val);
                                if (chosen) setValue('DropoffAddress', chosen.name);
                              }}
                            />
                          </Form.Item>
                        );
                      }}
                    />
                  ) : (
                    <Form.Item label={t('bookingForm.dropoffOnMap')} required labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} style={{ marginBottom: 0 }}>
                      <MapPicker value={dropoffPlace} onChange={handleDropoffPick} height={280} />
                    </Form.Item>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Quãng đường dự kiến do Backend tự động tính */}
            {transportMode === 'Ground' && (
              <Card
                bordered
                style={{
                  borderRadius: 12,
                  backgroundColor: '#fffdf5',
                  borderColor: '#fde68a',
                  marginBottom: 16,
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={15}>
                    <Flex align="center" gap={8} style={{ marginBottom: 6 }}>
                      <CarOutlined style={{ color: '#d97706', fontSize: 20 }} />
                      <Text strong style={{ color: '#92400e', fontSize: 15 }}>
                        {t('map.distanceAB')}
                      </Text>

                    </Flex>
                    <Text type="secondary" style={{ display: 'block', fontSize: 13, lineHeight: 1.5 }}>
                      {t('bookingForm.routeHint')}
                    </Text>
                  </Col>
                  <Col xs={24} md={9}>
                    {/* Chỉ hiện số khi đã chọn đủ 2 điểm và backend tính xong tuyến đường bộ */}
                    {!pickupPlace || !dropoffPlace ? (
                      <Text type="secondary" style={{ display: 'block', textAlign: 'right', fontSize: 13 }}>
                        {t('bookingForm.pickPointsForRoute')}
                      </Text>
                    ) : routeLoading ? (
                      <Flex align="center" justify="flex-end" gap={8}>
                        <Spin size="small" />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {t('bookingForm.routeLoading')}
                        </Text>
                      </Flex>
                    ) : route ? (
                      <Flex gap={8} justify="flex-end" wrap="wrap">
                        <div style={ROUTE_STAT_STYLE}>
                          <CarOutlined style={{ color: '#b45309' }} />
                          <span>
                            {t('bookingForm.distance')}: <strong>{Math.ceil(Number(route.totalDistanceKm) || 0).toLocaleString()} km</strong>
                          </span>
                        </div>
                        {/* Thời gian theo bộ ước tính xe chở ngựa của backend (cùng số dùng để kiểm tra hạn giao), không phải thời gian xe con của bản đồ */}
                        <div style={ROUTE_STAT_STYLE}>
                          <ClockCircleOutlined style={{ color: '#b45309' }} />
                          <span>
                            {t('bookingForm.transitTime')}:{' '}
                            {schedule?.transit ? <strong>~{formatDriveTime(schedule.transit.totalHours, t)}</strong> : <Spin size="small" />}
                          </span>
                        </div>
                      </Flex>
                    ) : (
                      <Text type="secondary" style={{ display: 'block', textAlign: 'right', fontSize: 13 }}>
                        {t('bookingForm.routeFailed')}
                      </Text>
                    )}
                  </Col>
                </Row>
                {pickupPlace && dropoffPlace && route && schedule?.transit && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: '#57534e', lineHeight: 1.6 }}>
                    <div>
                      {t('bookingForm.transitBreakdown', {
                        driving: formatHoursNumber(schedule.transit.drivingHours, i18n.language),
                        rest: formatHoursNumber(schedule.transit.restHours, i18n.language),
                        border: formatHoursNumber(schedule.transit.borderHours, i18n.language),
                        handling: formatHoursNumber(schedule.transit.handlingHours, i18n.language),
                      })}
                    </div>
                    <div style={{ fontStyle: 'italic' }}>{t('bookingForm.transitDisclaimer')}</div>
                  </div>
                )}
                {pickupPlace && dropoffPlace && (
                  <div style={{ marginTop: 12 }}>
                    <RouteMap
                      height={280}
                      stops={[
                        { ...pickupPlace, stopType: 'Origin', name: pickupPlace.address },
                        { ...dropoffPlace, stopType: 'Destination', name: dropoffPlace.address },
                      ]}
                      polyline={route?.polyline}
                      legs={route?.legs}
                      isEstimate={route?.isEstimate}
                    />
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 2: LỊCH TRÌNH & DỊCH VỤ BẢO VỆ */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div>
          {/* Lịch trình đón & giao */}
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 8 }}>
              {t('bookings.schedule.title')}
            </Text>
            <Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginBottom: 12 }}>
              {t('bookings.schedule.intro')}
            </Text>

            {scheduleLoading && (
              <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                <Spin size="small" />
                <Text type="secondary">{t('bookings.schedule.loading')}</Text>
              </Flex>
            )}
            {scheduleError && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
                title={t('bookings.schedule.unavailable', { message: scheduleError })}
              />
            )}
            {schedule && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                title={
                  <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                    <div>
                      {t('bookings.schedule.earliestHint', {
                        date: dayjs(schedule.earliestPickupDate).format('DD/MM/YYYY'),
                        days: schedule.leadTimeDays,
                      })}
                    </div>
                    <div>
                      {t('bookings.schedule.expressHint', {
                        date: dayjs(schedule.expressUntilDate).format('DD/MM/YYYY'),
                      })}
                    </div>
                    <div>
                      {t('bookings.schedule.transitHint', {
                        hours: schedule.transit?.totalHours,
                        maxHours: schedule.transit?.maxHours,
                        days: schedule.transit?.transitDays,
                      })}
                    </div>
                    {earliestDeadline && (
                      <div>
                        {t('bookings.schedule.deadlineHint', {
                          date: earliestDeadline.format('DD/MM/YYYY HH:mm'),
                        })}
                      </div>
                    )}
                  </div>
                }
              />
            )}

            <Row gutter={16}>
              <Col xs={24} md={14}>
                <Controller
                  name="PickupWindow"
                  control={control}
                  render={({ field }) => (
                    <Form.Item label={t('bookings.schedule.pickupWindowLabel')} required labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                      <DatePicker.RangePicker
                        value={field.value ? [dayjs(field.value[0]), dayjs(field.value[1])] : null}
                        onChange={(dates) =>
                          field.onChange(
                            dates
                              ? [
                                  toLocalDateTimeString(dates[0].startOf('day')),
                                  toLocalDateTimeString(dates[1].startOf('day')),
                                ]
                              : null,
                          )
                        }
                        // Khóa các ngày trước ngày đón sớm nhất backend cho phép
                        disabledDate={(current) =>
                          current && current < (earliestPickup || dayjs()).startOf('day')
                        }
                        format="DD/MM/YYYY"
                        size="large"
                        style={{ width: '100%', borderRadius: 8 }}
                      />
                    </Form.Item>
                  )}
                />
              </Col>
              <Col xs={24} md={10}>
                <Controller
                  name="DeliveryDeadline"
                  control={control}
                  render={({ field }) => (
                    <Form.Item label={t('bookings.schedule.deadlineLabel')} required labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                      <DatePicker
                        value={field.value ? dayjs(field.value) : null}
                        // Hạn giao tính tới cuối ngày được chọn
                        onChange={(date) => field.onChange(date ? toLocalDateTimeString(date.endOf('day')) : null)}
                        disabledDate={(current) =>
                          current &&
                          current.endOf('day') < (earliestDeadline || earliestPickup || dayjs())
                        }
                        format="DD/MM/YYYY"
                        size="large"
                        style={{ width: '100%', borderRadius: 8 }}
                      />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>
          </div>

          <Divider style={{ margin: '20px 0' }} />

          {/* Dịch vụ bảo vệ & Tiện ích khoang */}
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 12 }}>
              2. Tiện ích khoang & Bảo hiểm hành trình
            </Text>

            <Row gutter={[16, 16]}>
              {/* Kiểm soát nhiệt độ */}
              <Col xs={24} md={12}>
                <Controller
                  name="RequiresClimateControl"
                  control={control}
                  render={({ field }) => {
                    const isChecked = Boolean(field.value);
                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => field.onChange(!isChecked)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') field.onChange(!isChecked);
                        }}
                        style={{
                          padding: '16px 18px',
                          borderRadius: 12,
                          border: isChecked ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                          backgroundColor: isChecked ? '#fffdf7' : '#ffffff',
                          cursor: 'pointer',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                          <strong style={{ fontSize: 14, color: '#0f172a' }}>
                            Khoang kiểm soát nhiệt độ (Climate Control)
                          </strong>
                          <Checkbox checked={isChecked} />
                        </Flex>
                        <Text type="secondary" style={{ fontSize: 12.5, lineHeight: 1.45, display: 'block' }}>
                          Duy trì ổn định 18°C - 22°C suốt hành trình, đảm bảo hô hấp và sức bền cho ngựa thi đấu.
                        </Text>
                      </div>
                    );
                  }}
                />
              </Col>

            </Row>

          </div>

          <Divider style={{ margin: '20px 0' }} />

          {/* Ghi chú hướng dẫn đặc biệt */}
          <div>
            <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 8 }}>
              3. Hướng dẫn chăm sóc đặc biệt (Tùy chọn)
            </Text>
            <Controller
              name="SpecialInstructions"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  rows={3}
                  placeholder="Ghi chú chế độ ăn cỏ, bổ sung nước điện giải, tiền sử say xe hoặc yêu cầu chăm sóc của bác sĩ thú y..."
                  style={{ borderRadius: 8, padding: '10px 12px' }}
                />
              )}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 3: CHỌN NGỰA VÀ ĐĂNG KÝ HẠNG CHUỒNG */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <div>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                  Danh sách ngựa tham gia chuyến vận chuyển
                </Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12.5 }}>
                  Chọn ít nhất 1 cá thể ngựa đủ điều kiện sức khỏe và cấu hình hạng chuồng phù hợp.
                </Text>
              </div>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => navigate(ROUTES.CUSTOMER_HORSES_NEW)}
                style={{ borderRadius: 8 }}
              >
                Thêm hồ sơ ngựa mới
              </Button>
            </Flex>
          </div>

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
            message={t('bookings.wizard.eligibilityPolicyTitle', {
              defaultValue: 'Quy chuẩn điều kiện & sức khỏe vận chuyển (Chính sách Dịch vụ)',
            })}
            description={t('bookings.wizard.eligibilityPolicyDesc', {
              minAge: minAgeMonths,
              defaultValue: `Ngựa tối thiểu từ ${minAgeMonths} tháng tuổi (tính đến ngày đón), không mang thai quá 90% thai kỳ (> 306 ngày hoặc cách ngày dự sinh ≤ 34 ngày), và không vận chuyển ngựa vừa sinh trong vòng 7 ngày.`,
            })}
          />

          {loadingHorses ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <Text type="secondary">Đang tải danh sách hồ sơ ngựa...</Text>
            </div>
          ) : availableHorses.length === 0 ? (
            <Card
              bordered
              style={{
                borderRadius: 12,
                textAlign: 'center',
                backgroundColor: '#fafafa',
                borderColor: '#e2e8f0',
                padding: '32px 16px',
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <strong style={{ fontSize: 15, color: '#0f172a', display: 'block', marginBottom: 4 }}>
                      Bạn chưa có hồ sơ ngựa nào trong hệ thống
                    </strong>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Vui lòng tạo hồ sơ ngựa trước khi gửi yêu cầu vận chuyển mới.
                    </Text>
                  </div>
                }
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate(ROUTES.CUSTOMER_HORSES_NEW)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    backgroundColor: '#d97706',
                    borderColor: '#d97706',
                    marginTop: 10,
                  }}
                >
                  Tạo hồ sơ ngựa ngay
                </Button>
              </Empty>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {availableHorses.map((horse) => {
                const horseId = horse.horseId || horse.HorseID;
                const isSelected = selectedHorseIds.some((id) => String(id) === String(horseId));
                const horseName = horse.name || horse.Name;
                const horseBreed = horse.breed || horse.Breed || 'Thoroughbred';
                const horseGender = horse.gender || horse.Gender;
                const horseMicrochip = horse.microchipNumber || horse.MicrochipNumber;
                const targetPickupDate = pickupWindowEnd || pickupWindowStart || null;
                const eligibility = checkHorseTransportEligibility(horse, i18n?.language || 'vi', {
                  pickupDate: targetPickupDate,
                  minAgeMonths,
                });
                const isEligible = eligibility.eligible;
                const conditionError = horseConditionErrors[horseId] || horseConditionErrors[String(horseId)];
                const cannotSelect = !isEligible;

                return (
                  <Col xs={24} md={12} key={horseId}>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: isSelected ? '2px solid #d97706' : cannotSelect ? '1px solid #fecaca' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#fffdf7' : cannotSelect ? '#fffbfa' : '#ffffff',
                        cursor: cannotSelect ? 'not-allowed' : 'pointer',
                        opacity: cannotSelect ? 0.75 : 1,
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => !cannotSelect && handleToggleHorse(horseId)}
                    >
                      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                        <Flex align="center" gap={8}>
                          <Checkbox
                            checked={isSelected}
                            disabled={cannotSelect}
                            onChange={() => !cannotSelect && handleToggleHorse(horseId)}
                          />
                          <strong style={{ fontSize: 15, color: '#0f172a' }}>{horseName}</strong>
                        </Flex>
                        <Space size={6} wrap>
                          <Tag color={eligibility.tagColor} style={{ margin: 0, fontWeight: 600 }}>
                            {eligibility.tagText}
                          </Tag>
                          <Tag color="default" style={{ margin: 0 }}>
                            {horseBreed}
                          </Tag>
                        </Space>
                      </Flex>

                      <div style={{ fontSize: 12.5, color: '#64748b', marginLeft: 24, marginBottom: 8 }}>
                        Giới tính: {horseGender} · Mã Microchip: <code>{horseMicrochip || 'Chưa cập nhật'}</code>
                      </div>

                      {conditionError && (
                        <Alert
                          type="error"
                          showIcon
                          message={conditionError}
                          style={{ marginTop: 8, marginLeft: 24, borderRadius: 6, fontSize: 12.5 }}
                        />
                      )}

                      {!isEligible && !conditionError && (
                        <Alert
                          type="error"
                          showIcon
                          message={eligibility.message}
                          style={{ marginTop: 8, marginLeft: 24, borderRadius: 6, fontSize: 12.5 }}
                        />
                      )}

                      {/* Chọn hạng chuồng nếu ngựa được chọn */}
                      {isSelected && isEligible && (
                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: '1px solid #f1f5f9',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Text strong style={{ fontSize: 12.5, color: '#0f172a', display: 'block', marginBottom: 8 }}>
                            Hạng chuồng vận chuyển:
                          </Text>
                          <Row gutter={[8, 8]}>
                            {STALL_CLASSES.map((stall) => {
                              const isStallSelected = (stallClasses[horseId] || 'Comfort') === stall.value;
                              return (
                                <Col xs={24} sm={8} key={stall.value}>
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setStallClasses((prev) => ({ ...prev, [horseId]: stall.value }))}
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: 8,
                                      border: isStallSelected ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                                      backgroundColor: isStallSelected ? '#fff8e6' : '#ffffff',
                                      cursor: 'pointer',
                                      textAlign: 'center',
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                                      {stall.title.split(' ')[0]}
                                    </div>
                                    <Tag color={isStallSelected ? 'gold' : 'default'} style={{ margin: '4px 0 0', fontSize: 10 }}>
                                      {stall.badge}
                                    </Tag>
                                  </div>
                                </Col>
                              );
                            })}
                          </Row>

                          <Input
                            size="small"
                            value={horseNotes[horseId] || ''}
                            onChange={(e) =>
                              setHorseNotes((prev) => ({
                                ...prev,
                                [horseId]: e.target.value,
                              }))
                            }
                            placeholder="Ghi chú khẩu phần hoặc thể trạng riêng cho con này..."
                            style={{ borderRadius: 6, marginTop: 8 }}
                          />

                          {/* R-12 / R-13: giá trị khai báo + chứng từ + gói bảo hiểm của con này */}
                          <div style={{ marginTop: 12 }}>
                            <Text strong style={{ fontSize: 12.5, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                              {t('bookingForm.values.declaredLabel')}
                            </Text>
                            <InputNumber
                              size="middle"
                              min={0}
                              max={100000000}
                              step={5000}
                              value={horseValues[horseId]?.declaredValue ?? null}
                              onChange={(v) => updateHorseValue(horseId, { declaredValue: v })}
                              placeholder={t('bookingForm.values.declaredPlaceholder')}
                              style={{ width: '100%' }}
                              formatter={(val) => (val ? `$ ${Number(val).toLocaleString('en-US')}` : '')}
                              parser={(val) => (val ? String(val).replace(/[^\d.]/g, '') : '')}
                            />
                            {Number(horseValues[horseId]?.declaredValue) >= proofThreshold && (
                              <div style={{ marginTop: 8 }}>
                                <Upload
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  showUploadList={false}
                                  beforeUpload={(file) => {
                                    void uploadProof(horseId, file);
                                    return false;
                                  }}
                                >
                                  <Button icon={<UploadOutlined />} loading={uploadingHorseId === horseId}>
                                    {t('bookingForm.values.uploadProof')}
                                  </Button>
                                </Upload>
                                <Text type={horseValues[horseId]?.valueProofPath ? 'success' : 'warning'} style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                  {horseValues[horseId]?.valueProofPath
                                    ? t('bookingForm.values.proofUploaded', { name: horseValues[horseId]?.valueProofName || '' })
                                    : t('bookingForm.values.proofHint', { threshold: formatUsdPlain(proofThreshold) })}
                                </Text>
                              </div>
                            )}

                            <Text strong style={{ fontSize: 12.5, color: '#0f172a', display: 'block', margin: '10px 0 6px' }}>
                              {t('bookingForm.insurance.label')}
                            </Text>
                            <Radio.Group
                              value={horseValues[horseId]?.insurancePlan || 'None'}
                              onChange={(e) => updateHorseValue(horseId, { insurancePlan: e.target.value })}
                              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                            >
                              <Radio value="None">
                                <strong>{t('bookingForm.insurance.none')}</strong>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                  {t('bookingForm.insurance.noneHint', {
                                    liability: formatUsdPlain(policy?.insurance?.baseLiabilityUsd ?? 5000),
                                    vet: formatUsdPlain(policy?.insurance?.baseVetCapUsd ?? 1000),
                                  })}
                                </Text>
                              </Radio>
                              <Radio value="Full">
                                <strong>{t('bookingForm.insurance.full')}</strong>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                  {t('bookingForm.insurance.fullHint', {
                                    premium: policy?.insurance?.premiumPercent ?? 1,
                                    vetPercent: policy?.insurance?.vetCapPercent ?? 20,
                                  })}
                                </Text>
                              </Radio>
                            </Radio.Group>
                            <a href={`${POLICY_PAGE_PATH}#8`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
                              {t('bookingForm.insurance.policyLink')}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 4: XEM LẠI VÀ BÁO GIÁ MINH BẠCH */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <div>
          <Title level={5} style={{ margin: '0 0 16px', fontWeight: 700, color: '#0f172a' }}>
            Xem lại thông tin & Dự toán cước phí
          </Title>

          <Row gutter={16}>
            {/* Cột trái: Tóm tắt lộ trình */}
            <Col xs={24} lg={13}>
              <Card
                bordered
                style={{
                  borderRadius: 12,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  marginBottom: 16,
                }}
                styles={{ body: { padding: '16px 18px' } }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
                    Thông tin lộ trình
                  </Text>
                  <Tag color={transportMode === 'Air' ? 'blue' : 'orange'} style={{ fontWeight: 600 }}>
                    {transportMode === 'Air' ? 'Hàng không (Air Freight)' : `Đường bộ · ${distanceKm || 0} km`}
                  </Tag>
                </Flex>

                <div style={{ marginBottom: 10 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Điểm xuất phát ({pickupCountry}):</Text>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                    {getValues('PickupAddress')}
                    {transportMode === 'Ground' && getValues('PickupCity') ? `, ${getValues('PickupCity')}` : ''}
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Điểm giao đến ({dropoffCountry}):</Text>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                    {getValues('DropoffAddress')}
                    {transportMode === 'Ground' && getValues('DropoffCity') ? `, ${getValues('DropoffCity')}` : ''}
                  </div>
                </div>

                {(quote?.transitCountryCodes || []).length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('bookings.fields.route')}:</Text>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>
                      {formatCountryRoute({
                        pickupCountryCode: pickupCountry,
                        dropoffCountryCode: dropoffCountry,
                        transitCountryCodes: quote.transitCountryCodes,
                      })}
                    </div>
                  </div>
                )}

                {transportMode === 'Ground' && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: '8px 12px',
                      background: '#fffdf5',
                      borderRadius: 8,
                      border: '1px solid #fde68a',
                    }}
                  >
                    <Flex justify="space-between" align="center">
                      <span style={{ fontSize: 12.5, color: '#92400e', fontWeight: 600 }}>
                        Quãng đường cước phí: {distanceKm || quote?.distanceKm || 0} km
                      </span>

                    </Flex>
                    {quote?.routeSummary && (
                      <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 3 }}>
                        {quote.routeSummary}
                      </Text>
                    )}
                  </div>
                )}

                <Row gutter={16} style={{ marginBottom: 10 }}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('bookings.fields.pickupWindow')}:</Text>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {formatPickupWindow({ pickupWindowStart, pickupWindowEnd }, '---')}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('bookings.fields.deliveryDeadline')}:</Text>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {formatDeliveryDeadline({ deliveryDeadline }, '---')}
                    </div>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />

                <Text strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 8 }}>
                  Ngựa vận chuyển ({selectedHorseIds.length} con)
                </Text>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {availableHorses
                    .filter((h) => selectedHorseIds.includes(h.horseId || h.HorseID))
                    .map((h) => {
                      const hId = h.horseId || h.HorseID;
                      return (
                        <Flex
                          key={hId}
                          justify="space-between"
                          align="center"
                          style={{
                            background: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            fontSize: 12.5,
                          }}
                        >
                          <div>
                            <strong>{h.name || h.Name}</strong> ({h.breed || 'Ngựa đua'})
                          </div>
                          <Space size={4}>
                            <Tag color="gold" style={{ fontWeight: 600, margin: 0 }}>
                              {stallClasses[hId] || 'Comfort'}
                            </Tag>
                            {Number(horseValues[hId]?.declaredValue) > 0 && (
                              <Tag style={{ margin: 0 }}>${formatUsdPlain(horseValues[hId].declaredValue)}</Tag>
                            )}
                            {horseValues[hId]?.insurancePlan === 'Full' && (
                              <Tag color="blue" style={{ margin: 0 }}>{t('bookingForm.insurance.full')}</Tag>
                            )}
                          </Space>
                        </Flex>
                      );
                    })}
                </Space>
              </Card>
            </Col>

            {/* Cột phải: Bảng báo giá */}
            <Col xs={24} lg={11}>
              <Card
                bordered
                style={{
                  borderRadius: 12,
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  marginBottom: 16,
                }}
                styles={{ body: { padding: '16px 18px' } }}
              >
                <Text strong style={{ fontSize: 14, color: '#0f172a', display: 'block', marginBottom: 12 }}>
                  {t('bookingForm.range.title')}
                </Text>

                {quoteError && (
                  <Alert type="error" showIcon message={quoteError} style={{ marginBottom: 12, borderRadius: 8 }} />
                )}
                {!quoteRequest && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Chưa đủ thông tin để tính giá (cần chọn ngựa, ngày vận chuyển và quãng đường nếu đi đường bộ)."
                    style={{ marginBottom: 12, borderRadius: 8 }}
                  />
                )}

                <Table
                  dataSource={quoteItems}
                  loading={quoteLoading}
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Hạng mục chi phí',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name) => <span style={{ fontSize: 12 }}>{name}</span>,
                    },
                    {
                      title: 'SL',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      align: 'center',
                      width: 50,
                      render: (q) => <span style={{ fontSize: 12 }}>{q}</span>,
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right',
                      width: 100,
                      render: (val) => (
                        <strong style={{ fontSize: 12.5, color: Number(val) < 0 ? '#16a34a' : '#0f172a' }}>
                          ${Number(val).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </strong>
                      ),
                    },
                  ]}
                />

                <Divider style={{ margin: '14px 0' }} />

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    {t('bookingForm.range.label')}
                  </Text>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>
                    {quote
                      ? quoteMin === quoteMax
                        ? `$${formatUsd(quoteMin)} ${currencyCode}`
                        : `$${formatUsd(quoteMin)} – $${formatUsd(quoteMax)} ${currencyCode}`
                      : '---'}
                  </div>
                  {quote && usdVndRate > 0 && (
                    <Text type="secondary" style={{ fontSize: 12.5, display: 'block' }}>
                      {quoteMin === quoteMax
                        ? `≈ ${formatVnd(quoteMin)} đ`
                        : `≈ ${formatVnd(quoteMin)} – ${formatVnd(quoteMax)} đ`}
                    </Text>
                  )}
                  <Alert type="info" showIcon style={{ marginTop: 10, borderRadius: 8 }} title={t('bookingForm.range.note')} />
                  <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 6 }}>
                    {t('bookingForm.range.linesNote')}
                  </Text>
                </div>

                <Divider style={{ margin: '14px 0' }} />
                <Text strong style={{ fontSize: 13, color: '#0f172a', display: 'block', marginBottom: 8 }}>
                  {t('bookingForm.recipient.title')}
                </Text>
                <div style={{ marginBottom: 12 }}>
                  <RecipientForm value={recipient} onChange={setRecipient} />
                </div>
                <PolicyAgreement accepted={policyAgreement.accepted} onChange={setPolicyAgreement} />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* Thanh điều hướng chân trang */}
      <Divider style={{ margin: '20px 0 16px' }} />

      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={currentStep === 0 ? onCancel : handlePrev}
          disabled={loading}
          style={{ minWidth: 100, borderRadius: 8, height: 40 }}
        >
          {currentStep === 0 ? t('common.cancel') : t('common.back') || 'Quay lại'}
        </Button>

        {currentStep < 3 ? (
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={handleNext}
            style={{
              minWidth: 120,
              borderRadius: 8,
              fontWeight: 600,
              backgroundColor: '#d97706',
              borderColor: '#d97706',
              height: 40,
            }}
          >
            {t('common.next') || 'Tiếp tục'}
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleFilled />}
            loading={loading}
            disabled={!quote || quoteLoading || !policyAgreement.accepted || !recipientValid}
            onClick={handleFinalSubmit}
            style={{
              minWidth: 180,
              borderRadius: 8,
              fontWeight: 700,
              backgroundColor: '#d97706',
              borderColor: '#d97706',
              height: 40,
            }}
          >
            Gửi yêu cầu vận chuyển
          </Button>
        )}
      </Flex>
    </Card>
  );
}
