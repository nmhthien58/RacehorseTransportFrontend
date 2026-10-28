<<<<<<< HEAD
import { useFetch } from './useFetch';
import { policyService, DEFAULT_POLICY } from '@services/policyService';

const POLICY_CACHE_KEY = 'rht_system_policy_config';

/**
 * @file usePolicy.js
 * @description Hook lấy cấu hình chính sách dịch vụ dùng chung (FE-15).
 * Bọc useFetch, lưu kết quả trong sessionStorage để tái sử dụng xuyên suốt phiên làm việc.
 *
 * @returns {{
 *   policy: typeof DEFAULT_POLICY,
 *   loading: boolean,
 *   error: Error|null,
 *   refetch: () => Promise<typeof DEFAULT_POLICY|null>,
 *   policyVersion: string,
 *   effectiveDate: string
 * }}
 */
export function usePolicy() {
  const { data, loading, error, refetch } = useFetch(
    () => policyService.getPolicy(),
    [],
    {
      initialData: DEFAULT_POLICY,
      immediate: true,
      sessionCacheKey: POLICY_CACHE_KEY,
    }
  );

  const policy = data || DEFAULT_POLICY;

  return {
    policy,
    loading,
    error,
    refetch,
    policyVersion: policy.PolicyVersion || DEFAULT_POLICY.PolicyVersion,
    effectiveDate: policy.EffectiveDate || DEFAULT_POLICY.EffectiveDate,
  };
}

export default usePolicy;
=======
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
>>>>>>> main
