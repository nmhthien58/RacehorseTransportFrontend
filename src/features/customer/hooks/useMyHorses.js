import { useState, useEffect } from 'react';
import { horseService } from '@services/horseService';
import { MOCK_HORSES } from '@mocks/data/horses.mock';

/**
 * Hook lấy danh sách ngựa của Customer hiện tại qua horseService.
 *
 * @returns {{ data: Array<any>, loading: boolean, error: Error|null }}
 */
export function useMyHorses() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    horseService
      .getHorses()
      .then((res) => {
        if (isSubscribed) {
          const list = res.data?.data || res.data || [];
          setData(Array.isArray(list) && list.length > 0 ? list : MOCK_HORSES);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setData(MOCK_HORSES);
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
  }, []);

  return { data, loading, error };
}

export default useMyHorses;
