import { useState, useEffect } from 'react';
import horseService from '@services/horseService';
import { getStoredHorseById } from '@utils/horseStorage';

/**
 * Hook lấy thông tin chi tiết một cá thể ngựa theo ID.
 *
 * @param {number|string} id - Mã định danh HorseID
 * @returns {{ data: any|null, loading: boolean, error: Error|null }}
 */
export function useHorseDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    async function loadDetail() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Ưu tiên lấy từ stored horse hoặc gọi service
        const stored = getStoredHorseById(id);
        if (stored) {
          if (isSubscribed) setData(stored);
        } else {
          const res = await horseService.getHorseById(id);
          const found = res?.data || res;
          if (found && isSubscribed) {
            setData(found);
          } else if (isSubscribed) {
            setError(new Error(`Horse with ID ${id} not found`));
          }
        }
      } catch (err) {
        if (isSubscribed) {
          // Thử lại lần cuối từ stored
          const fallback = getStoredHorseById(id);
          if (fallback) {
            setData(fallback);
          } else {
            setError(err);
          }
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadDetail();

    const handleUpdate = () => {
      loadDetail();
    };
    window.addEventListener('horses_updated', handleUpdate);

    return () => {
      isSubscribed = false;
      window.removeEventListener('horses_updated', handleUpdate);
    };
  }, [id]);

  return { data, loading, error, refetch: () => setData(getStoredHorseById(id)) };
}

export default useHorseDetail;
