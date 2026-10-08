import { http, HttpResponse } from 'msw';
import initialBookings from '../data/bookings.json';

// Bộ nhớ đệm tạm thời cho mock API các đơn đặt chuyến trong phiên làm việc
let bookings = [...initialBookings];

export const bookingHandlers = [
  // GET /api/bookings - Lấy danh sách đơn đặt chuyến
  http.get('/api/bookings', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const customerId = url.searchParams.get('customerId');

    let filtered = bookings;

    // Lọc theo khách hàng (hỗ trợ hiển thị cả đơn mẫu ID=5 cho tài khoản demo)
    if (customerId) {
      const parsedId = Number(customerId);
      filtered = filtered.filter(
        (b) => b.CustomerUserID === parsedId || b.CustomerUserID === 5,
      );
    }

    // Lọc theo trạng thái
    if (status && status !== 'All') {
      filtered = filtered.filter((b) => b.Status === status);
    }

    return HttpResponse.json({
      data: filtered,
      total: filtered.length,
    });
  }),

  // GET /api/bookings/:id - Lấy chi tiết đơn đặt chuyến
  http.get('/api/bookings/:id', ({ params }) => {
    const booking = bookings.find((b) => b.BookingID === Number(params.id));
    if (!booking) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    return HttpResponse.json(booking);
  }),

  // POST /api/bookings - Tạo mới yêu cầu đặt chuyến
  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json();

    // 1. Kiểm tra các trường thông tin bắt buộc
    if (!body.PickupAddress || !body.DropoffAddress) {
      return HttpResponse.json(
        { message: 'Địa chỉ đón và giao là bắt buộc' },
        { status: 400 },
      );
    }

    if (!body.DepartureDate) {
      return HttpResponse.json(
        { message: 'Ngày khởi hành dự kiến là bắt buộc' },
        { status: 400 },
      );
    }

    const maxId = bookings.reduce(
      (max, b) => Math.max(max, Number(b.BookingID) || 0),
      0,
    );
    const newId = maxId + 1;
    const newCode = `BKG-2026-${String(newId).padStart(4, '0')}`;

    const totalHorsesCount = Array.isArray(body.BookingHorses)
      ? body.BookingHorses.length
      : Number(body.TotalHorses) || 1;

    // Dự toán chi phí mẫu nếu FE chưa truyền
    const estimatedCost =
      Number(body.EstimatedCost) ||
      (body.TransportMode === 'Air'
        ? totalHorsesCount * 4200
        : totalHorsesCount * 1800 + (body.RequiresClimateControl ? 350 : 0));

    const newBooking = {
      BookingID: newId,
      BookingCode: newCode,
      CustomerUserID: Number(body.CustomerUserID) || 5,
      PickupAddress: body.PickupAddress.trim(),
      PickupCountryCode: body.PickupCountryCode || 'VN',
      DropoffAddress: body.DropoffAddress.trim(),
      DropoffCountryCode: body.DropoffCountryCode || 'CN',
      DepartureDate: body.DepartureDate,
      DeliveryDate: body.DeliveryDate || body.DepartureDate,
      TotalHorses: totalHorsesCount,
      SpecialInstructions: body.SpecialInstructions?.trim() || null,
      EstimatedCost: estimatedCost,
      CurrencyCode: 'USD',
      Status: 'Submitted',
      TransportMode: body.TransportMode || 'Ground',
      DistanceKm: body.DistanceKm || (body.TransportMode === 'Ground' ? 1200 : null),
      IsExpress: Boolean(body.IsExpress),
      RequiresClimateControl: Boolean(body.RequiresClimateControl),
      DeclaredValue: Number(body.DeclaredValue) || null,
      QuoteBreakdown:
        body.QuoteBreakdown ||
        JSON.stringify([
          {
            code: body.TransportMode === 'Air' ? 'FREIGHT_AIR' : 'FREIGHT_GROUND',
            name:
              body.TransportMode === 'Air'
                ? 'Cước bay quốc tế (Air Stall)'
                : 'Cước vận chuyển xe thùng chuyên dụng',
            qty: totalHorsesCount,
            unitPrice: body.TransportMode === 'Air' ? 3500.0 : 1500.0,
            amount: totalHorsesCount * (body.TransportMode === 'Air' ? 3500.0 : 1500.0),
          },
          ...(body.RequiresClimateControl
            ? [
                {
                  code: 'SUR_CLIMATE',
                  name: 'Phụ phí điều hòa nhiệt độ cabin',
                  qty: 1,
                  unitPrice: 350.0,
                  amount: 350.0,
                },
              ]
            : []),
          {
            code: 'FEE_CLEARANCE',
            name: 'Phí thủ tục kiểm dịch & thông quan hải quan',
            qty: totalHorsesCount,
            unitPrice: 250.0,
            amount: totalHorsesCount * 250.0,
          },
        ]),
      BookingHorses: body.BookingHorses || [],
      RejectionReason: null,
      ReviewedByUserID: null,
      ReviewedAt: null,
      AssignedSpecialistID: null,
      AssignedCoordinatorID: null,
      CreatedAt: new Date().toISOString(),
    };

    // Đưa đơn mới lên đầu danh sách để hiển thị ngay lập tức
    bookings.unshift(newBooking);
    return HttpResponse.json(newBooking, { status: 201 });
  }),

  // POST /api/bookings/:id/approve - Manager duyệt đơn
  http.post('/api/bookings/:id/approve', async ({ params, request }) => {
    const body = await request.json();
    const index = bookings.findIndex((b) => b.BookingID === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    const nextStatus =
      body.specialistId && body.coordinatorId ? 'Assigned' : 'Approved';

    bookings[index] = {
      ...bookings[index],
      Status: nextStatus,
      AssignedSpecialistID: body.specialistId || bookings[index].AssignedSpecialistID,
      AssignedCoordinatorID: body.coordinatorId || bookings[index].AssignedCoordinatorID,
      ReviewedAt: new Date().toISOString(),
    };

    return HttpResponse.json(bookings[index]);
  }),

  // POST /api/bookings/:id/assign - Phân công nhân sự
  http.post('/api/bookings/:id/assign', async ({ params, request }) => {
    const body = await request.json();
    const index = bookings.findIndex((b) => b.BookingID === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    bookings[index] = {
      ...bookings[index],
      Status: 'Assigned',
      AssignedSpecialistID: body.specialistId,
      AssignedCoordinatorID: body.coordinatorId,
    };

    return HttpResponse.json(bookings[index]);
  }),

  // POST /api/bookings/:id/reject - Từ chối đơn
  http.post('/api/bookings/:id/reject', async ({ params, request }) => {
    const body = await request.json();
    const index = bookings.findIndex((b) => b.BookingID === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    bookings[index] = {
      ...bookings[index],
      Status: 'Rejected',
      RejectionReason: body.reason,
      ReviewedAt: new Date().toISOString(),
    };

    return HttpResponse.json(bookings[index]);
  }),

  // POST /api/bookings/:id/cancel - Hủy đơn
  http.post('/api/bookings/:id/cancel', ({ params }) => {
    const index = bookings.findIndex((b) => b.BookingID === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    bookings[index] = {
      ...bookings[index],
      Status: 'Cancelled',
    };

    return HttpResponse.json(bookings[index]);
  }),
];
