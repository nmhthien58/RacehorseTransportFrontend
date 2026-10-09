import { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
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
  CarOutlined,
  RocketOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import horseService from '@services/horseService';
import { useAuthStore } from '@features/auth/store/authStore';
import { getStoredHorses } from '@utils/horseStorage';
import {
  calculateHorseRisk,
  HealthStatusTag,
  RiskBadge,
} from '@utils/horseHealth';

const { Title, Text } = Typography;
const { TextArea } = Input;

const COUNTRY_OPTIONS = [
  { value: 'VN', label: '🇻🇳 Việt Nam (VN)' },
  { value: 'HK', label: '🇭🇰 Hong Kong (HK)' },
  { value: 'JP', label: '🇯🇵 Nhật Bản (JP)' },
  { value: 'FR', label: '🇫🇷 Pháp (FR)' },
  { value: 'GB', label: '🇬🇧 Vương Quốc Anh (GB)' },
  { value: 'US', label: '🇺🇸 Hoa Kỳ (US)' },
  { value: 'AU', label: '🇦🇺 Úc (AU)' },
  { value: 'TH', label: '🇹🇭 Thái Lan (TH)' },
  { value: 'SG', label: '🇸🇬 Singapore (SG)' },
  { value: 'MY', label: '🇲🇾 Malaysia (MY)' },
  { value: 'CN', label: '🇨🇳 Trung Quốc (CN)' },
  { value: 'KH', label: '🇰🇭 Campuchia (KH)' },
  { value: 'LA', label: '🇱🇦 Lào (LA)' },
  { value: 'AE', label: '🇦🇪 UAE / Dubai (AE)' },
];

const KNOWN_DESTINATIONS = {
  'hong kong': {
    countryCode: 'HK',
    address: 'Sha Tin Racecourse, Shatin, New Territories, Hong Kong (HKG International Airport)',
    defaultMode: 'Air',
  },
  'france': {
    countryCode: 'FR',
    address: 'Hippodrome de Longchamp, Route des Tribunes, Paris, France (CDG Airport)',
    defaultMode: 'Air',
  },
  'japan': {
    countryCode: 'JP',
    address: 'Tokyo Racecourse, Fuchu, Tokyo, Japan (NRT Airport)',
    defaultMode: 'Air',
  },
  'australia': {
    countryCode: 'AU',
    address: 'Flemington Racecourse, Flemington VIC 3031, Australia (SYD / MEL Airport)',
    defaultMode: 'Air',
  },
  'united kingdom': {
    countryCode: 'GB',
    address: 'Ascot Racecourse, High St, Ascot, Berkshire, United Kingdom (LHR Airport)',
    defaultMode: 'Air',
  },
  'united states': {
    countryCode: 'US',
    address: 'Churchill Downs, Central Ave, Louisville, Kentucky, United States (LAX / JFK Airport)',
    defaultMode: 'Air',
  },
  'thailand': {
    countryCode: 'TH',
    address: 'Royal Bangkok Sports Club, Henri Dunant St, Bangkok, Thailand (BKK Airport)',
    defaultMode: 'Air',
  },
  'singapore': {
    countryCode: 'SG',
    address: 'Singapore Turf Club, 1 Turf Club Ave, Singapore (SIN Airport)',
    defaultMode: 'Air',
  },
  'cambodia': {
    countryCode: 'KH',
    address: 'Phnom Penh Equestrian Center, Phnom Penh, Campuchia',
    defaultMode: 'Ground',
  },
  'laos': {
    countryCode: 'LA',
    address: 'Vientiane Equestrian Club, Vientiane, Lào',
    defaultMode: 'Ground',
  },
  'china': {
    countryCode: 'CN',
    address: 'Trường đua Tùng Hóa, TP. Quảng Châu, Trung Quốc (CAN Airport)',
    defaultMode: 'Ground',
  },
  'vietnam': {
    countryCode: 'VN',
    address: 'Trường đua Đại Nam / SVĐ Phú Thọ, TP. Hồ Chí Minh, Việt Nam',
    defaultMode: 'Ground',
  },
};

function resolveDestinationInfo(dest) {
  if (!dest) return null;
  const str = String(dest).toLowerCase();
  for (const [key, info] of Object.entries(KNOWN_DESTINATIONS)) {
    if (str.includes(key)) return info;
  }
  if (str.includes('hkg') || str.includes('hongkong')) return KNOWN_DESTINATIONS['hong kong'];
  if (str.includes('paris') || str.includes('cdg') || str.includes('pháp')) return KNOWN_DESTINATIONS['france'];
  if (str.includes('tokyo') || str.includes('nrt') || str.includes('nhật')) return KNOWN_DESTINATIONS['japan'];
  if (str.includes('sydney') || str.includes('melbourne') || str.includes('syd') || str.includes('úc')) return KNOWN_DESTINATIONS['australia'];
  if (str.includes('london') || str.includes('lhr') || str.includes('anh') || str.includes('uk')) return KNOWN_DESTINATIONS['united kingdom'];
  if (str.includes('usa') || str.includes('lax') || str.includes('jfk') || str.includes('mỹ') || str.includes('america')) return KNOWN_DESTINATIONS['united states'];
  if (str.includes('bangkok') || str.includes('bkk') || str.includes('thái')) return KNOWN_DESTINATIONS['thailand'];
  if (str.includes('campuchia') || str.includes('phnom penh')) return KNOWN_DESTINATIONS['cambodia'];
  if (str.includes('lào') || str.includes('vientiane')) return KNOWN_DESTINATIONS['laos'];
  if (str.includes('quảng châu') || str.includes('shanghai') || str.includes('trung quốc')) return KNOWN_DESTINATIONS['china'];
  if (str.includes('đà nẵng') || str.includes('hồ chí minh') || str.includes('hà nội')) return KNOWN_DESTINATIONS['vietnam'];
  return null;
}

/**
 * Bảng dữ liệu độ khả thi tuyến đường & cước phí công khai tham khảo từ Việt Nam
 */
const ROUTE_DATA = {
  CN: {
    name: 'Trung Quốc (China)',
    ground: {
      available: true,
      priceMin: 2150,
      priceMax: 3500,
      baseFreight: 2800,
      duration: '2 - 5 days',
      desc: 'Xe rơ-moóc chuyên dụng qua cửa khẩu Hữu Nghị / Móng Cái tới Quảng Châu & Tùng Hóa.',
    },
    air: {
      available: true,
      priceMin: 3200,
      priceMax: 4800,
      baseFreight: 4000,
      duration: '1 - 2 days in air',
      desc: 'Chuyên cơ bay thẳng Nội Bài / Tân Sơn Nhất -> Quảng Châu Bạch Vân (CAN).',
    },
    doorToDoor: {
      available: true,
      priceMin: 4650,
      priceMax: 6500,
      baseFreight: 5500,
      duration: '3 - 7 days',
      desc: 'Trọn gói trang trại VN -> Chuồng Tùng Hóa (bao thủ tục hải quan & kiểm dịch hai đầu).',
    },
  },
  LA: {
    name: 'Lào (Laos)',
    ground: {
      available: true,
      priceMin: 1200,
      priceMax: 1800,
      baseFreight: 1500,
      duration: '1 - 2 days',
      desc: 'Xe chuyên dụng qua cửa khẩu Cầu Treo / Lao Bảo tới Vientiane.',
    },
    air: {
      available: true,
      priceMin: 2800,
      priceMax: 3600,
      baseFreight: 3200,
      duration: '1 day in air',
      desc: 'Bay thẳng Vientiane Wattay International Airport.',
    },
    doorToDoor: {
      available: true,
      priceMin: 3400,
      priceMax: 4500,
      baseFreight: 4000,
      duration: '2 - 3 days',
      desc: 'Trọn gói chuồng - chuồng, lo trọn thủ tục xuất nhập cảnh thú y CVI.',
    },
  },
  KH: {
    name: 'Campuchia (Cambodia)',
    ground: {
      available: true,
      priceMin: 1400,
      priceMax: 2100,
      baseFreight: 1800,
      duration: '1 - 2 days',
      desc: 'Xe rơ-moóc chuyên dụng qua cửa khẩu Mộc Bài thẳng tiến Phnom Penh.',
    },
    air: {
      available: true,
      priceMin: 2900,
      priceMax: 3800,
      baseFreight: 3300,
      duration: '1 day in air',
      desc: 'Bay thẳng Phnom Penh International Airport.',
    },
    doorToDoor: {
      available: true,
      priceMin: 3600,
      priceMax: 4800,
      baseFreight: 4200,
      duration: '2 - 4 days',
      desc: 'Trọn gói chuồng - chuồng kèm hỗ trợ kiểm dịch biên giới hai chiều.',
    },
  },
  TH: {
    name: 'Thái Lan (Thailand)',
    ground: {
      available: true,
      priceMin: 2400,
      priceMax: 3600,
      baseFreight: 3000,
      duration: '2 - 3 days',
      desc: 'Hành lang đường bộ quá cảnh Lào / Campuchia tới Bangkok.',
    },
    air: {
      available: true,
      priceMin: 3200,
      priceMax: 4500,
      baseFreight: 3800,
      duration: '1 day in air',
      desc: 'Chuyên cơ bay thẳng Suvarnabhumi Airport (BKK).',
    },
    doorToDoor: {
      available: true,
      priceMin: 4800,
      priceMax: 6500,
      baseFreight: 5600,
      duration: '3 - 5 days',
      desc: 'Trọn gói chuồng - chuồng tới trường đua Hoàng Gia Bangkok, kiểm dịch 7 ngày.',
    },
  },
  HK: {
    name: 'Hong Kong (SAR)',
    ground: {
      available: false,
      reason: 'Tuyến đường bộ không khả dụng do ngăn cách hải phận và quy chế biên giới đặc khu. Quý khách vui lòng chọn Hàng không hoặc Door-to-Door.',
    },
    air: {
      available: true,
      priceMin: 4200,
      priceMax: 5800,
      baseFreight: 4800,
      duration: '1 - 2 days in air',
      desc: 'Chuyên cơ bay thẳng Hong Kong (HKG), chuồng bay IATA LAR giảm xóc.',
    },
    doorToDoor: {
      available: true,
      priceMin: 6400,
      priceMax: 8500,
      baseFreight: 7400,
      duration: '4 - 7 days',
      desc: 'Trọn gói trang trại VN -> Sha Tin Racecourse / Happy Valley (bao hải quan HK & kiểm dịch 7 ngày).',
    },
  },
  JP: {
    name: 'Nhật Bản (Japan)',
    ground: {
      available: false,
      reason: 'Tuyến đường bộ không khả dụng do phân cách bởi đại dương (quốc đảo Nhật Bản).',
    },
    air: {
      available: true,
      priceMin: 5500,
      priceMax: 7200,
      baseFreight: 6200,
      duration: '1 - 2 days in air',
      desc: 'Chuyên cơ bay thẳng Tokyo Narita (NRT) / Osaka (KIX) có trạm kiểm dịch JRA.',
    },
    doorToDoor: {
      available: true,
      priceMin: 8500,
      priceMax: 11000,
      baseFreight: 9800,
      duration: '5 - 10 days',
      desc: 'Trọn gói chuồng - chuồng, quản lý kiểm dịch 10 ngày chuẩn MAFF Nhật Bản.',
    },
  },
  AU: {
    name: 'Úc (Australia)',
    ground: {
      available: false,
      reason: 'Tuyến đường bộ không khả dụng do phân cách bởi đại dương (Châu Úc).',
    },
    air: {
      available: true,
      priceMin: 7800,
      priceMax: 11500,
      baseFreight: 9500,
      duration: '2 - 3 days in air',
      desc: 'Chuyên cơ bay thẳng Sydney (SYD) / Melbourne (MEL) tới khu kiểm dịch Mickleham.',
    },
    doorToDoor: {
      available: true,
      priceMin: 12500,
      priceMax: 16500,
      baseFreight: 14500,
      duration: '7 - 14 days',
      desc: 'Trọn gói chuồng - chuồng kèm kiểm dịch xuất cảnh & 14 ngày kiểm dịch DAFF Úc.',
    },
  },
  FR: {
    name: 'Pháp (France)',
    ground: {
      available: false,
      reason: 'Tuyến đường bộ không khả dụng do khoảng cách liên lục địa (>10,000 km, vượt quá giới hạn an toàn phúc lợi ngựa đua).',
    },
    air: {
      available: true,
      priceMin: 9200,
      priceMax: 14000,
      baseFreight: 11500,
      duration: '2 - 3 days in air',
      desc: 'Chuyên cơ bay thẳng Paris Charles de Gaulle (CDG) chuồng chuẩn FEI.',
    },
    doorToDoor: {
      available: true,
      priceMin: 14800,
      priceMax: 20500,
      baseFreight: 17500,
      duration: '7 - 14 days',
      desc: 'Trọn gói trang trại VN -> Sân bay -> Trường đua Chantilly / Deauville (hải quan EU & CVI trọn gói).',
    },
  },
  GB: {
    name: 'Vương Quốc Anh (United Kingdom)',
    ground: {
      available: false,
      reason: 'Tuyến đường bộ không khả dụng do cự ly liên lục địa và ngăn cách biển.',
    },
    air: {
      available: true,
      priceMin: 9500,
      priceMax: 14500,
      baseFreight: 12000,
      duration: '2 - 3 days in air',
      desc: 'Chuyên cơ bay thẳng London Stansted (STN) / Heathrow (LHR) equine hub.',
    },
    doorToDoor: {
      available: true,
      priceMin: 15200,
      priceMax: 21000,
      baseFreight: 18000,
      duration: '7 - 14 days',
      desc: 'Trọn gói chuồng - chuồng tới Newmarket hoặc trường đua Ascot nổi tiếng.',
    },
  },
  US: {
    name: 'Hoa Kỳ (United States)',
    ground: {
      available: false,
      reason: 'Tuyến đường bộ không khả dụng do phân cách bởi Thái Bình Dương (Hoa Kỳ).',
    },
    air: {
      available: true,
      priceMin: 10500,
      priceMax: 16000,
      baseFreight: 13500,
      duration: '2 - 4 days in air',
      desc: 'Chuyên cơ bay thẳng Los Angeles (LAX), New York (JFK), hoặc Chicago.',
    },
    doorToDoor: {
      available: true,
      priceMin: 16800,
      priceMax: 23500,
      baseFreight: 19800,
      duration: '8 - 15 days',
      desc: 'Trọn gói sang Lexington (KY) / Ocala (FL), hộ tống kiểm dịch USDA 30 ngày.',
    },
  },
  MY: {
    name: 'Malaysia',
    ground: {
      available: false,
      reason: 'Tuyến đường bộ không khả dụng do không có tuyến đường bộ liền mạch an toàn từ Việt Nam qua hải phận bán đảo.',
    },
    air: {
      available: true,
      priceMin: 3500,
      priceMax: 4800,
      baseFreight: 4200,
      duration: '1 - 2 days in air',
      desc: 'Chuyên cơ bay thẳng Kuala Lumpur (KUL) equine facility.',
    },
    doorToDoor: {
      available: true,
      priceMin: 5600,
      priceMax: 7200,
      baseFreight: 6400,
      duration: '3 - 6 days',
      desc: 'Trọn gói chuồng - chuồng tới Selangor Turf Club.',
    },
  },
  SG: {
    name: 'Singapore',
    ground: {
      available: false,
      reason: 'Tuyến đường bộ không khả dụng do ngăn cách bởi eo biển và quy chế kiểm dịch đảo quốc.',
    },
    air: {
      available: true,
      priceMin: 3800,
      priceMax: 5000,
      baseFreight: 4400,
      duration: '1 - 2 days in air',
      desc: 'Chuyên cơ bay thẳng Singapore Changi (SIN).',
    },
    doorToDoor: {
      available: true,
      priceMin: 6000,
      priceMax: 7800,
      baseFreight: 6900,
      duration: '3 - 6 days',
      desc: 'Trọn gói chuồng - chuồng với trạm kiểm dịch AVS Singapore.',
    },
  },
  DEFAULT: {
    name: 'Quốc tế (International)',
    ground: {
      available: false,
      reason: 'Không khả dụng đường bộ cho tuyến này do khoảng cách địa lý. Vui lòng chọn Hàng không hoặc Door-to-Door.',
    },
    air: {
      available: true,
      priceMin: 6000,
      priceMax: 9000,
      baseFreight: 7500,
      duration: '2 - 3 days in air',
      desc: 'Chuyên cơ hàng không quốc tế tiêu chuẩn chuồng IATA LAR.',
    },
    doorToDoor: {
      available: true,
      priceMin: 9500,
      priceMax: 14000,
      baseFreight: 11500,
      duration: '5 - 12 days',
      desc: 'Trọn gói chuồng - chuồng đa phương thức kết hợp đường bộ và hàng không.',
    },
  },
};

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
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Danh sách ngựa của khách hàng
  const [availableHorses, setAvailableHorses] = useState([]);
  const [loadingHorses, setLoadingHorses] = useState(true);

  // Phân tích thông tin điền sẵn từ chuyến đã chọn
  const rawDest =
    initialValues?.destination ||
    initialValues?.dropoffAddress ||
    initialValues?.dest ||
    '';
  const destInfo = resolveDestinationInfo(rawDest);

  const initialMode = (() => {
    const rawMode = (
      initialValues?.transportMode ||
      initialValues?.modes ||
      destInfo?.defaultMode ||
      'Air'
    ).toLowerCase();
    if (rawMode.includes('door')) return 'DoorToDoor';
    if (rawMode.includes('ground') || rawMode.includes('road')) return 'Ground';
    return 'Air';
  })();

  const initialDropoffCountry =
    initialValues?.dropoffCountryCode ||
    destInfo?.countryCode ||
    'HK';

  const initialDropoffAddress =
    initialValues?.dropoffAddress ||
    destInfo?.address ||
    (rawDest ? `${rawDest} International Terminal` : 'Sha Tin Racecourse, Shatin, New Territories, Hong Kong (HKG Airport)');

  // State các ngựa được chọn và cấu hình chuồng
  const [selectedHorseIds, setSelectedHorseIds] = useState([]);
  const [stallClasses, setStallClasses] = useState({});
  const [horseNotes, setHorseNotes] = useState({});

  const {
    control,
    trigger,
    getValues,
    setValue,
  } = useForm({
    defaultValues: {
      PickupAddress: initialValues?.pickupAddress || 'Trang trại Yên Bài, Ba Vì, Hà Nội',
      PickupCountryCode: initialValues?.pickupCountryCode || 'VN',
      DropoffAddress: initialDropoffAddress,
      DropoffCountryCode: initialDropoffCountry,
      DepartureDate: initialValues?.departureDate || dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm:ssZ'),
      DeliveryDate: initialValues?.deliveryDate || dayjs().add(9, 'day').format('YYYY-MM-DDTHH:mm:ssZ'),
      TransportMode: initialMode,
      InsurancePackage: initialValues?.insurancePackage || 'comprehensive',
      DeclaredValue: initialValues?.declaredValue || 50000,
      RequiresClimateControl: initialValues?.optClimateControl !== undefined ? initialValues.optClimateControl : true,
      IsExpress: initialValues?.optExpress !== undefined ? initialValues.optExpress : false,
      RequiresVetEscort: initialValues?.requiresVetEscort !== undefined ? initialValues.requiresVetEscort : false,
      FeedingCarePlan: initialValues?.feedingCarePlan || 'Timothy hay 3x daily, electrolyte bucket & hydration checks every 4 hours.',
      SpecialInstructions: initialValues?.specialInstructions || '',
    },
    mode: 'onTouched',
  });

  const dropoffCountry = useWatch({ control, name: 'DropoffCountryCode' });
  const transportMode = useWatch({ control, name: 'TransportMode' });
  const insurancePackage = useWatch({ control, name: 'InsurancePackage' });
  const requiresClimate = useWatch({ control, name: 'RequiresClimateControl' });
  const isExpress = useWatch({ control, name: 'IsExpress' });
  const requiresVetEscort = useWatch({ control, name: 'RequiresVetEscort' });

  // Thông tin cước & độ khả dụng tuyến đường theo quốc gia đến
  const routeData = ROUTE_DATA[dropoffCountry] || ROUTE_DATA.DEFAULT;
  const isGroundAvailable = Boolean(routeData.ground?.available);

  // Tự động chuyển mode nếu chuyển sang quốc gia không hỗ trợ Ground
  useEffect(() => {
    if (!isGroundAvailable && transportMode === 'Ground') {
      setValue('TransportMode', 'Air');
    }
  }, [dropoffCountry, isGroundAvailable, transportMode, setValue]);

  // Tải danh sách ngựa của user khi mở wizard, tự động dự phòng dữ liệu nếu API chưa sẵn sàng
  useEffect(() => {
    let isSubscribed = true;
    const ownerId = user?.userId || user?.UserID;

    const loadHorsesData = async () => {
      setLoadingHorses(true);
      let horsesList = [];
      try {
        const res = await horseService.getHorses({ ownerId: ownerId || undefined });
        const fetched = res?.data?.data || res?.data;
        if (Array.isArray(fetched) && fetched.length > 0) {
          horsesList = fetched;
        } else {
          horsesList = getStoredHorses();
        }
      } catch (err) {
        console.warn('Lỗi kết nối horseService, tải hồ sơ ngựa từ bộ nhớ cục bộ:', err);
        horsesList = getStoredHorses();
      }

      if (!isSubscribed) return;
      setAvailableHorses(horsesList);

      if (horsesList.length > 0) {
        // Ưu tiên chọn những chú ngựa đủ điều kiện di chuyển (không bị CRITICAL)
        const eligible = horsesList.filter((h) => {
          const risk = calculateHorseRisk(h, i18n?.language || 'vi');
          return risk.level !== 'CRITICAL';
        });
        const pool = eligible.length > 0 ? eligible : horsesList;
        const requestedCount = Number(initialValues?.totalHorses) || 1;
        const chosenHorses = pool.slice(0, requestedCount);
        const chosenIds = chosenHorses.map((h) => h.horseId || h.HorseID);

        setSelectedHorseIds(chosenIds);

        const newStallClasses = {};
        chosenHorses.forEach((h, idx) => {
          const hId = h.horseId || h.HorseID;
          if (initialValues?.calcHorses && initialValues.calcHorses[idx]?.stallClass) {
            const sc = initialValues.calcHorses[idx].stallClass.toLowerCase();
            newStallClasses[hId] = sc === 'private' ? 'Private' : sc === 'comfort' ? 'Comfort' : 'Shared';
          } else if (initialValues?.stallClass) {
            const sc = initialValues.stallClass.toLowerCase();
            newStallClasses[hId] = sc === 'private' ? 'Private' : sc === 'shared' ? 'Shared' : 'Comfort';
          } else {
            newStallClasses[hId] = 'Comfort';
          }
        });
        setStallClasses(newStallClasses);
      }
      setLoadingHorses(false);
    };

    loadHorsesData();

    return () => {
      isSubscribed = false;
    };
  }, [user, initialValues, i18n]);

  // Toggle chọn cá thể ngựa (Chặn nếu ngựa ở mức rủi ro nguy cấp Critical/Non-Fit-to-Travel)
  const handleToggleHorse = (horseId) => {
    const targetHorse = availableHorses.find((h) => (h.horseId || h.HorseID) === horseId);
    if (targetHorse) {
      const risk = calculateHorseRisk(targetHorse, i18n?.language || 'vi');
      if (risk.level === 'CRITICAL') {
        message.error(
          (i18n?.language || 'vi').startsWith('en')
            ? 'Cannot select this horse: Non-Fit-to-Travel due to critical medical condition.'
            : 'Không thể chọn chú ngựa này: Rủi ro nguy cấp/chấn thương, cấm vận chuyển (Non-Fit-to-Travel)!'
        );
        return;
      }
    }
    setSelectedHorseIds((prev) => {
      if (prev.includes(horseId)) {
        return prev.filter((id) => id !== horseId);
      }
      setStallClasses((s) => ({ ...s, [horseId]: s[horseId] || 'Comfort' }));
      return [...prev, horseId];
    });
  };

  // Tính toán bảng phân tích chi phí dự kiến minh bạch
  const { quoteItems, totalCost } = useMemo(() => {
    const horseCount = selectedHorseIds.length || 1;
    const items = [];

    // 1. Cước vận chuyển chính theo phương thức & điểm đến
    let baseFreightRate;
    let freightName;
    let freightCode;

    if (transportMode === 'DoorToDoor') {
      baseFreightRate = routeData.doorToDoor?.baseFreight || 7500;
      freightName = 'Cước Trọn gói Door-to-Door (Chuồng - Chuồng đa phương thức)';
      freightCode = 'FREIGHT_DOOR_TO_DOOR';
    } else if (transportMode === 'Air') {
      baseFreightRate = routeData.air?.baseFreight || 4800;
      freightName = 'Cước Chuyên cơ Hàng không Quốc tế (Air Freight - IATA LAR)';
      freightCode = 'FREIGHT_AIR';
    } else {
      baseFreightRate = routeData.ground?.baseFreight || 2800;
      freightName = 'Cước Vận chuyển Mặt đất (Ground Transport - Trailer Chuyên dụng)';
      freightCode = 'FREIGHT_GROUND';
    }

    items.push({
      key: 'freight',
      code: freightCode,
      name: freightName,
      qty: horseCount,
      unitPrice: baseFreightRate,
      amount: horseCount * baseFreightRate,
    });

    // 2. Phụ phí hạng chuồng (Stall Class)
    let stallSurcharge = 0;
    selectedHorseIds.forEach((id) => {
      const cls = stallClasses[id] || 'Shared';
      if (cls === 'Comfort') stallSurcharge += 200;
      if (cls === 'Private') stallSurcharge += 500;
    });
    if (stallSurcharge > 0) {
      items.push({
        key: 'stall',
        code: 'SUR_STALL_CLASS',
        name: 'Phụ phí nâng hạng chuồng vận chuyển (Comfort / Private)',
        qty: 1,
        unitPrice: stallSurcharge,
        amount: stallSurcharge,
      });
    }

    // 3. Bảo hiểm hành trình theo gói (Trip Insurance Packages)
    if (insurancePackage && insurancePackage !== 'none') {
      let insPricePerHorse = 0;
      let insName = 'Bảo hiểm hành trình';
      if (insurancePackage === 'trip') {
        insPricePerHorse = 10;
        insName = 'Bảo hiểm Gián đoạn & Trì hoãn (Trip Protection - $10/ngựa)';
      } else if (insurancePackage === 'cargo') {
        insPricePerHorse = 5;
        insName = 'Bảo hiểm Trang thiết bị & Hàng hóa (Cargo Coverage - $5/ngựa)';
      } else if (insurancePackage === 'mortality') {
        insPricePerHorse = 25;
        insName = 'Bảo hiểm Tử vong & Thương tật (Mortality Coverage - $25/ngựa)';
      } else if (insurancePackage === 'comprehensive') {
        insPricePerHorse = 36; // ($10 + $5 + $25) - 10% bundle discount
        insName = 'Gói Bảo hiểm Toàn diện Siêu tiết kiệm (Comprehensive - $36/ngựa)';
      }

      items.push({
        key: 'insurance',
        code: `INS_${insurancePackage.toUpperCase()}`,
        name: insName,
        qty: horseCount,
        unitPrice: insPricePerHorse,
        amount: horseCount * insPricePerHorse,
      });
    }

    // 4. Các tiện ích bổ sung với giá niêm yết công khai
    if (requiresClimate) {
      const climateFee = 350;
      items.push({
        key: 'climate',
        code: 'SUR_CLIMATE',
        name: '❄️ Điều hòa buồng lái ổn định nhiệt độ (16-19°C)',
        qty: 1,
        unitPrice: climateFee,
        amount: climateFee,
      });
    }

    if (isExpress) {
      const expressFee = 650;
      items.push({
        key: 'express',
        code: 'SUR_EXPRESS',
        name: '⚡ Dịch vụ Vận chuyển Hỏa tốc & Luồng xanh Hải quan (Express Dispatch)',
        qty: 1,
        unitPrice: expressFee,
        amount: expressFee,
      });
    }

    if (requiresVetEscort) {
      const vetFee = 500;
      items.push({
        key: 'vetEscort',
        code: 'SUR_VET_ESCORT',
        name: '🩺 Bác sĩ thú y chuyên trách áp tải hành trình (Dedicated Vet Escort)',
        qty: 1,
        unitPrice: vetFee,
        amount: vetFee,
      });
    }

    // 5. Phí thủ tục kiểm dịch & thông quan hải quan quốc tế
    if (transportMode !== 'DoorToDoor') {
      const clearanceFeePerHorse = transportMode === 'Air' ? 350 : 250;
      items.push({
        key: 'clearance',
        code: 'FEE_CLEARANCE',
        name: 'Phí thủ tục kiểm dịch & chứng thư CVI quốc tế',
        qty: horseCount,
        unitPrice: clearanceFeePerHorse,
        amount: horseCount * clearanceFeePerHorse,
      });
    } else {
      items.push({
        key: 'clearance_included',
        code: 'FEE_CLEARANCE_INCLUDED',
        name: 'Thủ tục hải quan & Giấy phép CVI (Đã bao gồm trọn gói trong Door-to-Door)',
        qty: horseCount,
        unitPrice: 0,
        amount: 0,
      });
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return { quoteItems: items, totalCost: total };
  }, [selectedHorseIds, stallClasses, transportMode, requiresClimate, isExpress, requiresVetEscort, insurancePackage, routeData]);

  // Cho phép chuyển bước trực tiếp khi click vào các tab Stepper
  const handleStepClick = async (targetStep) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    // Khi muốn nhảy tiến lên các bước sau, kiểm tra điều kiện cần thiết
    if (currentStep === 0 || targetStep >= 1) {
      const isWhereValid = await trigger([
        'PickupAddress',
        'PickupCountryCode',
        'DropoffAddress',
        'DropoffCountryCode',
      ]);
      if (!isWhereValid) {
        message.warning('Vui lòng hoàn tất thông tin địa điểm đón và giao (Where) trước.');
        return;
      }
    }
    if (targetStep >= 2) {
      if (selectedHorseIds.length === 0) {
        message.warning(t('bookings.selectAtLeastOneHorse') || 'Vui lòng chọn ít nhất 1 cá thể ngựa (What) để tiếp tục.');
        return;
      }
      if (transportMode === 'Ground' && !isGroundAvailable) {
        message.warning('Tuyến đường này không hỗ trợ vận chuyển đường bộ (Ground). Vui lòng chọn Air Freight hoặc Door-to-Door.');
        return;
      }
    }
    if (targetStep >= 3) {
      const isWhenValid = await trigger(['DepartureDate', 'DeliveryDate']);
      if (!isWhenValid) {
        message.warning('Vui lòng kiểm tra lại ngày vận chuyển (When).');
        return;
      }
    }
    setCurrentStep(targetStep);
  };

  // Chuyển sang bước kế tiếp sau khi kiểm tra hợp lệ
  const handleNext = async () => {
    if (currentStep === 0) {
      const isValid = await trigger([
        'PickupAddress',
        'PickupCountryCode',
        'DropoffAddress',
        'DropoffCountryCode',
      ]);
      if (!isValid) {
        message.warning('Vui lòng kiểm tra và điền đầy đủ địa chỉ đón và giao.');
        return;
      }
    }

    if (currentStep === 1) {
      if (selectedHorseIds.length === 0) {
        message.warning(t('bookings.selectAtLeastOneHorse') || 'Vui lòng chọn ít nhất 1 cá thể ngựa đủ điều kiện để tiếp tục.');
        return;
      }
      if (transportMode === 'Ground' && !isGroundAvailable) {
        message.warning('Tuyến đường này không hỗ trợ vận chuyển đường bộ (Ground). Vui lòng chọn Air Freight hoặc Door-to-Door.');
        return;
      }
    }

    if (currentStep === 2) {
      const isValid = await trigger(['DepartureDate', 'DeliveryDate']);
      if (!isValid) {
        message.warning('Vui lòng chọn ngày khởi hành hợp lệ.');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Submit toàn bộ đơn đặt chuyến
  const handleFinalSubmit = async () => {
    const values = getValues();
    const payload = {
      pickupAddress: values.PickupAddress?.trim() || values.pickupAddress?.trim(),
      pickupCountryCode: values.PickupCountryCode || values.pickupCountryCode,
      dropoffAddress: values.DropoffAddress?.trim() || values.dropoffAddress?.trim(),
      dropoffCountryCode: values.DropoffCountryCode || values.dropoffCountryCode,
      departureDate: values.DepartureDate || values.departureDate,
      deliveryDate: values.DeliveryDate || values.deliveryDate || values.DepartureDate || values.departureDate,
      transportMode: values.TransportMode || values.transportMode,
      insurancePackage: values.InsurancePackage || values.insurancePackage,
      requiresClimateControl: Boolean(values.RequiresClimateControl ?? values.requiresClimateControl),
      isExpress: Boolean(values.IsExpress ?? values.isExpress),
      requiresVetEscort: Boolean(values.RequiresVetEscort ?? values.requiresVetEscort),
      feedingCarePlan: (values.FeedingCarePlan || values.feedingCarePlan)?.trim() || null,
      declaredValue: Number(values.DeclaredValue || values.declaredValue) || null,
      specialInstructions: (values.SpecialInstructions || values.specialInstructions)?.trim() || null,
      totalHorses: selectedHorseIds.length,
      estimatedCost: totalCost,
      currencyCode: 'USD',
      quoteLines: quoteItems,
      quoteBreakdown: JSON.stringify(quoteItems),
      horses: selectedHorseIds.map((hId) => ({
        horseId: Number(hId),
        stallClass: stallClasses[hId] || 'Shared',
        notes: horseNotes[hId]?.trim() || null,
      })),
      bookingHorses: selectedHorseIds.map((hId) => ({
        horseId: Number(hId),
        stallClass: stallClasses[hId] || 'Shared',
        notes: horseNotes[hId]?.trim() || null,
      })),
    };

    await onSubmit(payload);
  };

  // Cấu hình các bước Stepper đúng 100% Figma
  const stepItems = [
    { title: 'Where', icon: <EnvironmentOutlined /> },
    { title: 'What', icon: <CheckOutlined /> },
    { title: 'When', icon: <CalendarOutlined /> },
    { title: 'Review', icon: <DollarOutlined /> },
  ];

  return (
    <Card
      bordered
      style={{
        borderRadius: 18,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        borderColor: '#e2e8f0',
      }}
      styles={{ body: { padding: '22px 26px' } }}
    >
      {/* HEADER VỚI NÚT QUAY LẠI VÀ SUBTITLE THEO FIGMA */}
      <div style={{ marginBottom: 18 }}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
          <Flex align="center" gap={10}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  padding: 0,
                  transition: 'all 0.2s',
                }}
              >
                ←
              </button>
            )}
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: 18 }}>
                Book Transport
              </Title>
              <Text style={{ fontSize: 12.5, color: '#64748b' }}>
                {currentStep === 0 && 'Pickup & destination'}
                {currentStep === 1 && 'Horses & Transport mode'}
                {currentStep === 2 && 'Dates, Insurance & Amenities'}
                {currentStep === 3 && 'Quote & Confirmation'}
              </Text>
            </div>
          </Flex>
          <Tag color="gold" style={{ fontWeight: 700, borderRadius: 9999, padding: '2px 10px' }}>
            Bước {currentStep + 1} / 4
          </Tag>
        </Flex>
      </div>

      {/* BANNER THÔNG BÁO TỰ ĐỘNG ĐIỀN THÔNG TIN TỪ CHUYẾN ĐÃ CHỌN */}
      {Boolean(initialValues?.destination || initialValues?.dest || initialValues?.transportMode || initialValues?.dropoffAddress) && (
        <Alert
          message={
            <Flex align="center" gap={8} wrap="wrap">
              <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: 13 }}>
                ✨ Thông tin chuyến đi đã được tự động điền sẵn:
              </span>
              <Tag color="blue" style={{ fontWeight: 700, margin: 0 }}>
                {initialMode === 'DoorToDoor'
                  ? '🌐 Trọn gói Door-to-Door'
                  : initialMode === 'Air'
                  ? '✈️ Hàng không (Air Flight)'
                  : '🚛 Đường bộ (Ground Truck)'}
              </Tag>
              <Tag color="gold" style={{ fontWeight: 700, margin: 0 }}>
                📍 {rawDest || destInfo?.address || 'Điểm đến đã chọn'}
              </Tag>
              <Tag color="green" style={{ fontWeight: 700, margin: 0 }}>
                🐎 {initialValues?.totalHorses || 1} ngựa
              </Tag>
            </Flex>
          }
          description={<span style={{ fontSize: 12 }}>Hệ thống đã tự động điền địa chỉ giao nhận quốc tế, phương thức vận chuyển và cấu hình chuồng trại tương ứng.</span>}
          type="info"
          showIcon
          closable
          style={{
            marginBottom: 18,
            borderRadius: 12,
            border: '1px solid #bfdbfe',
            backgroundColor: '#eff6ff',
            padding: '10px 14px',
          }}
        />
      )}

      {/* THANH TIẾN TRÌNH 4 BƯỚC FIGMA: Where -> What -> When -> Review */}
      <Steps
        current={currentStep}
        onChange={handleStepClick}
        items={stepItems.map((item) => ({
          ...item,
          style: { cursor: 'pointer' },
        }))}
        style={{ marginBottom: 22 }}
      />

      {/* ======================================================== */}
      {/* BƯỚC 1: WHERE (LỘ TRÌNH ĐÓN & GIAO) */}
      {/* ======================================================== */}
      {currentStep === 0 && (
        <div>
          <Title level={5} style={{ margin: '0 0 14px', fontWeight: 800, color: '#0f172a' }}>
            {t('bookings.stepWhereTitle') || 'Pickup & destination locations'}
          </Title>

          <Row gutter={16}>
            {/* Điểm đón */}
            <Col xs={24} md={12}>
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  marginBottom: 12,
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Tag color="orange" style={{ marginBottom: 10, fontWeight: 700 }}>
                  📍 {t('bookings.fields.pickupLocation') || 'ĐIỂM ĐÓN (PICKUP)'}
                </Tag>

                <Controller
                  name="PickupCountryCode"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Form.Item label={t('bookings.fields.pickupCountry') || 'Quốc gia xuất phát'} required style={{ marginBottom: 12 }}>
                      <Select {...field} size="large" options={COUNTRY_OPTIONS} />
                    </Form.Item>
                  )}
                />

                <Controller
                  name="PickupAddress"
                  control={control}
                  rules={{ required: t('bookings.validation.pickupRequired') || 'Vui lòng nhập địa chỉ đón' }}
                  render={({ field, fieldState: { error } }) => (
                    <Form.Item
                      label={t('bookings.fields.pickupAddress') || 'Địa chỉ đón chi tiết'}
                      required
                      validateStatus={error ? 'error' : ''}
                      help={error?.message}
                      style={{ marginBottom: 4 }}
                    >
                      <Input
                        {...field}
                        size="large"
                        placeholder="Ví dụ: Trang trại Yên Bài, Ba Vì, Hà Nội"
                      />
                    </Form.Item>
                  )}
                />
              </Card>
            </Col>

            {/* Điểm giao */}
            <Col xs={24} md={12}>
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  marginBottom: 12,
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Tag color="green" style={{ marginBottom: 10, fontWeight: 700 }}>
                  🏁 {t('bookings.fields.deliveryLocation') || 'ĐIỂM GIAO (DROPOFF)'}
                </Tag>

                <Controller
                  name="DropoffCountryCode"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Form.Item label={t('bookings.fields.dropoffCountry') || 'Quốc gia đến'} required style={{ marginBottom: 12 }}>
                      <Select {...field} size="large" options={COUNTRY_OPTIONS} />
                    </Form.Item>
                  )}
                />

                <Controller
                  name="DropoffAddress"
                  control={control}
                  rules={{ required: t('bookings.validation.dropoffRequired') || 'Vui lòng nhập địa chỉ giao' }}
                  render={({ field, fieldState: { error } }) => (
                    <Form.Item
                      label={t('bookings.fields.dropoffAddress') || 'Địa chỉ giao chi tiết'}
                      required
                      validateStatus={error ? 'error' : ''}
                      help={error?.message}
                      style={{ marginBottom: 4 }}
                    >
                      <Input
                        {...field}
                        size="large"
                        placeholder="Ví dụ: Sha Tin Racecourse, Hong Kong hoặc Trường đua Tùng Hóa"
                      />
                    </Form.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 2: WHAT (KHỚP FIGMA: Which horses are traveling? & How will your horse travel?) */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div>
          {/* PHẦN 1: WHICH HORSES ARE TRAVELING? */}
          <div style={{ marginBottom: 36 }}>
            <Title level={4} style={{ margin: '0 0 6px', fontWeight: 800, color: '#0f172a' }}>
              Which horses are traveling?
            </Title>
            <Text style={{ color: '#64748b', fontSize: 13, display: 'block', marginBottom: 20 }}>
              Select one or more horses for this trip.
            </Text>

            {selectedHorseIds.length === 0 && (
              <Alert
                type="warning"
                showIcon
                message={t('bookings.validation.selectHorseRequired') || 'Vui lòng chọn ít nhất 1 cá thể ngựa để tiếp tục'}
                style={{ marginBottom: 20, borderRadius: 10 }}
              />
            )}

            {loadingHorses ? (
              <Text type="secondary">{t('common.loading')}</Text>
            ) : availableHorses.length === 0 ? (
              <Alert
                type="info"
                message={t('horses.emptyText') || 'Chưa có hồ sơ ngựa nào'}
                description={t('bookings.noHorsesHint') || 'Vui lòng thêm ngựa vào hồ sơ trước khi tạo đơn đặt chuyến.'}
                style={{ borderRadius: 10 }}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {availableHorses.map((horse) => {
                  const horseId = horse.horseId || horse.HorseID;
                  const isSelected = selectedHorseIds.includes(horseId);
                  const horseName = horse.name || horse.Name;
                  const horseBreed = horse.breed || horse.Breed;
                  const horseGender = horse.gender || horse.Gender;
                  const horseMicrochip = horse.microchipNumber || horse.MicrochipNumber;
                  const horseRisk = calculateHorseRisk(horse, i18n?.language || 'vi');
                  const isCritical = horseRisk.level === 'CRITICAL';

                  return (
                    <Col key={horseId} xs={24} md={12}>
                      <div
                        style={{
                          padding: 18,
                          borderRadius: 16,
                          border: isCritical
                            ? '1.5px solid #FECACA'
                            : isSelected
                            ? '2.5px solid #F59E0B'
                            : '1.5px solid #E2E8F0',
                          backgroundColor: isCritical
                            ? '#FEF2F2'
                            : isSelected
                            ? '#FFFBEB'
                            : '#FFFFFF',
                          cursor: isCritical ? 'not-allowed' : 'pointer',
                          opacity: isCritical ? 0.88 : 1,
                          transform: isSelected && !isCritical ? 'scale(1.02)' : 'scale(1)',
                          boxShadow: isSelected && !isCritical
                            ? '0 8px 24px rgba(245, 158, 11, 0.22)'
                            : '0 2px 8px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onClick={() => !isCritical && handleToggleHorse(horseId)}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                          <Checkbox
                            checked={!isCritical && isSelected}
                            disabled={isCritical}
                            onChange={() => !isCritical && handleToggleHorse(horseId)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <strong
                              style={{
                                fontSize: 16,
                                color: isCritical ? '#991B1B' : isSelected ? '#92400E' : '#0F172A',
                                marginLeft: 4,
                              }}
                            >
                              🐴 {horseName}
                            </strong>
                          </Checkbox>
                          <Space size={6}>
                            {isSelected && !isCritical && (
                              <Tag color="gold" style={{ fontWeight: 800, borderRadius: 9999 }}>
                                ✓ Đã chọn
                              </Tag>
                            )}
                            <RiskBadge risk={horseRisk} size="small" />
                            <Tag color="blue">{horseBreed}</Tag>
                          </Space>
                        </Flex>

                        <div style={{ fontSize: 13, color: isCritical ? '#991B1B' : '#64748b', marginLeft: 28, marginBottom: 8 }}>
                          {t(`horses.genderOptions.${horseGender?.toLowerCase()}`) || horseGender} · {t('horses.fields.microchip')}:{' '}
                          <code>{horseMicrochip || '---'}</code>
                        </div>

                        {isCritical && (
                          <div
                            style={{
                              marginLeft: 28,
                              marginTop: 6,
                              padding: '6px 12px',
                              backgroundColor: '#FEE2E2',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#991B1B',
                            }}
                          >
                            ⛔ {(i18n?.language || 'vi').startsWith('en')
                              ? 'Non-Fit-to-Travel: Critical medical risk, prohibited from transport.'
                              : 'Cấm vận chuyển: Rủi ro nguy cấp hoặc chấn thương, không đủ điều kiện an toàn bay.'}
                          </div>
                        )}

                        {/* Tùy chọn hạng chuồng khi được tick chọn */}
                        {isSelected && (
                          <div
                            style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: '1px dashed #e2e8f0',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Row gutter={12}>
                              <Col span={12}>
                                <Form.Item
                                  label={<span style={{ fontSize: 12 }}>{t('bookings.stallClass')}</span>}
                                  style={{ margin: 0 }}
                                >
                                  <Select
                                    value={stallClasses[horseId] || 'Comfort'}
                                    onChange={(val) =>
                                      setStallClasses((prev) => ({ ...prev, [horseId]: val }))
                                    }
                                    options={[
                                      { value: 'Shared', label: 'Shared (× 1.0)' },
                                      { value: 'Comfort', label: 'Comfort (× 1.4)' },
                                      { value: 'Private', label: 'Private (× 2.2)' },
                                    ]}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item
                                  label={<span style={{ fontSize: 12 }}>{t('bookings.stallClassNotes')}</span>}
                                  style={{ margin: 0 }}
                                >
                                  <Input
                                    value={horseNotes[horseId] || ''}
                                    onChange={(e) =>
                                      setHorseNotes((prev) => ({
                                        ...prev,
                                        [horseId]: e.target.value,
                                      }))
                                    }
                                    placeholder={t('bookings.stallClassPlaceholder')}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>
                        )}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </div>

          <Divider style={{ margin: '20px 0 16px' }} />

          {/* PHẦN 2: HOW WILL YOUR HORSE TRAVEL? (3 HÌNH THỨC + KIỂM TRA ĐỘ KHẢ THI + CÔNG KHAI GIÁ) */}
          <div>
            <Title level={5} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0f172a' }}>
              How will your horse travel?
            </Title>
            <Text style={{ color: '#64748b', fontSize: 12.5, display: 'block', marginBottom: 14 }}>
              Phương thức vận chuyển phù hợp cho tuyến tới: <strong>{routeData.name}</strong>
            </Text>

            <Controller
              name="TransportMode"
              control={control}
              render={({ field }) => {
                const isGround = field.value === 'Ground';
                const isAir = field.value === 'Air';
                const isDoor = field.value === 'DoorToDoor';

                return (
                  <Row gutter={[14, 14]}>
                    {/* OPTION 1: GROUND TRANSPORT */}
                    <Col xs={24} md={8}>
                      <div
                        onClick={() => {
                          if (isGroundAvailable) field.onChange('Ground');
                        }}
                        style={{
                          backgroundColor: !isGroundAvailable
                            ? '#f8fafc'
                            : isGround
                            ? '#FFFBEB'
                            : '#FFFFFF',
                          border: !isGroundAvailable
                            ? '1.5px dashed #cbd5e1'
                            : isGround
                            ? '2px solid #F59E0B'
                            : '1.5px solid #E2E8F0',
                          borderRadius: 14,
                          padding: '16px 16px',
                          cursor: isGroundAvailable ? 'pointer' : 'not-allowed',
                          opacity: isGroundAvailable ? 1 : 0.65,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isGround && isGroundAvailable
                            ? '0 6px 18px rgba(245, 158, 11, 0.18)'
                            : '0 1px 3px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div>
                          <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: isGround ? '#FEF3C7' : '#F1F5F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                color: isGround ? '#D97706' : '#64748B',
                              }}
                            >
                              <CarOutlined />
                            </div>
                            <Space size={4}>
                              {isGround && isGroundAvailable && (
                                <Tag color="gold" style={{ fontWeight: 800, margin: 0, borderRadius: 9999 }}>
                                  ✓ Đã chọn
                                </Tag>
                              )}
                              {isGroundAvailable ? (
                                <Tag color="blue" style={{ fontWeight: 700, margin: 0 }}>Phổ biến</Tag>
                              ) : (
                                <Tag color="error" style={{ fontWeight: 700, margin: 0 }}>Không hỗ trợ</Tag>
                              )}
                            </Space>
                          </Flex>

                          <strong style={{ fontSize: 15, color: isGround ? '#92400E' : '#0F172A', display: 'block' }}>
                            Ground Transport
                          </strong>
                          <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
                            Xe thùng chuyên dụng
                          </span>
                          <Text style={{ fontSize: 12, color: '#475569', display: 'block', lineHeight: 1.4 }}>
                            {isGroundAvailable
                              ? 'Đón và giao tận chuồng, thùng xe đệm êm, kiểm soát camera & GPS lộ trình.'
                              : 'Không khả dụng do ngăn cách biển/đại dương hoặc cự ly vượt giới hạn.'}
                          </Text>
                        </div>

                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
                          <Flex justify="space-between" align="baseline">
                            <span style={{ fontSize: 12, color: '#64748b' }}>{isGroundAvailable ? routeData.ground?.duration : 'N/A'}</span>
                            {isGroundAvailable && (
                              <strong style={{ fontSize: 15, color: '#d97706' }}>
                                ${routeData.ground?.priceMin?.toLocaleString()} - ${routeData.ground?.priceMax?.toLocaleString()}
                              </strong>
                            )}
                          </Flex>
                        </div>
                      </div>
                    </Col>

                    {/* OPTION 2: AIR FREIGHT */}
                    <Col xs={24} md={8}>
                      <div
                        onClick={() => field.onChange('Air')}
                        style={{
                          backgroundColor: isAir ? '#FFFBEB' : '#FFFFFF',
                          border: isAir ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 14,
                          padding: '16px 16px',
                          cursor: 'pointer',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isAir
                            ? '0 6px 18px rgba(245, 158, 11, 0.18)'
                            : '0 1px 3px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div>
                          <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: isAir ? '#FEF3C7' : '#F1F5F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                color: isAir ? '#D97706' : '#64748B',
                              }}
                            >
                              <RocketOutlined />
                            </div>
                            <Space size={4}>
                              {isAir && (
                                <Tag color="gold" style={{ fontWeight: 800, margin: 0, borderRadius: 9999 }}>
                                  ✓ Đã chọn
                                </Tag>
                              )}
                              <Tag color="cyan" style={{ fontWeight: 700, margin: 0 }}>Nhanh nhất</Tag>
                            </Space>
                          </Flex>

                          <strong style={{ fontSize: 15, color: isAir ? '#92400E' : '#0F172A', display: 'block' }}>
                            Air Freight
                          </strong>
                          <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
                            Chuyên cơ hàng không quốc tế
                          </span>
                          <Text style={{ fontSize: 12, color: '#475569', display: 'block', lineHeight: 1.4 }}>
                            Chuyên cơ chuẩn IATA LAR, buồng ổn định áp suất & nhiệt độ, nhân viên chăm sóc bay cùng.
                          </Text>
                        </div>

                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
                          <Flex justify="space-between" align="baseline">
                            <span style={{ fontSize: 12, color: '#64748b' }}>{routeData.air?.duration || '1 - 2 ngày'}</span>
                            <strong style={{ fontSize: 15, color: '#2563eb' }}>
                              ${routeData.air?.priceMin?.toLocaleString()} - ${routeData.air?.priceMax?.toLocaleString()}
                            </strong>
                          </Flex>
                        </div>
                      </div>
                    </Col>

                    {/* OPTION 3: DOOR-TO-DOOR */}
                    <Col xs={24} md={8}>
                      <div
                        onClick={() => field.onChange('DoorToDoor')}
                        style={{
                          backgroundColor: isDoor ? '#FFFBEB' : '#FFFFFF',
                          border: isDoor ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 14,
                          padding: '16px 16px',
                          cursor: 'pointer',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isDoor
                            ? '0 6px 18px rgba(245, 158, 11, 0.18)'
                            : '0 1px 3px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div>
                          <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: isDoor ? '#FEF3C7' : '#F1F5F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                color: isDoor ? '#D97706' : '#64748B',
                              }}
                            >
                              <GlobalOutlined />
                            </div>
                            <Space size={4}>
                              {isDoor && (
                                <Tag color="gold" style={{ fontWeight: 800, margin: 0, borderRadius: 9999 }}>
                                  ✓ Đã chọn
                                </Tag>
                              )}
                              <Tag color="purple" style={{ fontWeight: 800, margin: 0 }}>Trọn gói</Tag>
                            </Space>
                          </Flex>

                          <strong style={{ fontSize: 15, color: isDoor ? '#92400E' : '#0F172A', display: 'block' }}>
                            Door-to-Door
                          </strong>
                          <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6 }}>
                            Đa phương thức Chuồng ➔ Chuồng
                          </span>
                          <Text style={{ fontSize: 12, color: '#475569', display: 'block', lineHeight: 1.4 }}>
                            Xe đón tận trang trại ➔ Chuyên cơ ➔ Xe giao tận chuồng đích. Bao trọn thủ tục hải quan & CVI.
                          </Text>
                        </div>

                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
                          <Flex justify="space-between" align="baseline">
                            <span style={{ fontSize: 12, color: '#64748b' }}>{routeData.doorToDoor?.duration || '3 - 14 ngày'}</span>
                            <strong style={{ fontSize: 15, color: '#7c3aed' }}>
                              ${routeData.doorToDoor?.priceMin?.toLocaleString()} - ${routeData.doorToDoor?.priceMax?.toLocaleString()}
                            </strong>
                          </Flex>
                        </div>
                      </div>
                    </Col>
                  </Row>
                );
              }}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 3: WHEN (KHỚP FIGMA: Dates, Trip Insurance Breakdown, Feeding Care, Amenities Pricing) */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div>
          {/* 1. NGÀY KHỞI HÀNH & GIAO */}
          <div style={{ marginBottom: 18 }}>
            <Title level={5} style={{ margin: '0 0 12px', fontWeight: 800, color: '#0f172a' }}>
              Pickup & delivery schedule
            </Title>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Controller
                  name="DepartureDate"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Form.Item label={<strong>Ngày đón sớm nhất (Earliest pickup) *</strong>} required style={{ marginBottom: 0 }}>
                      <DatePicker
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) =>
                          field.onChange(date ? date.format('YYYY-MM-DDTHH:mm:ssZ') : null)
                        }
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                        format="DD/MM/YYYY"
                        size="large"
                        style={{ width: '100%', borderRadius: 10 }}
                      />
                    </Form.Item>
                  )}
                />
              </Col>

              <Col xs={24} md={12}>
                <Controller
                  name="DeliveryDate"
                  control={control}
                  render={({ field }) => (
                    <Form.Item label={<strong>Ngày giao muộn nhất (Latest delivery)</strong>} style={{ marginBottom: 0 }}>
                      <DatePicker
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) =>
                          field.onChange(date ? date.format('YYYY-MM-DDTHH:mm:ssZ') : null)
                        }
                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                        format="DD/MM/YYYY"
                        size="large"
                        style={{ width: '100%', borderRadius: 10 }}
                      />
                    </Form.Item>
                  )}
                />
              </Col>
            </Row>
          </div>

          <Divider style={{ margin: '18px 0' }} />

          {/* 2. KHỐI BẢO HIỂM HÀNH TRÌNH (TRIP INSURANCE) */}
          <div style={{ marginBottom: 20 }}>
            <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
              <SafetyCertificateOutlined style={{ fontSize: 18, color: '#2563EB' }} />
              <Title level={5} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                Trip Insurance (Bảo hiểm vận chuyển ngựa đua)
              </Title>
            </Flex>
            <Text style={{ color: '#64748b', fontSize: 12.5, display: 'block', marginBottom: 12 }}>
              Các gói bảo hiểm chuyên biệt bảo vệ tối đa cho ngựa đua và tài sản suốt lộ trình.
            </Text>

            {/* Banner bảo vệ */}
            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 14,
              }}
            >
              <Flex gap={10} align="center">
                <InfoCircleOutlined style={{ color: '#2563EB', fontSize: 16 }} />
                <div>
                  <strong style={{ color: '#1E3A8A', fontSize: 13 }}>
                    Chính sách bảo hiểm vận chuyển ngựa tiêu chuẩn cao
                  </strong>
                  <Text style={{ display: 'block', color: '#3B82F6', fontSize: 12 }}>
                    Vượt xa mức giới hạn bồi thường $5/lb cơ bản của các đơn vị vận tải hàng thông thường.
                  </Text>
                </div>
              </Flex>
            </div>

            {/* 4 Gói bảo hiểm dạng lưới gọn gàng */}
            <Controller
              name="InsurancePackage"
              control={control}
              render={({ field }) => {
                const currentPackage = field.value;

                return (
                  <Row gutter={[12, 12]}>
                    {/* Gói 1: Trip Protection */}
                    <Col xs={24} sm={12}>
                      <div
                        onClick={() => field.onChange('trip')}
                        style={{
                          backgroundColor: currentPackage === 'trip' ? '#FFFBEB' : '#FFFFFF',
                          border: currentPackage === 'trip' ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transform: currentPackage === 'trip' ? 'scale(1.01)' : 'scale(1)',
                          boxShadow: currentPackage === 'trip' ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
                          transition: 'all 0.2s ease',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <strong style={{ color: currentPackage === 'trip' ? '#92400E' : '#0F172A', fontSize: 14 }}>
                            🛡️ Trip Protection
                          </strong>
                          <span style={{ fontWeight: 800, color: '#D97706', fontSize: 14 }}>
                            $10 / con
                          </span>
                        </Flex>
                        <Text style={{ fontSize: 12, color: '#64748B', display: 'block', lineHeight: 1.4 }}>
                          Bồi hoàn đến 100% chi phí chuyến đi; bảo vệ trước thời tiết xấu, hoãn hủy hoặc đổi lộ trình khẩn cấp.
                        </Text>
                      </div>
                    </Col>

                    {/* Gói 2: Cargo Coverage */}
                    <Col xs={24} sm={12}>
                      <div
                        onClick={() => field.onChange('cargo')}
                        style={{
                          backgroundColor: currentPackage === 'cargo' ? '#FFFBEB' : '#FFFFFF',
                          border: currentPackage === 'cargo' ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transform: currentPackage === 'cargo' ? 'scale(1.01)' : 'scale(1)',
                          boxShadow: currentPackage === 'cargo' ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
                          transition: 'all 0.2s ease',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <strong style={{ color: currentPackage === 'cargo' ? '#92400E' : '#0F172A', fontSize: 14 }}>
                            📦 Cargo Coverage
                          </strong>
                          <span style={{ fontWeight: 800, color: '#D97706', fontSize: 14 }}>
                            $5 / con
                          </span>
                        </Flex>
                        <Text style={{ fontSize: 12, color: '#64748B', display: 'block', lineHeight: 1.4 }}>
                          Bảo hiểm toàn bộ trang thiết bị trên xe (hạn mức $15,000), phụ kiện yên cương & chi phí cấp cứu.
                        </Text>
                      </div>
                    </Col>

                    {/* Gói 3: Mortality Coverage */}
                    <Col xs={24} sm={12}>
                      <div
                        onClick={() => field.onChange('mortality')}
                        style={{
                          backgroundColor: currentPackage === 'mortality' ? '#FFFBEB' : '#FFFFFF',
                          border: currentPackage === 'mortality' ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transform: currentPackage === 'mortality' ? 'scale(1.01)' : 'scale(1)',
                          boxShadow: currentPackage === 'mortality' ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
                          transition: 'all 0.2s ease',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <strong style={{ color: currentPackage === 'mortality' ? '#92400E' : '#0F172A', fontSize: 14 }}>
                            🏥 Mortality Coverage
                          </strong>
                          <span style={{ fontWeight: 800, color: '#D97706', fontSize: 14 }}>
                            $25 / con
                          </span>
                        </Flex>
                        <Text style={{ fontSize: 12, color: '#64748B', display: 'block', lineHeight: 1.4 }}>
                          Bảo hiểm sinh mạng và rủi ro chấn thương cấp tính / đau bụng ngựa (colic) có chứng nhận thú y.
                        </Text>
                      </div>
                    </Col>

                    {/* Gói 4: Comprehensive (TỔNG HỢP TIẾT KIỆM 10%) */}
                    <Col xs={24} sm={12}>
                      <div
                        onClick={() => field.onChange('comprehensive')}
                        style={{
                          backgroundColor: currentPackage === 'comprehensive' ? '#FFFBEB' : '#FFFFFF',
                          border: currentPackage === 'comprehensive' ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transform: currentPackage === 'comprehensive' ? 'scale(1.01)' : 'scale(1)',
                          boxShadow: currentPackage === 'comprehensive' ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
                          transition: 'all 0.2s ease',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <Flex align="center" gap={6}>
                            <strong style={{ color: currentPackage === 'comprehensive' ? '#92400E' : '#0F172A', fontSize: 14 }}>
                              ⭐ Comprehensive
                            </strong>
                            <Tag color="gold" style={{ fontWeight: 800, fontSize: 11, borderRadius: 9999, margin: 0 }}>
                              Save 10%
                            </Tag>
                          </Flex>
                          <span style={{ fontWeight: 800, color: '#D97706', fontSize: 14 }}>
                            $36 / con
                          </span>
                        </Flex>
                        <Text style={{ fontSize: 12, color: '#64748B', display: 'block', lineHeight: 1.4 }}>
                          Trọn bộ 3 gói (Trip + Cargo + Mortality) với mức chiết khấu 10% gói toàn diện tối ưu ngân sách.
                        </Text>
                      </div>
                    </Col>
                  </Row>
                );
              }}
            />

            {/* Khối khai báo giá trị ngựa (Declared Value) & Bảng phân tích phí bảo hiểm (Premium Breakdown) */}
            <Row gutter={16} style={{ marginTop: 14 }}>
              <Col xs={24} md={12}>
                <Controller
                  name="DeclaredValue"
                  control={control}
                  render={({ field }) => (
                    <Form.Item
                      label={
                        <div>
                          <strong>Khai báo giá trị ngựa (USD)</strong>
                          <span style={{ fontSize: 12, color: '#64748B', display: 'block' }}>
                            Căn cứ tính hạn mức bồi thường hàng hóa & rủi ro
                          </span>
                        </div>
                      }
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        {...field}
                        size="large"
                        style={{ width: '100%', borderRadius: 10 }}
                        min={5000}
                        max={2000000}
                        step={5000}
                        formatter={(val) => `$ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                      />
                    </Form.Item>
                  )}
                />
              </Col>

              <Col xs={24} md={12}>
                {/* BẢNG TÍNH PHÍ BẢO HIỂM MINH BẠCH (PREMIUM BREAKDOWN) */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '12px 16px',
                  }}
                >
                  <strong style={{ fontSize: 13, color: '#0F172A', display: 'block', marginBottom: 8 }}>
                    Premium Breakdown ({selectedHorseIds.length} ngựa)
                  </strong>

                  {insurancePackage === 'none' ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Không chọn gói bảo hiểm hành trình.
                    </Text>
                  ) : (
                    <div style={{ fontSize: 12, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {(insurancePackage === 'trip' || insurancePackage === 'comprehensive') && (
                        <Flex justify="space-between">
                          <span>Trip Protection ($10 × {selectedHorseIds.length}):</span>
                          <strong>${(10 * selectedHorseIds.length).toFixed(2)}</strong>
                        </Flex>
                      )}
                      {(insurancePackage === 'cargo' || insurancePackage === 'comprehensive') && (
                        <Flex justify="space-between">
                          <span>Cargo Coverage ($5 × {selectedHorseIds.length}):</span>
                          <strong>${(5 * selectedHorseIds.length).toFixed(2)}</strong>
                        </Flex>
                      )}
                      {(insurancePackage === 'mortality' || insurancePackage === 'comprehensive') && (
                        <Flex justify="space-between">
                          <span>Mortality Coverage ($25 × {selectedHorseIds.length}):</span>
                          <strong>${(25 * selectedHorseIds.length).toFixed(2)}</strong>
                        </Flex>
                      )}
                      {insurancePackage === 'comprehensive' && (
                        <Flex justify="space-between" style={{ color: '#16a34a' }}>
                          <span>Ưu đãi gói toàn diện (10%):</span>
                          <strong>-${(4 * selectedHorseIds.length).toFixed(2)}</strong>
                        </Flex>
                      )}
                      <Divider style={{ margin: '6px 0' }} />
                      <Flex justify="space-between" style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                        <span>Tổng phí bảo hiểm:</span>
                        <span style={{ color: '#D97706' }}>
                          $
                          {(
                            (insurancePackage === 'trip'
                              ? 10
                              : insurancePackage === 'cargo'
                              ? 5
                              : insurancePackage === 'mortality'
                              ? 25
                              : 36) * selectedHorseIds.length
                          ).toFixed(2)}
                        </span>
                      </Flex>
                    </div>
                  )}

                  <Flex gap={8} style={{ marginTop: 10 }}>
                    <Button
                      size="small"
                      type={insurancePackage !== 'none' ? 'primary' : 'default'}
                      onClick={() => setValue('InsurancePackage', 'comprehensive')}
                      style={{
                        backgroundColor: insurancePackage !== 'none' ? '#F59E0B' : undefined,
                        borderColor: insurancePackage !== 'none' ? '#F59E0B' : undefined,
                        fontWeight: 700,
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      {insurancePackage !== 'none' ? 'Bảo hiểm đã bật ✓' : 'Thêm gói Comprehensive'}
                    </Button>
                    {insurancePackage !== 'none' && (
                      <Button
                        size="small"
                        onClick={() => setValue('InsurancePackage', 'none')}
                        style={{ borderRadius: 6, fontSize: 12 }}
                      >
                        Bỏ chọn (Skip)
                      </Button>
                    )}
                  </Flex>
                </div>
              </Col>
            </Row>
          </div>

          <Divider style={{ margin: '18px 0' }} />

          {/* 3. KẾ HOẠCH DINH DƯỠNG (FEEDING & CARE PLAN) */}
          <div style={{ marginBottom: 18 }}>
            <Title level={5} style={{ margin: '0 0 2px', fontWeight: 800, color: '#0f172a' }}>
              Feeding & Care Plan
            </Title>
            <Text style={{ color: '#64748b', fontSize: 12, display: 'block', marginBottom: 8 }}>
              Tùy chọn — ghi chú khẩu phần cỏ khô, nước điện giải & thực phẩm bổ sung cho nhân viên áp tải.
            </Text>
            <Controller
              name="FeedingCarePlan"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  rows={2}
                  placeholder="Ví dụ: Cỏ khô Timothy 3 lần/ngày, bổ sung nước điện giải mỗi 4 tiếng, không cho ăn cám 2 tiếng trước khi bay..."
                  style={{ borderRadius: 10, padding: '10px 14px' }}
                />
              )}
            />
          </div>

          <Divider style={{ margin: '18px 0' }} />

          {/* 4. CÔNG KHAI GIÁ CÁC TIỆN ÍCH BỔ SUNG (TRANSPARENT AMENITIES PRICING) */}
          <div style={{ marginBottom: 16 }}>
            <Title level={5} style={{ margin: '0 0 2px', fontWeight: 800, color: '#0f172a' }}>
              Additional Amenities & Special Care
            </Title>
            <Text style={{ color: '#64748b', fontSize: 12, display: 'block', marginBottom: 12 }}>
              Bảng giá tiện ích bổ sung niêm yết minh bạch giúp bạn cân đối ngân sách.
            </Text>

            <Row gutter={[12, 12]}>
              {/* Tiện ích 1: Điều hòa buồng lái */}
              <Col xs={24} md={8}>
                <Controller
                  name="RequiresClimateControl"
                  control={control}
                  render={({ field }) => {
                    const isChecked = Boolean(field.value);
                    return (
                      <div
                        onClick={() => field.onChange(!isChecked)}
                        style={{
                          backgroundColor: isChecked ? '#FFFBEB' : '#FFFFFF',
                          border: isChecked ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transform: isChecked ? 'scale(1.01)' : 'scale(1)',
                          boxShadow: isChecked ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
                          transition: 'all 0.2s ease',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <strong style={{ color: isChecked ? '#92400E' : '#0F172A', fontSize: 13.5 }}>
                            ❄️ Climate Control
                          </strong>
                          <Tag color="gold" style={{ fontWeight: 800, margin: 0, fontSize: 11.5 }}>
                            +$350
                          </Tag>
                        </Flex>
                        <Text style={{ fontSize: 11.5, color: isChecked ? '#B45309' : '#64748B', display: 'block', lineHeight: 1.35 }}>
                          Giữ nhiệt độ ổn định 16-19°C trong khoang xe tải hoặc container bay.
                        </Text>
                      </div>
                    );
                  }}
                />
              </Col>

              {/* Tiện ích 2: Hỏa tốc & Luồng xanh */}
              <Col xs={24} md={8}>
                <Controller
                  name="IsExpress"
                  control={control}
                  render={({ field }) => {
                    const isChecked = Boolean(field.value);
                    return (
                      <div
                        onClick={() => field.onChange(!isChecked)}
                        style={{
                          backgroundColor: isChecked ? '#FFFBEB' : '#FFFFFF',
                          border: isChecked ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transform: isChecked ? 'scale(1.01)' : 'scale(1)',
                          boxShadow: isChecked ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
                          transition: 'all 0.2s ease',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <strong style={{ color: isChecked ? '#92400E' : '#0F172A', fontSize: 13.5 }}>
                            ⚡ Express Dispatch
                          </strong>
                          <Tag color="gold" style={{ fontWeight: 800, margin: 0, fontSize: 11.5 }}>
                            +$650
                          </Tag>
                        </Flex>
                        <Text style={{ fontSize: 11.5, color: isChecked ? '#B45309' : '#64748B', display: 'block', lineHeight: 1.35 }}>
                          Khởi hành ưu tiên dưới 7 ngày, thông quan luồng xanh hải quan nhanh.
                        </Text>
                      </div>
                    );
                  }}
                />
              </Col>

              {/* Tiện ích 3: Bác sĩ thú y áp tải */}
              <Col xs={24} md={8}>
                <Controller
                  name="RequiresVetEscort"
                  control={control}
                  render={({ field }) => {
                    const isChecked = Boolean(field.value);
                    return (
                      <div
                        onClick={() => field.onChange(!isChecked)}
                        style={{
                          backgroundColor: isChecked ? '#FFFBEB' : '#FFFFFF',
                          border: isChecked ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transform: isChecked ? 'scale(1.01)' : 'scale(1)',
                          boxShadow: isChecked ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
                          transition: 'all 0.2s ease',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <strong style={{ color: isChecked ? '#92400E' : '#0F172A', fontSize: 13.5 }}>
                            🩺 Equine Vet Escort
                          </strong>
                          <Tag color="gold" style={{ fontWeight: 800, margin: 0, fontSize: 11.5 }}>
                            +$500
                          </Tag>
                        </Flex>
                        <Text style={{ fontSize: 11.5, color: isChecked ? '#B45309' : '#64748B', display: 'block', lineHeight: 1.35 }}>
                          Bác sĩ thú y FEI chuyên trách theo sát và đo sinh hiệu liên tục.
                        </Text>
                      </div>
                    );
                  }}
                />
              </Col>
            </Row>
          </div>

          {/* Ghi chú hướng dẫn cho tài xế & nhân viên chăm sóc */}
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Special Instructions for Driver & Handlers (Hướng dẫn đặc biệt)
            </label>
            <Controller
              name="SpecialInstructions"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  rows={2}
                  placeholder="Ví dụ: Dừng nghỉ tưới nước mỗi 4 tiếng, kiểm tra móng trước khi bốc dỡ..."
                  style={{ borderRadius: 10, padding: '8px 12px' }}
                />
              )}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 4: REVIEW & SUBMIT (XEM LẠI & BÁO GIÁ MINH BẠCH) */}
      {/* ======================================================== */}
      {currentStep === 3 && (
        <div>
          <Title level={5} style={{ margin: '0 0 14px', fontWeight: 800, color: '#0f172a' }}>
            {t('bookings.stepReviewTitle') || 'Review your booking & estimated quote'}
          </Title>

          <Row gutter={16}>
            {/* Cột trái: Tóm tắt lộ trình, ngựa và dịch vụ */}
            <Col xs={24} lg={13}>
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  marginBottom: 16,
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Title level={5} style={{ margin: '0 0 10px', color: '#0f172a', fontSize: 14.5 }}>
                  🗺️ {t('bookings.routeAndVehicle') || 'Lộ trình & Phương thức'}
                </Title>
                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  <Text type="secondary">{t('bookings.fields.pickupLocation')}: </Text>
                  <strong>{getValues('PickupAddress')} ({getValues('PickupCountryCode')})</strong>
                </div>
                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  <Text type="secondary">{t('bookings.fields.deliveryLocation')}: </Text>
                  <strong>{getValues('DropoffAddress')} ({getValues('DropoffCountryCode')})</strong>
                </div>
                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  <Text type="secondary">Hình thức: </Text>
                  <Tag
                    color={
                      transportMode === 'DoorToDoor'
                        ? 'purple'
                        : transportMode === 'Air'
                        ? 'blue'
                        : 'orange'
                    }
                    style={{ fontWeight: 800 }}
                  >
                    {transportMode === 'DoorToDoor'
                      ? '🌐 Trọn gói Door-to-Door'
                      : transportMode === 'Air'
                      ? '✈️ Hàng không (Air Freight)'
                      : '🚛 Đường bộ (Ground Transport)'}
                  </Tag>
                  {requiresClimate && <Tag color="cyan">❄ Climate Control</Tag>}
                  {isExpress && <Tag color="volcano">⚡ Express</Tag>}
                  {requiresVetEscort && <Tag color="green">🩺 Vet Escort</Tag>}
                </div>
                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  <Text type="secondary">Thời gian khởi hành: </Text>
                  <strong>
                    {getValues('DepartureDate')
                      ? dayjs(getValues('DepartureDate')).format('DD/MM/YYYY')
                      : '---'}
                  </strong>
                </div>
                {Boolean(getValues('DeliveryDate')) && (
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    <Text type="secondary">Thời gian giao dự kiến: </Text>
                    <strong>{dayjs(getValues('DeliveryDate')).format('DD/MM/YYYY')}</strong>
                  </div>
                )}

                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  <Text type="secondary">Gói bảo hiểm: </Text>
                  <Tag color="gold" style={{ fontWeight: 700 }}>
                    {insurancePackage === 'comprehensive'
                      ? '⭐ Comprehensive ($36/ngựa)'
                      : insurancePackage === 'trip'
                      ? 'Trip Protection ($10/ngựa)'
                      : insurancePackage === 'cargo'
                      ? 'Cargo Coverage ($5/ngựa)'
                      : insurancePackage === 'mortality'
                      ? 'Mortality ($25/ngựa)'
                      : 'None'}
                  </Tag>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <Title level={5} style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 14 }}>
                  🐴 Danh sách ngựa ({selectedHorseIds.length} cá thể)
                </Title>
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
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <div>
                            <strong>{h.name || h.Name}</strong> ({h.breed || h.Breed || 'Ngựa đua'})
                          </div>
                          <Tag color="gold" style={{ fontWeight: 700 }}>
                            Hạng chuồng: {stallClasses[hId] || 'Comfort'}
                          </Tag>
                        </Flex>
                      );
                    })}
                  {availableHorses.filter((h) => selectedHorseIds.includes(h.horseId || h.HorseID)).length === 0 && (
                    <Text type="secondary">Đã chọn {selectedHorseIds.length} ngựa</Text>
                  )}
                </Space>
              </Card>
            </Col>

            {/* Cột phải: Bảng dự toán chi phí minh bạch */}
            <Col xs={24} lg={11}>
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  borderColor: '#fde68a',
                  backgroundColor: '#fffdf5',
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Flex align="center" gap="small" style={{ marginBottom: 12 }}>
                  <DollarOutlined style={{ fontSize: 18, color: '#d97706' }} />
                  <Title level={5} style={{ margin: 0, color: '#92400e', fontWeight: 800, fontSize: 14.5 }}>
                    Bảng Báo Giá Minh Bạch (Estimated Quote)
                  </Title>
                </Flex>

                <Table
                  dataSource={quoteItems}
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'Hạng mục chi phí',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name) => <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>,
                    },
                    {
                      title: 'SL',
                      dataIndex: 'qty',
                      key: 'qty',
                      align: 'center',
                      render: (q) => <span style={{ fontSize: 12 }}>{q}</span>,
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right',
                      render: (val) => (
                        <strong style={{ fontSize: 12.5, color: '#0F172A' }}>
                          ${val.toLocaleString()}
                        </strong>
                      ),
                    },
                  ]}
                />

                <Divider style={{ margin: '14px 0' }} />

                <Flex justify="space-between" align="center">
                  <div>
                    <Text type="secondary" style={{ fontSize: 12.5, display: 'block' }}>
                      Tổng chi phí dự tính
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                      Đã bao gồm cước vận chuyển, bảo hiểm & thủ tục CVI
                    </Text>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706' }}>
                    ${totalCost.toLocaleString()}
                  </div>
                </Flex>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG VÀ NÚT BẤM CỦA STEPPER */}
      <Divider style={{ margin: '20px 0 16px' }} />

      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={currentStep === 0 ? onCancel : handlePrev}
          disabled={loading}
          style={{ minWidth: 110, borderRadius: 9999, fontWeight: 600, height: 42 }}
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
              minWidth: 140,
              borderRadius: 9999,
              fontWeight: 700,
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
              color: '#0f172a',
              height: 42,
            }}
          >
            {t('common.next') || 'Tiếp tục →'}
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleFinalSubmit}
            style={{
              minWidth: 190,
              borderRadius: 9999,
              fontWeight: 800,
              backgroundColor: '#f59e0b',
              borderColor: '#f59e0b',
              color: '#0f172a',
              height: 42,
            }}
          >
            {t('bookings.submitRequest') || 'Gửi yêu cầu đặt chuyến'}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
