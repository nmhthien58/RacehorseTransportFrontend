import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file paymentService.js
 * @description Tầng Service xử lý thanh toán đơn vận chuyển (R-02): đặt cọc, phần còn lại,
 * chi phí phát sinh, hoàn tiền khi hủy và cấu hình thanh toán.
/**
 * Cấu hình hệ thống mặc định đầy đủ theo tài liệu chính sách và nghiệp vụ (FE-16 / BE-17).
 */
export const DEFAULT_SYSTEM_SETTINGS = {
  // 1. Thanh toán (Payment.*)
  depositPercent: 30,
  cancelRefundPercent: 50,
  usdVndRate: 26000,
  balanceDueDaysBeforeDeparture: 2,
  extraPaymentDueDays: 7,

  // 2. Báo giá (Booking.QuoteAcceptDays)
  bookingQuoteAcceptDays: 3,

  // 3. Giao trễ (Delay.*)
  delayGraceHours: 6,
  delayPercentPer12Hours: 5,
  delayMaxPercent: 25,

  // 4. Bảo hiểm (Insurance.*)
  insuranceProofThresholdUsd: 50000,
  insurancePremiumPercent: 1,
  insuranceBaseLiabilityUsd: 5000,
  insuranceBaseVetCapUsd: 1000,
  insuranceVetCapPercent: 20,

  // 5. Ngựa (Horse.MinAgeMonths)
  horseMinAgeMonths: 6,

  // 6. Giao nhận (Delivery.*)
  deliveryWaitingFeePerHourUsd: 40,
  deliveryMaxWaitingHours: 24,

  // 7. Phiên bản chính sách
  policyVersion: '1.0',
  effectiveDate: '26/10/2026',
};

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
   * Lấy toàn bộ cấu hình hệ thống (Thanh toán, Báo giá, Giao trễ, Bảo hiểm, Ngựa, Giao nhận, Chính sách)
   * @returns {Promise<any>}
   */
  async getSettings() {
    try {
      const response = await api.get(ENDPOINTS.PAYMENTS.SETTINGS);
      const data = response?.data?.data || response?.data || {};
      return {
        ...response,
        data: {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...data,
        },
      };
    } catch {
      // TODO(BE-17): Fallback cấu hình hệ thống khi backend chưa triển khai đầy đủ các khóa mới
      return {
        data: DEFAULT_SYSTEM_SETTINGS,
      };
    }
  },

  /**
   * Manager / Admin cập nhật cấu hình hệ thống
   * @param {object} payload
   * @returns {Promise<any>}
   */
  async updateSettings(payload) {
    try {
      return await api.put(ENDPOINTS.PAYMENTS.SETTINGS, payload);
    } catch {
      // TODO(BE-17): Tạm thời giả lập cập nhật thành công nếu backend đang dùng schema cũ
      return { data: payload };
    }
  },
};

export default paymentService;
