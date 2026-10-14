import { http, HttpResponse } from 'msw';
import driverMissionsData from '../data/driverMissionsData.json';
import driverCompletionData from '../data/driverCompletionData.json';
import { getStoredRoutePlans } from '../../utils/routePlanStorage';

// In-memory clone dữ liệu chuyến đi phục vụ thao tác của tài xế (gộp chuyến hoàn tất TRP-8821)
let baseMissions = JSON.parse(JSON.stringify([...driverMissionsData, ...driverCompletionData]));

/**
 * Lấy toàn bộ danh sách chuyến đi, kết hợp các Route Plan đã được Manager phê duyệt (ASSIGNED)
 */
function getAllMissions() {
  const isCleanMode = typeof window !== 'undefined' && localStorage.getItem('racehorse_clean_data_mode') === 'true';
  const rawBase = isCleanMode ? [] : [...baseMissions];

  // Lấy các kế hoạch đã được Manager phê duyệt (ASSIGNED)
  const storedPlans = getStoredRoutePlans();
  const assignedPlans = storedPlans.filter((p) => p.status === 'ASSIGNED');

  const planMissions = assignedPlans
    .map((plan) => {
      const tripId = plan.tripId || Number(plan.planId) || 8800 + (Number(String(plan.planCode || '').replace(/\D/g, '')) || 1);
      const existing = rawBase.find((m) => String(m.tripId) === String(tripId) || m.planCode === plan.planCode);
      if (existing) return null;

      return {
        tripId,
        tripCode: `TRP-${String(plan.planCode || '').replace('#', '')}`,
        planCode: plan.planCode,
        bookingCode: plan.orderCode || plan.bookingCode,
        customerId: plan.customerId || plan.orderId || 5,
        customerName: plan.customerName || 'Khách hàng',
        customerEmail: plan.customerEmail || 'customer@test.com',
        customerPhone: plan.customerPhone || '+84988111222',
        driverId: plan.driverId || 4,
        driverName: plan.driverName || 'Phạm Văn Đức',
        vetEscortId: plan.vetEscortId || 2,
        vetEscortName: plan.vetEscortName || 'Dr. Elena Rostova',
        overallStatus: 'Scheduled',
        origin: plan.origin,
        originAddress: plan.origin,
        destination: plan.destination,
        destinationAddress: plan.destination,
        plannedStartDate: plan.departureDate,
        estimatedArrivalDate: plan.deliveryDate,
        horses: Array.isArray(plan.horses)
          ? plan.horses.map((h, i) => (typeof h === 'string' ? { horseId: i + 1, name: h, breed: 'Thoroughbred' } : h))
          : [{ horseId: 1, name: 'Ngựa đua' }],
        totalHorses: plan.totalHorses || (plan.horses?.length || 1),
        vehicle: {
          id: plan.vehicleId || 'VAN-51D-8921',
          name: plan.vehicleName || 'Mercedes Actros #51D-8921',
          plateNumber: plan.vehicleId || '51D-8921',
          type: plan.transportMode || 'Ground',
        },
        preDepartureChecklist: [
          { id: 'CHK-01', text: 'Kiểm tra thông gió & điều hòa HVAC', checked: false },
          { id: 'CHK-02', text: 'Cấp đủ nước uống & cỏ khô cho ngựa', checked: false },
          { id: 'CHK-03', text: 'Kiểm tra dây đai an toàn & vách ngăn stall', checked: false },
          { id: 'CHK-04', text: 'Đối soát vi mạch và hộ chiếu ngựa', checked: false },
        ],
        checkpoints: Array.isArray(plan.checkpoints) ? plan.checkpoints : [],
      };
    })
    .filter(Boolean);

  return [...planMissions, ...rawBase];
}

/**
 * Tìm chuyến đi theo ID hoặc mã chuyến
 * @param {string|number} idOrCode
 */
function findTrip(idOrCode) {
  return getAllMissions().find(
    (m) => String(m.tripId) === String(idOrCode) || String(m.tripCode) === String(idOrCode)
  );
}

export const driverHandlers = [
  // 1. Lấy danh sách nhiệm vụ của tài xế (/api/driver/missions hoặc /api/trips)
  http.get('/api/driver/missions', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let filtered = getAllMissions();
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
    const customerId = url.searchParams.get('customerId');
    const customerEmail = url.searchParams.get('customerEmail');

    const authHeader = request.headers.get('Authorization') || '';
    let tokenUserId = null;
    if (authHeader.startsWith('Bearer mock-token-')) {
      tokenUserId = Number(authHeader.replace('Bearer mock-token-', ''));
    } else if (authHeader.startsWith('Bearer mock-google-token-')) {
      tokenUserId = Number(authHeader.replace('Bearer mock-google-token-', ''));
    }

    let filtered = getAllMissions();
    if (status && status !== 'All') {
      filtered = filtered.filter((m) => m.overallStatus === status);
    }
    if (customerId) {
      filtered = filtered.filter((m) => Number(m.customerId) === Number(customerId));
    } else if (customerEmail) {
      filtered = filtered.filter((m) => (m.customerEmail || '').toLowerCase() === customerEmail.toLowerCase());
    } else if (tokenUserId && tokenUserId > 4) {
      filtered = filtered.filter((m) => Number(m.customerId) === tokenUserId);
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
    for (const trip of getAllMissions()) {
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

    for (const trip of getAllMissions()) {
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
    for (const trip of getAllMissions()) {
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

  // 10. Báo cáo hoàn tất ca trực / Bàn giao xe (Driver Shift Closeout - Frame 193:1599)
  http.get('/api/trips/:id/completion-report', ({ params }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: trip.completionReport || {
        reportId: `CR-${trip.tripId}`,
        totalKm: '10,480 KM',
        transitDuration: '54h 15m',
        careLogsCount: `${(trip.welfareLogs || []).length} / ${(trip.welfareLogs || []).length || 4} (100% Equine Safety)`,
        disinfectionStatus: 'Completed (Ozone High-Pressure)',
        gpsEquipmentReturned: true,
        driverDutyHours: '28.5 Hours (Compliant with Rest Regulations)',
        transmittedTo: trip.coordinatorName || 'Lê Nguyên Vũ (Operations Manager)',
        transmittedAt: trip.actualEndDate || new Date().toISOString(),
        status: 'DeliveredPendingAudit',
        attachedDocuments: [
          {
            id: 'doc-1',
            name: 'Signed e-POD Handover Certificate',
            fileCode: `ePOD-${trip.tripId}-FINAL.pdf`,
            size: '2.4 MB',
            type: 'application/pdf',
            signedBy: 'Dr. Michael Evans & Tran Hoang Nam',
          },
          {
            id: 'doc-2',
            name: 'Equine Hospital / Quarantine Discharge Report',
            fileCode: `QUARANTINE-CLEARANCE-${trip.tripId}.pdf`,
            size: '1.8 MB',
            type: 'application/pdf',
            signedBy: 'Customs Animal Quarantine Bureau',
          },
          {
            id: 'doc-3',
            name: 'Layover Fuel & Special Handling Receipts',
            fileCode: `EXPENSE-PACKET-${trip.tripId}.pdf`,
            size: '3.1 MB',
            type: 'application/pdf',
            signedBy: 'Highway Rest Station & Toll Services',
          },
        ],
      },
    });
  }),

  http.post('/api/trips/:id/completion-report', async ({ params, request }) => {
    const trip = findTrip(params.id);
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Không tìm thấy chuyến đi' }, { status: 404 });
    }
    const body = await request.json();
    trip.completionReport = {
      ...(trip.completionReport || {}),
      ...body,
      transmittedAt: new Date().toISOString(),
      status: 'DeliveredPendingAudit',
    };
    return HttpResponse.json({
      success: true,
      message: 'Đã nộp báo cáo tổng kết chuyến đi lên Quản lý vận hành thành công',
      data: trip.completionReport,
    });
  }),
];

export default driverHandlers;
