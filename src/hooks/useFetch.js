import { useState, useEffect, useCallback } from 'react';

/**
 * Hook cơ sở phục vụ gọi hàm bất đồng bộ lấy dữ liệu (Service API)
 * Tuân thủ quy tắc kiến trúc dự án AGENTS.md:
 * - Không dùng React Query / SWR
 * - Tự động quản lý loading, error, data và hàm refetch
 *
 * @template T
 * @param {() => Promise<any>} fetchFn - Hàm gọi service trả về Promise
 * @param {boolean} [immediate=true] - Kích hoạt gọi API ngay khi component mount
 * @returns {{
 *   data: T | null,
 *   loading: boolean,
 *   error: any,
 *   refetch: () => Promise<any>,
 *   setData: React.Dispatch<React.SetStateAction<T | null>>
 * }}
 */
export function useFetch(fetchFn, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn();
      setData(res);
      setError(null);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    let active = true;

    if (immediate) {
      fetchFn()
        .then((res) => {
          if (active) {
            setData(res);
            setError(null);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err);
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [fetchFn, immediate]);

  return { data, loading, error, refetch, setData };
}

export default useFetch;
