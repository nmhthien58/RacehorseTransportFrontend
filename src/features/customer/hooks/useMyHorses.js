import { useState, useEffect, useCallback } from 'react';
import horseService from '@services/horseService';
import { useAuthStore } from '@features/auth/store/authStore';
import { deduplicateHorses } from '@utils/horseStorage';

/**
 * Hook lấy danh sách ngựa của Customer hiện tại, tự động cập nhật khi có ngựa mới
 *
 * @returns {{ data: Array<any>, loading: boolean, error: Error|null, refetch: () => void }}
 */
export function useMyHorses() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  const fetchHorses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await horseService.getHorses({ ownerId: user?.UserID || undefined });
      const horses = res?.data?.data || res?.data || res || [];
      setData(deduplicateHorses(horses));
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải danh sách ngựa:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHorses();

    const handleUpdate = () => {
      fetchHorses();
    };

    window.addEventListener('horses_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('horses_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchHorses]);

  return { data, loading, error, refetch: fetchHorses };
}

export default useMyHorses;
