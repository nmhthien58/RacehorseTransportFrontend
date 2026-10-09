import { useState, useEffect, useCallback } from 'react';
import horseService from '@services/horseService';

/**
 * Hook lấy thông tin chi tiết một cá thể ngựa theo ID qua horseService.
 *
 * @param {number|string} id - Mã định danh HorseID
 * @returns {{ data: any|null, loading: boolean, error: Error|null, refetch: () => void }}
 */
export function useHorseDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    if (!id) {
      return;
    }

    horseService
      .getHorseById(id)
      .then((res) => {
        if (isSubscribed) {
          setData(res.data?.data || res.data || res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error('Lỗi khi tải chi tiết ngựa:', err);
          setError(err);
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [id, refreshIndex]);

  return { data, loading, error, refetch };
}

export default useHorseDetail;
