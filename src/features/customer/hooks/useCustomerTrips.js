import { useState, useEffect, useCallback } from 'react';
import bookingService from '@services/bookingService';
import trackingService from '@services/trackingService';
import { unwrapData, unwrapList } from '@utils/apiHelpers';

/**
 * Gộp một chuyến trong GET /tracking/bookings/{id} với thông tin đơn chứa nó.
 * Giữ nguyên field backend trả về, chỉ thêm thông tin đơn và sắp xếp sẵn mốc / nhật ký.
 * @param {Object} tracking - Dữ liệu theo dõi của một đơn
 * @param {Object} trip - Một phần tử trong tracking.trips
 * @returns {Object}
 */
export function toCustomerTrip(tracking, trip) {
  const checkpoints = [...(trip.checkpoints || [])].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const activeCheckpoints = checkpoints.filter((c) => c.status !== 'Cancelled');
  const horses = (trip.horses || []).map((h) => ({
    ...h,
    // Backend trả nhật ký mới nhất trước; sắp lại cho chắc
    logs: [...(h.logs || [])].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt)),
  }));
  return {
    ...trip,
    bookingId: tracking.bookingId,
    bookingCode: tracking.bookingCode,
    pickupAddress: tracking.pickupAddress || '',
    dropoffAddress: tracking.dropoffAddress || '',
    checkpoints,
    horses,
    checkpointsTotal: activeCheckpoints.length,
    checkpointsReached: activeCheckpoints.filter((c) => c.actualArrivalTime).length,
    logCount: horses.reduce((sum, h) => sum + h.logs.length, 0),
    alertCount: horses.reduce((sum, h) => sum + h.logs.filter((l) => l.needsAttention).length, 0),
  };
}

/**
 * Tải toàn bộ chuyến chở ngựa của khách đang đăng nhập:
 * GET /bookings, rồi GET /tracking/bookings/{id} cho các đơn đã duyệt hoặc đã xong.
 * @param {{ pollMs?: number }} [options] - pollMs > 0 thì tự làm mới định kỳ
 * @returns {{ trips: Array<Object>, awaitingPlanning: Array<string>, loading: boolean, error: any, lastLoadedAt: Date|null, refetch: () => void }}
 */
export function useCustomerTrips({ pollMs = 0 } = {}) {
  const [trips, setTrips] = useState([]);
  const [awaitingPlanning, setAwaitingPlanning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => setRefreshIndex((prev) => prev + 1), []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const bookings = unwrapList(await bookingService.getBookings({ size: 100, sort: '-createdAt' }));
        const tracked = bookings.filter((b) => b.status === 'Approved' || b.status === 'Completed');
        const results = await Promise.all(
          tracked.map((b) =>
            trackingService
              .getBookingTracking(b.bookingId)
              .then((res) => unwrapData(res))
              .catch(() => null),
          ),
        );
        if (!active) return;
        const list = [];
        const waiting = [];
        results.filter(Boolean).forEach((tracking) => {
          (tracking.trips || []).forEach((trip) => list.push(toCustomerTrip(tracking, trip)));
          (tracking.horsesAwaitingPlanning || []).forEach((name) => waiting.push(`${name} (${tracking.bookingCode})`));
        });
        // Chuyến mới nhất (theo giờ khởi hành dự kiến) lên đầu
        list.sort((a, b) => new Date(b.plannedStartDate) - new Date(a.plannedStartDate));
        setTrips(list);
        setAwaitingPlanning(waiting);
        setLastLoadedAt(new Date());
        setError(null);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = pollMs > 0 ? setInterval(load, pollMs) : null;
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [pollMs, refreshIndex]);

  return { trips, awaitingPlanning, loading, error, lastLoadedAt, refetch };
}

export default useCustomerTrips;
