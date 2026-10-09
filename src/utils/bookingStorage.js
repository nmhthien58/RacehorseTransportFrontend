import initialBookings from '@mocks/data/bookings.json';

const STORAGE_KEY = 'racehorse_bookings_storage';

/**
 * Lấy toàn bộ danh sách yêu cầu vận chuyển từ localStorage, có fallback về dữ liệu mẫu ban đầu
 * @returns {Array<any>}
 */
export function getStoredBookings() {
  if (typeof window === 'undefined') return [...initialBookings];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBookings));
      return [...initialBookings];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBookings));
    return [...initialBookings];
  } catch (err) {
    console.error('Lỗi khi đọc danh sách bookings từ localStorage:', err);
    return [...initialBookings];
  }
}

/**
 * Lấy thông tin chi tiết một đơn đặt chuyến theo ID
 * @param {number|string} id
 * @returns {any|null}
 */
export function getStoredBookingById(id) {
  const list = getStoredBookings();
  const numId = Number(id);
  return list.find((b) => Number(b.BookingID) === numId) || null;
}

/**
 * Thêm mới một đơn yêu cầu vận chuyển và lưu vào localStorage
 * @param {Object} bookingData
 * @returns {Object} Đơn đặt chuyến mới được tạo
 */
export function addStoredBooking(bookingData) {
  const currentList = getStoredBookings();
  const maxId = currentList.reduce(
    (max, b) => Math.max(max, Number(b.BookingID) || 0),
    0,
  );
  const newId = maxId + 1;
  const newCode = `BKG-2026-${String(newId).padStart(4, '0')}`;

  const totalHorsesCount = Array.isArray(bookingData.BookingHorses)
    ? bookingData.BookingHorses.length
    : Number(bookingData.TotalHorses) || 1;

  const estimatedCost =
    Number(bookingData.EstimatedCost) ||
    (bookingData.TransportMode === 'Air'
      ? totalHorsesCount * 4500
      : totalHorsesCount * 1800 + (bookingData.RequiresClimateControl ? 350 : 0));

  const newBooking = {
    BookingID: newId,
    BookingCode: newCode,
    CustomerUserID: Number(bookingData.CustomerUserID) || 5,
    PickupAddress: (bookingData.PickupAddress || 'Trang trại Yên Bài, Ba Vì, Hà Nội').trim(),
    PickupCountryCode: bookingData.PickupCountryCode || 'VN',
    DropoffAddress: (bookingData.DropoffAddress || '').trim(),
    DropoffCountryCode: bookingData.DropoffCountryCode || 'CN',
    DepartureDate: bookingData.DepartureDate || new Date().toISOString(),
    DeliveryDate: bookingData.DeliveryDate || bookingData.DepartureDate || new Date().toISOString(),
    TotalHorses: totalHorsesCount,
    SpecialInstructions: bookingData.SpecialInstructions?.trim() || null,
    EstimatedCost: estimatedCost,
    CurrencyCode: bookingData.CurrencyCode || 'USD',
    Status: bookingData.Status || 'Submitted',
    TransportMode: bookingData.TransportMode || 'Ground',
    DistanceKm: bookingData.DistanceKm || (bookingData.TransportMode === 'Ground' ? 1200 : null),
    IsExpress: Boolean(bookingData.IsExpress),
    RequiresClimateControl: Boolean(bookingData.RequiresClimateControl),
    DeclaredValue: Number(bookingData.DeclaredValue) || null,
    QuoteBreakdown: bookingData.QuoteBreakdown || null,
    BookingHorses: bookingData.BookingHorses || [],
    RejectionReason: null,
    ReviewedByUserID: null,
    ReviewedAt: null,
    AssignedSpecialistID: null,
    AssignedCoordinatorID: null,
    CreatedAt: new Date().toISOString(),
  };

  const updatedList = [newBooking, ...currentList];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('bookings_updated', { detail: updatedList }));
    } catch (err) {
      console.error('Lỗi khi ghi booking mới vào localStorage:', err);
    }
  }

  return newBooking;
}

/**
 * Cập nhật đơn đặt chuyến trong localStorage
 * @param {number|string} id
 * @param {Object} updateData
 * @returns {Object|null}
 */
export function updateStoredBooking(id, updateData) {
  const currentList = getStoredBookings();
  const numId = Number(id);
  const index = currentList.findIndex((b) => Number(b.BookingID) === numId);
  if (index === -1) return null;

  const updatedBooking = {
    ...currentList[index],
    ...updateData,
  };

  currentList[index] = updatedBooking;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
      window.dispatchEvent(new CustomEvent('bookings_updated', { detail: currentList }));
    } catch (err) {
      console.error('Lỗi khi cập nhật booking trong localStorage:', err);
    }
  }

  return updatedBooking;
}

/**
 * Xóa đơn đặt chuyến khỏi localStorage
 * @param {number|string} id
 * @returns {boolean}
 */
export function deleteStoredBooking(id) {
  const currentList = getStoredBookings();
  const numId = Number(id);
  const filtered = currentList.filter((b) => Number(b.BookingID) !== numId);
  if (filtered.length === currentList.length) return false;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('bookings_updated', { detail: filtered }));
    } catch (err) {
      console.error('Lỗi khi xóa booking khỏi localStorage:', err);
    }
  }

  return true;
}
