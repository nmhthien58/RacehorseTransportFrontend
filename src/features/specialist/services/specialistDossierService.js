import api from '@services/api';
import { ENDPOINTS } from '@services/endpoints';

/**
 * @file specialistDossierService.js
 * @description Tầng Service quản lý hồ sơ pháp lý và kiểm dịch thông quan cho role Transport Specialist (Flow 2)
 */

export const specialistDossierService = {
  /**
   * Lấy danh sách hồ sơ kiểm dịch có bộ lọc và phân trang
   * @param {{ status?: string, search?: string, sort?: string, page?: number, pageSize?: number }} [params]
   * @returns {Promise<{ data: import('@types/database').DigitalDossier[], total?: number, pagination?: any }>}
   */
  async getDossiers(params = {}) {
    return api.get(ENDPOINTS.DOSSIERS.LIST, { params });
  },

  /**
   * Lấy chi tiết hồ sơ kiểm dịch kèm checklist và tài liệu thẩm định
   * @param {number|string} id - DossierID
   * @returns {Promise<import('@types/database').DigitalDossier>}
   */
  async getDossierById(id) {
    return api.get(ENDPOINTS.DOSSIERS.DETAIL(id));
  },

  /**
   * Phê duyệt một tài liệu thẩm định trong checklist
   * @param {number|string} docId - DocumentID
   * @returns {Promise<any>}
   */
  async approveDocument(docId) {
    return api.post(ENDPOINTS.DOSSIERS.APPROVE_DOCUMENT(docId));
  },

  /**
   * Từ chối một tài liệu kèm lý do và ghi chú chỉnh sửa
   * @param {number|string} docId - DocumentID
   * @param {{ reason: string, correctionNote?: string }} payload
   * @returns {Promise<any>}
   */
  async rejectDocument(docId, payload) {
    return api.post(ENDPOINTS.DOSSIERS.REJECT_DOCUMENT(docId), payload);
  },

  /**
   * Gửi yêu cầu khách hàng bổ sung tài liệu còn thiếu hoặc cập nhật lại
   * @param {number|string} id - DossierID
   * @param {{ notes?: string }} [payload]
   * @returns {Promise<any>}
   */
  async requestDocuments(id, payload = {}) {
    return api.post(ENDPOINTS.DOSSIERS.REQUEST_DOCUMENTS(id), payload);
  },

  /**
   * Nộp bộ hồ sơ đã hoàn chỉnh lên Cơ quan chức năng (Cục Thú y / Hải quan)
   * @param {number|string} id - DossierID
   * @returns {Promise<any>}
   */
  async submitToAuthorities(id) {
    return api.post(ENDPOINTS.DOSSIERS.SUBMIT_TO_AUTHORITIES(id));
  },

  /**
   * Ghi nhận hồ sơ đã được cơ quan chức năng thông quan thành công (Cleared)
   * @param {number|string} id - DossierID
   * @param {{ clearanceNumber?: string }} [payload]
   * @returns {Promise<any>}
   */
  async clearDossier(id, payload = {}) {
    return api.post(ENDPOINTS.DOSSIERS.CLEAR(id), payload);
  },

  /**
   * Báo cáo vướng mắc hoặc sự cố thủ tục kiểm dịch (Issue)
   * @param {number|string} id - DossierID
   * @param {{ reason: string, issueDescription?: string }} payload
   * @returns {Promise<any>}
   */
  async reportIssue(id, payload) {
    return api.post(ENDPOINTS.DOSSIERS.ISSUE(id), payload);
  },

  /**
   * Tra cứu cơ sở dữ liệu quy định kiểm dịch thú y theo quốc gia (Quarantine Rules DB)
   * @param {{ countryCode?: string, direction?: string, search?: string }} [params]
   * @returns {Promise<{ data: import('@types/database').CountryDocRequirement[], total?: number }>}
   */
  async getQuarantineRules() {
    // Backend chưa có API đọc quy định giấy tờ theo quốc gia (API.md mục 14) -> hook dùng dữ liệu tham khảo
    throw new Error('Quarantine rules API is not available yet');
  },

  /**
   * Lấy số liệu tổng quan cho trang Compliance Overview (/specialist/dashboard)
   * Tổng hợp từ danh sách hồ sơ kiểm dịch
   * @returns {Promise<{
   *   stats: { overdueDossiers: number, pendingApproval: number, activeQuarantine: number, exceptions: number },
   *   priorityActionQueue: any[],
   *   customerUploadedDossiers: any[],
   *   authorityComplianceStatus: any
   * }>}
   */
  async getOverview() {
    // Lấy tối đa 100 hồ sơ (mặc định backend chỉ trả 10)
    const res = await api.get(ENDPOINTS.DOSSIERS.LIST, { params: { size: 100 } });
    const dossiers = Array.isArray(res?.data) ? res.data : [];

    // "Quá hạn": chưa thông quan mà còn dưới 3 ngày là tới ngày khởi hành (backend không có trường SLA riêng)
    const isOverdue = (d) =>
      d.status !== 'Cleared' && d.departureDate && new Date(d.departureDate).getTime() - Date.now() < 3 * 24 * 3600 * 1000;
    const overdueCount = dossiers.filter(isOverdue).length;
    const pendingCount = dossiers.filter((d) => d.status === 'Reviewing' || d.status === 'AwaitingDocs').length;
    const activeQuarantineCount = dossiers.filter((d) => ['Reviewing', 'SubmittedToAuthorities', 'Draft'].includes(d.status)).length;
    const exceptionsCount = dossiers.filter((d) => d.status === 'Issue').length;

    const priorityActionQueue = dossiers
      .filter((d) => d.status === 'Issue' || isOverdue(d) || d.status === 'Reviewing')
      .slice(0, 5);

    // Danh sách không kèm giấy tờ; hồ sơ Reviewing là hồ sơ khách đã nộp giấy chờ thẩm định
    const customerUploadedDossiers = dossiers
      .filter((d) => d.status === 'Reviewing')
      .slice(0, 5);

    const clearedCount = dossiers.filter((d) => d.status === 'Cleared').length;
    const complianceRate = dossiers.length ? Math.round((clearedCount / dossiers.length) * 1000) / 10 : 0;

    return {
      stats: {
        overdueDossiers: overdueCount,
        pendingApproval: pendingCount,
        activeQuarantine: activeQuarantineCount,
        exceptions: exceptionsCount,
      },
      priorityActionQueue,
      customerUploadedDossiers,
      authorityComplianceStatus: {
        total: dossiers.length,
        cleared: clearedCount,
        submittedToAuthorities: dossiers.filter((d) => d.status === 'SubmittedToAuthorities').length,
        reviewing: dossiers.filter((d) => d.status === 'Reviewing').length,
        awaitingDocs: dossiers.filter((d) => d.status === 'AwaitingDocs').length,
        issue: exceptionsCount,
        complianceRate,
      },
    };
  },
};

export default specialistDossierService;
