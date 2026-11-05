import { useState, useEffect, useCallback, useMemo } from 'react';
import specialistDossierService from '../services/specialistDossierService';
import countryService from '@services/countryService';
import { unwrapList, getErrorMessage } from '@utils/apiHelpers';

/**
 * Hook tra cứu quy định giấy tờ theo quốc gia (GET /api/country-doc-requirements)
 * Lọc quốc gia / chiều ở backend, tìm theo từ khóa ở client.
 * @param {Object} [initialFilters]
 * @returns {Object}
 */
export function useQuarantineRules(initialFilters = {}) {
  const [result, setResult] = useState({ key: null, items: [], error: null });
  const [countries, setCountries] = useState([]);
  const [countryFilter, setCountryFilter] = useState(initialFilters.countryCode || 'all');
  const [directionFilter, setDirectionFilter] = useState(initialFilters.direction || 'all');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchRules = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Danh mục quốc gia để hiện tên nước và làm ô lọc
  useEffect(() => {
    countryService
      .getCatalog()
      .then((res) => setCountries(unwrapList(res)))
      .catch(() => setCountries([]));
  }, []);

  const requestKey = `${countryFilter}|${directionFilter}|${refreshKey}`;

  useEffect(() => {
    let isSubscribed = true;
    specialistDossierService
      .getQuarantineRules({
        countryCode: countryFilter !== 'all' ? countryFilter : undefined,
        direction: directionFilter !== 'all' ? directionFilter : undefined,
      })
      .then((items) => {
        if (isSubscribed) setResult({ key: requestKey, items, error: null });
      })
      .catch((err) => {
        if (isSubscribed) {
          setResult({ key: requestKey, items: [], error: getErrorMessage(err, 'Không thể tải quy định giấy tờ') });
        }
      });
    return () => {
      isSubscribed = false;
    };
  }, [countryFilter, directionFilter, refreshKey, requestKey]);

  const loading = result.key !== requestKey;
  const error = result.error;

  const rules = useMemo(() => {
    const nameOf = (code) => {
      const c = countries.find((x) => x.countryCode === code);
      return c ? c.nameVi || c.nameEn : code;
    };
    const q = searchQuery.trim().toLowerCase();
    const withNames = result.items.map((r) => ({ ...r, countryName: nameOf(r.countryCode) }));
    if (!q) return withNames;
    return withNames.filter(
      (r) =>
        r.docTypeName?.toLowerCase().includes(q) ||
        r.docTypeCode?.toLowerCase().includes(q) ||
        r.countryName?.toLowerCase().includes(q) ||
        r.regulationNote?.toLowerCase().includes(q)
    );
  }, [result.items, countries, searchQuery]);

  return {
    rules,
    countries,
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
