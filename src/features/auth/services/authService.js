import api from '@services/api';
import { ENDPOINTS } from '@services/endpoints';

/**
 * @file authService.js
 * @description Tầng Service xử lý xác thực và tài khoản cá nhân cho feature Auth
 */

/**
 * Đăng nhập người dùng bằng email và password.
 * @param {{ email: string, password?: string }} credentials
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: import('@types/database').User }>}
 */
export const loginApi = async (credentials) => {
  return await api.post(ENDPOINTS.AUTH.LOGIN, credentials);
};

/**
 * Đăng ký tài khoản khách hàng mới.
 * @param {{ fullName: string, email: string, password?: string, phoneNumber?: string }} data
 * @returns {Promise<any>}
 */
export const registerApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.REGISTER, data);
};

/**
 * Đăng nhập hoặc đăng ký bằng tài khoản Google.
 * @param {{ idToken?: string, email?: string, fullName?: string }} data
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: import('@types/database').User }>}
 */
export const googleLoginApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.GOOGLE_LOGIN, data);
};

/**
 * Xin access token mới bằng refreshToken.
 * @param {{ refreshToken: string }} data
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
export const refreshTokenApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.REFRESH, data);
};

/**
 * Đăng xuất tài khoản khỏi hệ thống.
 * @param {{ refreshToken?: string }} [data]
 * @returns {Promise<any>}
 */
export const logoutApi = async (data = {}) => {
  return await api.post(ENDPOINTS.AUTH.LOGOUT, data);
};

/**
 * Lấy thông tin tài khoản hiện tại từ token.
 * @returns {Promise<import('@types/database').User>}
 */
export const getCurrentUserApi = async () => {
  return await api.get(ENDPOINTS.AUTH.ME);
};

/**
 * Cập nhật thông tin tài khoản hiện tại (họ tên, số điện thoại).
 * @param {{ fullName?: string, phoneNumber?: string }} data
 * @returns {Promise<import('@types/database').User>}
 */
export const updateProfileApi = async (data) => {
  return await api.put(ENDPOINTS.AUTH.UPDATE_PROFILE, data);
};

/**
 * Đổi mật khẩu tài khoản hiện tại.
 * @param {{ currentPassword: string, newPassword: string }} data
 * @returns {Promise<any>}
 */
export const changePasswordApi = async (data) => {
  return await api.put(ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
};

/**
 * Yêu cầu gửi link hoặc mã OTP đặt lại mật khẩu về email.
 * @param {{ email: string }} data
 * @returns {Promise<any>}
 */
export const forgotPasswordApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
};

/**
 * Đặt lại mật khẩu mới bằng token hoặc code.
 * @param {{ token?: string, newPassword: string, code?: string, email?: string }} data
 * @returns {Promise<any>}
 */
export const resetPasswordApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
};

// Giữ tương thích ngược cho luồng đăng ký OTP nếu có
export const verifyEmailApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, data);
};

export const resendOtpApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.RESEND_OTP, data);
};

export const verifyCodeApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.VERIFY_CODE, data);
};

export default {
  loginApi,
  registerApi,
  googleLoginApi,
  refreshTokenApi,
  logoutApi,
  getCurrentUserApi,
  updateProfileApi,
  changePasswordApi,
  forgotPasswordApi,
  resetPasswordApi,
  verifyEmailApi,
  resendOtpApi,
  verifyCodeApi,
};
