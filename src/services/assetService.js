import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file assetService.js
 * @description Tầng Service đọc danh mục phương tiện (xe tải, xe van, chuồng hàng không) cho nhân sự
 */

export const assetService = {
  /**
   * Lấy danh sách phương tiện (lọc trạng thái / loại, phân trang)
   * @param {{ status?: string, assetType?: string, search?: string, sort?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: Array<{ assetId: number, assetCode: string, assetType: string, capacityHorses: number, hasClimateControl: boolean, status: string }>, pagination?: any }>}
   */
  async getAssets(params) {
    return api.get(ENDPOINTS.ASSETS.LIST, { params });
  },
};

export default assetService;
