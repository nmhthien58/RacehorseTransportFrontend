import initialBookings from '@mocks/data/bookings.json';
import { addRequestLetterFromBooking } from './requestLetterStorage';

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
    (max, b) => Math.max(max, Number(b.BookingID || b.bookingId) || 0),
    0,
  );
  const newId = maxId + 1;
  const newCode = `BKG-2026-${String(newId).padStart(4, '0')}`;

  const horsesList = bookingData.BookingHorses || bookingData.bookingHorses || bookingData.horses || [];
  const totalHorsesCount =
    Number(bookingData.TotalHorses || bookingData.totalHorses) ||
    (Array.isArray(horsesList) ? horsesList.length : 0) ||
    1;

  const mode = bookingData.TransportMode || bookingData.transportMode || 'Ground';
  const requiresClimate = Boolean(bookingData.RequiresClimateControl ?? bookingData.requiresClimateControl);
  const isExpress = Boolean(bookingData.IsExpress ?? bookingData.isExpress);

  const estimatedCost =
    Number(bookingData.EstimatedCost ?? bookingData.estimatedCost) ||
    (mode === 'Air'
      ? totalHorsesCount * 4500
      : totalHorsesCount * 1800 + (requiresClimate ? 350 : 0));

  const pickup = (bookingData.PickupAddress || bookingData.pickupAddress || 'Trang trại Yên Bài, Ba Vì, Hà Nội').trim();
  const dropoff = (bookingData.DropoffAddress || bookingData.dropoffAddress || '').trim();
  const pickupCountry = bookingData.PickupCountryCode || bookingData.pickupCountryCode || 'VN';
  const dropoffCountry = bookingData.DropoffCountryCode || bookingData.dropoffCountryCode || 'CN';
  const departureDate = bookingData.DepartureDate || bookingData.departureDate || new Date().toISOString();
  const deliveryDate = bookingData.DeliveryDate || bookingData.deliveryDate || departureDate;

  const newBooking = {
    BookingID: newId,
    bookingId: newId,
    BookingCode: newCode,
    bookingCode: newCode,
    CustomerUserID: Number(bookingData.CustomerUserID || bookingData.customerUserId) || 5,
    customerUserId: Number(bookingData.CustomerUserID || bookingData.customerUserId) || 5,
    PickupAddress: pickup,
    pickupAddress: pickup,
    PickupCountryCode: pickupCountry,
    pickupCountryCode: pickupCountry,
    DropoffAddress: dropoff,
    dropoffAddress: dropoff,
    DropoffCountryCode: dropoffCountry,
    dropoffCountryCode: dropoffCountry,
    DepartureDate: departureDate,
    departureDate: departureDate,
    DeliveryDate: deliveryDate,
    deliveryDate: deliveryDate,
    TotalHorses: totalHorsesCount,
    totalHorses: totalHorsesCount,
    SpecialInstructions: (bookingData.SpecialInstructions || bookingData.specialInstructions)?.trim() || null,
    specialInstructions: (bookingData.SpecialInstructions || bookingData.specialInstructions)?.trim() || null,
    EstimatedCost: estimatedCost,
    estimatedCost: estimatedCost,
    CurrencyCode: bookingData.CurrencyCode || bookingData.currencyCode || 'USD',
    currencyCode: bookingData.CurrencyCode || bookingData.currencyCode || 'USD',
    Status: bookingData.Status || bookingData.status || 'Submitted',
    status: bookingData.Status || bookingData.status || 'Submitted',
    TransportMode: mode,
    transportMode: mode,
    DistanceKm: bookingData.DistanceKm || bookingData.distanceKm || (mode === 'Ground' ? 1200 : null),
    distanceKm: bookingData.DistanceKm || bookingData.distanceKm || (mode === 'Ground' ? 1200 : null),
    IsExpress: isExpress,
    isExpress: isExpress,
    RequiresClimateControl: requiresClimate,
    requiresClimateControl: requiresClimate,
    DeclaredValue: Number(bookingData.DeclaredValue || bookingData.declaredValue) || null,
    declaredValue: Number(bookingData.DeclaredValue || bookingData.declaredValue) || null,
    QuoteBreakdown: bookingData.QuoteBreakdown || bookingData.quoteBreakdown || null,
    quoteBreakdown: bookingData.QuoteBreakdown || bookingData.quoteBreakdown || null,
    BookingHorses: horsesList,
    bookingHorses: horsesList,
    horses: horsesList,
    RejectionReason: null,
    rejectionReason: null,
    ReviewedByUserID: null,
    reviewedByUserId: null,
    ReviewedAt: null,
    reviewedAt: null,
    AssignedSpecialistID: null,
    assignedSpecialistId: null,
    AssignedCoordinatorID: null,
    assignedCoordinatorId: null,
    CreatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const updatedList = [newBooking, ...currentList];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('bookings_updated', { detail: updatedList }));
      // Tự động tạo và gửi thư yêu cầu tới Admin / Manager
      try {
        addRequestLetterFromBooking(newBooking);
      } catch (e) {
        console.warn('Không thể tạo thư yêu cầu tự động:', e);
      }
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
