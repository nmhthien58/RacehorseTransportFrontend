import { useEffect, useState } from 'react';
import { policyService } from '@services/policyService';

// Chính sách ít khi đổi: tải một lần trong phiên, các màn dùng chung kết quả
let cachedPromise = null;

const loadPolicy = () => {
  if (!cachedPromise) {
    cachedPromise = policyService
      .getPolicy()
      .then((res) => res?.data ?? null)
      .catch((err) => {
        cachedPromise = null; // lỗi mạng thì lần sau thử lại
        throw err;
      });
  }
  return cachedPromise;
};

/**
 * Chính sách dịch vụ hiện hành (phiên bản + giá trị cấu hình), dùng cho ô đồng ý chính sách và các con số hiển thị.
 * @returns {{ policy: Object | null, loading: boolean, error: Error | null }}
 */
export default function usePolicy() {
  const [state, setState] = useState({ policy: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    loadPolicy()
      .then((policy) => active && setState({ policy, loading: false, error: null }))
      .catch((error) => active && setState({ policy: null, loading: false, error }));
    return () => {
      active = false;
    };
  }, []);

  return state;
}
