import { useState, useEffect } from 'react';
import { MOCK_SETTINGS } from '@mocks/data/settings.mock';

/**
 * Hook lấy và lưu trữ tùy chọn cài đặt thông báo & bảo mật của Customer.
 *
 * @returns {{
 *   data: any|null,
 *   loading: boolean,
 *   error: Error|null,
 *   updateSettings: (partial: any) => void
 * }}
 */
export function useSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(MOCK_SETTINGS);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const updateSettings = (partial) => {
    setData((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  return { data, loading, error, updateSettings };
}

export default useSettings;
