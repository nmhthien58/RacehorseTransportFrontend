import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file reportService.js
 * @description Tầng Service xử lý dữ liệu báo cáo thống kê hoạt động vận chuyển (Reports)
 */

export const reportService = {
  /**
   * Lấy báo cáo tổng hợp hiệu suất vận hành, tỷ lệ đúng hạn và KPI
   * @param {{ fromDate?: string, toDate?: string }} [params]
   * @returns {Promise<any>}
   */
  async getSummary(params) {
    return api.get(ENDPOINTS.REPORTS.SUMMARY, { params });
  },
};

export default reportService;
