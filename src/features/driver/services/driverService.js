import api from '@services/api';
import { ENDPOINTS } from '@services/endpoints';

/**
 * @file driverService.js
 * @description Tầng Service xử lý nghiệp vụ cho Role Driver (Flow 4: Vận hành lộ trình, trạm kiểm soát & Nhật ký vận chuyển)
 */

/**
 * Trả về config màu sắc và nhãn của trạng thái chuyến đi
 * @param {string} status
 */
export function getTripStatusMeta(status) {
  switch (status) {
    case 'Scheduled':
      return { color: 'blue', text: 'Chờ xuất bến', badgeStatus: 'processing' };
    case 'InTransit':
      return { color: 'orange', text: 'Đang di chuyển', badgeStatus: 'warning' };
    case 'EmergencyRerouting':
      return { color: 'red', text: 'Sự cố / Đổi tuyến khẩn', badgeStatus: 'error' };
    case 'ArrivedDestination':
      return { color: 'purple', text: 'Đã tới điểm đích', badgeStatus: 'processing' };
    case 'Completed':
      return { color: 'green', text: 'Đã hoàn thành', badgeStatus: 'success' };
    default:
      return { color: 'default', text: status || 'Chưa xác định', badgeStatus: 'default' };
  }
}

export const driverService = {
  /**
   * Lấy danh sách nhiệm vụ của tài xế (các chuyến xe được phân công)
   * @param {{ status?: string, overallStatus?: string, search?: string }} [params]
   * @returns {Promise<any>}
   */
  async getMissions(params = {}) {
    return api.get(ENDPOINTS.TRIPS.LIST, { params });
  },

  /**
   * Lấy chi tiết thông tin nhiệm vụ vận chuyển theo Trip ID
   * @param {number|string} id - Trip ID
   * @returns {Promise<any>}
   */
  async getMissionById(id) {
    return api.get(ENDPOINTS.TRIPS.DETAIL(id));
  },

  /**
   * Cập nhật thông tin chuyến đi (checklist trước khởi hành hoặc ghi chú)
   * @param {number|string} tripId - Trip ID
   * @param {Object} payload - Dữ liệu cập nhật
   * @returns {Promise<any>}
   */
  async updateMission(tripId, payload) {
    return api.put(ENDPOINTS.TRIPS.UPDATE(tripId), payload);
  },

  /**
   * Bắt đầu xuất bến chuyến vận chuyển sau khi hoàn thành 100% checklist an toàn
   * @param {number|string} tripId - Trip ID
   * @returns {Promise<any>}
   */
  async startMission(tripId) {
    return api.post(ENDPOINTS.TRIPS.START(tripId));
  },

  /**
   * Ghi nhận xe đã đến một mốc kiểm soát trên lộ trình (Check-in Arrive)
   * @param {number|string} checkpointId
   * @returns {Promise<any>}
   */
  async arriveCheckpoint(checkpointId) {
    return api.post(ENDPOINTS.CHECKPOINTS.ARRIVE(checkpointId));
  },

  /**
   * Ghi nhận đã hoàn tất kiểm tra kiểm dịch / thông quan tại trạm kiểm soát (Check-in Clear)
   * @param {number|string} checkpointId
   * @param {{ clearanceNumber?: string, odometerReading?: number, notes?: string }} [payload]
   * @returns {Promise<any>}
   */
  async clearCheckpoint(checkpointId, payload = {}) {
    return api.post(ENDPOINTS.CHECKPOINTS.CLEAR(checkpointId), payload);
  },

  /**
   * Ghi nhận xe rời mốc kiểm soát để tiếp tục hành trình (Check-in Depart)
   * @param {number|string} checkpointId
   * @returns {Promise<any>}
   */
  async departCheckpoint(checkpointId) {
    return api.post(ENDPOINTS.CHECKPOINTS.DEPART(checkpointId));
  },

  /**
   * Lấy danh sách toàn bộ nhật ký sinh trắc & phúc lợi ngựa trong suốt chuyến đi
   * @param {number|string} tripId
   * @returns {Promise<Array<any>>}
   */
  async getWelfareLogs(tripId) {
    return api.get(ENDPOINTS.TRIPS.WELFARE_LOGS(tripId));
  },

  /**
   * Ghi nhận một mốc sinh trắc và phúc lợi ngựa (thân nhiệt, nhịp tim, nước uống, stress)
   * @param {number|string} tripId
   * @param {Object} logData
   * @returns {Promise<any>}
   */
  async createWelfareLog(tripId, logData) {
    return api.post(ENDPOINTS.TRIPS.CREATE_WELFARE_LOG(tripId), logData);
  },

  /**
   * Báo cáo sự cố khẩn cấp trên lộ trình (SOS) gửi về Trung tâm điều hành
   * @param {number|string} tripId
   * @param {Object} incidentData
   * @returns {Promise<any>}
   */
  async reportIncident(tripId, incidentData) {
    return api.post(ENDPOINTS.INCIDENTS.CREATE_FOR_TRIP(tripId), incidentData);
  },

  /**
   * Lấy danh sách sự cố đã báo cáo của chuyến đi
   * @param {number|string} tripId
   * @returns {Promise<Array<any>>}
   */
  async getIncidents(tripId) {
    return api.get(ENDPOINTS.INCIDENTS.LIST_BY_TRIP(tripId));
  },

  /**
   * Lập biên bản bàn giao nghiệm thu tại điểm đến có chữ ký số điện tử (e-POD)
   * @param {number|string} tripId
   * @param {Object} handoverData
   * @returns {Promise<any>}
   */
  async submitHandover(tripId, handoverData) {
    return api.post(ENDPOINTS.HANDOVER.CREATE_FOR_TRIP(tripId), handoverData);
  },

  /**
   * Lấy thông tin biên bản bàn giao của chuyến đi
   * @param {number|string} tripId
   * @returns {Promise<any>}
   */
  async getHandover(tripId) {
    return api.get(ENDPOINTS.HANDOVER.BY_TRIP(tripId));
  },

  /**
   * Lấy báo cáo hoàn tất ca trực & tổng kết chuyến đi (Shift Closeout Report)
   * @param {number|string} tripId
   * @returns {Promise<any>}
   */
  async getCompletionReport(tripId) {
    return api.get(ENDPOINTS.TRIPS.COMPLETION_REPORT(tripId));
  },

  /**
   * Nộp báo cáo tổng kết chuyến đi và kết thúc ca trực lên Quản lý vận hành
   * @param {number|string} tripId
   * @param {Object} payload
   * @returns {Promise<any>}
   */
  async submitCompletionReport(tripId, payload) {
    return api.post(ENDPOINTS.TRIPS.COMPLETION_REPORT(tripId), payload);
  },
};

export default driverService;
