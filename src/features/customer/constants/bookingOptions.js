/**
 * @file bookingOptions.js
 * @description Danh mục dữ liệu chuẩn cho luồng Đặt chuyến vận chuyển ngựa đua (Booking Wizard)
 * Được chuẩn hóa theo bảng giá và quy định của hệ thống backend, loại bỏ dữ liệu hardcode giả lập.
 */

export const TRANSPORT_MODES = [
  {
    value: 'Ground',
    label: 'Vận chuyển Đường bộ (Ground)',
    shortLabel: 'Đường bộ',
    tagColor: 'orange',
    description: 'Xe tải / rơ-moóc chuyên dụng đệm khí nén, đón trả tận trang trại, đi qua các cửa khẩu quốc tế.',
  },
  {
    value: 'Air',
    label: 'Vận chuyển Hàng không (Air Freight)',
    shortLabel: 'Hàng không',
    tagColor: 'blue',
    description: 'Chuyên cơ hàng không quốc tế, chuồng bay tiêu chuẩn IATA Live Animals Regulations (LAR).',
  },
];

export const SUPPORTED_COUNTRIES = [
  { code: 'VN', name: 'Việt Nam', ground: true, air: true },
  { code: 'CN', name: 'Trung Quốc', ground: true, air: true },
  { code: 'TH', name: 'Thái Lan', ground: true, air: true },
  { code: 'KH', name: 'Campuchia', ground: true, air: false },
  { code: 'LA', name: 'Lào', ground: true, air: false },
  { code: 'SG', name: 'Singapore', ground: false, air: true },
  { code: 'MY', name: 'Malaysia', ground: false, air: true },
  { code: 'HK', name: 'Hong Kong', ground: false, air: true },
  { code: 'JP', name: 'Nhật Bản', ground: false, air: true },
  { code: 'KR', name: 'Hàn Quốc', ground: false, air: true },
  { code: 'AE', name: 'UAE (Dubai)', ground: false, air: true },
  { code: 'AU', name: 'Úc (Australia)', ground: false, air: true },
  { code: 'FR', name: 'Pháp', ground: false, air: true },
  { code: 'GB', name: 'Vương quốc Anh', ground: false, air: true },
  { code: 'DE', name: 'Đức', ground: false, air: true },
  { code: 'US', name: 'Hoa Kỳ', ground: false, air: true },
  { code: 'RU', name: 'Nga', ground: true, air: false },
];

export const AIRPORTS_BY_COUNTRY = {
  VN: [
    { code: 'HAN', name: 'Sân bay Quốc tế Nội Bài (HAN) - Hà Nội' },
    { code: 'SGN', name: 'Sân bay Quốc tế Tân Sơn Nhất (SGN) - TP.HCM' },
    { code: 'DAD', name: 'Sân bay Quốc tế Đà Nẵng (DAD) - Đà Nẵng' },
  ],
  JP: [
    { code: 'NRT', name: 'Sân bay Quốc tế Tokyo Narita (NRT)' },
    { code: 'HND', name: 'Sân bay Quốc tế Tokyo Haneda (HND)' },
    { code: 'KIX', name: 'Sân bay Quốc tế Kansai Osaka (KIX)' },
  ],
  CN: [
    { code: 'CAN', name: 'Sân bay Quốc tế Bạch Vân Quảng Châu (CAN)' },
    { code: 'PVG', name: 'Sân bay Quốc tế Phố Đông Thượng Hải (PVG)' },
    { code: 'PEK', name: 'Sân bay Quốc tế Thủ đô Bắc Kinh (PEK)' },
  ],
  SG: [{ code: 'SIN', name: 'Sân bay Quốc tế Singapore Changi (SIN)' }],
  HK: [{ code: 'HKG', name: 'Cảng hàng không Quốc tế Hong Kong (HKG)' }],
  TH: [
    { code: 'BKK', name: 'Sân bay Quốc tế Suvarnabhumi (BKK) - Bangkok' },
    { code: 'DMK', name: 'Sân bay Don Mueang (DMK) - Bangkok' },
  ],
  MY: [{ code: 'KUL', name: 'Sân bay Quốc tế Kuala Lumpur (KUL)' }],
  AE: [
    { code: 'DXB', name: 'Sân bay Quốc tế Dubai (DXB)' },
    { code: 'DWC', name: 'Sân bay Quốc tế Al Maktoum Dubai (DWC)' },
  ],
  AU: [
    { code: 'SYD', name: 'Sân bay Quốc tế Sydney (SYD)' },
    { code: 'MEL', name: 'Sân bay Quốc tế Melbourne (MEL)' },
    { code: 'BNE', name: 'Sân bay Quốc tế Brisbane (BNE)' },
  ],
  FR: [
    { code: 'CDG', name: 'Sân bay Paris Charles de Gaulle (CDG)' },
    { code: 'ORY', name: 'Sân bay Paris Orly (ORY)' },
  ],
  GB: [
    { code: 'STN', name: 'Sân bay London Stansted (STN)' },
    { code: 'LHR', name: 'Sân bay London Heathrow (LHR)' },
  ],
  DE: [
    { code: 'FRA', name: 'Sân bay Quốc tế Frankfurt (FRA)' },
    { code: 'MUC', name: 'Sân bay Quốc tế Munich (MUC)' },
  ],
  US: [
    { code: 'JFK', name: 'Sân bay Quốc tế New York JFK (JFK)' },
    { code: 'LAX', name: 'Sân bay Quốc tế Los Angeles (LAX)' },
    { code: 'ORD', name: 'Sân bay Quốc tế Chicago O\'Hare (ORD)' },
    { code: 'MIA', name: 'Sân bay Quốc tế Miami (MIA)' },
  ],
};

export const STALL_CLASSES = [
  {
    value: 'Shared',
    title: 'Chuồng ghép (Shared)',
    badge: '3 ngựa / khoang',
    description: 'Cước cơ bản, phù hợp với các cá thể ngựa tính cách hiền hòa, quen di chuyển theo bầy đàn.',
  },
  {
    value: 'Comfort',
    title: 'Chuồng rưỡi (Comfort)',
    badge: '2 ngựa / khoang',
    description: 'Không gian rộng rãi, thoáng đãng, vách đệm êm giảm căng thẳng cho ngựa đua thi đấu.',
  },
  {
    value: 'Private',
    title: 'Chuồng riêng (Private)',
    badge: '1 ngựa / khoang',
    description: 'Khoang riêng biệt độc lập, chế độ giám sát và chăm sóc tối đa cho ngựa đua giá trị cao.',
  },
];

export const CITIES_BY_COUNTRY = {
  VN: [
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Bình Dương',
    'Đồng Nai',
    'Tây Ninh',
    'Long An',
    'Cần Thơ',
    'Đà Nẵng',
    'Lâm Đồng (Đà Lạt)',
    'Hải Phòng',
    'Lạng Sơn',
  ],
  KH: ['Phnom Penh', 'Bavet', 'Siem Reap', 'Sihanoukville', 'Kandal'],
  TH: ['Bangkok', 'Pattaya', 'Chiang Mai', 'Nakhon Ratchasima'],
  LA: ['Vientiane (Viêng Chăn)', 'Savannakhet', 'Pakse', 'Luang Prabang'],
  CN: ['Nam Ninh (Nanning)', 'Bằng Tường (Pingxiang)', 'Quảng Châu (Guangzhou)', 'Côn Minh (Kunming)'],
  RU: ['Moscow', 'Saint Petersburg', 'Novosibirsk'],
};

/**
 * Các nước ngựa có thể đi qua (quá cảnh) trên tuyến đường bộ, theo thứ tự khách chọn.
 * Gồm các nước trong danh sách hỗ trợ và vài nước chỉ đi qua (Mông Cổ, Kazakhstan).
 */
export const TRANSIT_COUNTRY_OPTIONS = [
  ...SUPPORTED_COUNTRIES.map((c) => ({ code: c.code, name: c.name })),
  { code: 'MN', name: 'Mông Cổ' },
  { code: 'KZ', name: 'Kazakhstan' },
];

/**
 * Tên nước theo mã (dùng hiển thị tuyến VN → CN → RU); không có thì trả lại mã.
 * @param {string} code
 * @returns {string}
 */
export function getCountryName(code) {
  return TRANSIT_COUNTRY_OPTIONS.find((c) => c.code === code)?.name || code;
}

