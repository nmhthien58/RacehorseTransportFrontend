import { http, HttpResponse } from 'msw';
import bookingsData from '../data/bookings.json';

export const bookingHandlers = [
  // GET /api/bookings
  http.get('/api/bookings', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let filtered = bookingsData;
    if (status) {
      filtered = bookingsData.filter((b) => b.Status === status);
    }

    return HttpResponse.json({
      data: filtered,
      total: filtered.length,
    });
  }),

  // GET /api/bookings/:id
  http.get('/api/bookings/:id', ({ params }) => {
    const booking = bookingsData.find((b) => b.BookingID === Number(params.id));
    if (!booking) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    return HttpResponse.json(booking);
  }),

  // POST /api/bookings
  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json();
    const newBooking = {
      BookingID: bookingsData.length + 1,
      BookingCode: `BKG-2026-${String(bookingsData.length + 1).padStart(4, '0')}`,
      TransportMode: body.TransportMode || 'Ground',
      DistanceKm: body.DistanceKm || null,
      IsExpress: body.IsExpress || false,
      RequiresClimateControl: body.RequiresClimateControl || false,
      DeclaredValue: body.DeclaredValue || null,
      QuoteBreakdown: null,
      ...body,
      Status: 'Submitted',
      CreatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newBooking, { status: 201 });
  }),

  // POST /api/bookings/:id/approve
  http.post('/api/bookings/:id/approve', async ({ params, request }) => {
    const body = await request.json();
    const booking = bookingsData.find((b) => b.BookingID === Number(params.id));
    if (!booking) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    
    // Nếu có gán nhân sự luôn -> trạng thái chuyển sang Assigned theo State Diagram 1
    const nextStatus = (body.specialistId && body.coordinatorId) ? 'Assigned' : 'Approved';

    return HttpResponse.json({
      ...booking,
      Status: nextStatus,
      AssignedSpecialistID: body.specialistId || booking.AssignedSpecialistID,
      AssignedCoordinatorID: body.coordinatorId || booking.AssignedCoordinatorID,
      ReviewedAt: new Date().toISOString(),
    });
  }),

  // POST /api/bookings/:id/assign
  http.post('/api/bookings/:id/assign', async ({ params, request }) => {
    const body = await request.json();
    const booking = bookingsData.find((b) => b.BookingID === Number(params.id));
    if (!booking) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...booking,
      Status: 'Assigned',
      AssignedSpecialistID: body.specialistId,
      AssignedCoordinatorID: body.coordinatorId,
    });
  }),

  // POST /api/bookings/:id/reject
  http.post('/api/bookings/:id/reject', async ({ params, request }) => {
    const body = await request.json();
    const booking = bookingsData.find((b) => b.BookingID === Number(params.id));
    if (!booking) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...booking,
      Status: 'Rejected',
      RejectionReason: body.reason,
      ReviewedAt: new Date().toISOString(),
    });
  }),

  // POST /api/bookings/:id/cancel
  http.post('/api/bookings/:id/cancel', async ({ params }) => {
    const booking = bookingsData.find((b) => b.BookingID === Number(params.id));
    if (!booking) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...booking,
      Status: 'Cancelled',
    });
  }),
];
