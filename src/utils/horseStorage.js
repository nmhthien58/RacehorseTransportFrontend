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
    HasVetRecord: true,
    hasVetRecord: true,
    IsEligibleForTransport: true,
    isEligibleForTransport: true,
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
    VetRecords: [
      {
        RecordID: 102,
        RecordType: 'Passport',
        Title: 'Hộ chiếu Thú y FEI & Chứng nhận kiểm dịch xuất cảnh',
        Veterinarian: 'Dr. Sarah Jenkins (FEI Official Vet #VN-884)',
        Clinic: 'Bệnh viện Thú y Hoàng Gia Ba Vì',
        Date: '2026-07-20',
        ValidUntil: '2027-01-20',
        Status: 'Valid',
        Notes: 'Đầy đủ vaccine cúm ngựa chủng Florida Clade. Đủ điều kiện vận chuyển quốc tế.',
      },
    ],
    HasVetRecord: true,
    hasVetRecord: true,
    IsEligibleForTransport: true,
    isEligibleForTransport: true,
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
    VetRecords: [
      {
        RecordID: 103,
        RecordType: 'Vaccination',
        Title: 'Chứng nhận tiêm phòng Equine Influenza & CVI Quốc tế',
        Veterinarian: 'Dr. Sarah Jenkins (FEI Official Vet #VN-884)',
        Clinic: 'Bệnh viện Thú y Hoàng Gia Ba Vì',
        Date: '2026-08-01',
        ValidUntil: '2027-02-01',
        Status: 'Valid',
        Notes: 'Đạt chuẩn kiểm dịch IATA LAR, đủ điều kiện bay và vận chuyển đường bộ.',
      },
    ],
    HasVetRecord: true,
    hasVetRecord: true,
    IsEligibleForTransport: true,
    isEligibleForTransport: true,
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
    HasVetRecord: false,
    hasVetRecord: false,
    IsEligibleForTransport: false,
    isEligibleForTransport: false,
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

      // Tự động đồng bộ hồ sơ thú y và tính hợp lệ vận chuyển
      combined = combined.map((h) => {
        const name = (h.Name || h.name || '').trim().toLowerCase();
        if (name === 'royal duchess' && (!h.VetRecords || h.VetRecords.length === 0)) {
          return {
            ...h,
            HasVetRecord: true,
            hasVetRecord: true,
            IsEligibleForTransport: true,
            isEligibleForTransport: true,
            VetRecords: INITIAL_HORSES.find((ih) => ih.Name === 'Royal Duchess')?.VetRecords || [],
          };
        }
        if (name === 'lightning' && (!h.VetRecords || h.VetRecords.length === 0)) {
          return {
            ...h,
            HasVetRecord: true,
            hasVetRecord: true,
            IsEligibleForTransport: true,
            isEligibleForTransport: true,
            VetRecords: INITIAL_HORSES.find((ih) => ih.Name === 'Lightning')?.VetRecords || [],
          };
        }
        if (name === 'thunder') {
          return {
            ...h,
            HasVetRecord: false,
            hasVetRecord: false,
            IsEligibleForTransport: false,
            isEligibleForTransport: false,
            VetRecords: [],
          };
        }
        const hasRecords = Boolean(
          (h.VetRecords && h.VetRecords.length > 0) ||
          (h.vetRecords && h.vetRecords.length > 0) ||
          h.HasVetRecord === true ||
          h.hasVetRecord === true
        );
        const isCritical = (h.HealthStatus || h.healthStatus) === 'Critical';
        return {
          ...h,
          HasVetRecord: hasRecords,
          hasVetRecord: hasRecords,
          IsEligibleForTransport: hasRecords && !isCritical,
          isEligibleForTransport: hasRecords && !isCritical,
        };
      });

      const clean = deduplicateHorses(combined);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
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

  const trimmedName = horseData.Name ? horseData.Name.trim() : (horseData.name ? horseData.name.trim() : 'Unnamed Horse');
  const trimmedChip = horseData.MicrochipNumber ? horseData.MicrochipNumber.trim() : (horseData.microchipNumber ? horseData.microchipNumber.trim() : '');

  // Chống Duplicate: Nếu đã có con ngựa trùng Microchip hoặc trùng Name + Breed -> Trả về con đó ngay, không nhân bản
  const existing = horses.find((h) => {
    if (trimmedChip && h.MicrochipNumber && h.MicrochipNumber.toLowerCase() === trimmedChip.toLowerCase()) {
      return true;
    }
    if (
      h.Name &&
      h.Name.trim().toLowerCase() === trimmedName.toLowerCase() &&
      h.Breed === (horseData.Breed || horseData.breed)
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

  const hasVet = Boolean(
    horseData.HasVetRecord !== false &&
    horseData.hasVetRecord !== false &&
    ((horseData.VetRecords && horseData.VetRecords.length > 0) ||
      (horseData.vetRecords && horseData.vetRecords.length > 0) ||
      horseData.hasVetRecord ||
      horseData.HasVetRecord ||
      horseData.vetRecord ||
      horseData.vetRecordTitle ||
      horseData.vetRecordFileName)
  );

  const healthSt = horseData.HealthStatus || horseData.healthStatus || 'Good';
  const isEligible = hasVet && healthSt !== 'Critical';

  let records = [];
  if (horseData.VetRecords && Array.isArray(horseData.VetRecords) && horseData.VetRecords.length > 0) {
    records = horseData.VetRecords;
  } else if (horseData.vetRecords && Array.isArray(horseData.vetRecords) && horseData.vetRecords.length > 0) {
    records = horseData.vetRecords;
  } else if (hasVet) {
    const vr = horseData.vetRecord || {};
    records = [
      {
        RecordID: Date.now(),
        RecordType: vr.recordType || horseData.vetRecordType || 'Passport',
        Title: vr.title || horseData.vetRecordTitle || 'Hồ sơ Thú y & Chứng nhận kiểm dịch',
        Veterinarian: vr.veterinarian || horseData.veterinarian || 'Dr. Sarah Jenkins (FEI Senior Vet)',
        Clinic: vr.clinic || horseData.clinic || 'Trung tâm Giám định Thú y IET',
        Date: vr.date || horseData.issueDate || new Date().toISOString().split('T')[0],
        ValidUntil: vr.validUntil || horseData.validUntil || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        Status: healthSt === 'Critical' ? 'Unfit' : 'Valid',
        Notes: vr.notes || horseData.vetNotes || `Đánh giá tình trạng sức khỏe: ${healthSt}. ${isEligible ? 'Đủ điều kiện vận chuyển' : 'Cấm vận chuyển'}.`,
        FileName: vr.fileName || horseData.vetRecordFileName || 'FEI_Equine_Passport.pdf',
      },
    ];
  }

  const newHorse = {
    HorseID: newHorseId,
    OwnerUserID: Number(horseData.OwnerUserID || horseData.ownerUserId) || 5,
    Name: trimmedName,
    MicrochipNumber: trimmedChip || `98514100${Date.now().toString().slice(-7)}`,
    PassportNumber:
      horseData.PassportNumber && horseData.PassportNumber.trim()
        ? horseData.PassportNumber.trim()
        : (horseData.passportNumber && horseData.passportNumber.trim()
            ? horseData.passportNumber.trim()
            : `FEI-VN-2026-${String(newHorseId).padStart(2, '0')}`),
    Breed: horseData.Breed || horseData.breed || 'Thoroughbred',
    Gender: horseData.Gender || horseData.gender || 'Stallion',
    DateOfBirth: horseData.DateOfBirth || horseData.dateOfBirth || new Date().toISOString().split('T')[0],
    Color: horseData.Color ? horseData.Color.trim() : (horseData.color ? horseData.color.trim() : 'Dark Bay'),
    SpecialCareRequirements: horseData.SpecialCareRequirements
      ? horseData.SpecialCareRequirements.trim()
      : (horseData.specialCareRequirements ? horseData.specialCareRequirements.trim() : null),
    HealthStatus: healthSt,
    healthStatus: healthSt,
    HasVetRecord: hasVet,
    hasVetRecord: hasVet,
    IsEligibleForTransport: isEligible,
    isEligibleForTransport: isEligible,
    PhotoUrl: horseData.PhotoUrl || horseData.photoUrl || null,
    IsActive: true,
    CreatedAt: new Date().toISOString(),
    VetRecords: records,
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

  const current = horses[index];
  const healthSt = updateData.HealthStatus || updateData.healthStatus || current.HealthStatus;
  const hasVet = updateData.HasVetRecord !== undefined ? updateData.HasVetRecord : current.HasVetRecord;
  const isEligible = hasVet && healthSt !== 'Critical';

  const updatedHorse = {
    ...current,
    ...updateData,
    HorseID: Number(id),
    HealthStatus: healthSt,
    healthStatus: healthSt,
    HasVetRecord: hasVet,
    hasVetRecord: hasVet,
    IsEligibleForTransport: isEligible,
    isEligibleForTransport: isEligible,
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

/**
 * Thêm hồ sơ thú y cho ngựa
 */
export function addHorseVetRecord(horseId, record) {
  const horses = getStoredHorses();
  const index = horses.findIndex((h) => String(h.HorseID) === String(horseId));
  if (index === -1) return null;

  const horse = horses[index];
  const newRecord = {
    RecordID: Date.now(),
    RecordType: record.recordType || 'GeneralCheckup',
    Title: record.title || 'Hồ sơ Thú y bổ sung',
    Veterinarian: record.veterinarian || 'Dr. Sarah Jenkins',
    Clinic: record.clinic || 'Bệnh viện Thú y IET',
    Date: record.date || new Date().toISOString().split('T')[0],
    ValidUntil: record.validUntil || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    Status: record.status || 'Valid',
    Notes: record.notes || '',
    FileName: record.fileName || 'Vet_Record.pdf',
  };

  const currentRecords = horse.VetRecords || [];
  horse.VetRecords = [newRecord, ...currentRecords];
  horse.HasVetRecord = true;
  horse.hasVetRecord = true;
  horse.IsEligibleForTransport = horse.HealthStatus !== 'Critical';
  horse.isEligibleForTransport = horse.HealthStatus !== 'Critical';

  horses[index] = { ...horse };
  saveStoredHorses(horses);
  return newRecord;
}

/**
 * Cập nhật hồ sơ thú y của ngựa
 */
export function updateHorseVetRecord(horseId, recordId, updatedData) {
  const horses = getStoredHorses();
  const index = horses.findIndex((h) => String(h.HorseID) === String(horseId));
  if (index === -1) return null;

  const horse = horses[index];
  const records = horse.VetRecords || [];
  const rIdx = records.findIndex((r) => String(r.RecordID || r.recordId) === String(recordId));
  if (rIdx === -1) return null;

  const current = records[rIdx];
  const updated = {
    ...current,
    Title: updatedData.title !== undefined ? updatedData.title : (updatedData.Title !== undefined ? updatedData.Title : current.Title),
    title: updatedData.title !== undefined ? updatedData.title : (updatedData.Title !== undefined ? updatedData.Title : current.Title),
    RecordType: updatedData.recordType !== undefined ? updatedData.recordType : (updatedData.RecordType !== undefined ? updatedData.RecordType : current.RecordType),
    recordType: updatedData.recordType !== undefined ? updatedData.recordType : (updatedData.RecordType !== undefined ? updatedData.RecordType : current.RecordType),
    Veterinarian: updatedData.veterinarian !== undefined ? updatedData.veterinarian : (updatedData.Veterinarian !== undefined ? updatedData.Veterinarian : current.Veterinarian),
    veterinarian: updatedData.veterinarian !== undefined ? updatedData.veterinarian : (updatedData.Veterinarian !== undefined ? updatedData.Veterinarian : current.Veterinarian),
    Clinic: updatedData.clinic !== undefined ? updatedData.clinic : (updatedData.Clinic !== undefined ? updatedData.Clinic : current.Clinic),
    clinic: updatedData.clinic !== undefined ? updatedData.clinic : (updatedData.Clinic !== undefined ? updatedData.Clinic : current.Clinic),
    Date: updatedData.date !== undefined ? updatedData.date : (updatedData.Date !== undefined ? updatedData.Date : current.Date),
    date: updatedData.date !== undefined ? updatedData.date : (updatedData.Date !== undefined ? updatedData.Date : current.Date),
    ValidUntil: updatedData.validUntil !== undefined ? updatedData.validUntil : (updatedData.ValidUntil !== undefined ? updatedData.ValidUntil : current.ValidUntil),
    validUntil: updatedData.validUntil !== undefined ? updatedData.validUntil : (updatedData.ValidUntil !== undefined ? updatedData.ValidUntil : current.ValidUntil),
    Status: updatedData.status !== undefined ? updatedData.status : (updatedData.Status !== undefined ? updatedData.Status : current.Status),
    status: updatedData.status !== undefined ? updatedData.status : (updatedData.Status !== undefined ? updatedData.Status : current.Status),
    Notes: updatedData.notes !== undefined ? updatedData.notes : (updatedData.Notes !== undefined ? updatedData.Notes : current.Notes),
    notes: updatedData.notes !== undefined ? updatedData.notes : (updatedData.Notes !== undefined ? updatedData.Notes : current.Notes),
    RecordID: Number(recordId) || current.RecordID || current.recordId,
    recordId: Number(recordId) || current.RecordID || current.recordId,
  };

  records[rIdx] = updated;
  horse.VetRecords = [...records];
  horses[index] = { ...horse };
  saveStoredHorses(horses);
  return updated;
}

/**
 * Xóa hồ sơ thú y của ngựa
 */
export function deleteHorseVetRecord(horseId, recordId) {
  const horses = getStoredHorses();
  const index = horses.findIndex((h) => String(h.HorseID) === String(horseId));
  if (index === -1) return false;

  const horse = horses[index];
  const records = (horse.VetRecords || []).filter(
    (r) => String(r.RecordID || r.recordId) !== String(recordId)
  );

  const hasRemaining = records.length > 0;
  horse.VetRecords = records;
  horse.HasVetRecord = hasRemaining;
  horse.hasVetRecord = hasRemaining;
  horse.IsEligibleForTransport = hasRemaining && horse.HealthStatus !== 'Critical';
  horse.isEligibleForTransport = hasRemaining && horse.HealthStatus !== 'Critical';

  horses[index] = { ...horse };
  saveStoredHorses(horses);
  return true;
}

export {
  calculateHorseRisk,
  checkHorseTransportEligibility,
  HealthStatusTag,
  RiskBadge,
  getHealthStatusConfig,
  HEALTH_STATUS_CONFIG,
  HEALTH_STATUS_OPTIONS,
} from './horseHealth';
