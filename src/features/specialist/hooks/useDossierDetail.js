import { useState, useEffect, useCallback } from 'react';
import specialistDossierService from '../services/specialistDossierService';
import { unwrapData, getErrorMessage } from '@utils/apiHelpers';

/**
 * Hook quản lý chi tiết một bộ hồ sơ kiểm dịch và các thao tác thẩm định giấy tờ.
 * Mọi API ghi của Flow 2 trả về chi tiết hồ sơ mới nhất -> dùng luôn response để cập nhật màn hình.
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

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      try {
        const res = await specialistDossierService.getDossierById(dossierId);
        if (isSubscribed) {
          setDossier(unwrapData(res));
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(getErrorMessage(err, 'Không thể tải thông tin hồ sơ kiểm dịch'));
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
   * Chạy một thao tác ghi, cập nhật hồ sơ từ response và trả về true/false.
   * @param {() => Promise<any>} call
   * @param {string} fallbackError
   * @returns {Promise<boolean>}
   */
  const runAction = async (call, fallbackError) => {
    setActionLoading(true);
    try {
      const res = await call();
      const detail = unwrapData(res);
      if (detail && typeof detail === 'object' && detail.dossierId) {
        setDossier(detail);
      } else {
        fetchDossier();
      }
      setError(null);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, fallbackError));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Phê duyệt một giấy tờ (POST /documents/{id}/approve)
   * @param {number|string} docId
   */
  const approveDocument = (docId) =>
    runAction(() => specialistDossierService.approveDocument(docId), 'Lỗi khi phê duyệt tài liệu');

  /**
   * Từ chối một giấy tờ kèm hướng dẫn sửa (backend nhận trường correctionNote)
   * @param {number|string} docId
   * @param {string} reason
   */
  const rejectDocument = (docId, reason) =>
    runAction(
      () => specialistDossierService.rejectDocument(docId, { correctionNote: reason }),
      'Lỗi khi từ chối tài liệu',
    );

  /**
   * Yêu cầu khách nộp giấy tờ (Draft/Issue/Reviewing -> AwaitingDocs); backend nhận trường note
   * @param {string|{ note?: string, notes?: string, documentTypes?: string[] }} [payload]
   */
  const requestDocuments = (payload) => {
    // Backend không nhận danh sách loại giấy (checklist theo quy định nước đi/đến) -> ghi vào ghi chú cho khách
    const docTypes = Array.isArray(payload?.documentTypes) && payload.documentTypes.length > 0
      ? `Cần nộp: ${payload.documentTypes.join(', ')}`
      : '';
    const text = typeof payload === 'string' ? payload : payload?.note || payload?.notes;
    const note = [docTypes, text].filter(Boolean).join('. ');
    return runAction(
      () => specialistDossierService.requestDocuments(dossierId, { note: note?.slice(0, 500) || null }),
      'Lỗi khi gửi yêu cầu bổ sung tài liệu',
    );
  };

  /**
   * Nộp hồ sơ cho cơ quan chức năng (cần mọi giấy bắt buộc đã Approved)
   */
  const submitToAuthorities = () =>
    runAction(
      () => specialistDossierService.submitToAuthorities(dossierId),
      'Lỗi khi nộp hồ sơ lên cơ quan chức năng',
    );

  /**
   * Ghi nhận thông quan (SubmittedToAuthorities -> Cleared); số giấy thông quan là bắt buộc
   * @param {string} clearanceNumber
   */
  const clearDossier = (clearanceNumber) =>
    runAction(
      () => specialistDossierService.clearDossier(dossierId, { clearanceNumber: clearanceNumber?.trim() }),
      'Lỗi khi ghi nhận thông quan hồ sơ',
    );

  /**
   * Mở lại hồ sơ đang Issue: backend dùng request-documents để chuyển về AwaitingDocs cho khách nộp lại
   */
  const returnToAuthority = () =>
    runAction(
      () => specialistDossierService.requestDocuments(dossierId, { note: 'Hồ sơ được mở lại sau khi xử lý vướng mắc' }),
      'Lỗi khi mở lại hồ sơ',
    );

  /**
   * Báo hồ sơ có vấn đề (-> Issue)
   * @param {string} reason
   */
  const reportIssue = (reason) =>
    runAction(() => specialistDossierService.reportIssue(dossierId, { reason }), 'Lỗi khi báo sự cố hồ sơ');

  /**
   * Tải lên giấy công ty đã xin (R-19)
   * @param {FormData} formData
   */
  const uploadCompanyDocument = (formData) =>
    runAction(() => specialistDossierService.uploadDocument(dossierId, formData), 'Lỗi khi tải lên giấy tờ');

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
    uploadCompanyDocument,
  };
}

export default useDossierDetail;
