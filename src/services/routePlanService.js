// Đang tạo routePlanService vì kết nối API lập và duyệt tuyến đơn hàng FE-03, FE-04 (BE-04)
import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file routePlanService.js
 * @description Tầng Service xử lý tuyến dự kiến của đơn: Coordinator lập trên bản đồ, Manager duyệt (R-10, BE-04)
 */

export const routePlanService = {
  /**
   * Lấy lịch sử các phiên bản tuyến dự kiến của một đơn
   * @param {number|string} bookingId
   * @returns {Promise<Array<any>>}
   */
  async getForBooking(bookingId) {
    return api.get(ENDPOINTS.ROUTE_PLANS.GET_FOR_BOOKING(bookingId));
  },

  /**
   * Lấy chi tiết một phiên bản tuyến theo ID
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  async getById(id) {
    return api.get(ENDPOINTS.ROUTE_PLANS.GET_BY_ID(id));
  },

  /**
   * Xem trước và tính toán các chặng, nước quá cảnh, cảnh báo cửa khẩu khi đang sửa mốc
   * @param {number|string} bookingId
   * @param {{ stops: Array<any> }} payload
   * @returns {Promise<any>}
   */
  async previewRoutePlan(bookingId, payload) {
    return api.post(ENDPOINTS.ROUTE_PLANS.PREVIEW(bookingId), payload);
  },

  /**
   * Coordinator tạo bản nháp tuyến mới cho đơn PreApproved
   * @param {number|string} bookingId
   * @param {{ stops: Array<any> }} payload
   * @returns {Promise<any>}
   */
  async createRoutePlan(bookingId, payload) {
    return api.post(ENDPOINTS.ROUTE_PLANS.CREATE(bookingId), payload);
  },

  /**
   * Coordinator cập nhật mốc của bản nháp tuyến
   * @param {number|string} id - routePlanId
   * @param {{ stops: Array<any> }} payload
   * @returns {Promise<any>}
   */
  async updateRoutePlan(id, payload) {
    return api.put(ENDPOINTS.ROUTE_PLANS.UPDATE(id), payload);
  },

  /**
   * Coordinator trình duyệt tuyến dự kiến lên Manager
   * @param {number|string} id - routePlanId
   * @returns {Promise<any>}
   */
  async submitRoutePlan(id) {
    return api.post(ENDPOINTS.ROUTE_PLANS.SUBMIT(id));
  },

  /**
   * Manager phê duyệt tuyến dự kiến của đơn -> đơn chuyển sang RoutePlanned
   * @param {number|string} id - routePlanId
   * @returns {Promise<any>}
   */
  async approveRoutePlan(id) {
    return api.post(ENDPOINTS.ROUTE_PLANS.APPROVE(id));
  },

  /**
   * Manager từ chối tuyến dự kiến kèm lý do để Coordinator sửa lại
   * @param {number|string} id - routePlanId
   * @param {string} reason
   * @returns {Promise<any>}
   */
  async rejectRoutePlan(id, reason) {
    return api.post(ENDPOINTS.ROUTE_PLANS.REJECT(id), { reason });
  },
};

export default routePlanService;
