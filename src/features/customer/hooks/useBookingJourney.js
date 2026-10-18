import { useState, useEffect, useCallback } from 'react';
import trackingService from '@services/trackingService';
import { unwrapData } from '@utils/apiHelpers';
import { toCustomerTrip } from '@features/customer/hooks/useCustomerTrips';

/**
 * Hành trình của một đơn (R-07): GET /tracking/bookings/{id}, mỗi chuyến chở ngựa của đơn ở dạng dùng chung với màn theo dõi.
 * @param {number|string|null} bookingId
 * @param {{ enabled?: boolean, pollMs?: number }} [options] - enabled = false thì không gọi API (đơn chưa duyệt)
 * @returns {{ trips: Array<Object>, awaitingPlanning: Array<string>, loading: boolean, lastLoadedAt: Date|null, refetch: () => void }}
 */
export function useBookingJourney(bookingId, { enabled = true, pollMs = 0 } = {}) {
  const [trips, setTrips] = useState([]);
  const [awaitingPlanning, setAwaitingPlanning] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => setRefreshIndex((prev) => prev + 1), []);

  useEffect(() => {
    if (!bookingId || !enabled) return undefined;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const tracking = unwrapData(await trackingService.getBookingTracking(bookingId));
        if (!active || !tracking) return;
        const list = (tracking.trips || []).map((trip) => toCustomerTrip(tracking, trip));
        // Chuyến mới nhất (theo giờ khởi hành dự kiến) lên đầu
        list.sort((a, b) => new Date(b.plannedStartDate) - new Date(a.plannedStartDate));
        setTrips(list);
        setAwaitingPlanning(tracking.horsesAwaitingPlanning || []);
        setLastLoadedAt(new Date());
      } catch {
        if (active) setTrips([]);
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
  }, [bookingId, enabled, pollMs, refreshIndex]);

  return { trips, awaitingPlanning, loading, lastLoadedAt, refetch };
}

export default useBookingJourney;
