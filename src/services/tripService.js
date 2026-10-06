import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file tripService.js
 * @description Tầng Service xử lý nghiệp vụ chuyến đi (Trips) và sự cố phát sinh (Incidents)
 */

export const tripService = {
  /**
   * Lấy danh sách các chuyến vận chuyển
   * @param {Object} [params] - Tham số lọc chuyến đi
   * @returns {Promise<{ data: import('../types/database').Trip[], total: number }>}
   */
  async getTrips(params) {
    return api.get(ENDPOINTS.TRIPS.LIST, { params });
  },

  /**
   * Lấy chi tiết thông tin chuyến vận chuyển theo TripID
   * @param {number|string} id - Mã định danh TripID
   * @returns {Promise<import('../types/database').Trip>}
   */
  async getTripById(id) {
    return api.get(ENDPOINTS.TRIPS.DETAIL(id));
  },

  /**
   * Tạo chuyến vận chuyển mới (dành cho FleetCoordinator)
   * @param {Partial<import('../types/database').Trip>} tripData - Dữ liệu chuyến đi
   * @returns {Promise<import('../types/database').Trip>}
   */
  async createTrip(tripData) {
    return api.post(ENDPOINTS.TRIPS.CREATE, tripData);
  },

  /**
   * Cập nhật trạng thái vận hành của chuyến đi (dành cho Driver / Coordinator)
   * @param {number|string} id - Mã định danh TripID
   * @param {string} status - Trạng thái mới (InTransit, EmergencyRerouting, ArrivedDestination, Completed, Cancelled)
   * @returns {Promise<import('../types/database').Trip>}
   */
  async updateTripStatus(id, status) {
    return api.post(ENDPOINTS.TRIPS.UPDATE_STATUS(id), { status });
  },

  /**
   * Lấy danh sách sự cố phát sinh trên lộ trình
   * @param {Object} [params] - Tham số lọc sự cố
   * @returns {Promise<{ data: import('../types/database').Incident[], total: number }>}
   */
  async getIncidents(params) {
    return api.get(ENDPOINTS.INCIDENTS.LIST, { params });
  },

  /**
   * Báo cáo sự cố phát sinh trong chuyến đi (dành cho DriverEscort)
   * @param {Partial<import('../types/database').Incident>} incidentData - Dữ liệu báo cáo sự cố
   * @returns {Promise<import('../types/database').Incident>}
   */
  async reportIncident(incidentData) {
    return api.post(ENDPOINTS.INCIDENTS.CREATE, incidentData);
  },

  /**
   * Điều phối viên đề xuất phương án xử lý sự cố kèm chi phí và nắn tuyến (State Diagram 7)
   * @param {number|string} id - Mã định danh IncidentID
   * @param {{ proposedAction: string, additionalCost?: number, revisedRouteNotes?: string }} payload
   * @returns {Promise<import('../types/database').Incident>}
   */
  async proposeIncidentPlan(id, payload) {
    return api.post(ENDPOINTS.INCIDENTS.PROPOSE_PLAN(id), payload);
  },

  /**
   * Quản lý phê duyệt phương án xử lý sự cố và ngân sách bổ sung
   * @param {number|string} id - Mã định danh IncidentID
   * @returns {Promise<import('../types/database').Incident>}
   */
  async approveIncidentPlan(id) {
    return api.post(ENDPOINTS.INCIDENTS.APPROVE(id));
  },

  /**
   * Quản lý từ chối phương án xử lý sự cố, yêu cầu điều phối viên lên lại phương án
   * @param {number|string} id - Mã định danh IncidentID
   * @returns {Promise<import('../types/database').Incident>}
   */
  async rejectIncidentPlan(id) {
    return api.post(ENDPOINTS.INCIDENTS.REJECT(id));
  },

  /**
   * Tài xế hoàn tất xử lý sự cố, ghi nhận thời điểm hoàn tất
   * @param {number|string} id - Mã định danh IncidentID
   * @returns {Promise<import('../types/database').Incident>}
   */
  async resolveIncident(id) {
    return api.post(ENDPOINTS.INCIDENTS.RESOLVE(id));
  },
};

export default tripService;
