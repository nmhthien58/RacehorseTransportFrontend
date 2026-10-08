import { http, HttpResponse } from 'msw';
import initialBookings from '../data/bookings.json';

// Bộ nhớ đệm tạm thời cho mock API các đơn đặt chuyến trong phiên làm việc
let bookings = [...initialBookings];

export const bookingHandlers = [
  // POST /api/bookings/quote-preview - Xem trước bảng giá
  http.post('/api/bookings/quote-preview', async ({ request }) => {
    const body = await request.json();
    const horsesList = body.horses || [];
    const count = horsesList.length > 0 ? horsesList.length : 1;
    const isAir = body.transportMode === 'Air';
    const ratePerHorse = isAir ? 4200 : 1800;
    const climateSurcharge = body.requiresClimateControl ? 350 : 0;
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

    let filtered = bookings;

    // Lọc theo khách hàng (hỗ trợ hiển thị cả đơn mẫu ID=5 cho tài khoản demo)
    if (customerId) {
      const parsedId = Number(customerId);
      filtered = filtered.filter(
        (b) => b.customerUserId === parsedId || b.customerUserId === 5,
      );
    }

    // Lọc theo trạng thái
    if (status && status !== 'All') {
      filtered = filtered.filter((b) => b.status === status);
    }

    return HttpResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / 10) || 1,
      },
    });
  }),

  // GET /api/bookings/:id - Lấy chi tiết đơn đặt chuyến
  http.get('/api/bookings/:id', ({ params }) => {
    const booking = bookings.find((b) => b.bookingId === Number(params.id));
    if (!booking) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: booking,
      ...booking,
    });
  }),

  // POST /api/bookings - Tạo mới yêu cầu đặt chuyến
  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json();

    // 1. Kiểm tra các trường thông tin bắt buộc
    const pickup = body.pickupAddress;
    const dropoff = body.dropoffAddress;
    const departure = body.departureDate;

    if (!pickup || !dropoff) {
      return HttpResponse.json(
        { success: false, message: 'Địa chỉ đón và giao là bắt buộc' },
        { status: 400 },
      );
    }

    if (!departure) {
      return HttpResponse.json(
        { success: false, message: 'Ngày khởi hành dự kiến là bắt buộc' },
        { status: 400 },
      );
    }

    const maxId = bookings.reduce(
      (max, b) => Math.max(max, Number(b.bookingId) || 0),
      0,
    );
    const newId = maxId + 1;
    const newCode = `BKG-2026-${String(newId).padStart(4, '0')}`;

    const rawHorses = body.bookingHorses || body.horses || [];
    const totalHorsesCount = Array.isArray(rawHorses)
      ? rawHorses.length
      : Number(body.totalHorses) || 1;

    const transportMode = body.transportMode || 'Ground';
    const estimatedCost =
      Number(body.estimatedCost) ||
      (transportMode === 'Air'
        ? totalHorsesCount * 4200
        : totalHorsesCount * 1800);

    const newBooking = {
      bookingId: newId,
      bookingCode: newCode,
      customerUserId: Number(body.customerUserId) || 5,
      pickupAddress: String(pickup).trim(),
      pickupCountryCode: body.pickupCountryCode || 'VN',
      dropoffAddress: String(dropoff).trim(),
      dropoffCountryCode: body.dropoffCountryCode || 'CN',
      departureDate: departure,
      deliveryDate: body.deliveryDate || departure,
      totalHorses: totalHorsesCount,
      specialInstructions: body.specialInstructions || null,
      estimatedCost,
      currencyCode: 'USD',
      status: 'Submitted',
      transportMode,
      distanceKm: Number(body.distanceKm) || 1200,
      isExpress: Boolean(body.isExpress),
      requiresClimateControl: Boolean(body.requiresClimateControl),
      declaredValue: Number(body.declaredValue) || null,
      quoteBreakdown: null,
      rejectionReason: null,
      reviewedByUserId: null,
      reviewedAt: null,
      assignedSpecialistId: null,
      assignedCoordinatorId: null,
      createdAt: new Date().toISOString(),
    };

    // Đưa đơn mới lên đầu danh sách để hiển thị ngay lập tức
    bookings.unshift(newBooking);
    return HttpResponse.json({
      success: true,
      message: 'Tạo đơn đặt chuyến thành công',
      data: newBooking,
      ...newBooking,
    }, { status: 201 });
  }),

  // POST /api/bookings/:id/approve - Manager duyệt đơn
  http.post('/api/bookings/:id/approve', async ({ params, request }) => {
    const body = await request.json();
    const index = bookings.findIndex((b) => b.bookingId === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const specId = body.specialistUserId || body.specialistId;
    bookings[index] = {
      ...bookings[index],
      status: 'Approved',
      assignedSpecialistId: specId || bookings[index].assignedSpecialistId,
      reviewedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      message: 'Duyệt đơn vận chuyển thành công',
      data: bookings[index],
      ...bookings[index],
    });
  }),

  // POST /api/bookings/:id/reassign-specialist & assign
  http.post('/api/bookings/:id/reassign-specialist', async ({ params, request }) => {
    const body = await request.json();
    const index = bookings.findIndex((b) => b.bookingId === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    bookings[index] = {
      ...bookings[index],
      assignedSpecialistId: body.specialistUserId || body.specialistId,
    };

    return HttpResponse.json({
      success: true,
      message: 'Cập nhật chuyên viên phụ trách thành công',
      data: bookings[index],
      ...bookings[index],
    });
  }),

  // POST /api/bookings/:id/assign
  http.post('/api/bookings/:id/assign', async ({ params, request }) => {
    const body = await request.json();
    const index = bookings.findIndex((b) => b.bookingId === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    bookings[index] = {
      ...bookings[index],
      status: 'Assigned',
      assignedSpecialistId: body.specialistId || body.specialistUserId,
      assignedCoordinatorId: body.coordinatorId,
    };

    return HttpResponse.json({
      success: true,
      data: bookings[index],
      ...bookings[index],
    });
  }),

  // POST /api/bookings/:id/reject - Từ chối đơn
  http.post('/api/bookings/:id/reject', async ({ params, request }) => {
    const body = await request.json();
    const index = bookings.findIndex((b) => b.bookingId === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    bookings[index] = {
      ...bookings[index],
      status: 'Rejected',
      rejectionReason: body.reason,
      reviewedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      message: 'Từ chối đơn vận chuyển thành công',
      data: bookings[index],
      ...bookings[index],
    });
  }),

  // POST /api/bookings/:id/cancel - Hủy đơn
  http.post('/api/bookings/:id/cancel', ({ params }) => {
    const index = bookings.findIndex((b) => b.bookingId === Number(params.id));
    if (index === -1) {
      return HttpResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    bookings[index] = {
      ...bookings[index],
      status: 'Cancelled',
    };

    return HttpResponse.json({
      success: true,
      message: 'Hủy đơn thành công',
      data: bookings[index],
      ...bookings[index],
    });
  }),
];
