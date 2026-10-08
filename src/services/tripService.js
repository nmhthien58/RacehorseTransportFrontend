import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file tripService.js
 * @description Tầng Service xử lý nghiệp vụ chuyến đi (Flow 3: Fleet & Planning, Flow 4: Operations & Checkpoints)
 */

export const tripService = {
  /**
   * Lấy danh sách ngựa đã thông quan đang chờ xếp chuyến
   * @returns {Promise<Array<any>>}
   */
  async getUnplannedHorses() {
    return api.get(ENDPOINTS.TRIPS.UNPLANNED_HORSES);
  },

  /**
   * Lấy danh sách phương tiện chuyên dụng còn rảnh trong khoảng thời gian dự kiến
   * @param {{ startDate?: string, endDate?: string }} [params]
   * @returns {Promise<Array<any>>}
   */
  async getAvailableVehicles(params) {
    return api.get(ENDPOINTS.TRIPS.AVAILABLE_VEHICLES, { params });
  },

  /**
   * Lấy danh sách tài xế và nhân sự áp tải còn rảnh trong khoảng thời gian
   * @param {{ startDate?: string, endDate?: string, role?: string }} [params]
   * @returns {Promise<Array<any>>}
   */
  async getAvailableCrew(params) {
    return api.get(ENDPOINTS.TRIPS.AVAILABLE_CREW, { params });
  },

  /**
   * Lấy danh sách các chuyến vận chuyển (hỗ trợ lọc theo trạng thái, xe, tài xế, phân trang)
   * @param {{ overallStatus?: string, vehicleId?: number, search?: string, sort?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: import('../types/database').Trip[], pagination?: any }>}
   */
  async getTrips(params) {
    return api.get(ENDPOINTS.TRIPS.LIST, { params });
  },

  /**
   * Lấy chi tiết thông tin chuyến vận chuyển theo TripID (kèm danh sách ngựa, tổ đội, lộ trình các mốc)
   * @param {number|string} id - Mã định danh TripID
   * @returns {Promise<import('../types/database').Trip>}
   */
  async getTripById(id) {
    return api.get(ENDPOINTS.TRIPS.DETAIL(id));
  },

  /**
   * Tạo bản nháp chuyến vận chuyển mới (dành cho FleetCoordinator)
   * @param {Partial<import('../types/database').Trip>} tripData - Dữ liệu chuyến đi
   * @returns {Promise<import('../types/database').Trip>}
   */
  async createTrip(tripData) {
    return api.post(ENDPOINTS.TRIPS.CREATE, tripData);
  },

  /**
   * Cập nhật bản nháp kế hoạch chuyến đi (khi chưa được duyệt)
   * @param {number|string} id - TripID
   * @param {Partial<import('../types/database').Trip>} tripData
   * @returns {Promise<import('../types/database').Trip>}
   */
  async updateTrip(id, tripData) {
    return api.put(ENDPOINTS.TRIPS.UPDATE(id), tripData);
  },

  /**
   * Thêm một mốc lộ trình mới vào chuyến đi
   * @param {number|string} tripId
   * @param {Object} checkpointData
   * @returns {Promise<any>}
   */
  async addCheckpoint(tripId, checkpointData) {
    return api.post(ENDPOINTS.TRIPS.ADD_CHECKPOINT(tripId), checkpointData);
  },

  /**
   * Cập nhật thông tin một mốc lộ trình
   * @param {number|string} tripId
   * @param {number|string} checkpointId
   * @param {Object} checkpointData
   * @returns {Promise<any>}
   */
  async updateCheckpoint(tripId, checkpointId, checkpointData) {
    return api.put(ENDPOINTS.TRIPS.UPDATE_CHECKPOINT(tripId, checkpointId), checkpointData);
  },

  /**
   * Xóa một mốc lộ trình khỏi chuyến đi
   * @param {number|string} tripId
   * @param {number|string} checkpointId
   * @returns {Promise<any>}
   */
  async deleteCheckpoint(tripId, checkpointId) {
    return api.delete(ENDPOINTS.TRIPS.DELETE_CHECKPOINT(tripId, checkpointId));
  },

  /**
   * Cập nhật thứ tự các mốc lộ trình
   * @param {number|string} tripId
   * @param {Array<number>} checkpointIds - Mảng các ID theo thứ tự mới
   * @returns {Promise<any>}
   */
  async reorderCheckpoints(tripId, checkpointIds) {
    return api.put(ENDPOINTS.TRIPS.REORDER_CHECKPOINTS(tripId), { checkpointIds });
  },

  /**
   * Trình duyệt kế hoạch chuyến đi lên LogisticsManager
   * @param {number|string} id - TripID
   * @returns {Promise<any>}
   */
  async submitPlan(id) {
    return api.post(ENDPOINTS.TRIPS.SUBMIT_PLAN(id));
  },

  /**
   * Phê duyệt kế hoạch chuyến đi (LogisticsManager)
   * @param {number|string} id - TripID
   * @returns {Promise<any>}
   */
  async approvePlan(id) {
    return api.post(ENDPOINTS.TRIPS.APPROVE_PLAN(id));
  },

  /**
   * Từ chối kế hoạch chuyến đi, yêu cầu điều phối viên chỉnh sửa (LogisticsManager)
   * @param {number|string} id - TripID
   * @param {{ reason: string }} payload
   * @returns {Promise<any>}
   */
  async rejectPlan(id, payload) {
    return api.post(ENDPOINTS.TRIPS.REJECT_PLAN(id), payload);
  },

  /**
   * Hủy chuyến đi trước khi khởi hành
   * @param {number|string} id - TripID
   * @param {{ reason?: string }} [payload]
   * @returns {Promise<any>}
   */
  async cancelTrip(id, payload = {}) {
    return api.post(ENDPOINTS.TRIPS.CANCEL(id), payload);
  },

  /**
   * Bắt đầu xuất phát chuyến vận chuyển (DriverEscort)
   * @param {number|string} id - TripID
   * @returns {Promise<any>}
   */
  async startTrip(id) {
    return api.post(ENDPOINTS.TRIPS.START(id));
  },

  /**
   * Ghi nhận xe đã đến một mốc lộ trình
   * @param {number|string} checkpointId
   * @returns {Promise<any>}
   */
  async arriveCheckpoint(checkpointId) {
    return api.post(ENDPOINTS.CHECKPOINTS.ARRIVE(checkpointId));
  },

  /**
   * Ghi nhận đã hoàn tất kiểm tra kiểm dịch / thông quan tại trạm kiểm soát
   * @param {number|string} checkpointId
   * @returns {Promise<any>}
   */
  async clearCheckpoint(checkpointId) {
    return api.post(ENDPOINTS.CHECKPOINTS.CLEAR(checkpointId));
  },

  /**
   * Ghi nhận xe rời mốc kiểm soát để tiếp tục hành trình
   * @param {number|string} checkpointId
   * @returns {Promise<any>}
   */
  async departCheckpoint(checkpointId) {
    return api.post(ENDPOINTS.CHECKPOINTS.DEPART(checkpointId));
  },

  /**
   * Ghi nhận nhật ký thể trạng và phúc lợi ngựa tại mốc (hỗ trợ multipart ảnh chụp thực tế)
   * @param {number|string} tripId
   * @param {FormData|Object} logData
   * @returns {Promise<any>}
   */
  async createWelfareLog(tripId, logData) {
    const isFormData = typeof FormData !== 'undefined' && logData instanceof FormData;
    return api.post(ENDPOINTS.TRIPS.CREATE_WELFARE_LOG(tripId), logData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  /**
   * Lấy danh sách toàn bộ nhật ký phúc lợi ngựa trong suốt chuyến đi
   * @param {number|string} tripId
   * @returns {Promise<Array<import('../types/database').HorseWelfareLog>>}
   */
  async getWelfareLogs(tripId) {
    return api.get(ENDPOINTS.TRIPS.WELFARE_LOGS(tripId));
  },

  /**
   * Đóng chuyến vận chuyển và chốt đánh giá KPI (FleetCoordinator / LogisticsManager)
   * @param {number|string} tripId
   * @param {{ executiveRemarks?: string }} [payload]
   * @returns {Promise<any>}
   */
  async closeTrip(tripId, payload = {}) {
    return api.post(ENDPOINTS.TRIPS.CLOSE(tripId), payload);
  },

  // === Bí danh tương thích ngược ===
  async updateTripStatus(id, status) {
    if (status === 'InTransit') return this.startTrip(id);
    return api.post(ENDPOINTS.TRIPS.UPDATE_STATUS(id), { status });
  },
};

export default tripService;
