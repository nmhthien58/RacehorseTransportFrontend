import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file paymentService.js
 * @description Tầng Service xử lý thanh toán đơn vận chuyển (R-02): đặt cọc, phần còn lại,
 * chi phí phát sinh, hoàn tiền khi hủy và cấu hình thanh toán.
 */

export const paymentService = {
  /**
   * Lấy tóm tắt thanh toán của đơn: khoản cần trả tiếp theo, đã trả, hoàn tiền và lịch sử giao dịch
   * @param {number|string} bookingId
   * @returns {Promise<any>}
   */
  async getBookingPayments(bookingId) {
    return api.get(ENDPOINTS.PAYMENTS.BOOKING(bookingId));
  },

  /**
   * Trang Thanh toán của khách: tổng quan tiền mọi đơn, các khoản cần trả ngay và toàn bộ giao dịch
   * @returns {Promise<any>}
   */
  async getMyBilling() {
    return api.get(ENDPOINTS.PAYMENTS.MY);
  },

  /**
   * Khách tạo link thanh toán (VNPay hoặc cổng giả lập) cho khoản đang mở của đơn
   * @param {number|string} bookingId
   * @param {'Deposit'|'Balance'|'Extra'} paymentType
   * @returns {Promise<{ payment: any, paymentUrl: string }>}
   */
  async createPayment(bookingId, paymentType) {
    return api.post(ENDPOINTS.PAYMENTS.BOOKING(bookingId), { paymentType });
  },

  /**
   * Manager ghi nhận khoản khách đã trả ngoài hệ thống (chuyển khoản, tiền mặt tại văn phòng)
   * @param {number|string} bookingId
   * @param {{ paymentType: string, amount: number, reference: string, note?: string }} payload
   * @returns {Promise<any>}
   */
  async recordManualPayment(bookingId, payload) {
    return api.post(ENDPOINTS.PAYMENTS.MANUAL(bookingId), payload);
  },

  /**
   * Hoàn tất giao dịch trên cổng thanh toán giả lập (chỉ dùng khi backend chạy Payment:Provider = Mock)
   * @param {string} txnRef
   * @param {boolean} success
   * @returns {Promise<any>}
   */
  async completeMockPayment(txnRef, success) {
    return api.post(ENDPOINTS.PAYMENTS.MOCK_COMPLETE(txnRef), { success });
  },

  /**
   * Gửi lại yêu cầu hoàn tiền qua cổng thanh toán khi lần trước thất bại
   * @param {number|string} paymentId - PaymentID của dòng hoàn tiền
   * @returns {Promise<any>}
   */
  async retryRefund(paymentId) {
    return api.post(ENDPOINTS.PAYMENTS.RETRY_REFUND(paymentId));
  },

  /**
   * Đánh dấu đã hoàn tiền thủ công (chuyển khoản trả lại khách ngoài hệ thống)
   * @param {number|string} paymentId - PaymentID của dòng hoàn tiền
   * @param {{ reference: string, note?: string }} payload
   * @returns {Promise<any>}
   */
  async markRefunded(paymentId, payload) {
    return api.post(ENDPOINTS.PAYMENTS.MARK_REFUNDED(paymentId), payload);
  },

  /**
   * Lấy cấu hình thanh toán: % cọc, % hoàn cọc khi hủy, tỉ giá USD→VND, hạn thanh toán
   * @returns {Promise<any>}
   */
  async getSettings() {
    return api.get(ENDPOINTS.PAYMENTS.SETTINGS);
  },

  /**
   * Manager cập nhật cấu hình thanh toán
   * @param {{ depositPercent: number, cancelRefundPercent: number, usdVndRate: number, balanceDueDaysBeforeDeparture: number, extraPaymentDueDays: number }} payload
   * @returns {Promise<any>}
   */
  async updateSettings(payload) {
    return api.put(ENDPOINTS.PAYMENTS.SETTINGS, payload);
  },

  /**
   * Manager xem toàn bộ giao dịch của mọi đơn (có phân trang như GET /api/bookings)
   * @param {{ type?: string, status?: string, from?: string, to?: string, search?: string, page?: number, size?: number, sort?: string }} [params]
   * @returns {Promise<any>}
   */
  async getPayments(params) {
    return api.get(ENDPOINTS.PAYMENTS.LIST, { params });
  },

  /**
   * Manager xem số liệu tổng hợp giao dịch trong khoảng thời gian
   * @param {{ from?: string, to?: string }} [params]
   * @returns {Promise<any>}
   */
  async getPaymentSummary(params) {
    return api.get(ENDPOINTS.PAYMENTS.SUMMARY, { params });
  },
};

export default paymentService;
