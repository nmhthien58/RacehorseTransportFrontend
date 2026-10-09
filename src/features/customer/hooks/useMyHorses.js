import { useState, useEffect, useCallback } from 'react';
import horseService from '@services/horseService';

/**
 * Hook lấy danh sách ngựa của Customer hiện tại qua horseService.
 *
 * @returns {{ data: Array<any>, loading: boolean, error: Error|null, refetch: () => void }}
 */
export function useMyHorses() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    horseService
      .getHorses()
      .then((res) => {
        if (isSubscribed) {
          const list = res.data?.data || res.data || [];
          setData(Array.isArray(list) ? list : []);
          setError(null);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error('Lỗi khi tải danh sách ngựa:', err);
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
  }, [refreshIndex]);

  return { data, loading, error, refetch };
}

export default useMyHorses;
