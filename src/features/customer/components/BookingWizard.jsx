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
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import horseService from '@services/horseService';
import { useAuthStore } from '@features/auth/store/authStore';
import bookingService from '@services/bookingService';
import { unwrapData, unwrapList, getErrorMessage, toIsoString } from '@utils/apiHelpers';
import { checkHorseTransportEligibility } from '@utils/horseHealth';
import { ROUTES } from '@routes/routes';

const { Title, Text } = Typography;
const { TextArea } = Input;

const COUNTRY_OPTIONS = [
  { value: 'VN', label: '🇻🇳 Việt Nam (HAN/SGN - Cảng HKQT Nội Bài / Tân Sơn Nhất)' },
  { value: 'JP', label: '🇯🇵 Nhật Bản (NRT - Sân bay Quốc tế Tokyo Narita)' },
  { value: 'SG', label: '🇸🇬 Singapore (SIN - Sân bay Quốc tế Changi)' },
  { value: 'HK', label: '🇭🇰 Hong Kong (HKG - Cảng HKQT Hồng Kông SuperTerminal)' },
  { value: 'FR', label: '🇫🇷 Pháp (CDG - Sân bay Paris Charles de Gaulle)' },
  { value: 'GB', label: '🇬🇧 Vương Quốc Anh (LHR/STN - Sân bay London Heathrow)' },
  { value: 'US', label: '🇺🇸 Hoa Kỳ (LAX/JFK - Sân bay Los Angeles / New York)' },
  { value: 'AU', label: '🇦🇺 Úc (SYD/MEL - Sân bay Sydney / Melbourne)' },
  { value: 'TH', label: '🇹🇭 Thái Lan (BKK - Sân bay Suvarnabhumi)' },
  { value: 'MY', label: '🇲🇾 Malaysia (KUL - Sân bay Kuala Lumpur)' },
  { value: 'AE', label: '🇦🇪 UAE / Dubai (DXB - Sân bay Quốc tế Dubai)' },
  { value: 'CN', label: '🇨🇳 Trung Quốc (CAN - Sân bay Bạch Vân Quảng Châu)' },
  { value: 'KH', label: '🇰🇭 Campuchia (PNH - Sân bay Phnom Penh)' },
  { value: 'LA', label: '🇱🇦 Lào (VTE - Sân bay Wattay Vientiane)' },
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

const COUNTRY_AIRPORTS = {
  VN: [
    { code: 'HAN', name: 'Sân bay Quốc tế Nội Bài (HAN) — Trạm kiểm dịch động vật & Cảng hàng không phía Bắc', shortName: 'Hà Nội - Nội Bài (HAN)' },
    { code: 'SGN', name: 'Sân bay Quốc tế Tân Sơn Nhất (SGN) — Cổng vận chuyển Equine Air Logistics phía Nam', shortName: 'TP.HCM - Tân Sơn Nhất (SGN)' },
    { code: 'DAD', name: 'Sân bay Quốc tế Đà Nẵng (DAD) — Trạm hàng hóa chuyên dụng & Kiểm dịch miền Trung', shortName: 'Đà Nẵng (DAD)' },
  ],
  JP: [
    { code: 'NRT', name: 'Sân bay Quốc tế Tokyo Narita (NRT) — Trạm kiểm dịch động vật JRA & Equine Terminal', shortName: 'Tokyo Narita (NRT)' },
    { code: 'HND', name: 'Sân bay Quốc tế Tokyo Haneda (HND) — Ga chuyên cơ & Equine Cargo Terminal', shortName: 'Tokyo Haneda (HND)' },
    { code: 'KIX', name: 'Sân bay Quốc tế Kansai Osaka (KIX) — Cổng kiểm dịch ngựa Tây Nhật Bản', shortName: 'Osaka Kansai (KIX)' },
  ],
  SG: [
    { code: 'SIN', name: 'Sân bay Quốc tế Singapore Changi (SIN) — Trạm kiểm dịch & Changi Equine Lounge', shortName: 'Singapore Changi (SIN)' },
    { code: 'XSP', name: 'Sân bay Seletar (XSP) — Ga chuyên cơ hàng không tư nhân & Ngựa đua Đông Nam Á', shortName: 'Singapore Seletar (XSP)' },
  ],
  HK: [
    { code: 'HKG', name: 'Cảng HKQT Hồng Kông (HKG) — SuperTerminal 1 & Trung tâm kiểm dịch HKJC Chek Lap Kok', shortName: 'Hong Kong (HKG)' },
  ],
  FR: [
    { code: 'CDG', name: 'Sân bay Paris Charles de Gaulle (CDG) — European Equine Hub & Trạm thú y BCP', shortName: 'Paris Charles de Gaulle (CDG)' },
    { code: 'ORY', name: 'Sân bay Paris Orly (ORY) — Ga vận tải hàng không chuyên dụng', shortName: 'Paris Orly (ORY)' },
    { code: 'LYS', name: 'Sân bay Lyon-Saint Exupéry (LYS) — Trạm trung chuyển ngựa đua miền Nam nước Pháp', shortName: 'Lyon-Saint Exupéry (LYS)' },
  ],
  GB: [
    { code: 'STN', name: 'Sân bay London Stansted (STN) — Cảng hàng không vận chuyển ngựa thi đấu chính của Vương Quốc Anh', shortName: 'London Stansted (STN)' },
    { code: 'LHR', name: 'Sân bay London Heathrow (LHR) — Animal Reception Centre (HARC)', shortName: 'London Heathrow (LHR)' },
    { code: 'MAN', name: 'Sân bay Manchester (MAN) — Cửa ngõ trung chuyển ngựa Bắc Anh', shortName: 'Manchester (MAN)' },
  ],
  US: [
    { code: 'JFK', name: 'Sân bay New York JFK (JFK) — The ARK at JFK Equine Quarantine & Export Center', shortName: 'New York JFK (JFK)' },
    { code: 'LAX', name: 'Sân bay Los Angeles (LAX) — Trạm kiểm dịch động vật bờ Tây USDA', shortName: 'Los Angeles (LAX)' },
    { code: 'MIA', name: 'Sân bay Quốc tế Miami (MIA) — Cổng xuất nhập khẩu động vật châu Mỹ', shortName: 'Miami (MIA)' },
    { code: 'ORD', name: 'Sân bay Chicago O\'Hare (ORD) — Trung tâm hàng hóa chuyên dụng vùng Trung Tây', shortName: 'Chicago O\'Hare (ORD)' },
  ],
  AU: [
    { code: 'MEL', name: 'Sân bay Melbourne Tullamarine (MEL) — Trạm kiểm dịch Mickleham Post Entry Quarantine', shortName: 'Melbourne (MEL)' },
    { code: 'SYD', name: 'Sân bay Quốc tế Sydney Kingsford Smith (SYD) — Ga kiểm dịch động vật sống', shortName: 'Sydney (SYD)' },
    { code: 'BNE', name: 'Sân bay Quốc tế Brisbane (BNE) — Equine Queensland Hub', shortName: 'Brisbane (BNE)' },
  ],
  TH: [
    { code: 'BKK', name: 'Sân bay Bangkok Suvarnabhumi (BKK) — Trạm kiểm dịch động vật Cục Thú y Hoàng Gia Thái Lan', shortName: 'Bangkok Suvarnabhumi (BKK)' },
    { code: 'DMK', name: 'Sân bay Don Mueang (DMK) — Cảng hàng không liên vận nội địa', shortName: 'Bangkok Don Mueang (DMK)' },
  ],
  MY: [
    { code: 'KUL', name: 'Sân bay Quốc tế Kuala Lumpur (KUL) — Tổ hợp kiểm dịch Sepang Equine Quarantine Complex', shortName: 'Kuala Lumpur (KUL)' },
    { code: 'PEN', name: 'Sân bay Quốc tế Penang (PEN) — Trạm trung chuyển ngựa Bắc Malaysia', shortName: 'Penang (PEN)' },
  ],
  AE: [
    { code: 'DXB', name: 'Sân bay Quốc tế Dubai (DXB) — Emirates SkyCargo Live Animal Hub', shortName: 'Dubai (DXB)' },
    { code: 'DWC', name: 'Sân bay Dubai World Central (DWC) — Trạm kiểm dịch & Chuồng nghỉ chuyên dụng Dubai South', shortName: 'Dubai Al Maktoum (DWC)' },
  ],
  CN: [
    { code: 'CAN', name: 'Sân bay Quốc tế Bạch Vân Quảng Châu (CAN) — Ga tiếp nhận ngựa Trường đua Tùng Hóa Conghua', shortName: 'Quảng Châu Bạch Vân (CAN)' },
    { code: 'PVG', name: 'Sân bay Thượng Hải Phố Đông (PVG) — Cửa ngõ kiểm dịch thú y Đông Trung Quốc', shortName: 'Thượng Hải Phố Đông (PVG)' },
    { code: 'PEK', name: 'Sân bay Thủ đô Bắc Kinh (PEK) — Trạm thú y hàng không Bắc Kinh', shortName: 'Bắc Kinh Thủ Đô (PEK)' },
  ],
  KH: [
    { code: 'PNH', name: 'Sân bay Quốc tế Phnom Penh (PNH) — Cảng hàng không kiểm dịch thú y Thủ đô', shortName: 'Phnom Penh (PNH)' },
    { code: 'SAI', name: 'Sân bay Quốc tế Siem Reap Angkor (SAI) — Ga hàng hóa mới', shortName: 'Siem Reap (SAI)' },
  ],
  LA: [
    { code: 'VTE', name: 'Sân bay Quốc tế Wattay Vientiane (VTE) — Ga hàng hóa & Kiểm dịch thủ đô Vientiane', shortName: 'Vientiane (VTE)' },
  ],
};

const COUNTRY_HUBS = {
  VN: {
    airport: 'Cảng hàng không Quốc tế Nội Bài (HAN) / Tân Sơn Nhất (SGN) - Equine Terminal',
    ground: 'Trường đua Đại Nam / SVĐ Phú Thọ, TP. Hồ Chí Minh',
  },
  HK: {
    airport: 'Cảng hàng không Quốc tế Hồng Kông (HKG) - SuperTerminal 1 Equine Bay',
    ground: 'Trường đua Sha Tin Racecourse, Shatin, New Territories, Hong Kong',
  },
  JP: {
    airport: 'Sân bay Quốc tế Tokyo Narita (NRT) - Animal Quarantine Depot',
    ground: 'Tokyo Racecourse, Fuchu, Tokyo, Japan',
  },
  FR: {
    airport: 'Sân bay Paris Charles de Gaulle (CDG) - Equine Cargo Hub',
    ground: 'Hippodrome de Longchamp, Route des Tribunes, Paris, France',
  },
  GB: {
    airport: 'Sân bay London Heathrow (LHR) / Stansted (STN) Equine Hub',
    ground: 'Ascot Racecourse, High St, Ascot, Berkshire, United Kingdom',
  },
  US: {
    airport: 'Sân bay Quốc tế Los Angeles (LAX) / New York (JFK) Animal Port',
    ground: 'Churchill Downs, Central Ave, Louisville, Kentucky, United States',
  },
  AU: {
    airport: 'Sân bay Melbourne (MEL) / Sydney (SYD) Equine Quarantine Terminal',
    ground: 'Flemington Racecourse, Flemington VIC 3031, Australia',
  },
  TH: {
    airport: 'Sân bay Quốc tế Suvarnabhumi (BKK) Equine Gate',
    ground: 'Royal Bangkok Sports Club, Henri Dunant St, Bangkok, Thailand',
  },
  SG: {
    airport: 'Sân bay Quốc tế Changi (SIN) Equine Center',
    ground: 'Singapore Turf Club, 1 Turf Club Ave, Singapore',
  },
  MY: {
    airport: 'Sân bay Quốc tế Kuala Lumpur (KUL) Animal Lounge',
    ground: 'Selangor Turf Club, Seri Kembangan, Selangor, Malaysia',
  },
  AE: {
    airport: 'Sân bay Quốc tế Dubai (DXB) Equine Freight Wing',
    ground: 'Meydan Racecourse, Al Meydan Rd, Nad Al Sheba, Dubai, UAE',
  },
  CN: {
    airport: 'Sân bay Quốc tế Quảng Châu Bạch Vân (CAN) Cargo Station',
    ground: 'Trường đua Tùng Hóa, TP. Quảng Châu, Trung Quốc',
  },
  KH: {
    airport: 'Sân bay Quốc tế Phnom Penh (PNH) Cargo Depot',
    ground: 'Phnom Penh Equestrian Center, Phnom Penh, Campuchia',
  },
  LA: {
    airport: 'Sân bay Quốc tế Wattay Vientiane (VTE) Cargo Station',
    ground: 'Vientiane Equestrian Club, Vientiane, Lào',
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
  const navigate = useNavigate();
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
    // Backend chỉ hỗ trợ Ground / Air; "door-to-door" cũ quy về đường bộ
    if (rawMode.includes('ground') || rawMode.includes('road') || rawMode.includes('door')) return 'Ground';
    return 'Air';
  })();

  const userFarmAddress = user?.farmAddress || user?.address || '';

  const initialPickupCountry = initialValues?.pickupCountryCode || 'VN';
  const initialDropoffCountry =
    initialValues?.dropoffCountryCode ||
    destInfo?.countryCode ||
    (initialPickupCountry === 'VN' ? 'JP' : 'VN');

  const initialDropoffAddress =
    initialValues?.dropoffAddress ||
    destInfo?.address ||
    (rawDest
      ? `${rawDest} International Terminal`
      : initialMode === 'Air'
      ? COUNTRY_HUBS[initialDropoffCountry]?.airport || `${initialDropoffCountry} International Terminal`
      : COUNTRY_HUBS[initialDropoffCountry]?.ground || 'Tokyo Racecourse, Fuchu, Tokyo, Japan');

  const initialPickupAddress =
    initialValues?.pickupAddress ||
    (initialMode === 'Air'
      ? COUNTRY_HUBS[initialPickupCountry]?.airport || `${initialPickupCountry} International Equine Terminal`
      : userFarmAddress || COUNTRY_HUBS[initialPickupCountry]?.ground || 'Trang trại xuất phát');

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
      PickupAddress: initialPickupAddress,
      PickupCountryCode: initialPickupCountry,
      PickupAirportCode: initialValues?.pickupAirportCode || COUNTRY_AIRPORTS[initialPickupCountry]?.[0]?.code || 'HAN',
      DropoffAddress: initialDropoffAddress,
      DropoffCountryCode: initialDropoffCountry,
      DropoffAirportCode: initialValues?.dropoffAirportCode || COUNTRY_AIRPORTS[initialDropoffCountry]?.[0]?.code || 'NRT',
      DepartureDate: initialValues?.departureDate || dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm:ssZ'),
      DeliveryDate: initialValues?.deliveryDate || dayjs().add(9, 'day').format('YYYY-MM-DDTHH:mm:ssZ'),
      TransportMode: initialMode,
      // 'transit' = mua bảo hiểm hành trình (backend tính % trên giá trị khai báo), 'none' = không mua
      InsurancePackage: initialValues?.declaredValue === null ? 'none' : 'transit',
      DeclaredValue: initialValues?.declaredValue || 50000,
      DistanceKm: initialValues?.distanceKm || null,
      RequiresClimateControl: initialValues?.requiresClimateControl ?? true,
      FeedingCarePlan: initialValues?.feedingCarePlan || 'Timothy hay 3x daily, electrolyte bucket & hydration checks every 4 hours.',
      SpecialInstructions: initialValues?.specialInstructions || '',
    },
    mode: 'onTouched',
  });

  const pickupCountry = useWatch({ control, name: 'PickupCountryCode' });
  const dropoffCountry = useWatch({ control, name: 'DropoffCountryCode' });
  const pickupAirportCode = useWatch({ control, name: 'PickupAirportCode' });
  const dropoffAirportCode = useWatch({ control, name: 'DropoffAirportCode' });
  const departureDate = useWatch({ control, name: 'DepartureDate' });
  const deliveryDate = useWatch({ control, name: 'DeliveryDate' });
  const transportMode = useWatch({ control, name: 'TransportMode' });
  const insurancePackage = useWatch({ control, name: 'InsurancePackage' });
  const declaredValue = useWatch({ control, name: 'DeclaredValue' });
  const distanceKm = useWatch({ control, name: 'DistanceKm' });
  const requiresClimateControl = useWatch({ control, name: 'RequiresClimateControl' });

  // Thông tin cước & độ khả dụng tuyến đường theo quốc gia đến
  const routeData = ROUTE_DATA[dropoffCountry] || ROUTE_DATA.DEFAULT;
  const isGroundAvailable = Boolean(routeData.ground?.available);

  // Tự động chuyển mode nếu chuyển sang quốc gia không hỗ trợ Ground
  useEffect(() => {
    if (!isGroundAvailable && transportMode === 'Ground') {
      setValue('TransportMode', 'Air');
    }
  }, [dropoffCountry, isGroundAvailable, transportMode, setValue]);

  // Tự động đồng bộ và gợi ý địa chỉ chuẩn theo hình thức vận chuyển và quốc gia đến
  useEffect(() => {
    if (transportMode === 'Air') {
      const pAirports = COUNTRY_AIRPORTS[pickupCountry] || [];
      const chosenPickupAirport = pAirports.find((a) => a.code === pickupAirportCode) || pAirports[0];
      if (chosenPickupAirport) {
        setValue('PickupAddress', chosenPickupAirport.name);
      } else {
        setValue('PickupAddress', `${pickupCountry} International Equine Terminal`);
      }

      const dAirports = COUNTRY_AIRPORTS[dropoffCountry] || [];
      const chosenDropoffAirport = dAirports.find((a) => a.code === dropoffAirportCode) || dAirports[0];
      if (chosenDropoffAirport) {
        setValue('DropoffAddress', chosenDropoffAirport.name);
      } else {
        setValue('DropoffAddress', `${dropoffCountry} International Equine Terminal`);
      }
    } else {
      const groundDrop = COUNTRY_HUBS[dropoffCountry]?.ground || `${dropoffCountry} Equine Center / Racecourse`;
      setValue('DropoffAddress', groundDrop);

      const curPickup = getValues('PickupAddress');
      if (!curPickup || curPickup.includes('Cảng hàng không') || curPickup.includes('Equine') || curPickup.includes('Sân bay')) {
        setValue('PickupAddress', userFarmAddress || COUNTRY_HUBS[pickupCountry]?.ground || 'Trang trại xuất phát');
      }
    }
  }, [dropoffCountry, pickupCountry, transportMode, pickupAirportCode, dropoffAirportCode, setValue, getValues, userFarmAddress]);

  // Tải danh sách ngựa của user khi mở wizard, đảm bảo chỉ tải ngựa thuộc tài khoản hiện tại
  useEffect(() => {
    let isSubscribed = true;

    const loadHorsesData = async () => {
      setLoadingHorses(true);
      let horsesList = [];
      try {
        // Backend chỉ trả ngựa của khách đang đăng nhập
        const res = await horseService.getHorses({ size: 100 });
        horsesList = unwrapList(res).filter((h) => h.isActive !== false);
      } catch (err) {
        message.error(getErrorMessage(err, 'Không tải được danh sách ngựa'));
      }

      if (!isSubscribed) return;
      setAvailableHorses(horsesList);

      if (horsesList.length > 0) {
        // Chỉ chọn trước ngựa nếu được chỉ định cụ thể qua initialValues (VD: bấm "Đặt chuyến" từ trang chi tiết ngựa)
        const specificHorseId = initialValues?.horseId || initialValues?.horseIds?.[0];
        if (specificHorseId && horsesList.some((h) => String(h.horseId || h.HorseID) === String(specificHorseId))) {
          setSelectedHorseIds([specificHorseId]);
          setStallClasses({ [specificHorseId]: 'Comfort' });
        } else {
          // Mặc định để trống để khách hàng tự chọn ngựa (Yêu cầu 2: tránh lỗi báo trùng lịch sai từ ngựa đầu)
          setSelectedHorseIds([]);
          setStallClasses({});
        }
      } else {
        setSelectedHorseIds([]);
        setStallClasses({});
      }
      setLoadingHorses(false);
    };

    void loadHorsesData().catch(console.error);

    return () => {
      isSubscribed = false;
    };
  }, [user, initialValues, i18n]);

  // Toggle chọn cá thể ngựa (Chặn nếu ngựa chấn thương nguy cấp hoặc trùng lịch trình của user này)
  const handleToggleHorse = (horseId) => {
    const targetHorse = availableHorses.find(
      (h) => String(h.horseId || h.HorseID) === String(horseId),
    );
    if (!targetHorse) return;

    const status = (targetHorse.HealthStatus || targetHorse.healthStatus || '').trim().toLowerCase();
    if (status === 'critical' || status === 'poor') {
      message.error('Không thể chọn: Chú ngựa này đang gặp chấn thương/tình trạng nguy kịch (Non-Fit-to-Travel), cấm vận chuyển!');
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

  // Báo giá do backend tính (POST /bookings/quote-preview) — không tự tính giá ở client
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const quoteRequest = useMemo(() => {
    if (selectedHorseIds.length === 0 || !departureDate || !deliveryDate || !dropoffCountry) return null;
    if (transportMode === 'Ground' && !(Number(distanceKm) > 0)) return null;
    return {
      transportMode,
      dropoffCountryCode: dropoffCountry,
      distanceKm: transportMode === 'Ground' ? Number(distanceKm) : null,
      requiresClimateControl: Boolean(requiresClimateControl),
      declaredValue: insurancePackage === 'none' ? null : Number(declaredValue) || null,
      departureDate: toIsoString(departureDate),
      deliveryDate: toIsoString(deliveryDate),
      horses: selectedHorseIds.map((hId) => ({ stallClass: stallClasses[hId] || 'Comfort' })),
    };
  }, [selectedHorseIds, stallClasses, transportMode, dropoffCountry, distanceKm, requiresClimateControl, insurancePackage, declaredValue, departureDate, deliveryDate]);

  useEffect(() => {
    if (currentStep !== 3 || !quoteRequest) return undefined;
    let cancelled = false;
    // Debounce nhẹ để không gọi API liên tục khi khách đang gõ
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const res = await bookingService.previewQuote(quoteRequest);
        if (!cancelled) setQuote(unwrapData(res));
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(getErrorMessage(err, 'Không tính được báo giá cho tuyến này'));
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentStep, quoteRequest]);

  const quoteItems = (quote?.lines || []).map((line, idx) => ({ key: `${line.code}-${idx}`, ...line }));
  const totalCost = Number(quote?.total || 0);
  const currencyCode = quote?.currencyCode || 'USD';

  // Cho phép chuyển bước trực tiếp khi click vào các tab Stepper
  const handleStepClick = async (targetStep) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    // Khi muốn nhảy tiến lên các bước sau, kiểm tra điều kiện cần thiết
    if (currentStep === 0 || targetStep >= 1) {
      if (getValues('PickupCountryCode') === getValues('DropoffCountryCode')) {
        message.error('Quốc gia xuất phát và Quốc gia đến không được trùng nhau!');
        return;
      }
    }
    if (targetStep >= 2) {
      const isWhenValid = await trigger(['DepartureDate', 'DeliveryDate']);
      if (!isWhenValid) {
        message.warning('Vui lòng kiểm tra lại ngày vận chuyển (When).');
        return;
      }
      const depDate = getValues('DepartureDate');
      const delDate = getValues('DeliveryDate');
      if (dayjs(delDate).isBefore(dayjs(depDate), 'day')) {
        message.error('Ngày giao hàng không thể trước ngày khởi hành!');
        return;
      }
    }
    if (targetStep >= 3) {
      if (selectedHorseIds.length === 0) {
        message.warning(t('bookings.selectAtLeastOneHorse') || 'Vui lòng chọn ít nhất 1 cá thể ngựa đủ điều kiện để tiếp tục.');
        return;
      }
      if (transportMode === 'Ground' && !isGroundAvailable) {
        message.warning('Tuyến đường này không hỗ trợ vận chuyển đường bộ (Ground). Vui lòng chọn Air Freight.');
        return;
      }
      if (transportMode === 'Ground') {
        const pAddr = getValues('PickupAddress');
        const dAddr = getValues('DropoffAddress');
        if (!pAddr || !pAddr.trim()) {
          message.warning('Vui lòng nhập địa chỉ đón chi tiết (trang trại xuất phát).');
          return;
        }
        if (!dAddr || !dAddr.trim()) {
          message.warning('Vui lòng nhập địa chỉ giao chi tiết (trang trại / trường đua đích).');
          return;
        }
        const km = Number(getValues('DistanceKm'));
        if (!(km >= 1 && km <= 50000)) {
          message.warning('Vui lòng nhập quãng đường dự kiến (1 - 50.000 km) cho chuyến đường bộ.');
          return;
        }
      }
    }
    setCurrentStep(targetStep);
  };

  // Chuyển sang bước kế tiếp sau khi kiểm tra hợp lệ
  const handleNext = async () => {
    // Bước 0: Where -> Chuyển sang Bước 1: When
    if (currentStep === 0) {
      if (getValues('PickupCountryCode') === getValues('DropoffCountryCode')) {
        message.error('Quốc gia xuất phát và Quốc gia đến không được trùng nhau!');
        return;
      }
      const pCode = getValues('PickupCountryCode');
      const dCode = getValues('DropoffCountryCode');
      const pAir = getValues('PickupAirportCode');
      const dAir = getValues('DropoffAirportCode');
      const pAirportObj = (COUNTRY_AIRPORTS[pCode] || []).find((a) => a.code === pAir) || (COUNTRY_AIRPORTS[pCode] || [])[0];
      const dAirportObj = (COUNTRY_AIRPORTS[dCode] || []).find((a) => a.code === dAir) || (COUNTRY_AIRPORTS[dCode] || [])[0];

      if (transportMode === 'Air') {
        setValue('PickupAddress', pAirportObj?.name || `${pCode} Equine Terminal`);
        setValue('DropoffAddress', dAirportObj?.name || `${dCode} International Terminal`);
      } else {
        setValue('PickupAddress', userFarmAddress || COUNTRY_HUBS[pCode]?.ground || 'Trang trại xuất phát');
        setValue('DropoffAddress', COUNTRY_HUBS[dCode]?.ground || `${dCode} Equine Center`);
      }
    }

    // Bước 1: When -> Chuyển sang Bước 2: What
    if (currentStep === 1) {
      const isValid = await trigger(['DepartureDate', 'DeliveryDate']);
      if (!isValid) {
        message.warning('Vui lòng chọn ngày khởi hành hợp lệ.');
        return;
      }
      const depDate = getValues('DepartureDate');
      const delDate = getValues('DeliveryDate');
      if (dayjs(delDate).isBefore(dayjs(depDate), 'day')) {
        message.error('Ngày giao hàng không thể trước ngày khởi hành!');
        return;
      }
    }

    // Bước 2: What -> Chuyển sang Bước 3: Review
    if (currentStep === 2) {
      if (selectedHorseIds.length === 0) {
        message.warning(t('bookings.selectAtLeastOneHorse') || 'Vui lòng chọn ít nhất 1 cá thể ngựa đủ điều kiện để tiếp tục.');
        return;
      }
      if (transportMode === 'Ground' && !isGroundAvailable) {
        message.warning('Tuyến đường này không hỗ trợ vận chuyển đường bộ (Ground). Vui lòng chọn Air Freight.');
        return;
      }
      if (transportMode === 'Ground') {
        const pAddr = getValues('PickupAddress');
        const dAddr = getValues('DropoffAddress');
        if (!pAddr || !pAddr.trim()) {
          message.warning('Vui lòng nhập địa chỉ đón chi tiết (trang trại xuất phát).');
          return;
        }
        if (!dAddr || !dAddr.trim()) {
          message.warning('Vui lòng nhập địa chỉ giao chi tiết (trang trại / trường đua đích).');
          return;
        }
        const km = Number(getValues('DistanceKm'));
        if (!(km >= 1 && km <= 50000)) {
          message.warning('Vui lòng nhập quãng đường dự kiến (1 - 50.000 km) cho chuyến đường bộ.');
          return;
        }
      }
      // Trùng lịch ngựa do backend kiểm tra khi gửi đơn (POST /bookings)
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Submit toàn bộ đơn đặt chuyến
  const handleFinalSubmit = async () => {
    const values = getValues();
    const mode = values.TransportMode || values.transportMode;
    const pCode = values.PickupCountryCode || values.pickupCountryCode;
    const dCode = values.DropoffCountryCode || values.dropoffCountryCode;

    let finalPickup = values.PickupAddress?.trim() || values.pickupAddress?.trim();
    let finalDropoff = values.DropoffAddress?.trim() || values.dropoffAddress?.trim();

    if (mode === 'Air' || !finalPickup) {
      const pAirports = COUNTRY_AIRPORTS[pCode] || [];
      const chosenP = pAirports.find((a) => a.code === values.PickupAirportCode) || pAirports[0];
      finalPickup = chosenP?.name || COUNTRY_HUBS[pCode]?.airport || `${pCode} International Terminal`;
    }
    if (mode === 'Air' || !finalDropoff) {
      const dAirports = COUNTRY_AIRPORTS[dCode] || [];
      const chosenD = dAirports.find((a) => a.code === values.DropoffAirportCode) || dAirports[0];
      finalDropoff = chosenD?.name || COUNTRY_HUBS[dCode]?.airport || `${dCode} International Terminal`;
    }

    // Kế hoạch dinh dưỡng chưa có trường riêng ở backend -> gộp vào ghi chú cho công ty
    const feedingPlan = (values.FeedingCarePlan || '').trim();
    const instructions = (values.SpecialInstructions || '').trim();
    const specialInstructions = [feedingPlan && `Feeding & care plan: ${feedingPlan}`, instructions]
      .filter(Boolean)
      .join('\n')
      .slice(0, 2000);

    const payload = {
      pickupAddress: finalPickup,
      pickupCountryCode: pCode,
      dropoffAddress: finalDropoff,
      dropoffCountryCode: dCode,
      departureDate: toIsoString(values.DepartureDate),
      deliveryDate: toIsoString(values.DeliveryDate),
      transportMode: mode,
      distanceKm: mode === 'Ground' ? Number(values.DistanceKm) : null,
      requiresClimateControl: Boolean(values.RequiresClimateControl),
      declaredValue: values.InsurancePackage === 'none' ? null : Number(values.DeclaredValue) || null,
      specialInstructions: specialInstructions || null,
      horses: selectedHorseIds.map((hId) => ({
        horseId: Number(hId),
        stallClass: stallClasses[hId] || 'Comfort',
        notes: horseNotes[hId]?.trim().slice(0, 300) || null,
      })),
    };

    await onSubmit(payload);
  };

  // Cấu hình các bước Stepper: Where -> When -> What -> Review
  const stepItems = [
    { title: 'Where', icon: <EnvironmentOutlined /> },
    { title: 'When', icon: <CalendarOutlined /> },
    { title: 'What', icon: <CheckOutlined /> },
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
                {currentStep === 0 && 'Pickup & Destination (Airports & Hubs)'}
                {currentStep === 1 && 'Dates & Transit Protection'}
                {currentStep === 2 && 'Horses, Stall Class & Transport Mode'}
                {currentStep === 3 && 'Quote & Final Confirmation'}
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
                {initialMode === 'Air'
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
      {/* BƯỚC 1: WHERE (HÀNH LANG VẬN CHUYỂN QUỐC TẾ QUA CẢNG HÀNG KHÔNG) */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* BƯỚC 1: WHERE (HÀNH LANG VẬN CHUYỂN QUỐC TẾ & CHỌN CẢNG HÀNG KHÔNG) */}
      {/* ======================================================== */}
      {currentStep === 0 && (
        <div>
          <Title level={5} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0f172a' }}>
            Hành lang Vận chuyển Quốc tế & Cảng hàng không (International Equine Corridor & Airports)
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13, display: 'block', marginBottom: 20 }}>
            Lựa chọn quốc gia xuất phát và quốc gia đích cùng cảng hàng không được cấp phép tiếp nhận kiểm dịch ngựa đua quốc tế.
          </Text>

          <Row gutter={16} style={{ marginBottom: 18 }}>
            {/* Quốc gia xuất phát */}
            <Col xs={24} md={12}>
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  height: '100%',
                }}
                styles={{ body: { padding: '18px 20px' } }}
              >
                <Tag color="orange" style={{ marginBottom: 12, fontWeight: 700 }}>
                  📍 QUỐC GIA XUẤT PHÁT (ORIGIN)
                </Tag>

                <Controller
                  name="PickupCountryCode"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Form.Item
                      label={<strong>1. Quốc gia xuất cảnh</strong>}
                      required
                      style={{ marginBottom: 12 }}
                    >
                      <Select
                        {...field}
                        size="large"
                        options={COUNTRY_OPTIONS.filter((c) => c.value !== dropoffCountry)}
                        onChange={(val) => {
                          field.onChange(val);
                          const newAirports = COUNTRY_AIRPORTS[val] || [];
                          const defaultAirport = newAirports[0]?.code || 'HAN';
                          setValue('PickupAirportCode', defaultAirport);
                          if (val === dropoffCountry) {
                            const alternative = COUNTRY_OPTIONS.find((c) => c.value !== val)?.value || 'JP';
                            setValue('DropoffCountryCode', alternative);
                            const altAirports = COUNTRY_AIRPORTS[alternative] || [];
                            setValue('DropoffAirportCode', altAirports[0]?.code || 'NRT');
                          }
                          if (transportMode === 'Air') {
                            setValue('PickupAddress', newAirports[0]?.name || `${val} Equine Terminal`);
                          } else {
                            setValue('PickupAddress', userFarmAddress || COUNTRY_HUBS[val]?.ground || 'Trang trại xuất phát');
                          }
                        }}
                      />
                    </Form.Item>
                  )}
                />

                <Controller
                  name="PickupAirportCode"
                  control={control}
                  render={({ field }) => {
                    const airports = COUNTRY_AIRPORTS[pickupCountry] || [];
                    return (
                      <Form.Item
                        label={<strong>2. Cảng hàng không xuất cảnh phụ trách</strong>}
                        required
                        style={{ marginBottom: 10 }}
                      >
                        <Select
                          {...field}
                          size="large"
                          options={airports.map((a) => ({
                            value: a.code,
                            label: `${a.shortName} — [IATA: ${a.code}]`,
                          }))}
                          onChange={(val) => {
                            field.onChange(val);
                            const chosen = airports.find((a) => a.code === val);
                            if (transportMode === 'Air') {
                              setValue('PickupAddress', chosen?.name || `${pickupCountry} Equine Terminal`);
                            }
                          }}
                        />
                      </Form.Item>
                    );
                  }}
                />

                <div style={{ fontSize: 12, color: '#475569', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  🏢 <strong>Trạm kiểm dịch xuất cảnh phụ trách:</strong>
                  <div style={{ marginTop: 2, color: '#0f172a', fontWeight: 600 }}>
                    {(COUNTRY_AIRPORTS[pickupCountry] || []).find((a) => a.code === pickupAirportCode)?.name || COUNTRY_HUBS[pickupCountry]?.airport || `${pickupCountry} International Terminal`}
                  </div>
                </div>
              </Card>
            </Col>

            {/* Quốc gia đến */}
            <Col xs={24} md={12}>
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  height: '100%',
                }}
                styles={{ body: { padding: '18px 20px' } }}
              >
                <Tag color="green" style={{ marginBottom: 12, fontWeight: 700 }}>
                  🏁 QUỐC GIA ĐẾN (DESTINATION)
                </Tag>

                <Controller
                  name="DropoffCountryCode"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Form.Item
                      label={<strong>1. Quốc gia nhập cảnh</strong>}
                      required
                      style={{ marginBottom: 12 }}
                    >
                      <Select
                        {...field}
                        size="large"
                        options={COUNTRY_OPTIONS.filter((c) => c.value !== pickupCountry)}
                        onChange={(val) => {
                          field.onChange(val);
                          const newAirports = COUNTRY_AIRPORTS[val] || [];
                          const defaultAirport = newAirports[0]?.code || 'NRT';
                          setValue('DropoffAirportCode', defaultAirport);
                          if (val === pickupCountry) {
                            const alternative = COUNTRY_OPTIONS.find((c) => c.value !== val)?.value || 'VN';
                            setValue('PickupCountryCode', alternative);
                            const altAirports = COUNTRY_AIRPORTS[alternative] || [];
                            setValue('PickupAirportCode', altAirports[0]?.code || 'HAN');
                          }
                          if (transportMode === 'Air') {
                            setValue('DropoffAddress', newAirports[0]?.name || `${val} International Terminal`);
                          } else {
                            setValue('DropoffAddress', COUNTRY_HUBS[val]?.ground || `${val} Equine Center`);
                          }
                        }}
                      />
                    </Form.Item>
                  )}
                />

                <Controller
                  name="DropoffAirportCode"
                  control={control}
                  render={({ field }) => {
                    const airports = COUNTRY_AIRPORTS[dropoffCountry] || [];
                    return (
                      <Form.Item
                        label={<strong>2. Cảng hàng không nhập cảnh tiếp nhận</strong>}
                        required
                        style={{ marginBottom: 10 }}
                      >
                        <Select
                          {...field}
                          size="large"
                          options={airports.map((a) => ({
                            value: a.code,
                            label: `${a.shortName} — [IATA: ${a.code}]`,
                          }))}
                          onChange={(val) => {
                            field.onChange(val);
                            const chosen = airports.find((a) => a.code === val);
                            if (transportMode === 'Air') {
                              setValue('DropoffAddress', chosen?.name || `${dropoffCountry} International Terminal`);
                            }
                          }}
                        />
                      </Form.Item>
                    );
                  }}
                />

                <div style={{ fontSize: 12, color: '#475569', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  🏢 <strong>Trạm kiểm dịch nhập cảnh tiếp nhận:</strong>
                  <div style={{ marginTop: 2, color: '#0f172a', fontWeight: 600 }}>
                    {(COUNTRY_AIRPORTS[dropoffCountry] || []).find((a) => a.code === dropoffAirportCode)?.name || COUNTRY_HUBS[dropoffCountry]?.airport || `${dropoffCountry} International Terminal`}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Banner minh họa hành lang tuyến bay quốc tế TO VÀ RÕ RÀNG */}
          <div
            style={{
              padding: '18px 22px',
              backgroundColor: '#eff6ff',
              borderRadius: 14,
              border: '2px solid #bfdbfe',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)',
            }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 14 }}>
              <div>
                <strong style={{ fontSize: 15, color: '#1e3a8a' }}>
                  ✈️ Tuyến vận chuyển: {COUNTRY_OPTIONS.find((c) => c.value === pickupCountry)?.label?.split('(')[0] || pickupCountry} ➔ {COUNTRY_OPTIONS.find((c) => c.value === dropoffCountry)?.label?.split('(')[0] || dropoffCountry}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#2563eb' }}>
                  Hành lang kiểm dịch hàng không được Tổ chức Thú y Thế giới (WOAH) & Liên đoàn Đua ngựa Quốc tế (FEI) công nhận.
                </p>
              </div>
              <Tag color="blue" style={{ fontWeight: 800, padding: '5px 14px', borderRadius: 8, fontSize: 13 }}>
                Độ khả dụng: {isGroundAvailable ? 'Hàng không & Đường bộ' : 'Chuyên cơ Hàng không / Door-to-Door'}
              </Tag>
            </Flex>

            {/* ROUTE LINE SUMMARY DISPLAY - RÕ RÀNG, TỔNG THỂ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#ffffff', padding: '14px 18px', borderRadius: 12, border: '1px solid #dbeafe', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#c2410c', textTransform: 'uppercase' }}>🛫 XUẤT PHÁT:</span>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {(COUNTRY_AIRPORTS[pickupCountry] || []).find((a) => a.code === pickupAirportCode)?.shortName || pickupCountry}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {(COUNTRY_AIRPORTS[pickupCountry] || []).find((a) => a.code === pickupAirportCode)?.name || getValues('PickupAddress')}
                </div>
              </div>

              <div style={{ textAlign: 'center', padding: '0 12px' }}>
                <Tag color="gold" style={{ fontWeight: 800, borderRadius: 9999, fontSize: 12 }}>
                  Tuyến Bay Quốc Tế ✈️
                </Tag>
                <div style={{ color: '#94a3b8', fontSize: 18, fontWeight: 800, letterSpacing: 2 }}>═══════➔</div>
              </div>

              <div style={{ flex: '1 1 240px', textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>🛬 ĐIỂM ĐẾN:</span>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {(COUNTRY_AIRPORTS[dropoffCountry] || []).find((a) => a.code === dropoffAirportCode)?.shortName || dropoffCountry}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {(COUNTRY_AIRPORTS[dropoffCountry] || []).find((a) => a.code === dropoffAirportCode)?.name || getValues('DropoffAddress')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 2: WHEN (LỊCH TRÌNH, BẢO HIỂM, CHĂM SÓC & TIỆN ÍCH TIÊU CHUẨN) */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div>
          {/* BANNER THÔNG TIN HÀNH LANG ĐÃ CHỌN Ở BƯỚC 1 (WHERE) */}
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
              <div>
                <span style={{ fontSize: 13, color: '#1E40AF', fontWeight: 700 }}>
                  🗺️ Tuyến bay / Hành lang đã chọn:
                </span>{' '}
                <strong style={{ color: '#1E3A8A', fontSize: 14.5 }}>
                  {pickupCountry} ({(COUNTRY_AIRPORTS[pickupCountry] || []).find((a) => a.code === pickupAirportCode)?.name || pickupAirportCode}) ➔{' '}
                  {dropoffCountry} ({(COUNTRY_AIRPORTS[dropoffCountry] || []).find((a) => a.code === dropoffAirportCode)?.name || dropoffAirportCode})
                </strong>
              </div>
              <Tag color="blue" style={{ fontWeight: 800, margin: 0 }}>
                {COUNTRY_OPTIONS.find((c) => c.value === pickupCountry)?.label || pickupCountry} ➔ {COUNTRY_OPTIONS.find((c) => c.value === dropoffCountry)?.label || dropoffCountry}
              </Tag>
            </Flex>
          </div>
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

          
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 3: WHAT (CHỌN NGỰA, HẠNG CHUỒNG, PHƯƠNG THỨC & ĐỊA CHỈ CHI TIẾT) */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div>
          {/* BANNER THỜI GIAN & HÀNH LANG VẬN CHUYỂN ĐÃ XÁC NHẬN */}
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: '#F0FDF4',
              border: '1.5px solid #BBF7D0',
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
              <div>
                <span style={{ fontSize: 13, color: '#166534', fontWeight: 700 }}>
                  📅 Khoảng thời gian vận chuyển đã xác nhận:
                </span>{' '}
                <strong style={{ color: '#14532D', fontSize: 14.5 }}>
                  {departureDate ? dayjs(departureDate).format('DD/MM/YYYY') : '---'} ➔{' '}
                  {deliveryDate ? dayjs(deliveryDate).format('DD/MM/YYYY') : (departureDate ? dayjs(departureDate).format('DD/MM/YYYY') : '---')}
                </strong>
              </div>
              <Tag color="green" style={{ fontWeight: 800, margin: 0 }}>
                Hệ thống tự động kiểm tra xung đột lịch & thời gian nghỉ 1 tuần
              </Tag>
            </Flex>
          </div>
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
              <Card
                bordered
                style={{
                  borderRadius: 16,
                  textAlign: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                  padding: '24px 16px',
                }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <strong style={{ fontSize: 16, color: '#0f172a', display: 'block', marginBottom: 4 }}>
                        {t('horses.emptyText') || 'Tài khoản của bạn chưa có hồ sơ ngựa nào'}
                      </strong>
                      <Text style={{ fontSize: 13, color: '#64748b' }}>
                        {t('bookings.noHorsesHint') || 'Vui lòng thêm ngựa vào hồ sơ trước khi tạo yêu cầu vận chuyển mới.'}
                      </Text>
                    </div>
                  }
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate(ROUTES.CUSTOMER_HORSES_NEW)}
                    style={{
                      borderRadius: 9999,
                      fontWeight: 700,
                      backgroundColor: '#f59e0b',
                      borderColor: '#f59e0b',
                      color: '#0f172a',
                      marginTop: 8,
                    }}
                  >
                    Thêm hồ sơ ngựa mới
                  </Button>
                </Empty>
              </Card>
            ) : (
              <Row gutter={[16, 16]}>
                {availableHorses.map((horse) => {
                  const horseId = horse.horseId || horse.HorseID;
                  const isSelected = selectedHorseIds.some((id) => String(id) === String(horseId));
                  const horseName = horse.name || horse.Name;
                  const horseBreed = horse.breed || horse.Breed;
                  const horseGender = horse.gender || horse.Gender;
                  const horseMicrochip = horse.microchipNumber || horse.MicrochipNumber;
                  const eligibility = checkHorseTransportEligibility(horse, i18n?.language || 'vi');
                  const isCritical = (horse.HealthStatus || horse.healthStatus || '').trim().toLowerCase() === 'critical';
                  const isBlocked = isCritical;

                  return (
                    <Col key={horseId} xs={24} md={12}>
                      <div
                        role="button"
                        tabIndex={isBlocked ? -1 : 0}
                        aria-disabled={isBlocked}
                        onClick={(e) => {
                          if (isBlocked) return;
                          if (e.target.closest?.('.stall-select-container') || e.target.closest?.('.ant-select') || e.target.closest?.('input')) return;
                          handleToggleHorse(horseId);
                        }}
                        onKeyDown={(e) => {
                          if (isBlocked) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleHorse(horseId);
                          }
                        }}
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
                          cursor: isBlocked ? 'not-allowed' : 'pointer',
                          opacity: isBlocked ? 0.75 : 1,
                          transform: isSelected && !isBlocked ? 'scale(1.02)' : 'scale(1)',
                          boxShadow: isSelected && !isBlocked
                            ? '0 8px 24px rgba(245, 158, 11, 0.22)'
                            : '0 2px 8px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                          <Checkbox
                            checked={!isBlocked && isSelected}
                            disabled={isBlocked}
                            onChange={() => !isBlocked && handleToggleHorse(horseId)}
                          >
                            <strong
                              style={{
                                fontSize: 16,
                                color: isCritical
                                  ? '#991B1B'
                                  : isSelected
                                  ? '#92400E'
                                  : '#0F172A',
                                marginLeft: 4,
                              }}
                            >
                              🐴 {horseName}
                            </strong>
                          </Checkbox>
                          <Space size={6} wrap>
                            {isSelected && !isBlocked && (
                              <Tag color="gold" style={{ fontWeight: 800, borderRadius: 9999 }}>
                                ✓ Đã chọn
                              </Tag>
                            )}
                            <Tag
                              color={eligibility.tagColor}
                              style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}
                            >
                              {eligibility.tagText}
                            </Tag>
                            <Tag color="blue">{horseBreed}</Tag>
                          </Space>
                        </Flex>

                        <div style={{ fontSize: 13, color: isBlocked ? '#991B1B' : '#64748b', marginLeft: 28, marginBottom: 8 }}>
                          {t(`horses.genderOptions.${horseGender?.toLowerCase()}`) || horseGender} · {t('horses.fields.microchip')}:{' '}
                          <code>{horseMicrochip || '---'}</code>
                        </div>

                        {/* Banner cảnh báo chặn vận chuyển nếu chấn thương nguy cấp */}
                        {isCritical && (
                          <div
                            style={{
                              marginLeft: 28,
                              marginTop: 6,
                              padding: '8px 12px',
                              backgroundColor: '#FEE2E2',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#991B1B',
                              border: '1px solid #FECACA',
                            }}
                          >
                            ⛔ Non-Fit-to-Travel: Rủi ro nguy cấp hoặc chấn thương nặng theo kết luận hồ sơ y tế, CẤM VẬN CHUYỂN!
                          </div>
                        )}

                        {/* Tùy chọn hạng chuồng khi được tick chọn */}
                        {isSelected && !isBlocked && (
                          <div
                            className="stall-select-container"
                            style={{
                              marginTop: 14,
                              paddingTop: 14,
                              borderTop: '1px dashed #e2e8f0',
                            }}
                          >
                            <div style={{ marginBottom: 8 }}>
                              <strong style={{ fontSize: 13, color: '#0f172a' }}>
                                🏷️ Chọn hạng chuồng vận chuyển (Stall Class):
                              </strong>
                            </div>

                            <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
                              {/* Option Shared */}
                              <Col xs={24} sm={8}>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStallClasses((prev) => ({ ...prev, [horseId]: 'Shared' }));
                                  }}
                                  style={{
                                    padding: '10px 10px',
                                    borderRadius: 10,
                                    border: (stallClasses[horseId] || 'Comfort') === 'Shared' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                                    backgroundColor: (stallClasses[horseId] || 'Comfort') === 'Shared' ? '#fffdf5' : '#ffffff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <Flex justify="space-between" align="center">
                                    <strong style={{ fontSize: 12, color: '#0f172a' }}>Shared</strong>
                                    <Tag color="default" style={{ margin: 0, fontSize: 11 }}>3 / pallet</Tag>
                                  </Flex>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                    Chuồng ghép — 3 ngựa / pallet, cước cơ bản
                                  </div>
                                </div>
                              </Col>

                              {/* Option Comfort */}
                              <Col xs={24} sm={8}>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStallClasses((prev) => ({ ...prev, [horseId]: 'Comfort' }));
                                  }}
                                  style={{
                                    padding: '10px 10px',
                                    borderRadius: 10,
                                    border: (stallClasses[horseId] || 'Comfort') === 'Comfort' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                                    backgroundColor: (stallClasses[horseId] || 'Comfort') === 'Comfort' ? '#fffdf5' : '#ffffff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <Flex justify="space-between" align="center">
                                    <strong style={{ fontSize: 12, color: '#0f172a' }}>Comfort</strong>
                                    <Tag color="gold" style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>2 / pallet</Tag>
                                  </Flex>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                    Chuồng rưỡi — 2 ngựa / pallet, cước cao hơn Shared
                                  </div>
                                </div>
                              </Col>

                              {/* Option Private */}
                              <Col xs={24} sm={8}>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStallClasses((prev) => ({ ...prev, [horseId]: 'Private' }));
                                  }}
                                  style={{
                                    padding: '10px 10px',
                                    borderRadius: 10,
                                    border: (stallClasses[horseId] || 'Comfort') === 'Private' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                                    backgroundColor: (stallClasses[horseId] || 'Comfort') === 'Private' ? '#fffdf5' : '#ffffff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <Flex justify="space-between" align="center">
                                    <strong style={{ fontSize: 12, color: '#0f172a' }}>Private</strong>
                                    <Tag color="purple" style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>1 / pallet</Tag>
                                  </Flex>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                    Chuồng riêng — 1 ngựa / pallet, cước cao nhất
                                  </div>
                                </div>
                              </Col>
                            </Row>

                            <Input
                              size="small"
                              value={horseNotes[horseId] || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setHorseNotes((prev) => ({
                                  ...prev,
                                  [horseId]: e.target.value,
                                }))
                              }
                              placeholder="Ghi chú khẩu phần hoặc chăm sóc riêng cho cá thể ngựa này..."
                              style={{ borderRadius: 8 }}
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
              Bảo hiểm hành trình tính theo % giá trị khai báo của ngựa (theo bảng giá hệ thống).
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

            {/* Bật / tắt bảo hiểm hành trình + khai báo giá trị (POST /bookings: declaredValue, null = không mua) */}
            <Row gutter={[16, 12]}>
              <Col xs={24} md={12}>
                <Controller
                  name="InsurancePackage"
                  control={control}
                  render={({ field }) => {
                    const isOn = field.value !== 'none';
                    const toggle = () => field.onChange(isOn ? 'none' : 'transit');
                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={toggle}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggle();
                          }
                        }}
                        style={{
                          backgroundColor: isOn ? '#FFFBEB' : '#FFFFFF',
                          border: isOn ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <strong style={{ color: isOn ? '#92400E' : '#0F172A', fontSize: 13.5 }}>
                            🛡️ Transit Insurance (Bảo hiểm hành trình)
                          </strong>
                          <Tag color={isOn ? 'gold' : 'default'} style={{ fontWeight: 800, margin: 0 }}>
                            {isOn ? '✓ Đã chọn' : 'Không mua'}
                          </Tag>
                        </Flex>
                        <Text style={{ fontSize: 12, color: '#64748B', display: 'block', lineHeight: 1.4 }}>
                          Phí bảo hiểm = % giá trị khai báo. Số tiền cụ thể hiện ở dòng bảo hiểm trong báo giá (bước Review).
                        </Text>
                      </div>
                    );
                  }}
                />
              </Col>
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
                            Căn cứ tính phí bảo hiểm & hạn mức bồi thường
                          </span>
                        </div>
                      }
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        {...field}
                        size="large"
                        disabled={insurancePackage === 'none'}
                        style={{ width: '100%', borderRadius: 10 }}
                        min={0}
                        max={1000000000}
                        step={5000}
                        formatter={(val) => (val ? `$ ${Number(val).toLocaleString('en-US')}` : '')}
                        parser={(val) => (val ? String(val).replace(/[^\d.]/g, '') : '')}
                      />
                    </Form.Item>
                  )}
                />
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
              Các tùy chọn dưới đây ảnh hưởng tới báo giá; số tiền do hệ thống tính ở bước Review.
            </Text>

            <Row gutter={[12, 12]}>
              {/* Tiện ích 1: Khoang điều hòa (requiresClimateControl, có phụ phí) */}
              <Col xs={24} md={8}>
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
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            field.onChange(!isChecked);
                          }
                        }}
                        style={{
                          backgroundColor: isChecked ? '#FFFBEB' : '#FFFFFF',
                          border: isChecked ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          height: '100%',
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <strong style={{ color: isChecked ? '#92400E' : '#0F172A', fontSize: 13.5 }}>
                            ❄️ Climate Control
                          </strong>
                          <Tag color={isChecked ? 'gold' : 'default'} style={{ fontWeight: 800, margin: 0, fontSize: 11.5 }}>
                            {isChecked ? '✓ Đã chọn' : 'Tùy chọn'}
                          </Tag>
                        </Flex>
                        <Text style={{ fontSize: 11.5, color: isChecked ? '#B45309' : '#64748B', display: 'block', lineHeight: 1.35 }}>
                          Khoang điều hòa / chăm sóc đặc biệt, có phụ phí theo % cước vận chuyển.
                        </Text>
                      </div>
                    );
                  }}
                />
              </Col>

              {/* Tiện ích 2: Nhân viên áp tải — hệ thống tự tính số người theo số ngựa */}
              <Col xs={24} md={8}>
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '12px 14px',
                    height: '100%',
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                    <strong style={{ color: '#0F172A', fontSize: 13.5 }}>
                      🩺 Groom / Escort
                    </strong>
                    <Tag color="green" style={{ fontWeight: 800, margin: 0, fontSize: 11.5 }}>
                      Tự động
                    </Tag>
                  </Flex>
                  <Text style={{ fontSize: 11.5, color: '#64748B', display: 'block', lineHeight: 1.35 }}>
                    Số nhân viên áp tải được hệ thống tính theo số ngựa; phí nằm trong báo giá.
                  </Text>
                </div>
              </Col>

              {/* Tiện ích 3: Phụ phí gấp — server tự xác định khi khởi hành trong vòng 7 ngày */}
              <Col xs={24} md={8}>
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '12px 14px',
                    height: '100%',
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                    <strong style={{ color: '#0F172A', fontSize: 13.5 }}>
                      ⚡ Express
                    </strong>
                    <Tag color={dayjs(departureDate).diff(dayjs(), 'day') < 7 ? 'volcano' : 'default'} style={{ fontWeight: 800, margin: 0, fontSize: 11.5 }}>
                      {dayjs(departureDate).diff(dayjs(), 'day') < 7 ? 'Áp dụng' : 'Không áp dụng'}
                    </Tag>
                  </Flex>
                  <Text style={{ fontSize: 11.5, color: '#64748B', display: 'block', lineHeight: 1.35 }}>
                    Khởi hành trong vòng 7 ngày tới sẽ tự động có phụ phí gấp.
                  </Text>
                </div>
              </Col>
            </Row>
          </div>

          {/* Ghi chú hướng dẫn cho tài xế & nhân viên chăm sóc */}
          <div style={{ marginTop: 14 }}>
            <label htmlFor="special-instructions-input" style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Special Instructions for Driver & Handlers (Hướng dẫn đặc biệt)
            </label>
            <Controller
              name="SpecialInstructions"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  id="special-instructions-input"
                  rows={2}
                  placeholder="Ví dụ: Dừng nghỉ tưới nước mỗi 4 tiếng, kiểm tra móng trước khi bốc dỡ..."
                  style={{ borderRadius: 10, padding: '8px 12px' }}
                />
              )}
            />
          </div>

          <Divider style={{ margin: '24px 0 20px' }} />

          {/* PHẦN 2: HOW WILL YOUR HORSE TRAVEL? (3 HÌNH THỨC VẬN CHUYỂN THEO ITEM 4) */}
          <div style={{ marginTop: 24 }}>
            <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
              How will your horse travel? (Hình thức vận chuyển)
            </Title>
            <Text style={{ color: '#64748B', fontSize: 13, display: 'block', marginBottom: 18 }}>
              Chọn Đường bộ hoặc Hàng không. Đường bộ chỉ có ở các tuyến hệ thống hỗ trợ.
            </Text>

            <Row gutter={[16, 16]}>
              {/* Option 1: Ground Transport */}
              <Col xs={24} md={12}>
                <Card
                  hoverable={isGroundAvailable}
                  onClick={() => isGroundAvailable && setValue('TransportMode', 'Ground')}
                  style={{
                    borderRadius: 16,
                    cursor: isGroundAvailable ? 'pointer' : 'not-allowed',
                    opacity: isGroundAvailable ? 1 : 0.6,
                    border: transportMode === 'Ground' ? '2.5px solid #F59E0B' : '1.5px solid #E2E8F0',
                    backgroundColor: transportMode === 'Ground' ? '#FFFBEB' : '#FFFFFF',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '18px 20px' } }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
                    <Tag color="orange" style={{ fontWeight: 800 }}>🚛 ĐƯỜNG BỘ (GROUND)</Tag>
                    {transportMode === 'Ground' && <Tag color="gold" style={{ fontWeight: 800 }}>✓ Đang chọn</Tag>}
                  </Flex>
                  <strong style={{ fontSize: 16, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                    Ground Transport
                  </strong>
                  <p style={{ fontSize: 12.5, color: '#64748B', minHeight: 38 }}>
                    Xe rơ-moóc chuyên dụng lót đệm rơm, hệ thống treo khí nén giảm xóc đường trường.
                  </p>
                  <Divider style={{ margin: '10px 0' }} />
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    <div>👥 <strong>Nhân sự:</strong> Tài xế (Driver) + Áp tải (Escort)</div>
                    <div style={{ marginTop: 6, fontWeight: 700, color: '#B45309' }}>
                      💵 Cước tính theo quãng đường (km) và số ngựa
                    </div>
                  </div>
                  {!isGroundAvailable && (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                      ⚠️ Tuyến đường này không khả dụng đường bộ
                    </div>
                  )}
                </Card>
              </Col>

              {/* Option 2: Air Flight */}
              <Col xs={24} md={12}>
                <Card
                  hoverable
                  onClick={() => setValue('TransportMode', 'Air')}
                  style={{
                    borderRadius: 16,
                    cursor: 'pointer',
                    border: transportMode === 'Air' ? '2.5px solid #2563EB' : '1.5px solid #E2E8F0',
                    backgroundColor: transportMode === 'Air' ? '#EFF6FF' : '#FFFFFF',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '18px 20px' } }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
                    <Tag color="blue" style={{ fontWeight: 800 }}>✈️ HÀNG KHÔNG (AIR FLIGHT)</Tag>
                    {transportMode === 'Air' && <Tag color="blue" style={{ fontWeight: 800 }}>✓ Đang chọn</Tag>}
                  </Flex>
                  <strong style={{ fontSize: 16, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                    Air Flight (IATA LAR)
                  </strong>
                  <p style={{ fontSize: 12.5, color: '#64748B', minHeight: 38 }}>
                    Chuyên cơ hàng không quốc tế, chuồng bay tiêu chuẩn IATA Live Animals Regulations.
                  </p>
                  <Divider style={{ margin: '10px 0' }} />
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    <div>👥 <strong>Nhân sự:</strong> Nhân viên áp tải bay (Escort)</div>
                    <div style={{ marginTop: 4 }}>
                      📋 <strong>Thủ tục:</strong> Kiểm dịch sân bay & chứng thư quốc tế
                    </div>
                    <div style={{ marginTop: 6, fontWeight: 700, color: '#1D4ED8' }}>
                      💵 Cước tính theo nước đến và số ngựa
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* PHẦN 3: ĐỊA CHỈ GIAO NHẬN CHI TIẾT TÙY THEO HÌNH THỨC VẬN CHUYỂN (REQUIREMENT 8) */}
          <div style={{ marginTop: 28 }}>
            <Title level={4} style={{ margin: '0 0 4px', fontWeight: 800, color: '#0F172A' }}>
              Detailed Pickup & Dropoff Address (Địa chỉ giao nhận chi tiết)
            </Title>
            <Text style={{ color: '#64748B', fontSize: 13, display: 'block', marginBottom: 14 }}>
              {transportMode === 'Air'
                ? 'Dịch vụ hàng không giao nhận trực tiếp tại Cảng hàng không quốc tế & Trạm kiểm dịch động vật.'
                : 'Dịch vụ giao nhận tận nơi — địa chỉ đón tại trang trại được tự động điền từ thông tin tài khoản của bạn.'}
            </Text>

            {transportMode === 'Air' ? (
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  backgroundColor: '#eff6ff',
                  border: '1.5px solid #bfdbfe',
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
                  <Tag color="blue" style={{ fontWeight: 800, fontSize: 12 }}>
                    ✈️ DỊCH VỤ HÀNG KHÔNG (AIRPORT-TO-AIRPORT)
                  </Tag>
                  <span style={{ fontSize: 12.5, color: '#1e40af', fontWeight: 600 }}>
                    Tiếp nhận và bàn giao trực tiếp tại Cảng hàng không & Trạm kiểm dịch thú y quốc tế
                  </span>
                </Flex>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        📍 Cảng hàng không đón xuất phát:
                      </Text>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5, marginTop: 4 }}>
                        {COUNTRY_HUBS[pickupCountry]?.airport || `${pickupCountry} Equine Terminal`}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        🏁 Cảng hàng không giao đến:
                      </Text>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5, marginTop: 4 }}>
                        {COUNTRY_HUBS[dropoffCountry]?.airport || `${dropoffCountry} Equine Terminal`}
                      </div>
                    </div>
                  </Col>
                </Row>
                <div style={{ fontSize: 12, color: '#2563eb', marginTop: 8, padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #dbeafe' }}>
                  💡 <em>Lưu ý: Dịch vụ hàng không (Air Flight) giao nhận ngựa trực tiếp tại khu kiểm dịch sân bay quốc tế. Quý khách tự túc chuyển ngựa tới sân bay. Nếu muốn đón / giao tận trang trại, vui lòng chọn hình thức <strong>Đường bộ</strong> (khi tuyến hỗ trợ).</em>
                </div>
              </Card>
            ) : (
              <Card
                bordered
                style={{
                  borderRadius: 14,
                  backgroundColor: '#fffbeb',
                  border: '1.5px solid #fde68a',
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Flex align="center" gap={8} style={{ marginBottom: 14 }}>
                  <Tag color="orange" style={{ fontWeight: 800, fontSize: 12 }}>
                    🚛 ĐƯỜNG BỘ CHUYÊN DỤNG (GROUND TRAILER)
                  </Tag>
                  <span style={{ fontSize: 12.5, color: '#92400e', fontWeight: 600 }}>
                    Xe rơ-moóc chuyên dụng đón trả tận trang trại theo hành lang đường bộ
                  </span>
                </Flex>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Controller
                      name="PickupAddress"
                      control={control}
                      rules={{ required: 'Vui lòng nhập địa chỉ đón chi tiết' }}
                      render={({ field, fieldState: { error } }) => (
                        <Form.Item
                          label={<strong style={{ fontSize: 13 }}>Địa chỉ đón chi tiết (Detailed Pickup Address) *</strong>}
                          required
                          validateStatus={error ? 'error' : ''}
                          help={error?.message}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            {...field}
                            size="large"
                            placeholder="Ví dụ: Trang trại xuất phát, Địa chỉ đón chi tiết..."
                            style={{ borderRadius: 10 }}
                          />
                        </Form.Item>
                      )}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Controller
                      name="DropoffAddress"
                      control={control}
                      rules={{ required: 'Vui lòng nhập địa chỉ giao chi tiết' }}
                      render={({ field, fieldState: { error } }) => (
                        <Form.Item
                          label={<strong style={{ fontSize: 13 }}>Địa chỉ giao chi tiết (Detailed Dropoff Address) *</strong>}
                          required
                          validateStatus={error ? 'error' : ''}
                          help={error?.message}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            {...field}
                            size="large"
                            placeholder="Ví dụ: Trường đua Đại Nam hoặc Trường đua Tùng Hóa"
                            style={{ borderRadius: 10 }}
                          />
                        </Form.Item>
                      )}
                    />
                  </Col>
                  <Col xs={24} md={12} style={{ marginTop: 12 }}>
                    <Controller
                      name="DistanceKm"
                      control={control}
                      render={({ field }) => (
                        <Form.Item
                          label={<strong style={{ fontSize: 13 }}>Quãng đường dự kiến (km) *</strong>}
                          required
                          help="Dùng để tính cước đường bộ (1 - 50.000 km)"
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            {...field}
                            size="large"
                            min={1}
                            max={50000}
                            precision={0}
                            placeholder="Ví dụ: 900"
                            style={{ width: '100%', borderRadius: 10 }}
                          />
                        </Form.Item>
                      )}
                    />
                  </Col>
                </Row>
              </Card>
            )}
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
                {/* THẺ HÀNH LANG VẬN CHUYỂN & TUYẾN ĐƯỜNG RÕ RÀNG TRỰC QUAN (REQUIREMENT 4) */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    border: '1.5px solid #CBD5E1',
                    padding: '16px 18px',
                    marginBottom: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <Flex align="center" justify="space-between" wrap="wrap" gap={8} style={{ marginBottom: 14 }}>
                    <Tag
                      color={transportMode === 'Air' ? 'blue' : 'orange'}
                      style={{ fontWeight: 800, fontSize: 12.5, padding: '3px 10px' }}
                    >
                      {transportMode === 'Air'
                        ? '✈️ HÀNG KHÔNG QUỐC TẾ (AIR FREIGHT)'
                        : `🚛 ĐƯỜNG BỘ CHUYÊN DỤNG (GROUND) · ${distanceKm || '?'} km`}
                    </Tag>
                    <Space size={6} wrap>
                      {requiresClimateControl && <Tag color="cyan" style={{ fontWeight: 700, margin: 0 }}>❄ Climate Control</Tag>}
                      {quote?.isExpress && <Tag color="volcano" style={{ fontWeight: 700, margin: 0 }}>⚡ Express</Tag>}
                    </Space>
                  </Flex>

                  <Row gutter={[16, 12]} align="middle">
                    {/* Điểm xuất phát */}
                    <Col xs={24} md={11}>
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: 12,
                          border: '1.5px solid #E2E8F0',
                          padding: '12px 14px',
                        }}
                      >
                        <Flex align="center" gap={6} style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>🛫</span>
                          <Tag color="orange" style={{ fontWeight: 800, margin: 0, fontSize: 11.5 }}>
                            XUẤT PHÁT: {pickupCountry}
                          </Tag>
                        </Flex>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', lineHeight: 1.45, marginTop: 4 }}>
                          {getValues('PickupAddress') || `${pickupCountry} Departure Terminal`}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          📅 Ngày khởi hành: <strong style={{ color: '#0F172A' }}>{getValues('DepartureDate') ? dayjs(getValues('DepartureDate')).format('DD/MM/YYYY') : '---'}</strong>
                        </div>
                      </div>
                    </Col>

                    {/* Mũi tên kết nối */}
                    <Col xs={24} md={2} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, color: '#2563EB', fontWeight: 900 }}>
                        ➔
                      </div>
                    </Col>

                    {/* Điểm đến */}
                    <Col xs={24} md={11}>
                      <div
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: 12,
                          border: '1.5px solid #E2E8F0',
                          padding: '12px 14px',
                        }}
                      >
                        <Flex align="center" gap={6} style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>🛬</span>
                          <Tag color="green" style={{ fontWeight: 800, margin: 0, fontSize: 11.5 }}>
                            GIAO ĐẾN: {dropoffCountry}
                          </Tag>
                        </Flex>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', lineHeight: 1.45, marginTop: 4 }}>
                          {getValues('DropoffAddress') || `${dropoffCountry} Arrival Terminal`}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          🏁 Ngày giao dự kiến: <strong style={{ color: '#0F172A' }}>{getValues('DeliveryDate') ? dayjs(getValues('DeliveryDate')).format('DD/MM/YYYY') : (getValues('DepartureDate') ? dayjs(getValues('DepartureDate')).format('DD/MM/YYYY') : '---')}</strong>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: '#F1F5F9', borderRadius: 8, fontSize: 12.5, color: '#334155' }}>
                    👥 <strong>Đội ngũ vận hành chuyên trách:</strong>{' '}
                    {transportMode === 'Air'
                      ? 'Nhân viên áp tải bay (Escort) đi cùng ngựa suốt chuyến bay.'
                      : 'Tài xế (Driver) + nhân viên áp tải (Escort) đi kèm.'}
                    {quote?.groomCount ? ` Số groom tính giá: ${quote.groomCount}.` : ''}
                    {quote?.transitDays ? ` Thời gian vận chuyển: ${quote.transitDays} ngày.` : ''}
                  </div>
                </div>

                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  <Text type="secondary">Bảo hiểm hành trình: </Text>
                  <Tag color={insurancePackage === 'none' ? 'default' : 'gold'} style={{ fontWeight: 700 }}>
                    {insurancePackage === 'none'
                      ? 'Không mua'
                      : `Giá trị khai báo $${Number(declaredValue || 0).toLocaleString('en-US')}`}
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

                {quoteError && (
                  <Alert type="error" showIcon message={quoteError} style={{ marginBottom: 12, borderRadius: 10 }} />
                )}
                {!quoteRequest && (
                  <Alert type="warning" showIcon message="Chưa đủ thông tin để tính giá (cần chọn ngựa, ngày đi/đến và quãng đường nếu đi đường bộ)." style={{ marginBottom: 12, borderRadius: 10 }} />
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
                      render: (name) => <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>,
                    },
                    {
                      title: 'SL',
                      dataIndex: 'quantity',
                      key: 'quantity',
                      align: 'center',
                      render: (q) => <span style={{ fontSize: 12 }}>{q}</span>,
                    },
                    {
                      title: 'Thành tiền',
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right',
                      render: (val) => (
                        <strong style={{ fontSize: 12.5, color: Number(val) < 0 ? '#16A34A' : '#0F172A' }}>
                          {Number(val).toLocaleString('en-US', { maximumFractionDigits: 2 })}
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
                      Giá do hệ thống tính theo bảng giá hiện hành, được chốt khi gửi đơn
                    </Text>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706' }}>
                    {totalCost.toLocaleString('en-US', { maximumFractionDigits: 2 })} {currencyCode}
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
            disabled={!quote || quoteLoading}
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
