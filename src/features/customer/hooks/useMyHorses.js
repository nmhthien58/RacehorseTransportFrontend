import { useState, useEffect } from 'react';
import { MOCK_HORSES } from '@mocks/data/horses.mock';

/**
 * Hook lấy danh sách ngựa của Customer hiện tại.
 * Hiện tại: trả mock data. Khi có API: đổi sang gọi horseService.getHorses().
 *
 * @returns {{ data: Array<any>, loading: boolean, error: Error|null }}
 */
export function useMyHorses() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: khi BE xong → gọi horseService.getHorses()
    const timer = setTimeout(() => {
      try {
        setData(MOCK_HORSES);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return { data, loading, error };
}

export default useMyHorses;
