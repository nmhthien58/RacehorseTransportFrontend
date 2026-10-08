import { useState, useEffect } from 'react';
import { horseService } from '@services/horseService';
import { MOCK_HORSES } from '@mocks/data/horses.mock';

/**
 * Hook lấy thông tin chi tiết một cá thể ngựa theo ID qua horseService.
 *
 * @param {number|string} id - Mã định danh HorseID
 * @returns {{ data: any|null, loading: boolean, error: Error|null }}
 */
export function useHorseDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;
    if (!id) {
      return;
    }

    horseService
      .getHorseById(id)
      .then((res) => {
        if (isSubscribed) {
          setData(res.data || res);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          const found = MOCK_HORSES.find((h) => String(h.HorseID) === String(id));
          if (found) {
            setData(found);
          } else {
            setError(err);
          }
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
  }, [id]);

  return { data, loading, error };
}

export default useHorseDetail;
