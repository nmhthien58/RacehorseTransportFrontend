import { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  AutoComplete,
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
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Typography,
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
  CheckCircleFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import horseService from '@services/horseService';
import bookingService from '@services/bookingService';
import { useAuthStore } from '@features/auth/store/authStore';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';
import { formatDeliveryDeadline, formatPickupWindow, toLocalDateTimeString } from '@utils/bookingSchedule';
import { checkHorseTransportEligibility } from '@utils/horseHealth';
import { ROUTES } from '@routes/routes';
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
  const { user } = useAuthStore();
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

  const userFarmAddress = user?.farmAddress || user?.address || 'Trang trại ngựa xuất phát, Việt Nam';

  // State các ngựa được chọn và cấu hình chuồng
  const [selectedHorseIds, setSelectedHorseIds] = useState([]);
  const [stallClasses, setStallClasses] = useState({});
  const [horseNotes, setHorseNotes] = useState({});

  const {
    control,
    getValues,
    setValue,
  } = useForm({
    defaultValues: {
      TransportMode: initialMode,
      PickupCountryCode: initialPickupCountry,
      PickupCity: initialValues?.pickupCity || 'TP. Hồ Chí Minh',
      PickupAddress: initialValues?.pickupAddress || userFarmAddress,
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
      DistanceKm: initialValues?.distanceKm || 250,
      // Khoảng ngày sẵn sàng đón [đầu, cuối] và hạn giao; điền mặc định khi đã biết ngày sớm nhất từ backend
      PickupWindow: null,
      DeliveryDeadline: null,
      InsurancePackage: initialValues?.declaredValue === null ? 'none' : 'transit',
      DeclaredValue: initialValues?.declaredValue || 50000,
      RequiresClimateControl: initialValues?.requiresClimateControl ?? true,
      SpecialInstructions: initialValues?.specialInstructions || '',
    },
    mode: 'onTouched',
  });

  const transportMode = useWatch({ control, name: 'TransportMode' });
  const pickupCountry = useWatch({ control, name: 'PickupCountryCode' });
  const pickupCity = useWatch({ control, name: 'PickupCity' });
  const pickupAddress = useWatch({ control, name: 'PickupAddress' });
  const dropoffCountry = useWatch({ control, name: 'DropoffCountryCode' });
  const dropoffCity = useWatch({ control, name: 'DropoffCity' });
  const dropoffAddress = useWatch({ control, name: 'DropoffAddress' });
  const pickupAirportCode = useWatch({ control, name: 'PickupAirportCode' });
  const dropoffAirportCode = useWatch({ control, name: 'DropoffAirportCode' });
  const pickupWindow = useWatch({ control, name: 'PickupWindow' });
  const deliveryDeadline = useWatch({ control, name: 'DeliveryDeadline' });
  const pickupWindowStart = pickupWindow?.[0] || null;
  const pickupWindowEnd = pickupWindow?.[1] || null;
  const insurancePackage = useWatch({ control, name: 'InsurancePackage' });
  const declaredValue = useWatch({ control, name: 'DeclaredValue' });
  const distanceKm = useWatch({ control, name: 'DistanceKm' });
  const requiresClimateControl = useWatch({ control, name: 'RequiresClimateControl' });

  // State tính quãng đường tự động từ backend
  const [isEstimatingDistance, setIsEstimatingDistance] = useState(false);
  const [routeEstimateInfo, setRouteEstimateInfo] = useState(null);

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

  // Tự động gọi Backend tính quãng đường khi các trường lộ trình thay đổi (chỉ cho Đường bộ)
  useEffect(() => {
    if (transportMode !== 'Ground') return undefined;
    if (!dropoffCountry) return undefined;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsEstimatingDistance(true);
      try {
        const res = await bookingService.estimateDistance({
          pickupCountryCode: pickupCountry || 'VN',
          pickupCity: pickupCity || '',
          pickupAddress: pickupAddress || '',
          dropoffCountryCode: dropoffCountry,
          dropoffCity: dropoffCity || '',
          dropoffAddress: dropoffAddress || '',
        });
        const data = unwrapData(res);
        if (!cancelled && data?.distanceKm) {
          setValue('DistanceKm', data.distanceKm);
          setRouteEstimateInfo(data);
        }
      } catch {
        // Giữ nguyên cự ly hiện có nếu lỗi mạng
      } finally {
        if (!cancelled) setIsEstimatingDistance(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    transportMode,
    pickupCountry,
    pickupCity,
    pickupAddress,
    dropoffCountry,
    dropoffCity,
    dropoffAddress,
    setValue,
  ]);

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
      const curPickup = getValues('PickupAddress');
      if (!curPickup || curPickup.includes('Sân bay') || curPickup.includes('Airport') || curPickup.includes('Terminal')) {
        setValue('PickupAddress', userFarmAddress);
      }
      const curDrop = getValues('DropoffAddress');
      if (!curDrop || curDrop.includes('Sân bay') || curDrop.includes('Airport') || curDrop.includes('Terminal')) {
        setValue('DropoffAddress', `Trường đua trung tâm / Trang trại đích, ${dropoffCountryObj?.name || dropoffCountry}`);
      }
    }
  }, [transportMode, pickupCountry, dropoffCountry, pickupAirportCode, dropoffAirportCode, setValue, getValues, userFarmAddress, dropoffCountryObj]);

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
        if (specificHorseId && horsesList.some((h) => String(h.horseId || h.HorseID) === String(specificHorseId))) {
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

    const status = (targetHorse.HealthStatus || targetHorse.healthStatus || '').trim().toLowerCase();
    if (status === 'critical' || status === 'poor') {
      message.error('Không thể chọn: Chú ngựa này chưa đạt tiêu chuẩn sức khỏe để vận chuyển (Non-Fit-to-Travel).');
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
  };

  // Lịch sớm nhất của tuyến (ngày đón sớm nhất, mốc Express, thời gian vận chuyển) lấy từ API xem giá.
  // Lịch không phụ thuộc số ngựa nên gửi tạm một con hạng Shared, chưa gửi ngày.
  const [schedule, setSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  useEffect(() => {
    if (currentStep !== 1 || !dropoffCountry) return undefined;
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
  }, [currentStep, transportMode, pickupCountry, dropoffCountry, distanceKm]);

  const earliestPickup = schedule?.earliestPickupDate ? dayjs(schedule.earliestPickupDate) : null;
  const maxTransitHours = Number(schedule?.transit?.maxHours || 0);
  // Hạn giao sớm nhất = đầu khoảng đón + thời gian vận chuyển chậm nhất
  const earliestDeadline = pickupWindowStart
    ? dayjs(pickupWindowStart).add(maxTransitHours, 'hour')
    : null;

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
    const minDeadline = dayjs(start).add(maxTransitHours, 'hour');
    if (dayjs(deadline).isBefore(minDeadline)) {
      return t('bookings.schedule.deadlineTooEarly', { date: minDeadline.format('DD/MM/YYYY HH:mm') });
    }
    return null;
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
      declaredValue: insurancePackage === 'none' ? null : Number(declaredValue) || null,
      pickupWindowStart: toLocalDateTimeString(pickupWindowStart),
      pickupWindowEnd: toLocalDateTimeString(pickupWindowEnd),
      deliveryDeadline: toLocalDateTimeString(deliveryDeadline),
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
    insurancePackage,
    declaredValue,
    pickupWindowStart,
    pickupWindowEnd,
    deliveryDeadline,
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
  const totalCost = Number(quote?.total || 0);
  const currencyCode = quote?.currencyCode || 'USD';

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
      if (transportMode === 'Ground') {
        const pCity = getValues('PickupCity');
        const pAddr = getValues('PickupAddress');
        const dCity = getValues('DropoffCity');
        const dAddr = getValues('DropoffAddress');
        if (!pCity || !pCity.trim()) {
          message.warning('Vui lòng chọn hoặc nhập tỉnh / thành phố đón.');
          return;
        }
        if (!pAddr || !pAddr.trim()) {
          message.warning('Vui lòng nhập địa chỉ đón chi tiết tại trang trại.');
          return;
        }
        if (!dCity || !dCity.trim()) {
          message.warning('Vui lòng chọn hoặc nhập tỉnh / thành phố giao.');
          return;
        }
        if (!dAddr || !dAddr.trim()) {
          message.warning('Vui lòng nhập địa chỉ giao chi tiết tại đích đến.');
          return;
        }
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
    }

    setCurrentStep(targetStep);
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      if (getValues('PickupCountryCode') === getValues('DropoffCountryCode')) {
        message.error('Quốc gia xuất phát và quốc gia đích không được trùng nhau.');
        return;
      }
      if (transportMode === 'Ground') {
        const pCity = getValues('PickupCity');
        const pAddr = getValues('PickupAddress');
        const dCity = getValues('DropoffCity');
        const dAddr = getValues('DropoffAddress');
        if (!pCity || !pCity.trim()) {
          message.warning('Vui lòng chọn hoặc nhập tỉnh / thành phố đón.');
          return;
        }
        if (!pAddr || !pAddr.trim()) {
          message.warning('Vui lòng nhập địa chỉ đón chi tiết tại trang trại.');
          return;
        }
        if (!dCity || !dCity.trim()) {
          message.warning('Vui lòng chọn hoặc nhập tỉnh / thành phố giao.');
          return;
        }
        if (!dAddr || !dAddr.trim()) {
          message.warning('Vui lòng nhập địa chỉ giao chi tiết tại đích đến.');
          return;
        }
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
    const pCity = values.PickupCity?.trim();
    const dCity = values.DropoffCity?.trim();

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
      pickupCity: mode === 'Ground' ? pCity : null,
      pickupCountryCode: pCode,
      dropoffAddress: finalDropoff,
      dropoffCity: mode === 'Ground' ? dCity : null,
      dropoffCountryCode: dCode,
      pickupWindowStart: toLocalDateTimeString(values.PickupWindow?.[0]),
      pickupWindowEnd: toLocalDateTimeString(values.PickupWindow?.[1]),
      deliveryDeadline: toLocalDateTimeString(values.DeliveryDeadline),
      transportMode: mode,
      distanceKm: mode === 'Ground' ? Number(values.DistanceKm) : null,
      requiresClimateControl: Boolean(values.RequiresClimateControl),
      declaredValue: values.InsurancePackage === 'none' ? null : Number(values.DeclaredValue) || null,
      specialInstructions: instructions || null,
      horses: selectedHorseIds.map((hId) => ({
        horseId: Number(hId),
        stallClass: stallClasses[hId] || 'Comfort',
        notes: horseNotes[hId]?.trim().slice(0, 300) || null,
      })),
    };

    await onSubmit(payload);
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
                    <>
                      <Controller
                        name="PickupCity"
                        control={control}
                        rules={{ required: 'Vui lòng chọn hoặc nhập tỉnh / thành phố đón' }}
                        render={({ field, fieldState: { error } }) => (
                          <Form.Item
                            label="Tỉnh / Thành phố đón"
                            required
                            validateStatus={error ? 'error' : ''}
                            help={error?.message}
                            style={{ marginBottom: 12 }}
                          >
                            <AutoComplete
                              {...field}
                              size="large"
                              options={(CITIES_BY_COUNTRY[pickupCountry] || CITIES_BY_COUNTRY.VN).map((c) => ({
                                value: c,
                              }))}
                              placeholder="Chọn hoặc nhập tỉnh / thành phố..."
                              filterOption={(inputValue, option) =>
                                (option?.value || '').toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                              }
                            />
                          </Form.Item>
                        )}
                      />

                      <Controller
                        name="PickupAddress"
                        control={control}
                        rules={{ required: 'Vui lòng nhập địa chỉ đón chi tiết' }}
                        render={({ field, fieldState: { error } }) => (
                          <Form.Item
                            label="Địa chỉ chi tiết (Trang trại / Số nhà, đường)"
                            required
                            validateStatus={error ? 'error' : ''}
                            help={error?.message}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              {...field}
                              size="large"
                              placeholder="Ví dụ: Trang trại ngựa Đua Củ Chi, Xã An Nhơn Tây..."
                              style={{ borderRadius: 8 }}
                            />
                          </Form.Item>
                        )}
                      />
                    </>
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
                    <>
                      <Controller
                        name="DropoffCity"
                        control={control}
                        rules={{ required: 'Vui lòng chọn hoặc nhập tỉnh / thành phố giao' }}
                        render={({ field, fieldState: { error } }) => (
                          <Form.Item
                            label="Tỉnh / Thành phố giao"
                            required
                            validateStatus={error ? 'error' : ''}
                            help={error?.message}
                            style={{ marginBottom: 12 }}
                          >
                            <AutoComplete
                              {...field}
                              size="large"
                              options={(CITIES_BY_COUNTRY[dropoffCountry] || []).map((c) => ({
                                value: c,
                              }))}
                              placeholder="Chọn hoặc nhập thành phố đến..."
                              filterOption={(inputValue, option) =>
                                (option?.value || '').toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                              }
                            />
                          </Form.Item>
                        )}
                      />

                      <Controller
                        name="DropoffAddress"
                        control={control}
                        rules={{ required: 'Vui lòng nhập địa chỉ giao chi tiết' }}
                        render={({ field, fieldState: { error } }) => (
                          <Form.Item
                            label="Địa chỉ chi tiết (Trường đua / Trang trại đích)"
                            required
                            validateStatus={error ? 'error' : ''}
                            help={error?.message}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              {...field}
                              size="large"
                              placeholder="Ví dụ: Trường đua Chroy Changvar, Số 12 Đường Quốc Lộ..."
                              style={{ borderRadius: 8 }}
                            />
                          </Form.Item>
                        )}
                      />
                    </>
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
                        Quãng đường vận chuyển dự kiến
                      </Text>
                      <Tag color="gold" style={{ margin: 0, fontWeight: 600 }}>
                        Backend tự động tính
                      </Tag>
                    </Flex>
                    <Text type="secondary" style={{ display: 'block', fontSize: 13, lineHeight: 1.5 }}>
                      {routeEstimateInfo?.routeSummary ||
                        'Hệ thống tự động phân tích tuyến đường bộ, cửa khẩu hải quan và tính toán cự ly thực tế giữa hai địa điểm.'}
                    </Text>
                    {routeEstimateInfo?.estimatedHours && (
                      <Text style={{ fontSize: 12.5, color: '#475569', marginTop: 4, display: 'block' }}>
                        Thời gian di chuyển đường bộ dự kiến: <strong>~{routeEstimateInfo.estimatedHours} giờ</strong> (chạy tốc độ an toàn cho sức khỏe ngựa)
                      </Text>
                    )}
                  </Col>
                  <Col xs={24} md={9} style={{ textAlign: 'right' }}>
                    {isEstimatingDistance ? (
                      <Flex align="center" justify="flex-end" gap={8}>
                        <Spin size="small" />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Đang tính cự ly từ Backend...
                        </Text>
                      </Flex>
                    ) : (
                      <div style={{ display: 'inline-block', textAlign: 'right' }}>
                        <div style={{ fontSize: 32, fontWeight: 700, color: '#b45309', lineHeight: 1.1 }}>
                          {distanceKm || 0} <span style={{ fontSize: 18, fontWeight: 500, color: '#78350f' }}>km</span>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                          Đơn giá: $1.00 USD/km/ngựa
                        </Text>
                      </div>
                    )}
                  </Col>
                </Row>
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

              {/* Bảo hiểm hành trình */}
              <Col xs={24} md={12}>
                <Controller
                  name="InsurancePackage"
                  control={control}
                  render={({ field }) => {
                    const isOn = field.value !== 'none';
                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => field.onChange(isOn ? 'none' : 'transit')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') field.onChange(isOn ? 'none' : 'transit');
                        }}
                        style={{
                          padding: '16px 18px',
                          borderRadius: 12,
                          border: isOn ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                          backgroundColor: isOn ? '#fffdf7' : '#ffffff',
                          cursor: 'pointer',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                          <strong style={{ fontSize: 14, color: '#0f172a' }}>
                            Bảo hiểm hành trình (Transit Insurance)
                          </strong>
                          <Checkbox checked={isOn} />
                        </Flex>
                        <Text type="secondary" style={{ fontSize: 12.5, lineHeight: 1.45, display: 'block' }}>
                          Bảo hiểm rủi ro vận chuyển toàn diện (tính phí 1% trên giá trị khai báo của ngựa).
                        </Text>
                      </div>
                    );
                  }}
                />
              </Col>
            </Row>

            {/* Nhập giá trị khai báo nếu mua bảo hiểm */}
            {insurancePackage !== 'none' && (
              <div style={{ marginTop: 16 }}>
                <Controller
                  name="DeclaredValue"
                  control={control}
                  render={({ field }) => (
                    <Form.Item
                      label="Giá trị khai báo của ngựa (USD)"
                      extra="Mức khai báo làm căn cứ xác định phí bảo hiểm và hạn mức bồi thường."
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        {...field}
                        size="large"
                        min={1000}
                        max={100000000}
                        step={5000}
                        style={{ width: '100%', maxWidth: 360, borderRadius: 8 }}
                        formatter={(val) => (val ? `$ ${Number(val).toLocaleString('en-US')}` : '')}
                        parser={(val) => (val ? String(val).replace(/[^\d.]/g, '') : '')}
                      />
                    </Form.Item>
                  )}
                />
              </div>
            )}
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
                const eligibility = checkHorseTransportEligibility(horse, i18n?.language || 'vi');
                const isCritical = (horse.HealthStatus || horse.healthStatus || '').trim().toLowerCase() === 'critical';

                return (
                  <Col xs={24} md={12} key={horseId}>
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: isSelected ? '2px solid #d97706' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#fffdf7' : '#ffffff',
                        cursor: isCritical ? 'not-allowed' : 'pointer',
                        opacity: isCritical ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => !isCritical && handleToggleHorse(horseId)}
                    >
                      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                        <Flex align="center" gap={8}>
                          <Checkbox
                            checked={isSelected}
                            disabled={isCritical}
                            onChange={() => !isCritical && handleToggleHorse(horseId)}
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

                      {isCritical && (
                        <Text type="danger" style={{ fontSize: 12, display: 'block', marginLeft: 24 }}>
                          Ngựa đang có vấn đề sức khỏe nghiêm trọng, không đủ điều kiện vận chuyển.
                        </Text>
                      )}

                      {/* Chọn hạng chuồng nếu ngựa được chọn */}
                      {isSelected && !isCritical && (
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
                      <Tag color="gold" style={{ margin: 0, fontSize: 11 }}>
                        Backend định tuyến
                      </Tag>
                    </Flex>
                    {(quote?.routeSummary || routeEstimateInfo?.routeSummary) && (
                      <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 3 }}>
                        {quote?.routeSummary || routeEstimateInfo?.routeSummary}
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
                          <Tag color="gold" style={{ fontWeight: 600, margin: 0 }}>
                            {stallClasses[hId] || 'Comfort'}
                          </Tag>
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
                  Bảng dự toán cước phí (Estimated Quote)
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

                <Flex justify="space-between" align="baseline">
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      Tổng chi phí dự kiến
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Đã bao gồm cước, phụ phí và phí kiểm dịch
                    </Text>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>
                    ${totalCost.toLocaleString('en-US', { maximumFractionDigits: 2 })} {currencyCode}
                  </div>
                </Flex>
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
            disabled={!quote || quoteLoading}
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
