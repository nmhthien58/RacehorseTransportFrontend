/**
 * @file userStorage.js
 * @description Quản lý danh sách tài khoản người dùng trong hệ thống (User Management)
 * Hỗ trợ quyền Admin / Logistics Manager xem, thêm và xóa người dùng
 */

import initialUsers from '@mocks/data/users.json';

const STORAGE_KEY_USERS = 'racehorse_users_storage';

/**
 * Lấy danh sách tài khoản người dùng từ localStorage
 * @returns {Array<any>}
 */
export function getStoredUsers() {
  if (typeof window === 'undefined') return [...initialUsers];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initialUsers));
      return [...initialUsers];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initialUsers));
    return [...initialUsers];
  } catch (err) {
    console.error('Lỗi đọc danh sách users từ localStorage:', err);
    return [...initialUsers];
  }
}

/**
 * Lưu danh sách người dùng vào localStorage
 * @param {Array<any>} users
 */
export function saveStoredUsers(users) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('users_updated', { detail: users }));
  } catch (err) {
    console.error('Lỗi lưu danh sách users vào localStorage:', err);
  }
}

/**
 * Xóa một người dùng theo userId
 * @param {number|string} userId
 * @returns {{ success: boolean, message?: string }}
 */
export function deleteStoredUser(userId) {
  const currentList = getStoredUsers();
  const idNum = Number(userId);
  const exists = currentList.some((u) => Number(u.userId) === idNum);
  if (!exists) {
    return { success: false, message: 'Người dùng không tồn tại' };
  }

  const updated = currentList.filter((u) => Number(u.userId) !== idNum);
  saveStoredUsers(updated);
  return { success: true };
}

/**
 * Thêm người dùng mới
 * @param {Object} userData
 * @returns {Object}
 */
export function addStoredUser(userData) {
  const currentList = getStoredUsers();
  const maxId = currentList.reduce((max, u) => Math.max(max, Number(u.userId) || 0), 0);
  const newUser = {
    userId: maxId + 1,
    fullName: userData.fullName || 'Người dùng mới',
    email: userData.email || `user${maxId + 1}@test.com`,
    phoneNumber: userData.phoneNumber || '+84988000000',
    role: userData.role || 'Customer',
    department: userData.department || 'Thành viên mới',
    staffId: userData.staffId || null,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const updated = [newUser, ...currentList];
  saveStoredUsers(updated);
  return newUser;
}
