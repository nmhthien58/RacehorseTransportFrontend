import { useEffect, useState, useCallback } from 'react';
import { policyService, DEFAULT_POLICY } from '@services/policyService';

let cachedPromise = null;

const loadPolicy = () => {
  if (!cachedPromise) {
    cachedPromise = policyService
      .getPolicy()
      .then((res) => res?.data ?? res ?? null)
      .catch((err) => {
        cachedPromise = null;
        throw err;
      });
  }
  return cachedPromise;
};

/**
 * @file usePolicy.js
 * @description Hook lấy cấu hình chính sách dịch vụ dùng chung (FE-15).
 * Lưu kết quả trong phiên làm việc để tái sử dụng.
 *
 * @returns {{
 *   policy: Object,
 *   loading: boolean,
 *   error: Error|null,
 *   refetch: () => Promise<Object>,
 *   policyVersion: string,
 *   effectiveDate: string
 * }}
 */
export function usePolicy() {
  const [state, setState] = useState({
    policy: DEFAULT_POLICY,
    loading: true,
    error: null,
  });

  const fetchPolicy = useCallback(() => {
    cachedPromise = null;
    return loadPolicy()
      .then((data) => {
        const pol = data || DEFAULT_POLICY;
        setState({ policy: pol, loading: false, error: null });
        return pol;
      })
      .catch((err) => {
        setState({ policy: DEFAULT_POLICY, loading: false, error: err });
        return DEFAULT_POLICY;
      });
  }, []);

  useEffect(() => {
    let active = true;
    loadPolicy()
      .then((data) => {
        if (!active) return;
        const pol = data || DEFAULT_POLICY;
        setState({ policy: pol, loading: false, error: null });
      })
      .catch((err) => {
        if (!active) return;
        setState({ policy: DEFAULT_POLICY, loading: false, error: err });
      });
    return () => {
      active = false;
    };
  }, []);

  const policy = state.policy || DEFAULT_POLICY;
  const policyVersion = policy?.version || policy?.PolicyVersion || DEFAULT_POLICY?.PolicyVersion || '1.0';
  const effectiveDate = policy?.effectiveDate || policy?.EffectiveDate || DEFAULT_POLICY?.EffectiveDate || '';

  return {
    policy,
    loading: state.loading,
    error: state.error,
    refetch: fetchPolicy,
    policyVersion,
    effectiveDate,
  };
}

export default usePolicy;
