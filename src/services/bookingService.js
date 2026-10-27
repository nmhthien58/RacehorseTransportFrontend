import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file bookingService.js
 * @description Tầng Service xử lý nghiệp vụ đặt chuyến vận chuyển ngựa đua (Flow 1: Booking & Pricing)
 */

export const bookingService = {
  /**
   * Xem trước bảng báo giá phân tích chi phí trước khi gửi đơn chính thức
   * @param {Object} previewData - Thông tin tuyến đường, phương thức và danh sách ngựa
   * @returns {Promise<{ estimatedCost: number, currencyCode: string, quoteLines: Array<any> }>}
   */
  async previewQuote(previewData) {
    return api.post(ENDPOINTS.BOOKINGS.QUOTE_PREVIEW, previewData);
  },

  /**
   * Tính toán quãng đường đường bộ dự kiến từ Backend
   * @param {{ pickupCountryCode?: string, pickupCity?: string, pickupAddress?: string, dropoffCountryCode: string, dropoffCity?: string, dropoffAddress?: string }} params
   * @returns {Promise<{ distanceKm: number, estimatedHours: number, routeSummary: string, source: string }>}
   */
  async estimateDistance(params) {
    return api.post(ENDPOINTS.BOOKINGS.ESTIMATE_DISTANCE, params);
  },

  /**
   * Lấy danh sách các đơn đặt chuyến vận chuyển (hỗ trợ lọc theo trạng thái, khách hàng, phân trang)
   * @param {{ customerUserId?: number, status?: string, search?: string, sort?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: import('../types/database').Booking[], pagination?: any }>}
   */
  async getBookings(params) {
    return api.get(ENDPOINTS.BOOKINGS.LIST, { params });
  },

  /**
   * Lấy thông tin chi tiết một đơn đặt chuyến theo ID (kèm danh sách ngựa, bảng giá, hành trình)
   * @param {number|string} id - Mã định danh BookingID
   * @returns {Promise<import('../types/database').Booking>}
   */
  async getBookingById(id) {
    return api.get(ENDPOINTS.BOOKINGS.DETAIL(id));
  },

  /**
   * Tạo yêu cầu đặt chuyến vận chuyển mới (dành cho Customer)
   * @param {Object} bookingData - Dữ liệu yêu cầu đặt chuyến
   * @returns {Promise<import('../types/database').Booking>}
   */
  async createBooking(bookingData) {
    return api.post(ENDPOINTS.BOOKINGS.CREATE, bookingData);
  },

  /**
   * Khách hàng hủy đơn đặt chuyến khi còn ở trạng thái Submitted
   * @param {number|string} id - Mã định danh BookingID
   * @returns {Promise<any>}
   */
  async cancelBooking(id) {
    return api.post(ENDPOINTS.BOOKINGS.CANCEL(id));
  },

  /**
   * Phê duyệt đơn đặt chuyến và chỉ định chuyên viên kiểm dịch phụ trách (dành cho LogisticsManager)
   * @param {number|string} id - Mã định danh BookingID
   * @param {{ specialistUserId: number }} payload - Chuyên viên được chỉ định
   * @returns {Promise<import('../types/database').Booking>}
   */
  async approveBooking(id, payload) {
    return api.post(ENDPOINTS.BOOKINGS.APPROVE(id), payload);
  },

  /**
   * Từ chối đơn đặt chuyến vận chuyển kèm lý do (dành cho LogisticsManager)
   * @param {number|string} id - Mã định danh BookingID
   * @param {{ reason: string }} payload - Lý do từ chối
   * @returns {Promise<any>}
   */
  async rejectBooking(id, payload) {
    return api.post(ENDPOINTS.BOOKINGS.REJECT(id), payload);
  },

  /**
   * Xác nhận / sửa các nước quá cảnh của đơn đang chờ duyệt; backend tính lại báo giá (dành cho LogisticsManager)
   * @param {number|string} id - Mã định danh BookingID
   * @param {string[]} transitCountryCodes - Mã nước đi qua theo thứ tự; mảng rỗng = đi thẳng
   * @returns {Promise<any>}
   */
  async updateTransitCountries(id, transitCountryCodes) {
    return api.put(ENDPOINTS.BOOKINGS.TRANSIT_COUNTRIES(id), { transitCountryCodes });
  },

  /**
   * Đổi chuyên viên kiểm dịch phụ trách đơn (dành cho LogisticsManager)
   * @param {number|string} id - Mã định danh BookingID
   * @param {{ specialistUserId: number }} payload - Chuyên viên mới
   * @returns {Promise<any>}
   */
  async reassignSpecialist(id, payload) {
    return api.post(ENDPOINTS.BOOKINGS.REASSIGN_SPECIALIST(id), payload);
  },

  // === Bí danh tương thích ngược ===
  async assignStaff(id, payload) {
    return this.reassignSpecialist(id, {
      specialistUserId: payload.specialistUserId || payload.specialistId,
    });
  },

  /**
   * Cập nhật thông tin người nhận của đơn (BE-15, khóa khi xe tới điểm trả)
   * @param {number|string} id
   * @param {{ recipientName: string, recipientPhone: string, recipientEmail?: string, recipientIdNumber?: string, recipientIsCustomer?: boolean }} payload
   * @returns {Promise<any>}
   */
  async updateRecipient(id, payload) {
    return api.put(ENDPOINTS.BOOKINGS.UPDATE_RECIPIENT(id), payload);
  },

  /**
   * Khách xác nhận người nhận sẽ có mặt nhận ngựa theo khung giờ đã báo (BE-15)
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  async confirmRecipient(id) {
    return api.post(ENDPOINTS.BOOKINGS.CONFIRM_RECIPIENT(id));
  },

  /**
   * Khách duyệt người nhận thay khi tài xế báo tên người ký khác (BE-15)
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  async approveAlternateRecipient(id) {
    return api.post(ENDPOINTS.BOOKINGS.APPROVE_ALTERNATE_RECIPIENT(id));
  },

  /**
   * Báo tên người ký khác trên e-POD cần khách duyệt (BE-15)
   * @param {number|string} id
   * @param {{ alternateRecipientName: string, alternateRecipientPhone?: string, alternateRecipientIdCard?: string }} payload
   * @returns {Promise<any>}
   */
  async proposeAlternateRecipient(id, payload) {
    return api.post(ENDPOINTS.BOOKINGS.PROPOSE_ALTERNATE_RECIPIENT(id), payload);
  },
  async calculateQuote(id, previewData = {}) {
    if (previewData && Object.keys(previewData).length > 0) {
      return this.previewQuote(previewData);
    }
    return api.post(ENDPOINTS.BOOKINGS.CALCULATE_QUOTE(id));
  },
};

export default bookingService;
