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
