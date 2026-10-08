import { http, HttpResponse } from 'msw';
import {
  getStoredHorses,
  getStoredHorseById,
  addStoredHorse,
  updateStoredHorse,
  deleteStoredHorse,
} from '../../utils/horseStorage';

export const horseHandlers = [
  // GET /api/horses - Danh sách ngựa
  http.get('/api/horses', ({ request }) => {
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId');

    let result = getStoredHorses();
    if (ownerId) {
      const parsedId = Number(ownerId);
      // Luôn đảm bảo tài khoản Customer thấy cả ngựa mẫu (ID=5) lẫn các cá thể mình tạo mới
      result = result.filter(
        (h) => h.OwnerUserID === parsedId || h.OwnerUserID === 5 || !h.OwnerUserID,
      );
    }

    return HttpResponse.json({
      data: result,
      total: result.length,
    });
  }),

  // GET /api/horses/:id - Chi tiết một con ngựa
  http.get('/api/horses/:id', ({ params }) => {
    const horse = getStoredHorseById(params.id);
    if (!horse) {
      return HttpResponse.json({ message: 'Horse not found' }, { status: 404 });
    }
    return HttpResponse.json(horse);
  }),

  // POST /api/horses - Tạo mới hồ sơ ngựa
  http.post('/api/horses', async ({ request }) => {
    const body = await request.json();

    // 1. Kiểm tra các trường dữ liệu bắt buộc
    if (!body.Name || !body.Name.trim()) {
      return HttpResponse.json(
        { message: 'Tên ngựa (Name) là bắt buộc' },
        { status: 400 },
      );
    }

    const newHorse = addStoredHorse(body);
    return HttpResponse.json(newHorse, { status: 201 });
  }),

  // PUT /api/horses/:id - Cập nhật thông tin ngựa
  http.put('/api/horses/:id', async ({ params, request }) => {
    const horseId = Number(params.id);
    const body = await request.json();
    const updated = updateStoredHorse(horseId, body);

    if (!updated) {
      return HttpResponse.json({ message: 'Horse not found' }, { status: 404 });
    }

    return HttpResponse.json(updated);
  }),

  // DELETE /api/horses/:id - Xóa hồ sơ ngựa
  http.delete('/api/horses/:id', ({ params }) => {
    const horseId = Number(params.id);
    const success = deleteStoredHorse(horseId);

    if (!success) {
      return HttpResponse.json({ message: 'Horse not found' }, { status: 404 });
    }

    return HttpResponse.json({ success: true, message: 'Horse deleted successfully' });
  }),
];
