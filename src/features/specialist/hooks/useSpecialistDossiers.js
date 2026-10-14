import { useState, useEffect, useCallback } from 'react';
import specialistDossierService from '../services/specialistDossierService';

/**
 * Hook quản lý danh sách hồ sơ kiểm dịch và thống kê cho Transport Specialist
 * @param {Object} [initialParams]
 * @returns {Object}
 */
export function useSpecialistDossiers(initialParams = {}) {
  const [dossiers, setDossiers] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [filterStatus, setFilterStatus] = useState(initialParams.status || 'All');
  const [searchQuery, setSearchQuery] = useState(initialParams.search || '');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDossiers = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const data = await specialistDossierService.getOverview();
      setOverview(data);
    } catch (err) {
      setError(err?.message || 'Không thể tải số liệu tổng quan');
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      try {
        const params = {
          status: filterStatus === 'All' ? undefined : filterStatus,
          search: searchQuery ? searchQuery.trim() : undefined,
          page: pagination.page,
          pageSize: pagination.pageSize,
        };
        const res = await specialistDossierService.getDossiers(params);
        if (isSubscribed) {
          const items = res?.data || (Array.isArray(res) ? res : []);
          setDossiers(items);
          if (res?.pagination) {
            setPagination((prev) => ({
              ...prev,
              total: res.pagination.totalItems || res.total || items.length,
            }));
          } else {
            setPagination((prev) => ({ ...prev, total: items.length }));
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err?.message || 'Không thể tải danh sách hồ sơ kiểm dịch');
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
  }, [filterStatus, searchQuery, pagination.page, pagination.pageSize, refreshKey]);

  return {
    dossiers,
    overview,
    loading,
    error,
    pagination,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    setPagination,
    fetchDossiers,
    fetchOverview,
  };
}

export default useSpecialistDossiers;
