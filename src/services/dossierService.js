import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file dossierService.js
 * @description Tầng Service xử lý nghiệp vụ hồ sơ kiểm dịch và giấy tờ thông quan (Flow 2: Digital Dossier)
 */

export const dossierService = {
  /**
   * Lấy danh sách các bộ hồ sơ kiểm dịch
   * @param {{ status?: string, specialistUserId?: number, search?: string, sort?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: import('../types/database').DigitalDossier[], pagination?: any }>}
   */
  async getDossiers(params) {
    return api.get(ENDPOINTS.DOSSIERS.LIST, { params });
  },

  /**
   * Lấy chi tiết bộ hồ sơ kiểm dịch kèm danh mục checklist các giấy tờ yêu cầu
   * @param {number|string} id - DossierID
   * @returns {Promise<import('../types/database').DigitalDossier>}
   */
  async getDossierById(id) {
    return api.get(ENDPOINTS.DOSSIERS.DETAIL(id));
  },

  /**
   * Chuyên viên kiểm dịch yêu cầu khách hàng bổ sung giấy tờ còn thiếu
   * @param {number|string} id - DossierID
   * @param {{ notes?: string }} [payload]
   * @returns {Promise<any>}
   */
  async requestDocuments(id, payload = {}) {
    return api.post(ENDPOINTS.DOSSIERS.REQUEST_DOCUMENTS(id), payload);
  },

  /**
   * Nộp hoặc nộp lại một giấy tờ trong bộ hồ sơ (hỗ trợ multipart upload PDF / ảnh)
   * @param {number|string} id - DossierID
   * @param {FormData|Object} documentData - Dữ liệu giấy tờ kèm file
   * @returns {Promise<any>}
   */
  async uploadDocument(id, documentData) {
    const isFormData = typeof FormData !== 'undefined' && documentData instanceof FormData;
    return api.post(ENDPOINTS.DOSSIERS.UPLOAD_DOCUMENT(id), documentData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  /**
   * Chuyên viên kiểm dịch phê duyệt một giấy tờ hợp lệ
   * @param {number|string} docId - DocumentID
   * @returns {Promise<any>}
   */
  async approveDocument(docId) {
    return api.post(ENDPOINTS.DOSSIERS.APPROVE_DOCUMENT(docId));
  },

  /**
   * Chuyên viên kiểm dịch từ chối một giấy tờ không hợp lệ kèm lý do
   * @param {number|string} docId - DocumentID
   * @param {{ reason: string }} payload - Lý do từ chối
   * @returns {Promise<any>}
   */
  async rejectDocument(docId, payload) {
    return api.post(ENDPOINTS.DOSSIERS.REJECT_DOCUMENT(docId), payload);
  },

  /**
   * Nộp bộ hồ sơ đã hoàn chỉnh lên các cơ quan chức năng (Cục Thú y, Hải quan)
   * @param {number|string} id - DossierID
   * @returns {Promise<any>}
   */
  async submitToAuthorities(id) {
    return api.post(ENDPOINTS.DOSSIERS.SUBMIT_TO_AUTHORITIES(id));
  },

  /**
   * Ghi nhận bộ hồ sơ đã được thông quan thành công (Cleared)
   * @param {number|string} id - DossierID
   * @param {{ clearanceNumber?: string }} [payload] - Số hiệu thông quan nếu có
   * @returns {Promise<any>}
   */
  async clearDossier(id, payload = {}) {
    return api.post(ENDPOINTS.DOSSIERS.CLEAR(id), payload);
  },

  /**
   * Báo cáo bộ hồ sơ gặp sự cố, bị cơ quan chức năng từ chối hoặc cần kiểm tra lại
   * @param {number|string} id - DossierID
   * @param {{ reason?: string, issueDescription?: string }} payload
   * @returns {Promise<any>}
   */
  async reportIssue(id, payload) {
    return api.post(ENDPOINTS.DOSSIERS.ISSUE(id), payload);
  },
};

export default dossierService;
