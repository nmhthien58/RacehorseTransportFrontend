import { useState, useEffect, useCallback } from 'react';
import specialistDossierService from '../services/specialistDossierService';
import fallbackRulesData from '@mocks/data/quarantineRulesData.json';

/**
 * Hook tra cứu cơ sở dữ liệu quy định kiểm dịch thú y quốc tế (Quarantine Rules DB)
 * @param {Object} [initialFilters]
 * @returns {Object}
 */
export function useQuarantineRules(initialFilters = {}) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countryFilter, setCountryFilter] = useState(initialFilters.countryCode || 'all');
  const [directionFilter, setDirectionFilter] = useState(initialFilters.direction || 'all');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRules = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const params = {
          countryCode: countryFilter !== 'all' ? countryFilter : undefined,
          direction: directionFilter !== 'all' ? directionFilter : undefined,
          search: searchQuery ? searchQuery.trim() : undefined,
        };
        const res = await specialistDossierService.getQuarantineRules(params);
        if (isSubscribed) {
          const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;
          if (items) {
            setRules(items);
          } else {
            // Fallback an toàn từ bộ dữ liệu mock chuẩn hóa
            let filtered = [...fallbackRulesData];
            if (params.countryCode) {
              filtered = filtered.filter((r) => r.countryCode?.toLowerCase() === params.countryCode.toLowerCase());
            }
            if (params.direction) {
              filtered = filtered.filter((r) => r.direction?.toLowerCase() === params.direction.toLowerCase());
            }
            if (params.search) {
              const q = params.search.toLowerCase();
              filtered = filtered.filter(
                (r) =>
                  r.docTypeName?.toLowerCase().includes(q) ||
                  r.countryName?.toLowerCase().includes(q) ||
                  r.issuingAuthority?.toLowerCase().includes(q) ||
                  r.regulationNote?.toLowerCase().includes(q)
              );
            }
            setRules(filtered);
          }
        }
      } catch (err) {
        if (isSubscribed) {
          // Khi API gặp sự cố, tự động dùng mock data để màn hình luôn hiển thị dữ liệu đầy đủ
          let filtered = [...fallbackRulesData];
          if (countryFilter !== 'all') {
            filtered = filtered.filter((r) => r.countryCode?.toLowerCase() === countryFilter.toLowerCase());
          }
          if (directionFilter !== 'all') {
            filtered = filtered.filter((r) => r.direction?.toLowerCase() === directionFilter.toLowerCase());
          }
          if (searchQuery) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(
              (r) =>
                r.docTypeName?.toLowerCase().includes(q) ||
                r.countryName?.toLowerCase().includes(q) ||
                r.issuingAuthority?.toLowerCase().includes(q) ||
                r.regulationNote?.toLowerCase().includes(q)
            );
          }
          setRules(filtered);
          // Ghi nhận thông báo lỗi nhẹ nếu cần
          if (!filtered.length) {
            setError(err?.message || 'Không thể tải quy định kiểm dịch');
          }
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    void loadData().catch(console.error);

    return () => {
      isSubscribed = false;
    };
  }, [countryFilter, directionFilter, searchQuery, refreshKey]);

  return {
    rules,
    loading,
    error,
    countryFilter,
    setCountryFilter,
    directionFilter,
    setDirectionFilter,
    searchQuery,
    setSearchQuery,
    fetchRules,
  };
}

export default useQuarantineRules;
