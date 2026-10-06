import api from '@services/api';
import { ENDPOINTS } from '@services/endpoints';

/**
 * Đăng nhập người dùng bằng email và password.
 * @param {{ email: string, password?: string }} credentials
 * @returns {Promise<{ token: string, user: import('@types/database').User }>}
 */
export const loginApi = async (credentials) => {
  return await api.post(ENDPOINTS.AUTH.LOGIN, credentials);
};

/**
 * Đăng ký tài khoản người dùng mới (phát sinh mã xác thực OTP).
 * @param {{ FullName: string, Email: string, password?: string, PhoneNumber?: string }} data
 * @returns {Promise<{ success: boolean, message: string, email: string }>}
 */
export const registerApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.REGISTER, data);
};

/**
 * Đăng nhập hoặc đăng ký bằng tài khoản Google.
 * @param {{ email: string, FullName: string, avatar?: string, googleToken?: string }} data
 * @returns {Promise<{ token: string, user: import('@types/database').User }>}
 */
export const googleLoginApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.GOOGLE_LOGIN, data);
};

/**
 * Xác thực mã OTP gửi về email khi đăng ký tài khoản mới.
 * @param {{ email: string, code: string }} data
 * @returns {Promise<{ token: string, user: import('@types/database').User }>}
 */
export const verifyEmailApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, data);
};

/**
 * Gửi lại mã OTP xác minh tài khoản.
 * @param {{ email: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const resendOtpApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.RESEND_OTP, data);
};

/**
 * Yêu cầu gửi mã OTP đặt lại mật khẩu về email.
 * @param {{ email: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const forgotPasswordApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
};

/**
 * Xác thực mã OTP.
 * @param {{ email: string, code: string }} data
 * @returns {Promise<{ success: boolean, verifyToken?: string }>}
 */
export const verifyCodeApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.VERIFY_CODE, data);
};

/**
 * Đặt lại mật khẩu mới.
 * @param {{ email: string, newPassword: string, code?: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const resetPasswordApi = async (data) => {
  return await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
};

/**
 * Lấy thông tin tài khoản hiện tại từ token.
 * @returns {Promise<import('@types/database').User>}
 */
export const getCurrentUserApi = async () => {
  return await api.get(ENDPOINTS.AUTH.ME);
};
