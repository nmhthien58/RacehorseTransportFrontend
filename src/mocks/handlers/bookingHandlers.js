import { http, HttpResponse } from 'msw';
import {
  getStoredBookings,
  getStoredBookingById,
  addStoredBooking,
  updateStoredBooking,
} from '../../utils/bookingStorage';

function normalizeBooking(b) {
  if (!b) return b;
  const id = Number(b.BookingID || b.bookingId || 0);
  const code = b.BookingCode || b.bookingCode || `BKG-2026-${String(id).padStart(4, '0')}`;
  const status = b.Status || b.status || 'Submitted';
  const pickup = b.PickupAddress || b.pickupAddress || '';
  const dropoff = b.DropoffAddress || b.dropoffAddress || '';
  const mode = b.TransportMode || b.transportMode || 'Ground';
  const cost = Number(b.EstimatedCost || b.estimatedCost || 0);
  const horses = b.BookingHorses || b.bookingHorses || b.horses || [];
  const total = Number(b.TotalHorses || b.totalHorses || horses.length || 1);

  return {
    ...b,
    bookingId: id,
    BookingID: id,
    bookingCode: code,
    BookingCode: code,
    customerUserId: Number(b.CustomerUserID || b.customerUserId || 5),
    CustomerUserID: Number(b.CustomerUserID || b.customerUserId || 5),
    pickupAddress: pickup,
    PickupAddress: pickup,
    pickupCountryCode: b.PickupCountryCode || b.pickupCountryCode || 'VN',
    PickupCountryCode: b.PickupCountryCode || b.pickupCountryCode || 'VN',
    dropoffAddress: dropoff,
    DropoffAddress: dropoff,
    dropoffCountryCode: b.DropoffCountryCode || b.dropoffCountryCode || 'CN',
    DropoffCountryCode: b.DropoffCountryCode || b.dropoffCountryCode || 'CN',
    departureDate: b.DepartureDate || b.departureDate || new Date().toISOString(),
    DepartureDate: b.DepartureDate || b.departureDate || new Date().toISOString(),
    deliveryDate: b.DeliveryDate || b.deliveryDate || b.DepartureDate || b.departureDate || new Date().toISOString(),
    DeliveryDate: b.DeliveryDate || b.deliveryDate || b.DepartureDate || b.departureDate || new Date().toISOString(),
    totalHorses: total,
    TotalHorses: total,
    specialInstructions: b.SpecialInstructions || b.specialInstructions || null,
    SpecialInstructions: b.SpecialInstructions || b.specialInstructions || null,
    estimatedCost: cost,
    EstimatedCost: cost,
    currencyCode: b.CurrencyCode || b.currencyCode || 'USD',
    CurrencyCode: b.CurrencyCode || b.currencyCode || 'USD',
    status: status,
    Status: status,
    transportMode: mode,
    TransportMode: mode,
    distanceKm: Number(b.DistanceKm || b.distanceKm || 1200),
    DistanceKm: Number(b.DistanceKm || b.distanceKm || 1200),
    isExpress: Boolean(b.IsExpress || b.isExpress),
    IsExpress: Boolean(b.IsExpress || b.isExpress),
    requiresClimateControl: Boolean(b.RequiresClimateControl || b.requiresClimateControl),
    RequiresClimateControl: Boolean(b.RequiresClimateControl || b.requiresClimateControl),
    declaredValue: Number(b.DeclaredValue || b.declaredValue || 0) || null,
    DeclaredValue: Number(b.DeclaredValue || b.declaredValue || 0) || null,
    bookingHorses: horses,
    BookingHorses: horses,
    rejectionReason: b.RejectionReason || b.rejectionReason || null,
    RejectionReason: b.RejectionReason || b.rejectionReason || null,
    assignedSpecialistId: b.AssignedSpecialistID || b.assignedSpecialistId || null,
    AssignedSpecialistID: b.AssignedSpecialistID || b.assignedSpecialistId || null,
    assignedCoordinatorId: b.AssignedCoordinatorID || b.assignedCoordinatorId || null,
    AssignedCoordinatorID: b.AssignedCoordinatorID || b.assignedCoordinatorId || null,
    createdAt: b.CreatedAt || b.createdAt || new Date().toISOString(),
    CreatedAt: b.CreatedAt || b.createdAt || new Date().toISOString(),
  };
}

export const bookingHandlers = [
  // POST /api/bookings/quote-preview - Xem trước bảng giá
  http.post('/api/bookings/quote-preview', async ({ request }) => {
    const body = await request.json();
    const horsesList = body.horses || body.BookingHorses || [];
    const count = horsesList.length > 0 ? horsesList.length : Number(body.totalHorses) || 1;
    const isAir = body.transportMode === 'Air' || body.TransportMode === 'Air';
    const ratePerHorse = isAir ? 4200 : 1800;
    const climateSurcharge = body.requiresClimateControl || body.RequiresClimateControl ? 350 : 0;
    const estimatedCost = count * ratePerHorse + climateSurcharge;

    return HttpResponse.json({
      success: true,
      message: 'Tính toán bảng báo giá thành công',
      data: {
        estimatedCost,
        currencyCode: 'USD',
        quoteLines: [
          {
            code: isAir ? 'FREIGHT_AIR' : 'FREIGHT_GROUND',
            name: isAir ? 'Cước đường hàng không chuyên dụng' : 'Cước vận chuyển xe thùng chuyên dụng',
            quantity: count,
            unitPrice: ratePerHorse,
            amount: count * ratePerHorse,
          },
          ...(climateSurcharge > 0
            ? [
                {
                  code: 'SUR_CLIMATE',
                  name: 'Phụ phí kiểm soát nhiệt độ cabin',
                  quantity: 1,
                  unitPrice: 350,
                  amount: 350,
                },
              ]
            : []),
        ],
      },
    });
  }),

  // GET /api/bookings - Lấy danh sách đơn đặt chuyến
  http.get('/api/bookings', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const customerId = url.searchParams.get('customerId') || url.searchParams.get('customerUserId');

    let list = getStoredBookings().map(normalizeBooking);

    if (customerId) {
      const parsedId = Number(customerId);
      list = list.filter(
        (b) => b.customerUserId === parsedId || b.customerUserId === 5,
      );
    }

    if (status && status !== 'All') {
      list = list.filter((b) => b.status === status);
    }

    return HttpResponse.json({
      success: true,
      data: list,
      total: list.length,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: list.length,
        totalPages: Math.ceil(list.length / 10) || 1,
      },
    });
  }),

  // GET /api/bookings/:id - Lấy chi tiết đơn đặt chuyến
  http.get('/api/bookings/:id', ({ params }) => {
    const booking = getStoredBookingById(params.id);
    if (!booking) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }
    const normalized = normalizeBooking(booking);
    return HttpResponse.json({
      success: true,
      data: normalized,
      ...normalized,
    });
  }),

  // POST /api/bookings - Tạo mới yêu cầu đặt chuyến
  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json();

    const pickup = body.pickupAddress || body.PickupAddress;
    const dropoff = body.dropoffAddress || body.DropoffAddress;
    const departure = body.departureDate || body.DepartureDate;

    if (!pickup || !dropoff) {
      return HttpResponse.json(
        { success: false, message: 'Địa chỉ đón và giao là bắt buộc' },
        { status: 400 },
      );
    }

    const newBooking = addStoredBooking({
      ...body,
      PickupAddress: pickup,
      DropoffAddress: dropoff,
      DepartureDate: departure || new Date().toISOString(),
      DeliveryDate: body.deliveryDate || body.DeliveryDate || departure || new Date().toISOString(),
      TransportMode: body.transportMode || body.TransportMode || 'Ground',
      CustomerUserID: Number(body.customerUserId || body.CustomerUserID || 5),
      EstimatedCost: Number(body.estimatedCost || body.EstimatedCost || 0),
      Status: 'Submitted',
    });

    const normalized = normalizeBooking(newBooking);
    return HttpResponse.json({
      success: true,
      message: 'Tạo đơn đặt chuyến thành công',
      data: normalized,
      ...normalized,
    }, { status: 201 });
  }),

  // POST /api/bookings/:id/approve - Manager duyệt đơn
  http.post('/api/bookings/:id/approve', async ({ params, request }) => {
    const body = await request.json();
    const specId = body.specialistUserId || body.specialistId;
    const updated = updateStoredBooking(params.id, {
      Status: 'Approved',
      status: 'Approved',
      AssignedSpecialistID: specId,
      assignedSpecialistId: specId,
      ReviewedAt: new Date().toISOString(),
    });

    if (!updated) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const normalized = normalizeBooking(updated);
    return HttpResponse.json({
      success: true,
      message: 'Duyệt đơn vận chuyển thành công',
      data: normalized,
      ...normalized,
    });
  }),

  // POST /api/bookings/:id/reassign-specialist
  http.post('/api/bookings/:id/reassign-specialist', async ({ params, request }) => {
    const body = await request.json();
    const specId = body.specialistUserId || body.specialistId;
    const updated = updateStoredBooking(params.id, {
      AssignedSpecialistID: specId,
      assignedSpecialistId: specId,
    });

    if (!updated) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const normalized = normalizeBooking(updated);
    return HttpResponse.json({
      success: true,
      message: 'Cập nhật chuyên viên phụ trách thành công',
      data: normalized,
      ...normalized,
    });
  }),

  // POST /api/bookings/:id/assign
  http.post('/api/bookings/:id/assign', async ({ params, request }) => {
    const body = await request.json();
    const updated = updateStoredBooking(params.id, {
      Status: 'Assigned',
      status: 'Assigned',
      AssignedSpecialistID: body.specialistId || body.specialistUserId,
      assignedSpecialistId: body.specialistId || body.specialistUserId,
      AssignedCoordinatorID: body.coordinatorId,
      assignedCoordinatorId: body.coordinatorId,
    });

    if (!updated) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const normalized = normalizeBooking(updated);
    return HttpResponse.json({
      success: true,
      data: normalized,
      ...normalized,
    });
  }),

  // POST /api/bookings/:id/reject - Từ chối đơn
  http.post('/api/bookings/:id/reject', async ({ params, request }) => {
    const body = await request.json();
    const updated = updateStoredBooking(params.id, {
      Status: 'Rejected',
      status: 'Rejected',
      RejectionReason: body.reason,
      rejectionReason: body.reason,
      ReviewedAt: new Date().toISOString(),
    });

    if (!updated) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const normalized = normalizeBooking(updated);
    return HttpResponse.json({
      success: true,
      message: 'Từ chối đơn vận chuyển thành công',
      data: normalized,
      ...normalized,
    });
  }),

  // POST /api/bookings/:id/cancel - Hủy đơn
  http.post('/api/bookings/:id/cancel', ({ params }) => {
    const updated = updateStoredBooking(params.id, {
      Status: 'Cancelled',
      status: 'Cancelled',
    });

    if (!updated) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const normalized = normalizeBooking(updated);
    return HttpResponse.json({
      success: true,
      message: 'Hủy đơn thành công',
      data: normalized,
      ...normalized,
    });
  }),
];
