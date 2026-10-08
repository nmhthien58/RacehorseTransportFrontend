import { useState, useEffect } from 'react';
import { MOCK_HORSES } from '@mocks/data/horses.mock';

/**
 * Hook lấy thông tin chi tiết một cá thể ngựa theo ID.
 * Hiện tại: tìm kiếm trong mock data. Khi có API: gọi horseService.getHorseById(id).
 *
 * @param {number|string} id - Mã định danh HorseID
 * @returns {{ data: any|null, loading: boolean, error: Error|null }}
 */
export function useHorseDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const found = MOCK_HORSES.find((h) => String(h.HorseID) === String(id));
        if (found) {
          setData(found);
        } else {
          setError(new Error(`Horse with ID ${id} not found`));
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [id]);

  return { data, loading, error };
}

export default useHorseDetail;
