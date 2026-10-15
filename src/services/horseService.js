import dayjs from 'dayjs';
import api from './api';
import { ENDPOINTS } from './endpoints';
import { toFormData } from '@utils/apiHelpers';

// Instance mặc định là JSON: phải ghi đè để axios gửi FormData đúng dạng multipart (có boundary)
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/**
 * Chuyển dữ liệu form ngựa thành FormData đúng các trường backend nhận
 * (POST/PUT /api/horses chỉ nhận multipart/form-data, gửi JSON sẽ bị 415).
 * @param {FormData|Record<string, any>} horseData
 * @returns {FormData}
 */
function buildHorseForm(horseData) {
  if (typeof FormData !== 'undefined' && horseData instanceof FormData) return horseData;
  const dob = horseData.dateOfBirth || horseData.DateOfBirth;
  return toFormData({
    name: (horseData.name || horseData.Name || '').trim(),
    microchipNumber: (horseData.microchipNumber || horseData.MicrochipNumber || '').trim(),
    passportNumber: (horseData.passportNumber || horseData.PassportNumber || '').trim(),
    breed: horseData.breed || horseData.Breed,
    gender: horseData.gender || horseData.Gender,
    dateOfBirth: dob ? dayjs(dob).format('YYYY-MM-DD') : null,
    color: horseData.color || horseData.Color,
    specialCareRequirements: horseData.specialCareRequirements || horseData.SpecialCareRequirements,
    // Ảnh phải là file (jpg/png); link ảnh dạng text không được backend nhận
    photo: horseData.photo instanceof Blob ? horseData.photo : null,
    removePhoto: horseData.removePhoto ? 'true' : null,
  });
}

/**
 * @file horseService.js
 * @description Tầng Service xử lý nghiệp vụ hồ sơ ngựa đua (Horses)
 */

export const horseService = {
  /**
   * Lấy danh sách hồ sơ ngựa đua (hỗ trợ phân trang, tìm kiếm và lọc theo chủ ngựa)
   * @param {{ ownerUserId?: number, includeInactive?: boolean, search?: string, sort?: string, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: import('../types/database').Horse[], pagination?: any }>}
   */
  async getHorses(params) {
    return api.get(ENDPOINTS.HORSES.LIST, { params });
  },

  /**
   * Lấy chi tiết hồ sơ một con ngựa theo ID
   * @param {number|string} id - Mã định danh HorseID
   * @returns {Promise<import('../types/database').Horse>}
   */
  async getHorseById(id) {
    return api.get(ENDPOINTS.HORSES.DETAIL(id));
  },

  /**
   * Khai báo hồ sơ ngựa đua mới (multipart/form-data, ảnh ở trường `photo`)
   * @param {FormData|Partial<import('../types/database').Horse>} horseData - Dữ liệu hồ sơ ngựa
   * @returns {Promise<import('../types/database').Horse>}
   */
  async createHorse(horseData) {
    return api.post(ENDPOINTS.HORSES.CREATE, buildHorseForm(horseData), MULTIPART);
  },

  /**
   * Cập nhật thông tin hồ sơ ngựa đua
   * @param {number|string} id - Mã định danh HorseID
   * @param {FormData|Partial<import('../types/database').Horse>} horseData - Dữ liệu cập nhật
   * @returns {Promise<import('../types/database').Horse>}
   */
  async updateHorse(id, horseData) {
    // PUT phải gửi lại đủ các trường bắt buộc
    return api.put(ENDPOINTS.HORSES.UPDATE(id), buildHorseForm(horseData), MULTIPART);
  },

  /**
   * Xóa hồ sơ ngựa đua khỏi hệ thống
   * @param {number|string} id - Mã định danh HorseID
   * @returns {Promise<any>}
   */
  async deleteHorse(id) {
    return api.delete(ENDPOINTS.HORSES.DELETE(id));
  },

  /**
   * Bổ sung hồ sơ thú y cho ngựa
   */
  async addVetRecord(horseId, recordData) {
    return api.post(`/horses/${horseId}/vet-records`, recordData);
  },

  /**
   * Chỉnh sửa hồ sơ thú y của ngựa
   */
  async updateVetRecord(horseId, recordId, recordData) {
    return api.put(`/horses/${horseId}/vet-records/${recordId}`, recordData);
  },

  /**
   * Xóa hồ sơ thú y của ngựa
   */
  async deleteVetRecord(horseId, recordId) {
    return api.delete(`/horses/${horseId}/vet-records/${recordId}`);
  },
};

export default horseService;
