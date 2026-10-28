// Đang tạo deliveryFailureService vì kết nối API không giao được và quyết định của khách FE-14 (BE-16)
import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file deliveryFailureService.js
 * @description Không giao được ngựa tại điểm giao (R-16): đoàn xe ghi nhận, khách chọn cách xử lý trong hạn, phí chờ.
 */

export const deliveryFailureService = {
  /**
   * Đoàn xe ghi nhận không giao được đơn tại điểm giao (xe đang dừng ở điểm giao của đơn)
   * @param {number|string} tripId
   * @param {number|string} bookingId
   * @param {{ reason: 'RecipientAbsent'|'RecipientRefused'|'RefusedInjured'|'RefusedWrongHorse', note?: string, photoPaths?: string[] }} payload
   * @returns {Promise<any>}
   */
  async record(tripId, bookingId, payload) {
    return api.post(ENDPOINTS.DELIVERY_FAILURES.RECORD(tripId, bookingId), payload);
  },

  /**
   * Khách chọn cách xử lý (lỗi khách, trong hạn decisionDueAt)
   * @param {number|string} bookingId
   * @param {{ decision: 'AlternateRecipient'|'HoldAtStable'|'ReturnToOrigin', recipientName?: string, recipientPhone?: string, address?: string, lat?: number, lng?: number }} payload
   * @returns {Promise<any>}
   */
  async decide(bookingId, payload) {
    return api.post(ENDPOINTS.DELIVERY_FAILURES.DECISION(bookingId), payload);
  },

  /**
   * Các lần không giao được của đơn, mới nhất trước (khách / nhân sự xem được đơn; tài xế không gọi được)
   * @param {number|string} bookingId
   * @returns {Promise<any>}
   */
  async getForBooking(bookingId) {
    return api.get(ENDPOINTS.DELIVERY_FAILURES.BY_BOOKING(bookingId));
  },
};

export default deliveryFailureService;
