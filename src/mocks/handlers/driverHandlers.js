import { http, HttpResponse } from 'msw';
import driverMissionsData from '../data/driverMissionsData.json';

// In-memory clone dữ liệu chuyến đi phục vụ thao tác của tài xế
let missions = JSON.parse(JSON.stringify(driverMissionsData));

/**
 * Tìm chuyến đi theo ID hoặc mã chuyến
 * @param {string|number} idOrCode
 */
function findTrip(idOrCode) {
  return missions.find(
    (m) => String(m.tripId) === String(idOrCode) || String(m.tripCode) === String(idOrCode)
  );
}

export const driverHandlers = [
  // 1. Lấy danh sách nhiệm vụ của tài xế (/api/driver/missions hoặc /api/trips)
  http.get('/api/driver/missions', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let filtered = [...missions];
    if (status && status !== 'All') {
      filtered = filtered.filter((m) => m.overallStatus === status);
    }
    return HttpResponse.json({
      success: true,
      data: filtered,
    });
  }),

  // Fallback endpoint chuẩn /api/trips nếu service dùng ENDPOINTS.TRIPS.LIST
  http.get('/api/trips', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let filtered = [...missions];
    if (status && status !== 'All') {
      filtered = filtered.filter((m) => m.overallStatus === status);
    }
    return HttpResponse.json({
      success: true,
      data: filtered,
    });
  }),

  // 2. Chi tiết chuyến đi theo ID
  http.get('/api/driver/missions/:id', ({ params }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: trip });
  }),

  http.get('/api/trips/:id', ({ params }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: trip });
  }),

  // 3. Checklist trước khởi hành
  http.get('/api/trips/:id/checklist', ({ params }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: {
        tripId: trip.tripId,
        tripCode: trip.tripCode,
        checklist: trip.preDepartureChecklist || [],
      },
    });
  }),

  // Cập nhật chuyến đi (preDepartureChecklist hoặc các trường khác theo ENDPOINTS.TRIPS.UPDATE)
  http.put('/api/trips/:id', async ({ params, request }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    const body = await request.json();
    if (body.checklistItem) {
      const { itemId, checked, notes } = body.checklistItem;
      const item = (trip.preDepartureChecklist || []).find((i) => i.id === itemId);
      if (item) {
        item.checked = !!checked;
        item.checkedAt = checked ? new Date().toISOString() : null;
        if (notes !== undefined) item.notes = notes;
      }
    } else if (Array.isArray(body.preDepartureChecklist)) {
      trip.preDepartureChecklist = body.preDepartureChecklist;
    } else {
      Object.assign(trip, body);
    }
    return HttpResponse.json({
      success: true,
      data: trip,
    });
  }),

  // Cập nhật trạng thái checklist item
  http.put('/api/trips/:id/checklist', async ({ params, request }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    const body = await request.json();
    const { itemId, checked, notes } = body;

    if (trip.preDepartureChecklist) {
      const item = trip.preDepartureChecklist.find((i) => i.id === itemId);
      if (item) {
        item.checked = !!checked;
        item.checkedAt = checked ? new Date().toISOString() : null;
        if (notes !== undefined) item.notes = notes;
      }
    }

    const mandatoryItems = (trip.preDepartureChecklist || []).filter((i) => i.isMandatory);
    const completedMandatory = mandatoryItems.filter((i) => i.checked);
    const isAllMandatoryDone = completedMandatory.length === mandatoryItems.length;

    return HttpResponse.json({
      success: true,
      data: {
        checklist: trip.preDepartureChecklist,
        isReadyToStart: isAllMandatoryDone,
        completedCount: (trip.preDepartureChecklist || []).filter((i) => i.checked).length,
        totalCount: (trip.preDepartureChecklist || []).length,
      },
    });
  }),

  // Batch toggle checklist items
  http.post('/api/trips/:id/checklist/batch', async ({ params, request }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    const { items } = await request.json();
    if (Array.isArray(items) && trip.preDepartureChecklist) {
      items.forEach((update) => {
        const target = trip.preDepartureChecklist.find((i) => i.id === update.id);
        if (target) {
          target.checked = update.checked;
          target.checkedAt = update.checked ? new Date().toISOString() : null;
        }
      });
    }
    return HttpResponse.json({
      success: true,
      data: trip.preDepartureChecklist,
    });
  }),

  // 4. Bắt đầu chuyến đi (Start Trip)
  http.post('/api/trips/:id/start', ({ params }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    trip.overallStatus = 'InTransit';
    trip.actualStartDate = trip.actualStartDate || new Date().toISOString();

    // Tự động khởi động checkpoint đầu tiên nếu đang Pending
    if (trip.routeCheckpoints && trip.routeCheckpoints.length > 0) {
      const firstCp = trip.routeCheckpoints[0];
      if (firstCp.status === 'Pending') {
        firstCp.status = 'Arrived';
        firstCp.actualArrivalTime = new Date().toISOString();
      }
    }

    return HttpResponse.json({
      success: true,
      message: 'Chuyến xe đã chính thức xuất bến',
      data: trip,
    });
  }),

  // 5. Thao tác Trạm kiểm soát (Checkpoints)
  // Check-in Arrive
  http.post('/api/checkpoints/:id/arrive', ({ params }) => {
    const checkpointId = Number(params.id);
    for (const trip of missions) {
      const cp = (trip.routeCheckpoints || []).find((c) => c.checkpointId === checkpointId);
      if (cp) {
        cp.status = 'Arrived';
        cp.actualArrivalTime = new Date().toISOString();
        return HttpResponse.json({ success: true, data: cp });
      }
    }
    return HttpResponse.json({ success: false, message: 'Không tìm thấy trạm' }, { status: 404 });
  }),

  // Check-in Clear (hoàn tất thủ tục/kiểm tra)
  http.post('/api/checkpoints/:id/clear', async ({ params, request }) => {
    const checkpointId = Number(params.id);
    let payload;
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    for (const trip of missions) {
      const cp = (trip.routeCheckpoints || []).find((c) => c.checkpointId === checkpointId);
      if (cp) {
        cp.status = 'Cleared';
        if (payload.clearanceNumber) cp.clearanceNumber = payload.clearanceNumber;
        if (payload.odometerReading) cp.odometerReading = Number(payload.odometerReading);
        if (payload.notes) cp.notes = payload.notes;
        return HttpResponse.json({ success: true, data: cp });
      }
    }
    return HttpResponse.json({ success: false, message: 'Không tìm thấy trạm' }, { status: 404 });
  }),

  // Check-in Depart (rời trạm)
  http.post('/api/checkpoints/:id/depart', ({ params }) => {
    const checkpointId = Number(params.id);
    for (const trip of missions) {
      const cps = trip.routeCheckpoints || [];
      const cpIndex = cps.findIndex((c) => c.checkpointId === checkpointId);
      if (cpIndex !== -1) {
        const cp = cps[cpIndex];
        cp.status = 'Departed';
        cp.actualDepartureTime = new Date().toISOString();

        // Kích hoạt trạm tiếp theo nếu có
        if (cpIndex + 1 < cps.length) {
          const nextCp = cps[cpIndex + 1];
          if (nextCp.status === 'Pending') {
            nextCp.status = 'Pending';
          }
        } else {
          // Trạm cuối cùng -> cập nhật trip sang ArrivedDestination
          trip.overallStatus = 'ArrivedDestination';
        }

        return HttpResponse.json({ success: true, data: cp, tripStatus: trip.overallStatus });
      }
    }
    return HttpResponse.json({ success: false, message: 'Không tìm thấy trạm' }, { status: 404 });
  }),

  // 6. Nhật ký sinh trắc & phúc lợi ngựa (Welfare Logs)
  http.get('/api/trips/:id/welfare-logs', ({ params }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: trip.welfareLogs || [],
    });
  }),

  http.post('/api/trips/:id/welfare-logs', async ({ params, request }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    const logData = await request.json();
    const newLog = {
      logId: Date.now(),
      tripId: trip.tripId,
      timestamp: new Date().toISOString(),
      loggedBy: 'Phạm Văn Đức (Tài xế trưởng)',
      ...logData,
    };

    if (!trip.welfareLogs) trip.welfareLogs = [];
    trip.welfareLogs.unshift(newLog);

    return HttpResponse.json({
      success: true,
      message: 'Ghi nhật ký chăm sóc thành công',
      data: newLog,
    });
  }),

  // 7. Báo cáo khẩn cấp / Sự cố (Incidents)
  http.get('/api/trips/:id/incidents', ({ params }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: trip.incidents || [],
    });
  }),

  http.post('/api/trips/:id/incidents', async ({ params, request }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    const body = await request.json();
    const newIncident = {
      incidentId: Date.now(),
      reportedAt: new Date().toISOString(),
      status: 'Reported',
      tripId: trip.tripId,
      tripCode: trip.tripCode,
      ...body,
    };

    if (!trip.incidents) trip.incidents = [];
    trip.incidents.unshift(newIncident);

    // Nếu sự cố nghiêm trọng, chuyển trạng thái chuyến
    if (['RerouteRequired', 'Accident', 'HorseHealthCritical'].includes(body.incidentType)) {
      trip.overallStatus = 'EmergencyRerouting';
    }

    return HttpResponse.json({
      success: true,
      message: 'Đã phát tín hiệu báo cáo khẩn cấp lên Trung tâm điều hành',
      data: newIncident,
    });
  }),

  // 8. Nghiệm thu bàn giao điểm đến & Chữ ký số e-POD (Arrival Handover)
  http.get('/api/trips/:id/handover', ({ params }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: trip.handover || null,
    });
  }),

  http.get('/api/trips/:id/handovers', ({ params }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: trip.handover ? [trip.handover] : [],
    });
  }),

  http.post('/api/trips/:id/handover', async ({ params, request }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    const body = await request.json();
    const handoverData = {
      acceptanceId: 501,
      tripId: trip.tripId,
      tripCode: trip.tripCode,
      arrivalConfirmedAt: new Date().toISOString(),
      ...body,
    };

    trip.handover = handoverData;
    trip.overallStatus = 'Completed';
    trip.actualEndDate = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      message: 'Hoàn tất nghiệm thu bàn giao và ký xác nhận e-POD thành công',
      data: handoverData,
    });
  }),
];

export default driverHandlers;
