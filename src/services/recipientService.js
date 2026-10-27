// Đang tạo recipientService vì kết nối API người nhận ngựa FE-13 (R-16, BE-15)
import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file recipientService.js
 * @description Tầng Service quản lý thông tin người nhận ngựa và xác nhận có mặt (R-16, BE-15)
 */

export const recipientService = {
  /**
   * Khách cập nhật thông tin người nhận ngựa của đơn
   * @param {number|string} bookingId
   * @param {{ isCustomer: boolean, name?: string, phone?: string, email?: string, idNumber?: string }} payload
   * @returns {Promise<any>}
   */
  async updateRecipient(bookingId, payload) {
    return api.put(ENDPOINTS.RECIPIENTS.UPDATE(bookingId), payload);
  },

  /**
   * Khách xác nhận người nhận sẽ có mặt tại điểm giao
   * @param {number|string} bookingId
   * @param {{ isAvailable: boolean }} [payload={ isAvailable: true }]
   * @returns {Promise<any>}
   */
  async confirmPresence(bookingId, payload = { isAvailable: true }) {
    return api.post(ENDPOINTS.RECIPIENTS.CONFIRM_PRESENCE(bookingId), payload);
  },

  /**
   * Khách xác nhận đồng ý cho người khác nhận thay khi tài xế báo khác tên
   * @param {number|string} bookingId
   * @param {{ name: string, idNumber?: string }} payload
   * @returns {Promise<any>}
   */
  async approveAlternateRecipient(bookingId, payload) {
    return api.post(ENDPOINTS.RECIPIENTS.APPROVE_ALTERNATE(bookingId), payload);
  },

  /**
   * Lấy danh sách người nhận của mọi đơn trên chuyến (dành cho tài xế và nhân viên)
   * @param {number|string} tripId
   * @returns {Promise<Array<any>>}
   */
  async getTripRecipients(tripId) {
    return api.get(ENDPOINTS.RECIPIENTS.BY_TRIP(tripId));
  },
};

export default recipientService;
