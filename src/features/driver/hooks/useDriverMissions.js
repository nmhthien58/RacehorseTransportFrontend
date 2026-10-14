import { useState, useEffect, useCallback } from 'react';
import driverService from '../services/driverService';

/**
 * Hook lấy danh sách nhiệm vụ / chuyến đi cho Role Driver
 * @param {Object} [initialParams]
 * @returns {Object}
 */
export function useDriverMissions(initialParams = {}) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState(initialParams.status || 'All');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          status: filterStatus === 'All' ? undefined : filterStatus,
        };
        const res = await driverService.getMissions(params);
        if (isSubscribed) {
          const list = res?.data || (Array.isArray(res) ? res : []);
          setMissions(list);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err?.message || 'Không thể tải danh sách chuyến đi của tài xế');
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
  }, [filterStatus, refreshKey]);

  return {
    missions,
    loading,
    error,
    filterStatus,
    setFilterStatus,
    refresh,
  };
}

/**
 * Hook quản lý chi tiết một nhiệm vụ và các thao tác cập nhật lộ trình của Driver
 * @param {number|string} tripId - ID của chuyến đi
 * @returns {Object}
 */
export function useMissionDetail(tripId) {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMission = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    async function loadDetail() {
      if (!tripId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await driverService.getMissionById(tripId);
        if (isSubscribed) {
          setMission(res?.data || res);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err?.message || 'Không thể tải chi tiết nhiệm vụ');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    void loadDetail().catch(console.error);

    return () => {
      isSubscribed = false;
    };
  }, [tripId, refreshKey]);

  /**
   * Cập nhật một mục trong Pre-departure checklist
   * @param {string} itemId
   * @param {boolean} checked
   * @param {string} [notes]
   */
  const toggleChecklistItem = async (itemId, checked, notes) => {
    setActionLoading(true);
    try {
      await driverService.updateMission(tripId, {
        checklistItem: { itemId, checked, notes },
      });
      fetchMission();
      return true;
    } catch (err) {
      setError(err?.message || 'Không thể cập nhật danh mục kiểm tra');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Bắt đầu chuyến đi (Start Trip)
   */
  const startTrip = async () => {
    setActionLoading(true);
    try {
      await driverService.startMission(tripId);
      fetchMission();
      return true;
    } catch (err) {
      setError(err?.message || 'Không thể bắt đầu chuyến đi');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Check-in Arrive tại một mốc kiểm soát
   * @param {number|string} checkpointId
   */
  const arriveCheckpoint = async (checkpointId) => {
    setActionLoading(true);
    try {
      await driverService.arriveCheckpoint(checkpointId);
      fetchMission();
      return true;
    } catch (err) {
      setError(err?.message || 'Không thể check-in đến trạm');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Check-in Clear tại một mốc kiểm soát
   * @param {number|string} checkpointId
   * @param {{ clearanceNumber?: string, odometerReading?: number, notes?: string }} payload
   */
  const clearCheckpoint = async (checkpointId, payload) => {
    setActionLoading(true);
    try {
      await driverService.clearCheckpoint(checkpointId, payload);
      fetchMission();
      return true;
    } catch (err) {
      setError(err?.message || 'Không thể hoàn tất kiểm tra trạm');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Check-in Depart rời một mốc kiểm soát
   * @param {number|string} checkpointId
   */
  const departCheckpoint = async (checkpointId) => {
    setActionLoading(true);
    try {
      await driverService.departCheckpoint(checkpointId);
      fetchMission();
      return true;
    } catch (err) {
      setError(err?.message || 'Không thể cập nhật rời trạm');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Thêm nhật ký thể trạng và phúc lợi ngựa
   * @param {Object} logData
   */
  const addWelfareLog = async (logData) => {
    setActionLoading(true);
    try {
      await driverService.createWelfareLog(tripId, logData);
      fetchMission();
      return true;
    } catch (err) {
      setError(err?.message || 'Không thể ghi nhận nhật ký chăm sóc');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Báo cáo sự cố khẩn cấp trên lộ trình (SOS)
   * @param {Object} incidentData
   */
  const reportIncident = async (incidentData) => {
    setActionLoading(true);
    try {
      await driverService.reportIncident(tripId, incidentData);
      fetchMission();
      return true;
    } catch (err) {
      setError(err?.message || 'Không thể gửi báo cáo khẩn cấp');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Lập biên bản bàn giao e-POD có chữ ký người nhận
   * @param {Object} handoverData
   */
  const submitArrivalPod = async (handoverData) => {
    setActionLoading(true);
    try {
      await driverService.submitHandover(tripId, handoverData);
      fetchMission();
      return true;
    } catch (err) {
      setError(err?.message || 'Không thể nộp biên bản nghiệm thu bàn giao');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    mission,
    loading,
    actionLoading,
    error,
    fetchMission,
    toggleChecklistItem,
    startTrip,
    arriveCheckpoint,
    clearCheckpoint,
    departCheckpoint,
    addWelfareLog,
    reportIncident,
    submitArrivalPod,
  };
}

export default useDriverMissions;
