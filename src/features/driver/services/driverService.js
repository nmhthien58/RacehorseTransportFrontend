import api from '@services/api';
import { ENDPOINTS } from '@services/endpoints';
import { toFormData } from '@utils/apiHelpers';

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
    // Backend chỉ trả chuyến có tên tài xế / áp tải đang đăng nhập; mặc định chỉ 10 dòng
    return api.get(ENDPOINTS.TRIPS.LIST, { params: { size: 100, ...params } });
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
    // Lưu ý: PUT /trips/{id} chỉ dành cho điều phối viên sửa bản nháp, đoàn xe gọi sẽ bị 403
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
   * Backend không nhận body (chỉ áp dụng cho mốc BorderGate)
   * @returns {Promise<any>}
   */
  async clearCheckpoint(checkpointId) {
    return api.post(ENDPOINTS.CHECKPOINTS.CLEAR(checkpointId));
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
   * Cho một con ngựa rời chuyến giữa đường (thú y / sự cố); chuyến vẫn đi tiếp
   * @param {number|string} tripId
   * @param {number|string} tripHorseId
   * @param {string} reason
   * @returns {Promise<any>} Chi tiết chuyến sau khi cập nhật
   */
  async offloadHorse(tripId, tripHorseId, reason) {
    return api.post(ENDPOINTS.TRIPS.OFFLOAD_HORSE(tripId, tripHorseId), { reason });
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
   * Ghi nhật ký thể trạng một con ngựa (POST /trips/{id}/welfare-logs, multipart/form-data)
   * @param {number|string} tripId
   * @param {{ tripHorseId: number, checkpointId?: number, cabinTemp: number, waterIntakeLiters: number,
   *   feedStatus: 'Normal'|'Reduced'|'Refused', stressLevel: 'Calm'|'MildStress'|'Agitated', notes?: string, photo?: File }} logData
   * @returns {Promise<any>}
   */
  async createWelfareLog(tripId, logData) {
    const form = toFormData({
      tripHorseId: logData.tripHorseId,
      checkpointId: logData.checkpointId,
      cabinTemp: logData.cabinTemp,
      waterIntakeLiters: logData.waterIntakeLiters,
      feedStatus: logData.feedStatus,
      stressLevel: logData.stressLevel,
      notes: logData.notes,
      photo: logData.photo instanceof Blob ? logData.photo : null,
    });
    // Instance mặc định là JSON: ghi đè để axios gửi đúng multipart
    return api.post(ENDPOINTS.TRIPS.CREATE_WELFARE_LOG(tripId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
   * Báo tên người ký nhận thay khác với người nhận trên đơn (BE-15)
   * @param {number|string} bookingId
   * @param {{ alternateRecipientName: string, alternateRecipientPhone?: string, alternateRecipientIdCard?: string }} payload
   * @returns {Promise<any>}
   */
  async proposeAlternateRecipient(bookingId, payload) {
    return api.post(ENDPOINTS.BOOKINGS.PROPOSE_ALTERNATE_RECIPIENT(bookingId), payload);
  },

  /**
   * Lập biên bản bàn giao cho một đơn trên chuyến (multipart, mỗi mã vi mạch append một lần).
   * @param {number|string} tripId
   * @param {{ bookingId: number, recipientName: string, recipientPhone: string, recipientIdCard: string, overallCondition: string, remarks?: string, microchipNumbers: string[], signature: Blob }} handoverData
   * @returns {Promise<any>}
   */
  async submitHandover(tripId, handoverData) {
    const { signature, ...fields } = handoverData;
    const form = toFormData(fields);
    // Backend kiểm tra đuôi file chữ ký nên phải đặt tên .png
    form.append('signature', signature, 'signature.png');
    return api.post(ENDPOINTS.HANDOVER.CREATE_FOR_TRIP(tripId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Các biên bản bàn giao đã lập trên chuyến
   * @param {number|string} tripId
   * @returns {Promise<Array<any>>}
   */
  async getHandovers(tripId) {
    return api.get(ENDPOINTS.HANDOVER.BY_TRIP(tripId));
  },
};

export default driverService;
