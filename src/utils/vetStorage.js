const VET_RECORDS_KEY = 'racehorse_vet_records_storage';
const VET_REMINDERS_KEY = 'racehorse_vet_reminders_storage';
const VET_MARKINGS_KEY = 'racehorse_vet_markings_storage';
const VET_PHOTOS_KEY = 'racehorse_vet_photos_storage';

export const INITIAL_VET_RECORDS = [
  {
    id: 1001,
    horseId: 'H-01',
    recordType: 'Coggins',
    title: 'Equine Infectious Anemia (Coggins Test - AGID)',
    date: '2026-08-10',
    expirationDate: '2027-02-10',
    nextDueDate: '2027-02-10',
    resultFinding: 'Negative (Passed)',
    providerName: 'Dr. Sarah Jenkins, DVM',
    providerContact: 'Oak Ridge Equine Hospital · (555) 234-5678',
    lotNumber: 'COG-884-VN',
    accessionNumber: 'ACC-2026-909',
    issuingState: 'FEI / WOAH Certified',
    notes: 'FEI certified negative test for international air/ground transport.',
  },
  {
    id: 1002,
    horseId: 'H-01',
    recordType: 'Vaccinations',
    title: 'Equine Influenza & Tetanus Toxoid Booster',
    date: '2026-07-15',
    expirationDate: '2027-01-15',
    nextDueDate: '2027-01-15',
    resultFinding: 'Vaccinated (Passed)',
    providerName: 'Dr. Sarah Jenkins, DVM',
    providerContact: 'Oak Ridge Equine Hospital',
    lotNumber: 'VAC-FL-991',
    accessionNumber: 'ACC-2026-102',
    issuingState: 'Ministry of Agriculture',
    notes: 'Annual booster completed, zero adverse reactions noted.',
  },
  {
    id: 1003,
    horseId: 'H-01',
    recordType: 'Health Cert',
    title: 'Pre-Travel Certificate of Veterinary Inspection (CVI)',
    date: '2026-09-20',
    expirationDate: '2026-10-20',
    nextDueDate: '2026-10-20',
    resultFinding: 'Fit to Travel (Approved)',
    providerName: 'IET Equine Clinic',
    providerContact: '(555) 555-0123',
    lotNumber: 'CVI-INT-092',
    accessionNumber: 'ACC-2026-784',
    issuingState: 'International Equine Transport Authority',
    notes: 'Fit to travel clearance approved for air and ground transport.',
  },
  {
    id: 1004,
    horseId: 'H-04',
    recordType: 'Vaccinations',
    title: 'Equine Influenza (Florida Clade 1 & 2)',
    date: '2026-08-15',
    expirationDate: '2027-02-15',
    nextDueDate: '2027-02-15',
    resultFinding: 'Passed',
    providerName: 'Dr. Sarah Jenkins (FEI Official Vet)',
    providerContact: 'Trung tâm Thú y Hoàng Gia Ba Vì',
    lotNumber: 'EIF-2026-01',
    accessionNumber: 'ACC-883-99',
    issuingState: 'FEI National Federation',
    notes: 'Đạt điều kiện kiểm dịch xuất nhập cảnh quốc tế theo tiêu chuẩn WOAH/FEI.',
  },
  {
    id: 1005,
    horseId: 'H-04',
    recordType: 'Dental',
    title: 'Dental Exam & Occlusal Floating',
    date: '2026-05-12',
    expirationDate: '2027-05-12',
    nextDueDate: '2027-05-12',
    resultFinding: 'Normal',
    providerName: 'Dr. Sarah Jenkins, DVM',
    providerContact: 'Oak Ridge Equine Hospital',
    notes: 'Khớp cắn cân đối, răng hàm phát triển chuẩn.',
  },
  {
    id: 1006,
    horseId: 'H-05',
    recordType: 'Other',
    title: 'Khẩn cấp: Rạn xương bánh chè & Viêm sưng cấp tính',
    date: '2026-10-01',
    expirationDate: '2026-10-15',
    nextDueDate: '2026-10-15',
    resultFinding: 'Non-Fit-to-Travel (CẤM VẬN CHUYỂN)',
    providerName: 'Dr. Sarah Jenkins (FEI Official Vet)',
    providerContact: 'Bệnh viện Thú y Quốc tế IET',
    notes: 'Chấn thương nghiêm trọng, sốt cao 39.8°C. Chống chỉ định di chuyển đường dài.',
  },
];

export const INITIAL_REMINDERS = [
  {
    id: 2001,
    horseId: 'H-01',
    title: 'Tetanus Toxoid Booster Due',
    type: 'Vaccination',
    dueDate: 'In 10 days',
    notes: 'Annual booster required for competition readiness.',
    status: 'Upcoming',
  },
  {
    id: 2002,
    horseId: 'H-01',
    title: 'Coggins 6-Month Renewal',
    type: 'Coggins',
    dueDate: 'In 35 days',
    notes: 'Required for cross-border international transit.',
    status: 'Upcoming',
  },
  {
    id: 2003,
    horseId: 'H-04',
    title: 'Farrier Shoe Reset',
    type: 'Farrier',
    dueDate: 'In 14 days',
    notes: 'Inspection and new aluminum competition plates.',
    status: 'Upcoming',
  },
];

/**
 * Khử trùng lặp hồ sơ thú y dựa trên ID và bộ thuộc tính (title, date, horseId)
 */
export function deduplicateVetRecords(records) {
  if (!Array.isArray(records)) return [];
  const seen = new Set();
  const result = [];
  for (const r of records) {
    if (!r) continue;
    const key = r.id ? `id_${r.id}` : `val_${r.title || ''}_${r.date || ''}_${r.horseId || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(r);
    }
  }
  return result;
}

/**
 * Khử trùng lặp lời nhắc
 */
export function deduplicateReminders(reminders) {
  if (!Array.isArray(reminders)) return [];
  const seen = new Set();
  const result = [];
  for (const r of reminders) {
    if (!r) continue;
    const key = r.id ? `id_${r.id}` : `val_${r.title || ''}_${r.dueDate || ''}_${r.horseId || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(r);
    }
  }
  return result;
}

/**
 * Lấy toàn bộ hồ sơ thú y từ localStorage (Tự động lọc trùng lặp)
 */
export function getStoredVetRecords() {
  if (typeof window === 'undefined') return deduplicateVetRecords([...INITIAL_VET_RECORDS]);
  try {
    const raw = localStorage.getItem(VET_RECORDS_KEY);
    if (!raw) {
      const deduped = deduplicateVetRecords([...INITIAL_VET_RECORDS]);
      localStorage.setItem(VET_RECORDS_KEY, JSON.stringify(deduped));
      return deduped;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const deduped = deduplicateVetRecords(parsed);
      if (deduped.length !== parsed.length) {
        localStorage.setItem(VET_RECORDS_KEY, JSON.stringify(deduped));
      }
      return deduped;
    }
    const deduped = deduplicateVetRecords([...INITIAL_VET_RECORDS]);
    localStorage.setItem(VET_RECORDS_KEY, JSON.stringify(deduped));
    return deduped;
  } catch (err) {
    console.error('Lỗi khi đọc hồ sơ thú y từ storage:', err);
    return deduplicateVetRecords([...INITIAL_VET_RECORDS]);
  }
}

/**
 * Thêm mới một hồ sơ thú y (Chống nhân đôi dữ liệu tuyệt đối)
 */
export function addStoredVetRecord(recordData) {
  const currentList = getStoredVetRecords();
  const newRec = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...recordData,
  };
  const filtered = currentList.filter(
    (r) => !(r.title?.trim() === newRec.title?.trim() && r.date === newRec.date && r.horseId === newRec.horseId)
  );
  const updatedList = deduplicateVetRecords([newRec, ...filtered]);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VET_RECORDS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('vet_records_updated', { detail: updatedList }));
    } catch (err) {
      console.error('Lỗi khi lưu hồ sơ thú y vào storage:', err);
    }
  }
  return newRec;
}

/**
 * Chỉnh sửa cập nhật một hồ sơ thú y
 * @param {number|string} id
 * @param {Object} updateData
 * @returns {Object|null}
 */
export function updateStoredVetRecord(id, updateData) {
  const currentList = getStoredVetRecords();
  const index = currentList.findIndex((r) => String(r.id) === String(id));
  if (index === -1) return null;

  const updatedRec = {
    ...currentList[index],
    ...updateData,
    id: currentList[index].id,
    updatedAt: new Date().toISOString(),
  };

  currentList[index] = updatedRec;
  const updatedList = deduplicateVetRecords(currentList);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VET_RECORDS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('vet_records_updated', { detail: updatedList }));
    } catch (err) {
      console.error('Lỗi khi cập nhật hồ sơ thú y:', err);
    }
  }
  return updatedRec;
}

/**
 * Xóa một hồ sơ thú y
 * @param {number|string} id
 * @returns {Array<any>}
 */
export function deleteStoredVetRecord(id) {
  const currentList = getStoredVetRecords();
  const updatedList = currentList.filter((r) => String(r.id) !== String(id));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VET_RECORDS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('vet_records_updated', { detail: updatedList }));
    } catch (err) {
      console.error('Lỗi khi xóa hồ sơ thú y:', err);
    }
  }
  return updatedList;
}

/**
 * Lấy danh sách nhắc nhở (Reminders)
 */
export function getStoredReminders() {
  if (typeof window === 'undefined') return deduplicateReminders([...INITIAL_REMINDERS]);
  try {
    const raw = localStorage.getItem(VET_REMINDERS_KEY);
    if (!raw) {
      const deduped = deduplicateReminders([...INITIAL_REMINDERS]);
      localStorage.setItem(VET_REMINDERS_KEY, JSON.stringify(deduped));
      return deduped;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const deduped = deduplicateReminders(parsed);
      if (deduped.length !== parsed.length) {
        localStorage.setItem(VET_REMINDERS_KEY, JSON.stringify(deduped));
      }
      return deduped;
    }
    const deduped = deduplicateReminders([...INITIAL_REMINDERS]);
    localStorage.setItem(VET_REMINDERS_KEY, JSON.stringify(deduped));
    return deduped;
  } catch (err) {
    console.error('Lỗi khi đọc nhắc nhở từ storage:', err);
    return deduplicateReminders([...INITIAL_REMINDERS]);
  }
}

/**
 * Thêm mới một nhắc nhở
 */
export function addStoredReminder(reminderData) {
  const currentList = getStoredReminders();
  const newRem = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    status: 'Upcoming',
    ...reminderData,
  };
  const filtered = currentList.filter(
    (r) => !(r.title?.trim() === newRem.title?.trim() && r.dueDate === newRem.dueDate && r.horseId === newRem.horseId)
  );
  const updatedList = deduplicateReminders([newRem, ...filtered]);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VET_REMINDERS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('reminders_updated', { detail: updatedList }));
    } catch (err) {
      console.error('Lỗi khi lưu nhắc nhở vào storage:', err);
    }
  }
  return newRem;
}

/**
 * Xóa một nhắc nhở
 */
export function deleteStoredReminder(id) {
  const currentList = getStoredReminders();
  const updatedList = currentList.filter((r) => r.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VET_REMINDERS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('reminders_updated', { detail: updatedList }));
    } catch (err) {
      console.error('Lỗi khi xóa nhắc nhở:', err);
    }
  }
  return updatedList;
}

/**
 * Đọc đặc điểm nhận dạng thể chất của ngựa
 */
export function getStoredMarkings(horseKey) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VET_MARKINGS_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all?.[horseKey] || null;
  } catch {
    return null;
  }
}

/**
 * Lưu đặc điểm nhận dạng thể chất của ngựa
 */
export function saveStoredMarkings(horseKey, markings) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(VET_MARKINGS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[horseKey] = markings;
    localStorage.setItem(VET_MARKINGS_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Lỗi khi lưu đặc điểm nhận dạng:', err);
  }
}

/**
 * Đọc bộ ảnh 6 góc nhận dạng
 */
export function getStoredAnglePhotos(horseKey) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VET_PHOTOS_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all?.[horseKey] || null;
  } catch {
    return null;
  }
}

/**
 * Lưu ảnh 6 góc nhận dạng (dạng Data URL / Base64)
 */
export function saveStoredAnglePhotos(horseKey, photos) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(VET_PHOTOS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[horseKey] = photos;
    localStorage.setItem(VET_PHOTOS_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Lỗi khi lưu ảnh nhận dạng:', err);
  }
}
