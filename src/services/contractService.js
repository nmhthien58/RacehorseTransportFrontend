// Đang tạo contractService vì kết nối API hợp đồng vận chuyển và vận đơn hàng không FE-17 (BE-20)
import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file contractService.js
 * @description Hợp đồng vận chuyển PDF của đơn (R-17): bản hiện hành, lịch sử phiên bản, tải file, chấp nhận bản sửa đổi;
 * vận đơn hàng không (air waybill) của chuyến.
 */

export const contractService = {
  /**
   * Hợp đồng hiện hành của đơn: bản Draft đang chờ khách chấp nhận nếu có, không thì bản Accepted. Kèm `fileUrl` có hạn.
   * @param {number|string} bookingId
   * @returns {Promise<any>}
   */
  async getCurrent(bookingId) {
    return api.get(ENDPOINTS.CONTRACTS.CURRENT(bookingId));
  },

  /**
   * Mọi phiên bản hợp đồng của đơn, mới nhất trước (không có `fileUrl`)
   * @param {number|string} bookingId
   * @returns {Promise<any>}
   */
  async getHistory(bookingId) {
    return api.get(ENDPOINTS.CONTRACTS.HISTORY(bookingId));
  },

  /**
   * Tải PDF một phiên bản (backend chuyển hướng tới link có hạn, trình duyệt tự theo)
   * @param {number|string} contractId
   * @returns {Promise<Blob>}
   */
  async downloadFile(contractId) {
    return api.get(ENDPOINTS.CONTRACTS.FILE(contractId), { responseType: 'blob' });
  },

  /**
   * Khách chấp nhận bản hợp đồng sửa đổi (bản đầu chấp nhận cùng báo giá qua accept-quote)
   * @param {number|string} contractId
   * @param {{ contractSha256: string, acceptPolicy: boolean, policyVersion: string }} payload
   * @returns {Promise<any>}
   */
  async accept(contractId, payload) {
    return api.post(ENDPOINTS.CONTRACTS.ACCEPT(contractId), payload);
  },

  /**
   * Vận đơn hàng không của chuyến (chỉ chuyến chở ngựa của đơn Air; chuyến đường bộ trả 400)
   * @param {number|string} tripId
   * @returns {Promise<any>}
   */
  async getAirWaybill(tripId) {
    return api.get(ENDPOINTS.CONTRACTS.AIR_WAYBILL(tripId));
  },

  /**
   * Coordinator nhập số vận đơn + đường dẫn file đã tải lên (POST /files, category documents)
   * @param {number|string} tripId
   * @param {{ airWaybillNumber: string, airWaybillFilePath?: string }} payload
   * @returns {Promise<any>}
   */
  async updateAirWaybill(tripId, payload) {
    return api.put(ENDPOINTS.CONTRACTS.AIR_WAYBILL(tripId), payload);
  },
};

export default contractService;
