import { http, HttpResponse } from 'msw';
import { getStoredBookings, updateStoredBooking, getStoredBookingById } from '../../utils/bookingStorage';

let paymentSettingsState = {
  depositPercent: 30,
  cancelRefundPercent: 50,
  usdVndRate: 26000,
  balanceDueDaysBeforeDeparture: 2,
  extraPaymentDueDays: 7,
  updatedAt: new Date().toISOString(),
  updatedByName: 'Trần Quốc Bảo',
};

let routePlansStorage = [];
let claimsStorage = [
  {
    claimId: 1,
    claimCode: 'CLM-2026-0001',
    bookingId: 1,
    bookingHorseId: 1,
    horseName: 'Midnight Gunner',
    microchipNumber: '985141008472910',
    claimType: 'Injury',
    insurancePlan: 'Full',
    agreedValue: 80000,
    requestedAmount: 5000,
    approvedAmount: null,
    status: 'Open',
    faultParty: 'Company',
    description: 'Ngựa bị xây xát chân trước trong quá trình di chuyển qua đoạn gồ ghề.',
    evidenceUrls: ['https://example.com/evidence/vet-report-1.pdf'],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

let delayCompensationsStorage = [
  {
    compensationId: 1,
    bookingId: 1,
    bookingCode: 'BKG-2026-0001',
    customerName: 'Jane Smith',
    delayHours: 14,
    compensationPercent: 10,
    amountUsd: 750,
    status: 'Pending',
    reason: 'Trễ giờ do sự cố vận hành của công ty',
    createdAt: new Date().toISOString(),
  },
];

export const businessHandlers = [
  // 1. Cấu hình thanh toán (Payment Settings)
  http.get('/api/settings/payment', () => {
    return HttpResponse.json({
      success: true,
      data: paymentSettingsState,
      message: 'Payment settings retrieved',
    });
  }),

  http.put('/api/settings/payment', async ({ request }) => {
    const body = await request.json();
    paymentSettingsState = {
      ...paymentSettingsState,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedByName: 'Trần Quốc Bảo',
    };
    return HttpResponse.json({
      success: true,
      data: paymentSettingsState,
      message: 'Payment settings updated successfully',
    });
  }),

  // 2. Tuyến dự kiến của đơn (Route Plans)
  http.get('/api/bookings/:id/route-plans', ({ params }) => {
    const list = routePlansStorage.filter((p) => Number(p.bookingId) === Number(params.id));
    return HttpResponse.json({
      success: true,
      data: list,
      message: 'Route plans retrieved',
    });
  }),

  http.get('/api/route-plans/:id', ({ params }) => {
    const plan = routePlansStorage.find((p) => Number(p.routePlanId) === Number(params.id));
    if (!plan) {
      return HttpResponse.json({ success: false, message: 'Route plan not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: plan });
  }),

  http.post('/api/bookings/:id/route-plans/preview', async ({ params, request }) => {
    const body = await request.json();
    const stops = body.stops || [];
    return HttpResponse.json({
      success: true,
      data: {
        bookingId: Number(params.id),
        stops,
        totalDistanceKm: 1250,
        estimatedHours: 28,
        transitCountryCodes: stops.filter((s) => s.countryCode && s.countryCode !== 'VN' && s.countryCode !== 'CN').map((s) => s.countryCode),
        warnings: [],
      },
    });
  }),

  http.post('/api/bookings/:id/route-plans', async ({ params, request }) => {
    const body = await request.json();
    const newPlan = {
      routePlanId: Date.now(),
      bookingId: Number(params.id),
      version: routePlansStorage.filter((p) => Number(p.bookingId) === Number(params.id)).length + 1,
      status: 'Draft',
      stops: body.stops || [],
      totalDistanceKm: body.totalDistanceKm || 1200,
      estimatedHours: body.estimatedHours || 26,
      transitCountryCodes: body.transitCountryCodes || ['LA'],
      createdAt: new Date().toISOString(),
    };
    routePlansStorage.push(newPlan);
    return HttpResponse.json({ success: true, data: newPlan, message: 'Route plan created successfully' }, { status: 201 });
  }),

  http.post('/api/route-plans/:id/submit', ({ params }) => {
    const plan = routePlansStorage.find((p) => Number(p.routePlanId) === Number(params.id));
    if (plan) plan.status = 'PendingApproval';
    return HttpResponse.json({ success: true, data: plan, message: 'Route plan submitted successfully' });
  }),

  http.post('/api/route-plans/:id/approve', ({ params }) => {
    const plan = routePlansStorage.find((p) => Number(p.routePlanId) === Number(params.id));
    if (plan) {
      plan.status = 'Approved';
      updateStoredBooking(plan.bookingId, {
        status: 'RoutePlanned',
        Status: 'RoutePlanned',
        transitCountries: plan.transitCountryCodes,
        distanceKm: plan.totalDistanceKm,
      });
    }
    return HttpResponse.json({ success: true, data: plan, message: 'Route plan approved successfully' });
  }),

  http.post('/api/route-plans/:id/reject', async ({ params, request }) => {
    const body = await request.json();
    const plan = routePlansStorage.find((p) => Number(p.routePlanId) === Number(params.id));
    if (plan) {
      plan.status = 'Rejected';
      plan.rejectionReason = body.reason || 'Manager yêu cầu chỉnh sửa tuyến';
    }
    return HttpResponse.json({ success: true, data: plan, message: 'Route plan rejected' });
  }),

  // 3. Người nhận ngựa (Recipients)
  http.put('/api/bookings/:id/recipient', async ({ params, request }) => {
    const body = await request.json();
    const updated = updateStoredBooking(params.id, {
      recipientIsCustomer: body.isCustomer,
      recipientName: body.isCustomer ? null : body.name,
      recipientPhone: body.isCustomer ? null : body.phone,
      recipientEmail: body.isCustomer ? null : body.email,
      recipientIdNumber: body.idNumber,
    });
    return HttpResponse.json({ success: true, data: updated, message: 'Recipient updated successfully' });
  }),

  http.post('/api/bookings/:id/confirm-presence', ({ params }) => {
    const updated = updateStoredBooking(params.id, {
      recipientConfirmedAt: new Date().toISOString(),
    });
    return HttpResponse.json({ success: true, data: updated, message: 'Presence confirmed' });
  }),

  http.post('/api/bookings/:id/approve-alternate-recipient', async ({ params, request }) => {
    const body = await request.json();
    const updated = updateStoredBooking(params.id, {
      recipientName: body.name,
      recipientIdNumber: body.idNumber,
      alternateRecipientApproved: true,
    });
    return HttpResponse.json({ success: true, data: updated, message: 'Alternate recipient approved' });
  }),

  http.get('/api/trips/:id/recipients', () => {
    const bookings = getStoredBookings();
    const recipients = bookings.slice(0, 2).map((b) => ({
      bookingId: b.bookingId || b.BookingID,
      bookingCode: b.bookingCode || b.BookingCode,
      recipientName: b.recipientName || b.customerName || 'Jane Smith',
      recipientPhone: b.recipientPhone || b.customerPhone || '+84988111222',
      recipientConfirmedAt: b.recipientConfirmedAt || null,
      isAvailable: Boolean(b.recipientConfirmedAt),
      alternateSignerName: b.alternateSignerName || null,
    }));
    return HttpResponse.json({ success: true, data: recipients, message: 'Recipients retrieved' });
  }),

  // 4. Giá trị thỏa thuận từng ngựa (Manager chốt) & Hủy khi đổi tuyến
  http.put('/api/bookings/:id/horse-values', async ({ params, request }) => {
    const body = await request.json();
    const horseValues = body.horseValues || [];
    const b = getStoredBookingById(params.id);
    if (b && b.horses) {
      b.horses = b.horses.map((h) => {
        const found = horseValues.find((hv) => Number(hv.horseId) === Number(h.horseId));
        return found ? { ...h, agreedValue: found.agreedValue } : h;
      });
      updateStoredBooking(params.id, { horses: b.horses, status: 'Quoted', Status: 'Quoted' });
    }
    return HttpResponse.json({ success: true, data: b, message: 'Horse values updated successfully' });
  }),

  http.post('/api/bookings/:id/cancel-route-change', ({ params }) => {
    const updated = updateStoredBooking(params.id, {
      status: 'Cancelled',
      Status: 'Cancelled',
      cancelledReason: 'Khách hàng hủy đơn do công ty đổi tuyến phát sinh giấy tờ mới (Hoàn 100%)',
      refundPercent: 100,
    });
    return HttpResponse.json({ success: true, data: updated, message: 'Đã hủy đơn và hoàn 100% tiền cọc' });
  }),

  // 5. Bồi thường giao trễ (Delay Compensations)
  http.get('/api/delay-compensations', () => {
    return HttpResponse.json({ success: true, data: delayCompensationsStorage });
  }),

  http.get('/api/bookings/:id/delay-compensations', ({ params }) => {
    const list = delayCompensationsStorage.filter((d) => Number(d.bookingId) === Number(params.id));
    return HttpResponse.json({ success: true, data: list });
  }),

  http.post('/api/delay-compensations/:id/approve', async ({ params, request }) => {
    const body = await request.json().catch(() => ({}));
    const item = delayCompensationsStorage.find((d) => Number(d.compensationId) === Number(params.id));
    if (item) {
      item.status = 'Approved';
      if (body.approvedAmount != null) item.amountUsd = Number(body.approvedAmount);
      if (body.reason) item.managerNote = body.reason;
    }
    return HttpResponse.json({ success: true, data: item, message: 'Duyệt bồi thường giao trễ thành công' });
  }),

  http.post('/api/delay-compensations/:id/reject', async ({ params, request }) => {
    const body = await request.json().catch(() => ({}));
    const item = delayCompensationsStorage.find((d) => Number(d.compensationId) === Number(params.id));
    if (item) {
      item.status = 'Rejected';
      item.rejectionReason = body.reason || 'Từ chối bồi thường';
    }
    return HttpResponse.json({ success: true, data: item, message: 'Từ chối bồi thường giao trễ thành công' });
  }),

  // 6. Hồ sơ bồi thường bảo hiểm (Insurance Claims)
  http.get('/api/claims', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const bookingId = url.searchParams.get('bookingId');
    let list = [...claimsStorage];
    if (status && status !== 'All') list = list.filter((c) => c.status === status);
    if (bookingId) list = list.filter((c) => Number(c.bookingId) === Number(bookingId));
    return HttpResponse.json({ success: true, data: list });
  }),

  http.get('/api/claims/:id', ({ params }) => {
    const found = claimsStorage.find((c) => Number(c.claimId) === Number(params.id));
    if (!found) return HttpResponse.json({ success: false, message: 'Claim not found' }, { status: 404 });
    return HttpResponse.json({ success: true, data: found });
  }),

  http.post('/api/bookings/:id/claims', async ({ params, request }) => {
    const body = await request.json();
    const newClaim = {
      claimId: Date.now(),
      claimCode: `CLM-2026-${String(claimsStorage.length + 1).padStart(4, '0')}`,
      bookingId: Number(params.id),
      bookingHorseId: Number(body.bookingHorseId),
      horseName: body.horseName || 'Chiến mã',
      microchipNumber: body.microchipNumber || '985141008472910',
      claimType: body.claimType || 'Injury',
      insurancePlan: body.insurancePlan || 'Full',
      agreedValue: body.agreedValue || 80000,
      requestedAmount: Number(body.requestedAmount) || 0,
      approvedAmount: null,
      status: 'Open',
      description: body.description || '',
      evidenceUrls: body.evidenceUrls || [],
      createdAt: new Date().toISOString(),
    };
    claimsStorage.push(newClaim);
    return HttpResponse.json({ success: true, data: newClaim, message: 'Nộp yêu cầu bồi thường thành công' }, { status: 201 });
  }),

  http.post('/api/claims/:id/evidence', async ({ params }) => {
    const found = claimsStorage.find((c) => Number(c.claimId) === Number(params.id));
    if (found) {
      found.evidenceUrls = found.evidenceUrls || [];
      found.evidenceUrls.push('https://example.com/evidence/uploaded-doc.pdf');
    }
    return HttpResponse.json({ success: true, data: found, message: 'Tải chứng từ thành công' });
  }),

  http.post('/api/claims/:id/review', ({ params }) => {
    const found = claimsStorage.find((c) => Number(c.claimId) === Number(params.id));
    if (found) found.status = 'UnderReview';
    return HttpResponse.json({ success: true, data: found, message: 'Hồ sơ đang được thẩm định' });
  }),

  http.post('/api/claims/:id/approve', async ({ params, request }) => {
    const body = await request.json();
    const found = claimsStorage.find((c) => Number(c.claimId) === Number(params.id));
    if (found) {
      found.status = 'Approved';
      found.approvedAmount = Number(body.approvedAmount);
      found.managerNote = body.note || '';
      found.reviewedAt = new Date().toISOString();
    }
    return HttpResponse.json({ success: true, data: found, message: 'Duyệt bồi thường bảo hiểm thành công' });
  }),

  http.post('/api/claims/:id/reject', async ({ params, request }) => {
    const body = await request.json();
    const found = claimsStorage.find((c) => Number(c.claimId) === Number(params.id));
    if (found) {
      found.status = 'Rejected';
      found.decisionReason = body.reason || 'Không đủ điều kiện bồi thường theo chính sách loại trừ';
      found.reviewedAt = new Date().toISOString();
    }
    return HttpResponse.json({ success: true, data: found, message: 'Từ chối bồi thường bảo hiểm' });
  }),

  http.post('/api/claims/:id/pay', async ({ params, request }) => {
    const body = await request.json();
    const found = claimsStorage.find((c) => Number(c.claimId) === Number(params.id));
    if (found) {
      found.status = 'Paid';
      found.paidReference = body.reference || `TXN-CLAIM-${Date.now()}`;
      found.paidAt = new Date().toISOString();
    }
    return HttpResponse.json({ success: true, data: found, message: 'Ghi nhận chi trả bồi thường thành công' });
  }),
];
