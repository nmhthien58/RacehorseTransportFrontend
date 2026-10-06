import { http, HttpResponse } from 'msw';
import initialHorses from '../data/horses.json';

// Bộ nhớ đệm tạm thời cho mock API trong phiên làm việc
let horses = [...initialHorses];

export const horseHandlers = [
  // GET /api/horses - Danh sách ngựa
  http.get('/api/horses', ({ request }) => {
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId');

    let result = horses;
    if (ownerId) {
      result = horses.filter((h) => h.OwnerUserID === Number(ownerId));
    }

    return HttpResponse.json({
      data: result,
      total: result.length,
    });
  }),

  // GET /api/horses/:id - Chi tiết một con ngựa
  http.get('/api/horses/:id', ({ params }) => {
    const horse = horses.find((h) => h.HorseID === Number(params.id));
    if (!horse) {
      return HttpResponse.json({ message: 'Horse not found' }, { status: 404 });
    }
    return HttpResponse.json(horse);
  }),

  // POST /api/horses - Tạo mới hồ sơ ngựa
  http.post('/api/horses', async ({ request }) => {
    const body = await request.json();
    const newHorse = {
      HorseID: Date.now(),
      OwnerUserID: body.OwnerUserID || 5, // Default tài khoản Customer demo (UserID = 5)
      Name: body.Name,
      MicrochipNumber: body.MicrochipNumber || '',
      PassportNumber: body.PassportNumber || '',
      Breed: body.Breed || 'Thoroughbred',
      Gender: body.Gender || 'Stallion',
      DateOfBirth: body.DateOfBirth || null,
      Color: body.Color || '',
      SpecialCareRequirements: body.SpecialCareRequirements || '',
      PhotoUrl: body.PhotoUrl || null,
      IsActive: true,
      CreatedAt: new Date().toISOString(),
      ...body,
    };

    horses.unshift(newHorse);
    return HttpResponse.json(newHorse, { status: 201 });
  }),

  // PUT /api/horses/:id - Cập nhật thông tin ngựa
  http.put('/api/horses/:id', async ({ params, request }) => {
    const horseId = Number(params.id);
    const body = await request.json();
    const index = horses.findIndex((h) => h.HorseID === horseId);

    if (index === -1) {
      return HttpResponse.json({ message: 'Horse not found' }, { status: 404 });
    }

    horses[index] = {
      ...horses[index],
      ...body,
      HorseID: horseId,
    };

    return HttpResponse.json(horses[index]);
  }),

  // DELETE /api/horses/:id - Xóa hồ sơ ngựa
  http.delete('/api/horses/:id', ({ params }) => {
    const horseId = Number(params.id);
    const index = horses.findIndex((h) => h.HorseID === horseId);

    if (index === -1) {
      return HttpResponse.json({ message: 'Horse not found' }, { status: 404 });
    }

    horses.splice(index, 1);
    return HttpResponse.json({ success: true, message: 'Horse deleted successfully' });
  }),
];
