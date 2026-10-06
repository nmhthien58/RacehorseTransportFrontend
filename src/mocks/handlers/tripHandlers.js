import { http, HttpResponse } from 'msw';
import tripsData from '../data/trips.json';
import incidentsData from '../data/incidents.json';

export const tripHandlers = [
  // GET /api/trips
  http.get('/api/trips', () => {
    return HttpResponse.json({
      data: tripsData,
      total: tripsData.length,
    });
  }),

  // GET /api/trips/:id
  http.get('/api/trips/:id', ({ params }) => {
    const trip = tripsData.find((t) => t.TripID === Number(params.id));
    if (!trip) {
      return HttpResponse.json({ message: 'Trip not found' }, { status: 404 });
    }
    return HttpResponse.json(trip);
  }),

  // POST /api/trips/:id/status
  http.post('/api/trips/:id/status', async ({ params, request }) => {
    const body = await request.json();
    const trip = tripsData.find((t) => t.TripID === Number(params.id));
    if (!trip) {
      return HttpResponse.json({ message: 'Trip not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...trip,
      OverallStatus: body.status,
    });
  }),

  // GET /api/incidents
  http.get('/api/incidents', () => {
    return HttpResponse.json({
      data: incidentsData,
      total: incidentsData.length,
    });
  }),

  // POST /api/incidents
  http.post('/api/incidents', async ({ request }) => {
    const body = await request.json();
    const newIncident = {
      IncidentID: incidentsData.length + 1,
      IncidentCode: `INC-2026-${String(incidentsData.length + 1).padStart(4, '0')}`,
      Severity: body.Severity || 'Moderate',
      AffectedTripHorseID: body.AffectedTripHorseID || null,
      ...body,
      Status: 'Reported',
      ReportedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newIncident, { status: 201 });
  }),

  // POST /api/incidents/:id/plan (Coordinator đề xuất phương án xử lý)
  http.post('/api/incidents/:id/plan', async ({ params, request }) => {
    const body = await request.json();
    const incident = incidentsData.find((i) => i.IncidentID === Number(params.id));
    if (!incident) {
      return HttpResponse.json({ message: 'Incident not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...incident,
      Status: 'PlanProposed',
      ProposedAction: body.proposedAction || incident.ProposedAction,
      AdditionalCost: body.additionalCost ?? incident.AdditionalCost,
      RevisedRouteNotes: body.revisedRouteNotes || incident.RevisedRouteNotes,
    });
  }),

  // POST /api/incidents/:id/approve (Manager duyệt phương án)
  http.post('/api/incidents/:id/approve', async ({ params, request }) => {
    const body = await request.json();
    const incident = incidentsData.find((i) => i.IncidentID === Number(params.id));
    if (!incident) {
      return HttpResponse.json({ message: 'Incident not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...incident,
      Status: 'Approved',
      ApprovedByUserID: body.approvedByUserId || 1,
      ApprovedAt: new Date().toISOString(),
    });
  }),

  // POST /api/incidents/:id/reject (Manager từ chối phương án)
  http.post('/api/incidents/:id/reject', ({ params }) => {
    const incident = incidentsData.find((i) => i.IncidentID === Number(params.id));
    if (!incident) {
      return HttpResponse.json({ message: 'Incident not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...incident,
      Status: 'Rejected',
    });
  }),

  // POST /api/incidents/:id/resolve (Driver hoàn thành xử lý sự cố)
  http.post('/api/incidents/:id/resolve', ({ params }) => {
    const incident = incidentsData.find((i) => i.IncidentID === Number(params.id));
    if (!incident) {
      return HttpResponse.json({ message: 'Incident not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...incident,
      Status: 'Resolved',
      ResolvedAt: new Date().toISOString(),
    });
  }),
];
