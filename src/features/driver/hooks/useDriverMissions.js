import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import driverService from '../services/driverService';
import { unwrapData, unwrapList, getErrorMessage } from '@utils/apiHelpers';

/**
 * Chuẩn hóa chi tiết chuyến (GET /trips/{id}) sang các trường mà màn hình tài xế đang dùng.
 * Giữ nguyên mọi trường gốc của backend, chỉ bổ sung trường suy ra.
 * @param {Object} trip - Chi tiết chuyến từ backend
 * @param {Array<Object>} [welfareLogs] - GET /trips/{id}/welfare-logs
 * @returns {Object}
 */
export function normalizeMission(trip, welfareLogs) {
  if (!trip) return trip;
  const checkpoints = [...(trip.checkpoints || [])]
    .filter((c) => c.isActive !== false)
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const bookings = trip.bookings || [];
  const firstBooking = bookings[0] || {};
  const origin = checkpoints.find((c) => c.checkpointType === 'Origin');
  const destination = [...checkpoints].reverse().find((c) => c.checkpointType === 'Destination');

  return {
    ...trip,
    transportMode: trip.vehicleType === 'AirStall' ? 'Air' : 'Ground',
    vehicleName: trip.vehicleType,
    origin: origin?.address || firstBooking.pickupAddress || '',
    destination: destination?.address || firstBooking.dropoffAddress || '',
    bookingCode: bookings.map((b) => b.bookingCode).join(', '),
    customerName: bookings.map((b) => b.customerName).join(', '),
    customerPhone: firstBooking.customerPhone || '',
    coordinatorName: trip.plannedByName,
    horses: (trip.horses || []).map((h) => ({ ...h, id: h.horseId, name: h.horseName })),
    // Tên trường cũ của màn hình lộ trình
    routeCheckpoints: checkpoints.map((c) => ({
      ...c,
      orderIndex: c.sequenceOrder,
      locationName: c.checkpointName,
      locationType: c.checkpointType,
      plannedArrivalTime: c.plannedTime,
    })),
    welfareLogs: (welfareLogs || trip.welfareLogs || []).map((log) => ({
      ...log,
      timestamp: log.loggedAt,
      loggedBy: log.recordedByName,
    })),
  };
}

/**
 * Hook lấy danh sách nhiệm vụ / chuyến đi của tài xế, áp tải đang đăng nhập
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
      try {
        const params = {
          status: filterStatus === 'All' ? undefined : filterStatus,
        };
        const list = unwrapList(await driverService.getMissions(params));
        // Danh sách chỉ có tóm tắt -> tải chi tiết từng chuyến (ngựa, lộ trình, các đơn)
        const details = await Promise.all(
          list.map((trip) =>
            driverService
              .getMissionById(trip.tripId)
              .then((res) => normalizeMission(unwrapData(res)))
              .catch(() => normalizeMission(trip)),
          ),
        );
        if (isSubscribed) {
          setMissions(details);
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(getErrorMessage(err, 'Không thể tải danh sách chuyến đi của tài xế'));
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadData();

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
 * Hook quản lý chi tiết một nhiệm vụ và các thao tác cập nhật lộ trình của đoàn xe
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
      try {
        const [tripRes, logsRes] = await Promise.all([
          driverService.getMissionById(tripId),
          driverService.getWelfareLogs(tripId).catch(() => null),
        ]);
        if (isSubscribed) {
          setMission(normalizeMission(unwrapData(tripRes), unwrapList(logsRes)));
          setError(null);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(getErrorMessage(err, 'Không thể tải chi tiết nhiệm vụ'));
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isSubscribed = false;
    };
  }, [tripId, refreshKey]);

  /**
   * Chạy một thao tác ghi; các API xuất phát / check-in trả về chi tiết chuyến mới nhất.
   * @param {() => Promise<any>} call
   * @param {string} fallbackError
   * @returns {Promise<boolean>}
   */
  const runAction = async (call, fallbackError) => {
    setActionLoading(true);
    try {
      const detail = unwrapData(await call());
      if (detail?.tripId) {
        setMission((prev) => normalizeMission(detail, prev?.welfareLogs));
      } else {
        fetchMission();
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
   * Danh mục kiểm tra trước khởi hành: backend chưa có API lưu checklist,
   * trạng thái tick được giữ ở màn hình (PreDepartureChecklistPage).
   * @returns {Promise<boolean>}
   */
  const toggleChecklistItem = async () => true;

  /** Xuất phát (POST /trips/{id}/start) — backend chặn nếu còn hồ sơ chưa Cleared */
  const startTrip = () => runAction(() => driverService.startMission(tripId), 'Không thể bắt đầu chuyến đi');

  /** Đã tới mốc (POST /checkpoints/{id}/arrive) */
  const arriveCheckpoint = (checkpointId) =>
    runAction(() => driverService.arriveCheckpoint(checkpointId), 'Không thể check-in đến trạm');

  /** Đã thông quan tại cửa khẩu (POST /checkpoints/{id}/clear), không cần body */
  const clearCheckpoint = (checkpointId) =>
    runAction(() => driverService.clearCheckpoint(checkpointId), 'Không thể hoàn tất kiểm tra trạm');

  /** Rời mốc (POST /checkpoints/{id}/depart) */
  const departCheckpoint = (checkpointId) =>
    runAction(() => driverService.departCheckpoint(checkpointId), 'Không thể cập nhật rời trạm');

  /**
   * Ghi nhật ký thể trạng một con ngựa (multipart)
   * @param {Object} logData - xem driverService.createWelfareLog
   */
  const addWelfareLog = async (logData) => {
    setActionLoading(true);
    try {
      await driverService.createWelfareLog(tripId, logData);
      fetchMission();
      setError(null);
      return true;
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể ghi nhận nhật ký chăm sóc'));
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
      // Modal báo sự cố vẫn mở nên báo lỗi bằng toast để người dùng thấy ngay
      message.error(getErrorMessage(err, 'Không thể gửi báo cáo sự cố'));
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
      message.error(getErrorMessage(err, 'Không thể lập biên bản bàn giao'));
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
