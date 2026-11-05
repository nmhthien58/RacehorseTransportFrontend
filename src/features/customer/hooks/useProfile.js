import { useState, useEffect, useCallback } from 'react';
import authService from '@services/authService';
import { unwrapData } from '@utils/apiHelpers';

/**
 * Hook lấy hồ sơ của tài khoản đang đăng nhập từ GET /api/auth/me
 * (họ tên, email, số điện thoại, vai trò, trạng thái, ngày tạo)
 *
 * @returns {{ data: any|null, loading: boolean, error: Error|null, refresh: () => void }}
 */
export function useProfile() {
  const [refreshKey, setRefreshKey] = useState(0);
  // Kết quả gắn với refreshKey: khác key hiện tại nghĩa là đang tải
  const [result, setResult] = useState({ key: -1, data: null, error: null });

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    authService
      .getCurrentUser()
      .then((res) => {
        if (active) setResult({ key: refreshKey, data: unwrapData(res), error: null });
      })
      .catch((err) => {
        if (active) setResult((prev) => ({ key: refreshKey, data: prev.data, error: err }));
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  return { data: result.data, loading: result.key !== refreshKey, error: result.error, refresh };
}

export default useProfile;
