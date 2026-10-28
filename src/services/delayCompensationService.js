// Đang tạo delayCompensationService vì kết nối API bồi thường giao trễ FE-12 (R-09, BE-13)
import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file delayCompensationService.js
 * @description Tầng Service quản lý bồi thường giao trễ do lỗi vận hành của công ty (R-09, BE-13)
 */

export const delayCompensationService = {
  /**
   * Manager lấy danh sách các khoản bồi thường giao trễ
   * @param {{ status?: string }} [params]
   * @returns {Promise<Array<any>>}
   */
  async list(params) {
    return api.get(ENDPOINTS.DELAY_COMPENSATIONS.LIST, { params });
  },

  /**
   * Lấy danh sách bồi thường giao trễ của một đơn
   * @param {number|string} bookingId
   * @returns {Promise<Array<any>>}
   */
  async getByBooking(bookingId) {
    return api.get(ENDPOINTS.DELAY_COMPENSATIONS.BY_BOOKING(bookingId));
  },

  /**
   * Manager phê duyệt khoản bồi thường giao trễ (có thể điều chỉnh số tiền)
   * @param {number|string} id - Compensation ID
   * @param {{ approvedAmount?: number, reason?: string }} [payload]
   * @returns {Promise<any>}
   */
  async approve(id, payload = {}) {
    return api.post(ENDPOINTS.DELAY_COMPENSATIONS.APPROVE(id), payload);
  },

  /**
   * Manager từ chối khoản bồi thường giao trễ
   * @param {number|string} id - Compensation ID
   * @param {{ reason: string }} payload
   * @returns {Promise<any>}
   */
  async reject(id, payload) {
    return api.post(ENDPOINTS.DELAY_COMPENSATIONS.REJECT(id), payload);
  },
};

export default delayCompensationService;
