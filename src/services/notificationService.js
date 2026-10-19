import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import api from './api';
import { ENDPOINTS } from './endpoints';

/**
 * @file notificationService.js
 * @description Chuông thông báo: đọc / đánh dấu đã đọc qua REST, nhận thông báo mới realtime qua SignalR.
 */

/**
 * @typedef {Object} NotificationItem
 * @property {number} notificationId
 * @property {string} title
 * @property {string} message
 * @property {string|null} referenceType - "Booking" | "Trip" | "Dossier" | "Incident"
 * @property {number|null} referenceId
 * @property {boolean} isRead
 * @property {string} createdAt
 */

// Hub nằm ở gốc backend (không có /api), ví dụ https://<backend>/hubs/notifications
const resolveHubUrl = () => {
  const base = api.defaults.baseURL || '';
  const origin = base.endsWith('/api') ? base.slice(0, -4) : base;
  return `${origin}${ENDPOINTS.NOTIFICATIONS.HUB}`;
};

export const notificationService = {
  /**
   * Lấy thông báo của người dùng hiện tại, mới nhất trước.
   * @param {{ isRead?: boolean, page?: number, size?: number }} [params]
   * @returns {Promise<{ data: NotificationItem[], pagination?: any }>}
   */
  async getNotifications(params) {
    return api.get(ENDPOINTS.NOTIFICATIONS.LIST, { params });
  },

  /**
   * Lấy số thông báo chưa đọc.
   * @returns {Promise<{ data: { count: number } }>}
   */
  async getUnreadCount() {
    return api.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  },

  /**
   * Đánh dấu một thông báo là đã đọc.
   * @param {number} id - NotificationID
   * @returns {Promise<{ data: NotificationItem }>}
   */
  async markAsRead(id) {
    return api.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  /**
   * Đánh dấu toàn bộ thông báo là đã đọc.
   * @returns {Promise<any>}
   */
  async markAllAsRead() {
    return api.patch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },

  /**
   * Tạo kết nối SignalR tới hub thông báo (chưa start).
   * Token được đọc lại mỗi lần kết nối / kết nối lại nên luôn dùng token mới nhất sau khi refresh.
   * @param {() => string | null} getToken
   * @returns {import('@microsoft/signalr').HubConnection}
   */
  createHubConnection(getToken) {
    return new HubConnectionBuilder()
      .withUrl(resolveHubUrl(), {
        accessTokenFactory: () => getToken() || '',
        // Gửi token bằng accessTokenFactory, không cần cookie nên không bắt backend bật AllowCredentials
        withCredentials: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();
  },
};

/** Tên sự kiện backend đẩy về khi có thông báo mới */
export const NOTIFICATION_RECEIVED_EVENT = 'notificationReceived';

export default notificationService;
