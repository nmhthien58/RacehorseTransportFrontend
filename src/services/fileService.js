import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file fileService.js
 * @description Tải file lên storage của backend; dùng path trả về để gửi kèm các request khác.
 */

export const fileService = {
  /**
   * Tải một file lên (PDF / JPG / PNG)
   * @param {File} file
   * @param {'documents'|'horses'|'welfare'|'signatures'} category
   * @returns {Promise<{ data: { path: string, url: string, urlExpiresAt: string, fileName: string, contentType: string } }>}
   */
  async upload(file, category) {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    return api.post(ENDPOINTS.FILES.UPLOAD, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export default fileService;
