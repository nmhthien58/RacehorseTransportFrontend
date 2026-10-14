/**
 * Hệ thống lưu trữ và quản lý "Thư yêu cầu vận chuyển" (Transport Request Letters) gửi tới Admin / Manager
 * Tự động tạo thư khi Customer gửi yêu cầu đặt chuyến mới (Booking).
 */

const STORAGE_KEY = 'racehorse_request_letters';

const INITIAL_LETTERS = [
  {
    id: 'LTR-2026-0001',
    bookingId: 1,
    bookingCode: 'BKG-2026-0001',
    title: 'Thư đề nghị vận chuyển: BKG-2026-0001',
    titleEn: 'Transport Request Letter: BKG-2026-0001',
    customerName: 'Jane Smith',
    customerEmail: 'customer@test.com',
    customerPhone: '+84988111222',
    pickupAddress: 'Trang trại Yên Bài, Ba Vì, Hà Nội',
    dropoffAddress: 'Trường đua Tùng Hóa, TP. Quảng Châu',
    transportMode: 'Ground',
    totalHorses: 2,
    horsesDescription: 'Midnight Gunner, Royal Duchess (Hạng Shared Stall)',
    estimatedCost: 7500,
    departureDate: '2026-10-01T06:00:00Z',
    isRead: false,
    createdAt: '2026-09-29T08:30:00Z',
    contentVi: `Kính gửi Ban Điều Phối & Quản Lý Racehorse Transport,

Tôi là Jane Smith, chủ sở hữu trang trại Ba Vì. Tôi trân trọng gửi thư này đề nghị sắp xếp vận chuyển chuyên dụng cho 02 cá thể ngựa Midnight Gunner và Royal Duchess từ Ba Vì tới Trường đua Tùng Hóa, Quảng Châu.

Yêu cầu chăm sóc:
- Xe chuyên dụng có điều hòa nhiệt độ cabin 18-20°C.
- Có Bác sĩ thú y áp tải kiểm tra sinh hiệu định kỳ và bù nước.
- Hỗ trợ thủ tục thông quan cửa khẩu Hữu Nghị.

Kính đề nghị Ban Quản lý xem xét hồ sơ và phê duyệt kế hoạch sớm nhất.

Trân trọng,
Jane Smith`,
    contentEn: `Dear Racehorse Transport Operations & Dispatch Team,

I am Jane Smith. I hereby submit this official request for transport of 2 Thoroughbred racehorses (Midnight Gunner & Royal Duchess) from Ba Vi to Conghua Racecourse, Guangzhou.

Key requirements:
- Climate-controlled trailer maintaining 18-20°C.
- Onboard vet escort for vital signs and hydration checks.
- Border customs clearance assistance at Huu Nghi port.

Please review and confirm dispatch schedule at your earliest convenience.

Sincerely,
Jane Smith`,
  },
  {
    id: 'LTR-2026-0002',
    bookingId: 2,
    bookingCode: 'BKG-2026-0002',
    title: 'Thư yêu cầu vận chuyển thi đấu: BKG-2026-0002',
    titleEn: 'Transport Request Letter: BKG-2026-0002',
    customerName: 'Jane Smith',
    customerEmail: 'customer@test.com',
    customerPhone: '+84988111222',
    pickupAddress: 'Trang trại sinh thái Yên Bài, Ba Vì, Hà Nội, Việt Nam',
    dropoffAddress: 'Hippodrome de Longchamp, Paris, France',
    transportMode: 'Air',
    totalHorses: 1,
    horsesDescription: 'Northern Dancer (Hạng Comfort)',
    estimatedCost: 7200,
    departureDate: '2026-11-01T07:00:00Z',
    isRead: false,
    createdAt: '2026-10-09T10:15:00Z',
    contentVi: `Kính gửi Ban Giám Đốc Logistics & Đội xe Chuyên dụng,

Trang trại Ba Vì chúng tôi vừa đăng ký chuyến vận chuyển hàng không quốc tế cho ngựa Northern Dancer tham dự giải đua tại Paris, Pháp. Đơn đặt chuyến BKG-2026-0002 đã được nộp trên hệ thống cùng chứng nhận tiêm phòng hợp lệ.

Kính mong Quản lý vận hành kiểm tra báo giá, hoàn tất thủ tục xuất khẩu thú y và phê duyệt đơn giúp chúng tôi.

Trân trọng cảm ơn!
Jane Smith (Ba Vì Racing Club)`,
    contentEn: `Dear Logistics Management & Fleet Operations,

We have registered an international air freight transport for Northern Dancer to participate in the upcoming racing tournament in Paris, France under booking BKG-2026-0002.

Please review our itemized quote and approve the request to initiate veterinary passport verification.

Best regards,
Jane Smith (Ba Vì Racing Club)`,
  },
];

/**
 * Đọc danh sách thư yêu cầu từ localStorage
 * @returns {Array<any>}
 */
export function getStoredRequestLetters() {
  if (typeof window === 'undefined') return [...INITIAL_LETTERS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LETTERS));
      return [...INITIAL_LETTERS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const hasOldFakeData = parsed.some((l) => l.customerName === 'Sheikh Mohammed Al-Maktoum');
      if (hasOldFakeData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LETTERS));
        return [...INITIAL_LETTERS];
      }
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LETTERS));
    return [...INITIAL_LETTERS];
  } catch (err) {
    console.error('Lỗi khi đọc thư yêu cầu từ localStorage:', err);
    return [...INITIAL_LETTERS];
  }
}

/**
 * Thêm thư yêu cầu mới khi Customer gửi đơn đặt chuyến
 * @param {Object} booking
 * @returns {Object} Thư mới tạo
 */
export function addRequestLetterFromBooking(booking) {
  const currentLetters = getStoredRequestLetters();
  const id = `LTR-${booking.BookingCode || Date.now()}`;

  const customerName = booking.CustomerName || 'Jane Smith';
  const customerEmail = booking.CustomerEmail || 'customer@test.com';
  const customerPhone = booking.CustomerPhone || '+84988111222';
  const bookingCode = booking.BookingCode || `BKG-2026-${String(booking.BookingID || Date.now()).slice(-4)}`;
  const totalHorses = Number(booking.TotalHorses) || 1;
  const transportMode = booking.TransportMode || 'Ground';
  const pickup = booking.PickupAddress || 'Việt Nam';
  const dropoff = booking.DropoffAddress || 'Điểm đến quốc tế';
  const cost = Number(booking.EstimatedCost) || 0;
  const departure = booking.DepartureDate || new Date().toISOString();

  const modeName =
    transportMode === 'Air'
      ? 'Đường hàng không (Air Freight)'
      : transportMode === 'DoorToDoor'
      ? 'Đa phương thức Chuồng - Chuồng (Door-to-Door)'
      : 'Đường bộ chuyên dụng (Ground Trailer)';

  const newLetter = {
    id,
    bookingId: Number(booking.BookingID),
    bookingCode,
    title: `Thư yêu cầu vận chuyển mới: ${bookingCode}`,
    titleEn: `New Transport Request Letter: ${bookingCode}`,
    customerName,
    customerEmail,
    customerPhone,
    pickupAddress: pickup,
    dropoffAddress: dropoff,
    transportMode,
    totalHorses,
    horsesDescription: `${totalHorses} cá thể ngựa đua`,
    estimatedCost: cost,
    departureDate: departure,
    isRead: false,
    createdAt: new Date().toISOString(),
    contentVi: `Kính gửi Ban Quản Lý & Điều Phối Logistics Racehorse Transport,

Tôi là ${customerName}, chủ sở hữu đàn ngựa. Tôi vừa gửi yêu cầu đặt chuyến vận chuyển mã số ${bookingCode} trên cổng thông tin khách hàng.

Thông tin tóm tắt lộ trình:
- Địa điểm đón: ${pickup}
- Địa điểm giao: ${dropoff}
- Phương thức vận chuyển: ${modeName}
- Số lượng: ${totalHorses} ngựa
- Dự kiến khởi hành: ${new Date(departure).toLocaleDateString('vi-VN')}
- Ước tính cước phí dự kiến: ${cost.toLocaleString()} USD
${booking.SpecialInstructions ? `- Yêu cầu đặc biệt từ chủ ngựa: "${booking.SpecialInstructions}"` : ''}

Kính đề nghị Quản lý điều vận kiểm tra tính khả dụng của đội xe/chuyến bay, phân bổ Bác sĩ thú y hoặc Chuyên viên kiểm dịch phụ trách và phê duyệt đơn giúp tôi.

Trân trọng cảm ơn,
${customerName}`,
    contentEn: `Dear Racehorse Transport Logistics & Fleet Management,

I am ${customerName}. I have just submitted a new horse transport booking request with reference code ${bookingCode}.

Trip summary:
- Origin: ${pickup}
- Destination: ${dropoff}
- Transport Method: ${transportMode}
- Horses count: ${totalHorses}
- Target Departure: ${new Date(departure).toLocaleDateString('en-US')}
- Estimated Freight: ${cost.toLocaleString()} USD
${booking.SpecialInstructions ? `- Special Care Instructions: "${booking.SpecialInstructions}"` : ''}

Please review our request, assign designated specialists/coordinators, and grant approval to proceed with route planning.

Kind regards,
${customerName}`,
  };

  const updated = [newLetter, ...currentLetters];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('request_letter_received', { detail: newLetter }));
      window.dispatchEvent(new CustomEvent('letters_updated', { detail: updated }));
    } catch (e) {
      console.error('Lỗi ghi thư yêu cầu vào localStorage:', e);
    }
  }
  return newLetter;
}

/**
 * Đánh dấu một thư là đã đọc
 * @param {string} letterId
 */
export function markLetterAsRead(letterId) {
  const current = getStoredRequestLetters();
  const updated = current.map((l) => (l.id === letterId ? { ...l, isRead: true } : l));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('letters_updated', { detail: updated }));
  }
}

/**
 * Đánh dấu toàn bộ thư là đã đọc
 */
export function markAllLettersAsRead() {
  const current = getStoredRequestLetters();
  const updated = current.map((l) => ({ ...l, isRead: true }));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('letters_updated', { detail: updated }));
  }
}

/**
 * Lấy số lượng thư chưa đọc
 * @returns {number}
 */
export function getUnreadLettersCount() {
  const letters = getStoredRequestLetters();
  return letters.filter((l) => !l.isRead).length;
}

export default {
  getStoredRequestLetters,
  addRequestLetterFromBooking,
  markLetterAsRead,
  markAllLettersAsRead,
  getUnreadLettersCount,
};
