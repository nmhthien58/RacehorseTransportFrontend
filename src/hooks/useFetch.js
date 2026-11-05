import { useState, useEffect, useCallback } from 'react';

/**
 * @file useFetch.js
 * @description Hook nền tảng data fetching dùng chung của dự án theo quy định tại AGENTS.md.
 * Quản lý trạng thái data, loading, error, và hỗ trợ caching theo phiên hoặc refetch tự động.
 *
 * @template T
 * @param {() => Promise<T>} asyncFn - Hàm bất đồng bộ gọi API
 * @param {Array<any>} [deps=[]] - Danh sách phụ thuộc kích hoạt fetch lại
 * @param {object} [options={}] - Cấu hình bổ sung
 * @param {T} [options.initialData=null] - Dữ liệu khởi tạo
 * @param {boolean} [options.immediate=true] - Tự động gọi ngay khi mount
 * @param {string} [options.sessionCacheKey] - Khóa lưu cache vào sessionStorage trong phiên làm việc
 * @returns {{
 *   data: T,
 *   loading: boolean,
 *   error: Error|null,
 *   refetch: () => void,
 *   setData: import('react').Dispatch<import('react').SetStateAction<T>>
 * }}
 */
export function useFetch(asyncFn, deps = [], options = {}) {
  const { initialData = null, immediate = true, sessionCacheKey = null } = options;

  // Lấy dữ liệu khởi tạo từ sessionStorage nếu có cấu hình sessionCacheKey
  const [data, setData] = useState(() => {
    if (sessionCacheKey && typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(sessionCacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // Bỏ qua lỗi parse sessionStorage
      }
    }
    return initialData;
  });

  const [loading, setLoading] = useState(immediate && !data);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!immediate && refreshKey === 0) return;

    let isSubscribed = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFn();
        if (isSubscribed) {
          setData(result);
          if (sessionCacheKey && typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(sessionCacheKey, JSON.stringify(result));
            } catch {
              // Bỏ qua lỗi storage
            }
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isSubscribed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, immediate, sessionCacheKey, ...deps]);

  return { data, loading, error, refetch, setData };
}

export default useFetch;
