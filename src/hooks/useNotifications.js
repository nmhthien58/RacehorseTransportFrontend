import { useState, useEffect, useCallback, useRef } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import notificationService, { NOTIFICATION_RECEIVED_EVENT } from '@services/notificationService';
import { useAuthStore } from '@features/auth/store/authStore';
import { unwrapData, unwrapList } from '@utils/apiHelpers';

const isMock = import.meta.env.VITE_USE_MOCK !== 'false';
const LIST_SIZE = 10;
// Hết lượt tự kết nối lại của SignalR thì chờ chừng này rồi thử lại từ đầu
const RESTART_DELAY_MS = 15000;

/**
 * Tải 10 thông báo mới nhất và số chưa đọc. Lỗi thì trả null (interceptor đã ghi lỗi ra console).
 * @returns {Promise<{ items: Array<import('@services/notificationService').NotificationItem>, unreadCount: number } | null>}
 */
async function fetchSnapshot() {
  try {
    const [listRes, countRes] = await Promise.all([
      notificationService.getNotifications({ page: 1, size: LIST_SIZE }),
      notificationService.getUnreadCount(),
    ]);
    return { items: unwrapList(listRes), unreadCount: unwrapData(countRes)?.count ?? 0 };
  } catch {
    return null;
  }
}

/**
 * Chuông thông báo của người dùng đang đăng nhập.
 * Tải danh sách + số chưa đọc qua REST, sau đó giữ kết nối SignalR để nhận thông báo mới ngay lập tức.
 * @param {{ onReceived?: (item: import('@services/notificationService').NotificationItem) => void }} [options]
 *   onReceived: gọi khi có thông báo mới đẩy về (ví dụ để hiện toast)
 * @returns {{
 *   items: Array<import('@services/notificationService').NotificationItem>,
 *   unreadCount: number,
 *   loading: boolean,
 *   connected: boolean,
 *   refetch: () => Promise<void>,
 *   markAsRead: (id: number) => Promise<void>,
 *   markAllAsRead: () => Promise<void>,
 * }}
 */
export function useNotifications({ onReceived } = {}) {
  const userId = useAuthStore((state) => state.user?.userId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // Tài khoản đăng nhập dự phòng bằng dữ liệu mẫu có token giả, backend sẽ từ chối
  const hasRealToken = useAuthStore((state) => Boolean(state.token) && !state.token.startsWith('mock-token'));
  const enabled = !isMock && isAuthenticated && hasRealToken && Boolean(userId);

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Chỉ dùng để hiện spinner ở lần tải đầu; các lần tải lại chạy ngầm
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(false);

  // Giữ callback mới nhất mà không phải tạo lại kết nối mỗi lần component render
  const onReceivedRef = useRef(onReceived);
  useEffect(() => {
    onReceivedRef.current = onReceived;
  }, [onReceived]);

  const applySnapshot = useCallback((snapshot) => {
    if (snapshot) {
      setItems(snapshot.items);
      setUnreadCount(snapshot.unreadCount);
    }
    setLoaded(true);
  }, []);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    applySnapshot(await fetchSnapshot());
  }, [enabled, applySnapshot]);

  useEffect(() => {
    if (!enabled) return undefined;

    let disposed = false;
    let restartTimer = null;
    const connection = notificationService.createHubConnection(() => useAuthStore.getState().token);

    connection.on(NOTIFICATION_RECEIVED_EVENT, (item) => {
      setItems((prev) =>
        [item, ...prev.filter((n) => n.notificationId !== item.notificationId)].slice(0, LIST_SIZE),
      );
      setUnreadCount((prev) => prev + 1);
      onReceivedRef.current?.(item);
    });

    // Mất kết nối một lúc có thể đã lỡ vài thông báo, nên tải lại cho chắc
    connection.onreconnecting(() => setConnected(false));
    connection.onreconnected(() => {
      setConnected(true);
      refetch();
    });

    const start = async () => {
      try {
        await connection.start();
        if (disposed) return;
        setConnected(true);
      } catch {
        if (disposed) return;
        setConnected(false);
        scheduleRestart();
      }
    };

    // Token hết hạn cũng làm kết nối thất bại; gọi REST trước để interceptor của api.js refresh token
    const scheduleRestart = () => {
      clearTimeout(restartTimer);
      restartTimer = setTimeout(async () => {
        if (disposed) return;
        await refetch();
        if (!disposed && connection.state === HubConnectionState.Disconnected) {
          start();
        }
      }, RESTART_DELAY_MS);
    };

    connection.onclose(() => {
      if (disposed) return;
      setConnected(false);
      scheduleRestart();
    });

    fetchSnapshot().then((snapshot) => {
      if (!disposed) applySnapshot(snapshot);
    });
    start();

    return () => {
      disposed = true;
      clearTimeout(restartTimer);
      connection.stop();
    };
  }, [enabled, userId, refetch, applySnapshot]);

  const markAsRead = useCallback(async (id) => {
    const target = items.find((n) => n.notificationId === id);
    if (!target || target.isRead) return;
    setItems((prev) => prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationService.markAsRead(id);
    } catch {
      refetch();
    }
  }, [items, refetch]);

  const markAllAsRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch {
      refetch();
    }
  }, [refetch]);

  // Đăng xuất (hoặc chạy mock) thì chuông trống, không hiện dữ liệu của phiên trước
  return {
    items: enabled ? items : [],
    unreadCount: enabled ? unreadCount : 0,
    loading: enabled && !loaded,
    connected: enabled && connected,
    refetch,
    markAsRead,
    markAllAsRead,
  };
}

export default useNotifications;
