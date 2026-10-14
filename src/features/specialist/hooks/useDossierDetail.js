import { useState, useEffect, useCallback } from 'react';
import api from '@services/api';
import specialistDossierService from '../services/specialistDossierService';

/**
 * Hook quản lý chi tiết một bộ hồ sơ kiểm dịch và các thao tác thẩm định giấy tờ
 * @param {number|string} dossierId - ID của hồ sơ
 * @returns {Object}
 */
export function useDossierDetail(dossierId) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDossier = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Lắng nghe cập nhật khi khách hàng nộp hồ sơ hoặc mô phỏng phê duyệt
  useEffect(() => {
    const handleUpdate = () => {
      fetchDossier();
    };
    window.addEventListener('dossiers_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dossiers_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchDossier]);

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      try {
        const res = await specialistDossierService.getDossierById(dossierId);
        if (isSubscribed) {
          setDossier(res?.data || res);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err?.message || 'Không thể tải thông tin hồ sơ kiểm dịch');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    if (dossierId) {
      loadData();
    }

    return () => {
      isSubscribed = false;
    };
  }, [dossierId, refreshKey]);

  /**
   * Phê duyệt một tài liệu
   * @param {number|string} docId
   */
  const approveDocument = async (docId) => {
    setActionLoading(true);
    try {
      await specialistDossierService.approveDocument(docId);
      fetchDossier();
      return true;
    } catch (err) {
      setError(err?.message || 'Lỗi khi phê duyệt tài liệu');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Từ chối một tài liệu kèm lý do
   * @param {number|string} docId
   * @param {string} reason
   */
  const rejectDocument = async (docId, reason) => {
    setActionLoading(true);
    try {
      await specialistDossierService.rejectDocument(docId, { reason });
      fetchDossier();
      return true;
    } catch (err) {
      setError(err?.message || 'Lỗi khi từ chối tài liệu');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Yêu cầu khách hàng nộp bổ sung giấy tờ
   * @param {string|{ notes?: string, documentTypes?: string[] }} [payload]
   */
  const requestDocuments = async (payload) => {
    setActionLoading(true);
    try {
      const data = typeof payload === 'string' ? { notes: payload } : (payload || {});
      await specialistDossierService.requestDocuments(dossierId, data);
      fetchDossier();
      return true;
    } catch (err) {
      setError(err?.message || 'Lỗi khi gửi yêu cầu bổ sung tài liệu');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Nộp bộ hồ sơ đã hoàn chỉnh lên Cơ quan chức năng (Reviewing -> SubmittedToAuthorities)
   */
  const submitToAuthorities = async () => {
    setActionLoading(true);
    try {
      try {
        await api.post(`/dossiers/${dossierId}/submit`);
      } catch {
        await specialistDossierService.submitToAuthorities(dossierId);
      }
      setDossier((prev) =>
        prev
          ? {
              ...prev,
              status: 'SubmittedToAuthorities',
              issueReason: null,
            }
          : prev
      );
      return true;
    } catch (err) {
      setError(err?.message || 'Lỗi khi nộp hồ sơ lên cơ quan chức năng');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Xác nhận thông quan thành công (SubmittedToAuthorities -> Cleared)
   * @param {string} [clearanceNumber]
   */
  const clearDossier = async (clearanceNumber) => {
    setActionLoading(true);
    try {
      try {
        await api.post(`/dossiers/${dossierId}/approve`, { clearanceNumber });
      } catch {
        await specialistDossierService.clearDossier(dossierId, { clearanceNumber });
      }
      const finalNumber = clearanceNumber || `VET-CERT-${new Date().getFullYear()}-${String(dossierId).padStart(4, '0')}`;
      setDossier((prev) =>
        prev
          ? {
              ...prev,
              status: 'Cleared',
              clearanceNumber: finalNumber,
              clearedAt: new Date().toISOString(),
              issueReason: null,
            }
          : prev
      );
      return true;
    } catch (err) {
      setError(err?.message || 'Lỗi khi ghi nhận thông quan hồ sơ');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Nộp lại hồ sơ cho Cơ quan chức năng sau khi xử lý vướng mắc (Issue -> SubmittedToAuthorities)
   */
  const returnToAuthority = async () => {
    setActionLoading(true);
    try {
      try {
        await api.post(`/dossiers/${dossierId}/submit`);
      } catch {
        await specialistDossierService.submitToAuthorities(dossierId);
      }
      setDossier((prev) =>
        prev
          ? {
              ...prev,
              status: 'SubmittedToAuthorities',
              issueReason: null,
            }
          : prev
      );
      return true;
    } catch (err) {
      setError(err?.message || 'Lỗi khi nộp lại hồ sơ cho cơ quan chức năng');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Báo cáo sự cố hoặc vướng mắc hồ sơ (Issue)
   * @param {string} reason
   */
  const reportIssue = async (reason) => {
    setActionLoading(true);
    try {
      await specialistDossierService.reportIssue(dossierId, { reason });
      setDossier((prev) =>
        prev
          ? {
              ...prev,
              status: 'Issue',
              issueReason: reason,
            }
          : prev
      );
      return true;
    } catch (err) {
      setError(err?.message || 'Lỗi khi báo sự cố hồ sơ');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    dossier,
    loading,
    actionLoading,
    error,
    fetchDossier,
    approveDocument,
    rejectDocument,
    requestDocuments,
    submitToAuthorities,
    clearDossier,
    returnToAuthority,
    reportIssue,
  };
}

export default useDossierDetail;
