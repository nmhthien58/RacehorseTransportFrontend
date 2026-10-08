import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file handoverService.js
 * @description Tầng Service xử lý biên bản nghiệm thu bàn giao điện tử e-POD (Flow 6: Handover & e-POD)
 */

export const handoverService = {
  /**
   * Lập biên bản bàn giao ngựa tại điểm đích có chữ ký người nhận (hỗ trợ multipart kèm ảnh chữ ký)
   * @param {number|string} tripId
   * @param {FormData|Object} handoverData
   * @returns {Promise<import('../types/database').HandoverAcceptance>}
   */
  async createHandover(tripId, handoverData) {
    const isFormData = typeof FormData !== 'undefined' && handoverData instanceof FormData;
    return api.post(ENDPOINTS.HANDOVER.CREATE_FOR_TRIP(tripId), handoverData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  /**
   * Lấy danh sách các biên bản bàn giao thuộc một chuyến đi
   * @param {number|string} tripId
   * @returns {Promise<Array<import('../types/database').HandoverAcceptance>>}
   */
  async getTripHandovers(tripId) {
    return api.get(ENDPOINTS.HANDOVER.BY_TRIP(tripId));
  },

  /**
   * Lấy danh sách các biên bản bàn giao thuộc một đơn đặt chuyến
   * @param {number|string} bookingId
   * @returns {Promise<Array<import('../types/database').HandoverAcceptance>>}
   */
  async getBookingHandovers(bookingId) {
    return api.get(ENDPOINTS.HANDOVER.BY_BOOKING(bookingId));
  },

  /**
   * Đóng chuyến vận chuyển và hoàn tất hợp đồng
   * @param {number|string} tripId
   * @param {{ executiveRemarks?: string }} [payload]
   * @returns {Promise<any>}
   */
  async closeTrip(tripId, payload = {}) {
    return api.post(ENDPOINTS.HANDOVER.CLOSE_TRIP(tripId), payload);
  },
};

export default handoverService;
