import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file documentTypeService.js
 * @description Tầng Service xử lý danh mục loại giấy tờ kiểm dịch thú y quốc tế (Document Types)
 */

export const documentTypeService = {
  /**
   * Lấy danh sách gọn các loại giấy tờ phục vụ hiển thị trong dropdown
   * @returns {Promise<Array<{ DocTypeID: number, DocTypeCode: string, DocTypeName: string }>>}
   */
  async getLookup() {
    return api.get(ENDPOINTS.DOCUMENT_TYPES.LOOKUP);
  },

  /**
   * Lấy danh sách đầy đủ các loại giấy tờ (có phân trang)
   * @param {{ search?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: Array<any>, pagination?: any }>}
   */
  async getDocumentTypes(params) {
    return api.get(ENDPOINTS.DOCUMENT_TYPES.LIST, { params });
  },

  /**
   * Chi tiết một loại giấy tờ
   * @param {number|string} id - DocTypeID
   * @returns {Promise<any>}
   */
  async getDocumentTypeById(id) {
    return api.get(ENDPOINTS.DOCUMENT_TYPES.DETAIL(id));
  },

  /**
   * Thêm mới loại giấy tờ
   * @param {Object} data
   * @returns {Promise<any>}
   */
  async createDocumentType(data) {
    return api.post(ENDPOINTS.DOCUMENT_TYPES.CREATE, data);
  },

  /**
   * Sửa cấu hình loại giấy tờ
   * @param {number|string} id - DocTypeID
   * @param {Object} data
   * @returns {Promise<any>}
   */
  async updateDocumentType(id, data) {
    return api.put(ENDPOINTS.DOCUMENT_TYPES.UPDATE(id), data);
  },

  /**
   * Xóa một loại giấy tờ
   * @param {number|string} id - DocTypeID
   * @returns {Promise<any>}
   */
  async deleteDocumentType(id) {
    return api.delete(ENDPOINTS.DOCUMENT_TYPES.DELETE(id));
  },
};

export default documentTypeService;
