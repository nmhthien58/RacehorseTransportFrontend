import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file incidentService.js
 * @description Tầng Service xử lý nghiệp vụ quản lý sự cố phát sinh trên lộ trình (Flow 5: Incident Management)
 */

export const incidentService = {
  /**
   * Báo cáo sự cố phát sinh trong chuyến đi (DriverEscort)
   * @param {number|string} tripId
   * @param {{ incidentType: string, severity: string, description: string, horseIds?: number[] }} incidentData
   * @returns {Promise<import('../types/database').TripIncident>}
   */
  async reportIncident(tripId, incidentData) {
    return api.post(ENDPOINTS.INCIDENTS.CREATE_FOR_TRIP(tripId), incidentData);
  },

  /**
   * Lấy danh sách toàn bộ sự cố trong hệ thống (hỗ trợ phân trang, lọc theo trạng thái, mức độ)
   * @param {{ status?: string, severity?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: import('../types/database').TripIncident[], pagination?: any }>}
   */
  async getIncidents(params) {
    return api.get(ENDPOINTS.INCIDENTS.LIST, { params });
  },

  /**
   * Lấy thông tin chi tiết của một sự cố
   * @param {number|string} id - IncidentID
   * @returns {Promise<import('../types/database').TripIncident>}
   */
  async getIncidentById(id) {
    return api.get(ENDPOINTS.INCIDENTS.DETAIL(id));
  },

  /**
   * Lấy danh sách các sự cố thuộc về một chuyến đi cụ thể
   * @param {number|string} tripId
   * @returns {Promise<Array<import('../types/database').TripIncident>>}
   */
  async getTripIncidents(tripId) {
    return api.get(ENDPOINTS.INCIDENTS.LIST_BY_TRIP(tripId));
  },

  /**
   * Điều phối viên đề xuất phương án giải quyết sự cố kèm chi phí và nắn tuyến
   * @param {number|string} id - IncidentID
   * @param {{ proposedAction: string, additionalCost?: number, revisedRouteNotes?: string }} payload
   * @returns {Promise<import('../types/database').TripIncident>}
   */
  async proposePlan(id, payload) {
    return api.post(ENDPOINTS.INCIDENTS.PROPOSE_PLAN(id), payload);
  },

  /**
   * Quản lý phê duyệt phương án xử lý sự cố (LogisticsManager)
   * @param {number|string} id - IncidentID
   * @returns {Promise<any>}
   */
  async approvePlan(id) {
    return api.post(ENDPOINTS.INCIDENTS.APPROVE_PLAN(id));
  },

  /**
   * Quản lý từ chối phương án xử lý sự cố (LogisticsManager)
   * @param {number|string} id - IncidentID
   * @param {{ reason: string }} payload
   * @returns {Promise<any>}
   */
  async rejectPlan(id, payload) {
    return api.post(ENDPOINTS.INCIDENTS.REJECT_PLAN(id), payload);
  },

  /**
   * Áp dụng nắn tuyến sau khi phương án xử lý sự cố được duyệt (FleetCoordinator)
   * @param {number|string} id - IncidentID
   * @param {{ newCheckpoints?: Array<any> }} payload
   * @returns {Promise<any>}
   */
  async applyReroute(id, payload) {
    return api.post(ENDPOINTS.INCIDENTS.APPLY_REROUTE(id), payload);
  },

  /**
   * Hoàn tất giải quyết sự cố và đóng hồ sơ sự cố
   * @param {number|string} id - IncidentID
   * @param {{ resolutionNotes?: string }} [payload]
   * @returns {Promise<any>}
   */
  async resolveIncident(id, payload = {}) {
    return api.post(ENDPOINTS.INCIDENTS.RESOLVE(id), payload);
  },
};

export default incidentService;
