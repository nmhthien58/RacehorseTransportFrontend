import { http, HttpResponse } from 'msw';
import tripsData from '../data/trips.json';
import incidentsData from '../data/incidents.json';

let trips = [...tripsData];
let incidents = [...incidentsData];

export const tripHandlers = [
  // GET /api/trips
  http.get('/api/trips', () => {
    return HttpResponse.json({
      success: true,
      data: trips,
      total: trips.length,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: trips.length,
        totalPages: Math.ceil(trips.length / 10) || 1,
      },
    });
  }),

  // GET /api/trips/unplanned-horses
  http.get('/api/trips/unplanned-horses', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          bookingHorseId: 3,
          bookingId: 2,
          bookingCode: 'BKG-2026-0002',
          horseId: 1,
          horseName: 'Red Flash',
          microchipNumber: '982000412345671',
          dossierStatus: 'Cleared',
          transportMode: 'Ground',
        },
      ],
    });
  }),

  // GET /api/trips/available-vehicles
  http.get('/api/trips/available-vehicles', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          vehicleId: 1,
          vehicleCode: '29B-888.99',
          vehicleType: 'HorseTruck_AirSuspension',
          capacity: 6,
          status: 'Available',
        },
      ],
    });
  }),

  // GET /api/trips/available-crew
  http.get('/api/trips/available-crew', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { userId: 4, fullName: 'Phạm Văn Đức', role: 'Driver' },
        { userId: 9, fullName: 'Trần Thị Hoa', role: 'Escort' },
      ],
    });
  }),

  // GET /api/trips/:id
  http.get('/api/trips/:id', ({ params }) => {
    const trip = trips.find((t) => t.TripID === Number(params.id));
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Trip not found' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: trip,
      ...trip,
    });
  }),

  // POST /api/trips - Tạo chuyến
  http.post('/api/trips', async ({ request }) => {
    const body = await request.json();
    const newId = trips.length + 1;
    const newTrip = {
      TripID: newId,
      TripCode: `TRP-2026-${String(newId).padStart(4, '0')}`,
      OverallStatus: 'Draft',
      Status: 'Draft',
      ...body,
      CreatedAt: new Date().toISOString(),
    };
    trips.unshift(newTrip);
    return HttpResponse.json({
      success: true,
      message: 'Tạo bản nháp chuyến thành công',
      data: newTrip,
      ...newTrip,
    }, { status: 201 });
  }),

  // POST /api/trips/:id/start
  http.post('/api/trips/:id/start', ({ params }) => {
    const trip = trips.find((t) => t.TripID === Number(params.id));
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Trip not found' }, { status: 404 });
    }
    trip.OverallStatus = 'InTransit';
    trip.Status = 'InTransit';
    trip.ActualStartDate = new Date().toISOString();
    return HttpResponse.json({
      success: true,
      message: 'Chuyến xe đã xuất phát',
      data: trip,
      ...trip,
    });
  }),

  // POST /api/trips/:id/status
  http.post('/api/trips/:id/status', async ({ params, request }) => {
    const body = await request.json();
    const trip = trips.find((t) => t.TripID === Number(params.id));
    if (!trip) {
      return HttpResponse.json({ success: false, message: 'Trip not found' }, { status: 404 });
    }
    trip.OverallStatus = body.status;
    trip.Status = body.status;
    return HttpResponse.json({
      success: true,
      data: trip,
      ...trip,
    });
  }),

  // Tracking API
  http.get('/api/tracking/trips', () => {
    return HttpResponse.json({
      success: true,
      data: trips.map((t) => ({
        tripId: t.TripID,
        tripCode: t.TripCode,
        overallStatus: t.OverallStatus || t.Status,
        delayMinutes: 0,
      })),
    });
  }),

  http.get('/api/tracking/bookings/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        bookingId: Number(params.id),
        status: 'InTransit',
        trips: trips.slice(0, 1),
      },
    });
  }),

  // Checkpoints
  http.post('/api/checkpoints/:id/arrive', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Đã đến mốc checkpoint ${params.id}`,
    });
  }),

  http.post('/api/checkpoints/:id/clear', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Đã thông quan tại mốc checkpoint ${params.id}`,
    });
  }),

  http.post('/api/checkpoints/:id/depart', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Xe đã rời mốc checkpoint ${params.id}`,
    });
  }),

  // Welfare logs
  http.post('/api/trips/:id/welfare-logs', async () => {
    return HttpResponse.json({
      success: true,
      message: 'Ghi nhật ký thể trạng thành công',
      data: { logId: Date.now(), loggedAt: new Date().toISOString() },
    }, { status: 201 });
  }),

  http.get('/api/trips/:id/welfare-logs', () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  // Handover
  http.post('/api/trips/:tripId/handover', async () => {
    return HttpResponse.json({
      success: true,
      message: 'Lập biên bản bàn giao thành công',
      data: { handoverId: Date.now(), handoverDateTime: new Date().toISOString() },
    }, { status: 201 });
  }),

  // Summary Report
  http.get('/api/reports/summary', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalTrips: trips.length,
        completedTrips: trips.filter((t) => t.Status === 'Completed').length,
        onTimeRatePercent: 98.5,
        totalHorsesTransported: 45,
      },
    });
  }),

  // GET /api/incidents
  http.get('/api/incidents', () => {
    return HttpResponse.json({
      success: true,
      data: incidents,
      total: incidents.length,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: incidents.length,
        totalPages: Math.ceil(incidents.length / 10) || 1,
      },
    });
  }),

  // POST /api/incidents
  http.post('/api/incidents', async ({ request }) => {
    const body = await request.json();
    const newIncident = {
      IncidentID: incidents.length + 1,
      IncidentCode: `INC-2026-${String(incidents.length + 1).padStart(4, '0')}`,
      Severity: body.Severity || body.severity || 'Moderate',
      ...body,
      Status: 'Reported',
      ReportedAt: new Date().toISOString(),
    };
    incidents.unshift(newIncident);
    return HttpResponse.json({
      success: true,
      message: 'Báo sự cố thành công',
      data: newIncident,
      ...newIncident,
    }, { status: 201 });
  }),

  // POST /api/incidents/:id/plan
  http.post('/api/incidents/:id/plan', async ({ params, request }) => {
    const body = await request.json();
    const incident = incidents.find((i) => i.IncidentID === Number(params.id));
    if (!incident) {
      return HttpResponse.json({ success: false, message: 'Incident not found' }, { status: 404 });
    }
    incident.Status = 'PlanProposed';
    incident.ProposedAction = body.proposedAction || incident.ProposedAction;
    incident.AdditionalCost = body.additionalCost ?? incident.AdditionalCost;
    incident.RevisedRouteNotes = body.revisedRouteNotes || incident.RevisedRouteNotes;
    return HttpResponse.json({
      success: true,
      data: incident,
      ...incident,
    });
  }),

  // POST /api/incidents/:id/approve
  http.post('/api/incidents/:id/approve', async ({ params, request }) => {
    const body = await request.json();
    const incident = incidents.find((i) => i.IncidentID === Number(params.id));
    if (!incident) {
      return HttpResponse.json({ success: false, message: 'Incident not found' }, { status: 404 });
    }
    incident.Status = 'Approved';
    incident.ApprovedByUserID = body.approvedByUserId || 1;
    incident.ApprovedAt = new Date().toISOString();
    return HttpResponse.json({
      success: true,
      data: incident,
      ...incident,
    });
  }),

  // POST /api/incidents/:id/reject
  http.post('/api/incidents/:id/reject', ({ params }) => {
    const incident = incidents.find((i) => i.IncidentID === Number(params.id));
    if (!incident) {
      return HttpResponse.json({ success: false, message: 'Incident not found' }, { status: 404 });
    }
    incident.Status = 'Rejected';
    return HttpResponse.json({
      success: true,
      data: incident,
      ...incident,
    });
  }),

  // POST /api/incidents/:id/resolve
  http.post('/api/incidents/:id/resolve', ({ params }) => {
    const incident = incidents.find((i) => i.IncidentID === Number(params.id));
    if (!incident) {
      return HttpResponse.json({ success: false, message: 'Incident not found' }, { status: 404 });
    }
    incident.Status = 'Resolved';
    incident.ResolvedAt = new Date().toISOString();
    return HttpResponse.json({
      success: true,
      data: incident,
      ...incident,
    });
  }),
];
