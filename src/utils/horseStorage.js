const STORAGE_KEY = 'racehorse_horses_storage';

/**
 * 4 hồ sơ ngựa mẫu chuẩn ban đầu với ID duy nhất
 */
export const INITIAL_HORSES = [
  {
    HorseID: 1,
    OwnerUserID: 5,
    Name: 'Midnight Gunner',
    MicrochipNumber: '985141008472910',
    PassportNumber: 'FEI-VN-2023-01',
    Breed: 'Quarter Horse',
    Gender: 'Stallion',
    DateOfBirth: '2020-04-15',
    Color: 'Dark Bay, 2 chân trước vớ trắng',
    SpecialCareRequirements:
      'Cần lót đệm rơm dày, nhiệt độ cabin 16-19°C. Cách ly với ngựa đực khác.',
    HealthStatus: 'Excellent',
    PhotoUrl: null,
    IsActive: true,
    CreatedAt: '2026-01-01T00:00:00Z',
    VetRecords: [
      {
        RecordID: 101,
        RecordType: 'Vaccination',
        Title: 'Tiêm chủng Equine Influenza (Cúm ngựa chủng Florida Clade 1 & 2)',
        Veterinarian: 'Dr. Sarah Jenkins (FEI Official Vet #VN-884)',
        Clinic: 'Trung tâm Thú y Hoàng Gia Ba Vì',
        Date: '2026-08-15',
        ValidUntil: '2027-02-15',
        Status: 'Valid',
        Notes: 'Đạt điều kiện kiểm dịch xuất nhập cảnh quốc tế theo tiêu chuẩn WOAH/FEI',
      },
    ],
    TransportHistory: [],
  },
  {
    HorseID: 2,
    OwnerUserID: 5,
    Name: 'Royal Duchess',
    MicrochipNumber: '985141008472911',
    PassportNumber: 'FEI-VN-2023-02',
    Breed: 'Thoroughbred',
    Gender: 'Mare',
    DateOfBirth: '2021-03-10',
    Color: 'Chestnut, dải trắng rộng dọc sống mũi, chân sau trái vớ cao',
    SpecialCareRequirements:
      'Dễ say xe nhẹ khi ôm cua gắt, cần treo bao cỏ tươi và bổ sung gói điện giải trong nước uống.',
    HealthStatus: 'Good',
    PhotoUrl: null,
    IsActive: true,
    CreatedAt: '2026-01-01T00:00:00Z',
    VetRecords: [],
    TransportHistory: [],
  },
  {
    HorseID: 3,
    OwnerUserID: 5,
    Name: 'Lightning',
    MicrochipNumber: '985141008472912',
    PassportNumber: 'FEI-VN-2023-03',
    Breed: 'Thoroughbred',
    Gender: 'Gelding',
    DateOfBirth: '2022-07-24',
    Color: 'Bay, ngôi sao và vệt trắng dài, cả 2 chân sau vớ trắng',
    SpecialCareRequirements:
      'Tính tình thân thiện, quen hành trình đường dài, thích nghe nhạc êm dịu trong khoang.',
    HealthStatus: 'Excellent',
    PhotoUrl: null,
    IsActive: true,
    CreatedAt: '2026-01-01T00:00:00Z',
    VetRecords: [],
    TransportHistory: [],
  },
  {
    HorseID: 4,
    OwnerUserID: 5,
    Name: 'Thunder',
    MicrochipNumber: '985141008472914',
    PassportNumber: 'FEI-VN-2023-04',
    Breed: 'Arabian Stallion',
    Gender: 'Stallion',
    DateOfBirth: '2021-05-12',
    Color: 'Dark Golden Brown, star on forehead, white sock left hind',
    SpecialCareRequirements:
      'Đang theo dõi hồi phục sau giải đấu, cần xe đệm êm và kiểm tra thân nhiệt định kỳ.',
    HealthStatus: 'Attention',
    PhotoUrl: null,
    IsActive: true,
    CreatedAt: '2026-01-01T00:00:00Z',
    VetRecords: [],
    TransportHistory: [],
  },
  {
    HorseID: 5,
    OwnerUserID: 5,
    Name: 'Shadowfax',
    MicrochipNumber: '985141008472915',
    PassportNumber: 'FEI-VN-2023-05',
    Breed: 'Thoroughbred',
    Gender: 'Stallion',
    DateOfBirth: '2020-02-18',
    Color: 'Bạch sắc (White Grey), mắt hổ phách',
    SpecialCareRequirements:
      'Chấn thương rạn xương bánh chè sau giải đấu, sốt cao 39.8°C. Bác sĩ thú y chỉ định CẤM VẬN CHUYỂN (Non-Fit-to-Travel) - Cần điều trị khẩn cấp tại trạm xá.',
    HealthStatus: 'Critical',
    PhotoUrl: null,
    IsActive: false,
    CreatedAt: '2026-01-01T00:00:00Z',
    VetRecords: [
      {
        RecordID: 108,
        RecordType: 'EmergencyCheck',
        Title: 'Chẩn đoán rạn xương & viêm sưng cấp tính',
        Veterinarian: 'Dr. Sarah Jenkins (FEI Official Vet)',
        Clinic: 'Bệnh viện Thú y Quốc tế IET',
        Date: '2026-10-01',
        ValidUntil: '2026-10-15',
        Status: 'Quarantine',
        Notes: 'Chống chỉ định di chuyển đường dài, cấm cấp phép Fit-to-Travel.',
      },
    ],
    TransportHistory: [],
  },
];

/**
 * Hàm lọc sạch toàn bộ các bản ghi trùng lặp (theo ID, MicrochipNumber hoặc Tên + Giống)
 * @param {Array<any>} list
 * @returns {Array<any>}
 */
export function deduplicateHorses(list) {
  if (!Array.isArray(list) || list.length === 0) return [...INITIAL_HORSES];

  const seenIds = new Set();
  const seenChips = new Set();
  const seenNames = new Set();
  const unique = [];

  for (const h of list) {
    if (!h || !h.Name) continue;
    const nameKey = h.Name.trim().toLowerCase();
    const idKey = Number(h.HorseID);
    const chipKey = (h.MicrochipNumber || '').trim().toLowerCase();
    const comboKey = `${nameKey}_${(h.Breed || '').trim().toLowerCase()}`;

    // Bỏ qua nếu trùng ID
    if (idKey && seenIds.has(idKey)) continue;

    // Bỏ qua nếu trùng mã chip (chỉ xét khi có chip hợp lệ)
    if (chipKey && seenChips.has(chipKey)) continue;

    // Bỏ qua nếu trùng cả Tên và Giống ngựa
    if (seenNames.has(comboKey)) continue;

    if (idKey) seenIds.add(idKey);
    if (chipKey) seenChips.add(chipKey);
    seenNames.add(comboKey);

    unique.push(h);
  }

  return unique.length > 0 ? unique : [...INITIAL_HORSES];
}

/**
 * Lấy danh sách hồ sơ ngựa từ localStorage, tự động lọc sạch trùng lặp
 * @returns {Array<any>}
 */
export function getStoredHorses() {
  if (typeof window === 'undefined') return [...INITIAL_HORSES];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HORSES));
      return [...INITIAL_HORSES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Đảm bảo cá thể ví dụ Critical Risk (Shadowfax) có mặt để người dùng kiểm nghiệm
      let combined = [...parsed];
      const hasShadowfax = combined.some(
        (h) => h.Name?.trim().toLowerCase() === 'shadowfax' || h.HealthStatus === 'Critical',
      );
      if (!hasShadowfax) {
        const shadowfax = INITIAL_HORSES.find((h) => h.Name === 'Shadowfax');
        if (shadowfax) combined.push(shadowfax);
      }
      const clean = deduplicateHorses(combined);
      // Nếu phát hiện có phần tử trùng lặp trong storage cũ hoặc vừa bổ sung Shadowfax, ghi đè lại bản sạch
      if (clean.length !== parsed.length || !hasShadowfax) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      }
      return clean;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HORSES));
    return [...INITIAL_HORSES];
  } catch (error) {
    console.error('Lỗi khi đọc danh sách ngựa từ localStorage:', error);
    return [...INITIAL_HORSES];
  }
}

/**
 * Lưu danh sách hồ sơ ngựa vào localStorage và phát event đồng bộ
 * @param {Array<any>} horses
 */
export function saveStoredHorses(horses) {
  if (typeof window === 'undefined') return;
  try {
    const clean = deduplicateHorses(horses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent('horses_updated', { detail: clean }));
  } catch (error) {
    console.error('Lỗi khi ghi danh sách ngựa vào localStorage:', error);
  }
}

/**
 * Lấy chi tiết 1 con ngựa theo ID
 * @param {number|string} id
 * @returns {any|null}
 */
export function getStoredHorseById(id) {
  const horses = getStoredHorses();
  return horses.find((h) => String(h.HorseID) === String(id)) || null;
}

/**
 * Thêm mới một hồ sơ ngựa vào localStorage (chống trùng lặp tuyệt đối)
 * @param {Object} horseData
 * @returns {Object}
 */
export function addStoredHorse(horseData) {
  const horses = getStoredHorses();

  const trimmedName = horseData.Name ? horseData.Name.trim() : 'Unnamed Horse';
  const trimmedChip = horseData.MicrochipNumber ? horseData.MicrochipNumber.trim() : '';

  // Chống Duplicate: Nếu đã có con ngựa trùng Microchip hoặc trùng Name + Breed -> Trả về con đó ngay, không nhân bản
  const existing = horses.find((h) => {
    if (trimmedChip && h.MicrochipNumber && h.MicrochipNumber.toLowerCase() === trimmedChip.toLowerCase()) {
      return true;
    }
    if (
      h.Name &&
      h.Name.trim().toLowerCase() === trimmedName.toLowerCase() &&
      h.Breed === horseData.Breed
    ) {
      return true;
    }
    return false;
  });

  if (existing) {
    return existing;
  }

  const maxId = horses.reduce((max, h) => Math.max(max, Number(h.HorseID) || 0), 0);
  const newHorseId = maxId + 1;

  const newHorse = {
    HorseID: newHorseId,
    OwnerUserID: Number(horseData.OwnerUserID) || 5,
    Name: trimmedName,
    MicrochipNumber: trimmedChip || `98514100${Date.now().toString().slice(-7)}`,
    PassportNumber:
      horseData.PassportNumber && horseData.PassportNumber.trim()
        ? horseData.PassportNumber.trim()
        : `FEI-VN-2026-${String(newHorseId).padStart(2, '0')}`,
    Breed: horseData.Breed || 'Thoroughbred',
    Gender: horseData.Gender || 'Stallion',
    DateOfBirth: horseData.DateOfBirth || new Date().toISOString().split('T')[0],
    Color: horseData.Color ? horseData.Color.trim() : 'Dark Bay',
    SpecialCareRequirements: horseData.SpecialCareRequirements
      ? horseData.SpecialCareRequirements.trim()
      : null,
    HealthStatus: horseData.HealthStatus || 'Excellent',
    PhotoUrl: horseData.PhotoUrl || null,
    IsActive: true,
    CreatedAt: new Date().toISOString(),
    VetRecords: [
      {
        RecordID: Date.now(),
        RecordType: 'GeneralCheckup',
        Title: 'Kiểm tra lâm sàng ban đầu khi đăng ký',
        Veterinarian: 'Dr. Sarah Jenkins (FEI Senior Vet)',
        Clinic: 'Trung tâm Giám định Thú y IET',
        Date: new Date().toISOString().split('T')[0],
        ValidUntil: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        Status: 'Valid',
        Notes: 'Thể trạng tốt, nhịp tim đều, đủ điều kiện tham gia vận chuyển.',
      },
    ],
    TransportHistory: [],
  };

  const updatedHorses = [newHorse, ...horses];
  saveStoredHorses(updatedHorses);
  return newHorse;
}

/**
 * Cập nhật thông tin hồ sơ ngựa
 * @param {number|string} id
 * @param {Object} updateData
 * @returns {Object|null}
 */
export function updateStoredHorse(id, updateData) {
  const horses = getStoredHorses();
  const index = horses.findIndex((h) => String(h.HorseID) === String(id));
  if (index === -1) return null;

  const updatedHorse = {
    ...horses[index],
    ...updateData,
    HorseID: Number(id),
  };

  horses[index] = updatedHorse;
  saveStoredHorses(horses);
  return updatedHorse;
}

/**
 * Xóa một hồ sơ ngựa theo ID
 * @param {number|string} id
 * @returns {boolean}
 */
export function deleteStoredHorse(id) {
  const horses = getStoredHorses();
  const filtered = horses.filter((h) => String(h.HorseID) !== String(id));
  if (filtered.length !== horses.length) {
    saveStoredHorses(filtered);
    return true;
  }
  return false;
}

export {
  calculateHorseRisk,
  HealthStatusTag,
  RiskBadge,
  getHealthStatusConfig,
  HEALTH_STATUS_CONFIG,
  HEALTH_STATUS_OPTIONS,
} from './horseHealth';
