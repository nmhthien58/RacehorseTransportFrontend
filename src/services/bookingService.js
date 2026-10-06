import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file bookingService.js
 * @description Tầng Service xử lý nghiệp vụ đặt chuyến vận chuyển ngựa đua
 */

export const bookingService = {
  /**
   * Lấy danh sách các đơn đặt chuyến vận chuyển (có hỗ trợ lọc theo trạng thái)
   * @param {Object} [params] - Tham số lọc (ví dụ: { status: 'Submitted' })
   * @returns {Promise<{ data: import('../types/database').Booking[], total: number }>}
   */
  async getBookings(params) {
    return api.get(ENDPOINTS.BOOKINGS.LIST, { params });
  },

  /**
   * Lấy thông tin chi tiết một đơn đặt chuyến theo ID
   * @param {number|string} id - Mã định danh BookingID
   * @returns {Promise<import('../types/database').Booking>}
   */
  async getBookingById(id) {
    return api.get(ENDPOINTS.BOOKINGS.DETAIL(id));
  },

  /**
   * Tạo yêu cầu đặt chuyến vận chuyển mới (dành cho Customer)
   * @param {Partial<import('../types/database').Booking>} bookingData - Dữ liệu yêu cầu đặt chuyến
   * @returns {Promise<import('../types/database').Booking>}
   */
  async createBooking(bookingData) {
    return api.post(ENDPOINTS.BOOKINGS.CREATE, bookingData);
  },

  /**
   * Phê duyệt đơn đặt chuyến và phân công nhân sự phụ trách (dành cho Manager)
   * @param {number|string} id - Mã định danh BookingID
   * @param {{ specialistId?: number, coordinatorId?: number }} payload - Phân công Specialist và Coordinator
   * @returns {Promise<import('../types/database').Booking>}
   */
  async approveBooking(id, payload) {
    return api.post(ENDPOINTS.BOOKINGS.APPROVE(id), payload);
  },

  /**
   * Phân công chuyên viên kiểm dịch và điều phối viên cho đơn (trạng thái chuyển sang Assigned)
   * @param {number|string} id - Mã định danh BookingID
   * @param {{ specialistId: number, coordinatorId: number }} payload - Thông tin phân công
   * @returns {Promise<import('../types/database').Booking>}
   */
  async assignStaff(id, payload) {
    return api.post(ENDPOINTS.BOOKINGS.ASSIGN(id), payload);
  },

  /**
   * Từ chối đơn đặt chuyến vận chuyển kèm lý do (dành cho Manager)
   * @param {number|string} id - Mã định danh BookingID
   * @param {{ reason: string }} payload - Lý do từ chối
   * @returns {Promise<import('../types/database').Booking>}
   */
  async rejectBooking(id, payload) {
    return api.post(ENDPOINTS.BOOKINGS.REJECT(id), payload);
  },

  /**
   * Hủy đơn đặt chuyến vận chuyển (dành cho Customer)
   * @param {number|string} id - Mã định danh BookingID
   * @returns {Promise<import('../types/database').Booking>}
   */
  async cancelBooking(id) {
    return api.post(ENDPOINTS.BOOKINGS.CANCEL(id));
  },

  /**
   * Yêu cầu tính toán bảng phân tích báo giá chi tiết (theo bảng giá pricing.PriceItems)
   * @param {number|string} id - Mã định danh BookingID
   * @returns {Promise<any>}
   */
  async calculateQuote(id) {
    return api.post(ENDPOINTS.BOOKINGS.CALCULATE_QUOTE(id));
  },
};

export default bookingService;
