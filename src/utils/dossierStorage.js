import specialistDossiersData from '@mocks/data/specialistDossiersData.json';

const STORAGE_KEY = 'racehorse_specialist_dossiers';

/**
 * Lấy danh sách Digital Dossiers từ localStorage (fallback về file JSON mẫu)
 * @returns {Array<any>}
 */
export function getStoredDossiers() {
  if (typeof window === 'undefined') return [...specialistDossiersData];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(specialistDossiersData));
      return [...specialistDossiersData];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(specialistDossiersData));
    return [...specialistDossiersData];
  } catch (err) {
    console.error('Lỗi khi đọc dossiers từ localStorage:', err);
    return [...specialistDossiersData];
  }
}

/**
 * Lưu danh sách dossiers vào localStorage và bắn sự kiện đồng bộ
 * @param {Array<any>} list
 */
export function saveStoredDossiers(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('dossiers_updated', { detail: list }));
  } catch (e) {
    console.error('Lỗi lưu dossiers vào localStorage:', e);
  }
}

/**
 * Tự động tạo hồ sơ kiểm dịch (Digital Dossier) khi Logistics Manager phê duyệt đơn hàng
 * @param {Object} booking Đơn hàng đã được duyệt
 * @param {number|string} specialistUserId ID của Chuyên viên kiểm dịch được chỉ định
 * @returns {Object} Dossier mới tạo
 */
export function addDossierFromBooking(booking, specialistUserId = 2) {
  const currentList = getStoredDossiers();
  const bId = Number(booking.BookingID || booking.bookingId);
  const bCode = booking.BookingCode || booking.bookingCode || `BKG-2026-${String(bId).padStart(4, '0')}`;

  // Kiểm tra nếu đã có dossier cho booking này thì chỉ cập nhật trạng thái
  const existing = currentList.find(
    (d) => Number(d.bookingId) === bId || d.bookingCode === bCode,
  );
  if (existing) {
    existing.specialistUserId = Number(specialistUserId) || existing.specialistUserId || 2;
    existing.status = 'Reviewing';
    saveStoredDossiers(currentList);
    return existing;
  }

  const maxId = currentList.reduce((max, d) => Math.max(max, Number(d.dossierId) || 0), 0);
  const newDossierId = maxId + 1;
  const newDossierCode = `DOS-2026-${String(newDossierId).padStart(4, '0')}`;

  const horses = booking.BookingHorses || booking.bookingHorses || booking.horses || [];
  const firstHorse = horses[0] || {};
  const horseNames = horses.map((h) => h.HorseName || h.horseName || h.Name || h.name || 'Racehorse').join(', ') || 'Racehorse';

  const pickupCountry = booking.PickupCountryCode || booking.pickupCountryCode || 'VN';
  const dropoffCountry = booking.DropoffCountryCode || booking.dropoffCountryCode || 'JP';

  const newDossier = {
    dossierId: newDossierId,
    dossierCode: newDossierCode,
    status: 'Reviewing', // Chờ thẩm định hồ sơ kiểm dịch xuất cảnh
    bookingId: bId,
    bookingCode: bCode,
    bookingHorseId: firstHorse.bookingHorseId || 1,
    customerName: booking.CustomerName || booking.customerName || 'Khách hàng',
    customerPhone: booking.CustomerPhone || booking.customerPhone || '+84988111222',
    customerEmail: booking.CustomerEmail || booking.customerEmail || 'customer@test.com',
    horseId: firstHorse.HorseID || firstHorse.horseId || 1,
    horseName: horseNames,
    microchipNumber: firstHorse.MicrochipNumber || firstHorse.microchipNumber || '985141008472910',
    passportNumber: firstHorse.PassportNumber || firstHorse.passportNumber || `FEI-VN-2026-${String(bId).padStart(2, '0')}`,
    breed: firstHorse.Breed || firstHorse.breed || 'Thoroughbred',
    gender: firstHorse.Gender || firstHorse.gender || 'Stallion',
    dateOfBirth: firstHorse.DateOfBirth || firstHorse.dateOfBirth || '2021-01-01',
    pickupAddress: booking.PickupAddress || booking.pickupAddress || 'Trang trại xuất phát',
    pickupCountryCode: pickupCountry,
    dropoffAddress: booking.DropoffAddress || booking.dropoffAddress || 'Điểm đến quốc tế',
    dropoffCountryCode: dropoffCountry,
    departureDate: booking.DepartureDate || booking.departureDate || new Date().toISOString(),
    specialistUserId: Number(specialistUserId) || 2,
    specialistName: Number(specialistUserId) === 2 ? 'Nguyễn Thị Mai' : 'Chuyên viên Kiểm dịch',
    clearanceNumber: null,
    issueReason: null,
    clearedAt: null,
    createdAt: new Date().toISOString(),
    slaDeadline: new Date(Date.now() + 48 * 3600000).toISOString(),
    slaHoursRemaining: 48,
    slaStatus: 'Normal',
    requiredCount: 4,
    approvedCount: 0,
    isReadyToSubmit: false,
    conditionQuestions: [
      {
        id: 'q1',
        question: `Ngựa đã qua thời gian cách ly kiểm dịch tối thiểu tại chuồng xuất phát (${pickupCountry})?`,
        passed: true,
        note: 'Kiểm tra lâm sàng ban đầu đầy đủ',
      },
      {
        id: 'q2',
        question: `Không phát hiện triệu chứng lây nhiễm theo quy chuẩn của nước nhập cảnh (${dropoffCountry})?`,
        passed: true,
        note: 'Xét nghiệm âm tính với các bệnh truyền nhiễm Equine',
      },
      {
        id: 'q3',
        question: 'Đối chiếu mã vi mạch sinh trắc học (Microchip) trùng khớp 100% với hộ chiếu?',
        passed: true,
        note: 'Đã quét chip cảm biến đối soát',
      },
    ],
    checklist: [
      {
        docTypeId: 1,
        docTypeCode: 'HORSE_PASSPORT',
        docTypeName: 'Hộ chiếu ngựa FEI quốc tế',
        authority: 'Liên đoàn Thể thao Cưỡi ngựa Quốc tế (FEI)',
        isMandatory: true,
        validityDays: 365,
        state: 'Pending',
        documentId: 1001,
        notes: 'Bắt buộc đối chiếu mã vi mạch và sơ đồ nhận dạng lông xoáy',
      },
      {
        docTypeId: 2,
        docTypeCode: 'HEALTH_CERT',
        docTypeName: 'Chứng nhận kiểm dịch thú y xuất khẩu',
        authority: 'Cục Thú y / Chi cục Thú y Vùng',
        isMandatory: true,
        validityDays: 14,
        state: 'Pending',
        documentId: 1002,
        notes: 'Xác nhận âm tính với bệnh truyền nhiễm (AIE, EVA, Glanders)',
      },
      {
        docTypeId: 3,
        docTypeCode: 'IMPORT_PERMIT',
        docTypeName: `Giấy phép nhập cảnh của Cơ quan Thú y nước đến (${dropoffCountry})`,
        authority: `Cơ quan Thú y & Nông nghiệp ${dropoffCountry}`,
        isMandatory: true,
        validityDays: 30,
        state: 'Pending',
        documentId: 1003,
        notes: 'Chấp thuận nhập cảnh và bố trí trạm kiểm dịch đích',
      },
      {
        docTypeId: 4,
        docTypeCode: 'VACCINE_RECORD',
        docTypeName: 'Chứng nhận tiêm phòng cúm Equine Influenza',
        authority: 'Phòng khám thú y được cấp phép',
        isMandatory: true,
        validityDays: 180,
        state: 'Pending',
        documentId: 1004,
        notes: 'Tiêm mũi nhắc lại trong vòng 6 tháng và cách ngày bay tối thiểu 14 ngày',
      },
    ],
    documents: [],
  };

  const updatedList = [newDossier, ...currentList];
  saveStoredDossiers(updatedList);
  return newDossier;
}
