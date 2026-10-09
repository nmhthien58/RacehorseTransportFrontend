import { http, HttpResponse } from 'msw';
import {
  getStoredHorses,
  getStoredHorseById,
  addStoredHorse,
  updateStoredHorse,
  deleteStoredHorse,
} from '../../utils/horseStorage';

function normalizeHorse(h) {
  if (!h) return h;
  return {
    ...h,
    horseId: h.HorseID || h.horseId,
    HorseID: h.HorseID || h.horseId,
    ownerUserId: h.OwnerUserID || h.ownerUserId || 5,
    OwnerUserID: h.OwnerUserID || h.ownerUserId || 5,
    name: h.Name || h.name,
    Name: h.Name || h.name,
    microchipNumber: h.MicrochipNumber || h.microchipNumber,
    MicrochipNumber: h.MicrochipNumber || h.microchipNumber,
    passportNumber: h.PassportNumber || h.passportNumber,
    PassportNumber: h.PassportNumber || h.passportNumber,
    breed: h.Breed || h.breed,
    Breed: h.Breed || h.breed,
    gender: h.Gender || h.gender,
    Gender: h.Gender || h.gender,
    dateOfBirth: h.DateOfBirth || h.dateOfBirth,
    DateOfBirth: h.DateOfBirth || h.dateOfBirth,
    color: h.Color || h.color,
    Color: h.Color || h.color,
    specialCareRequirements: h.SpecialCareRequirements || h.specialCareRequirements,
    SpecialCareRequirements: h.SpecialCareRequirements || h.specialCareRequirements,
    healthStatus: h.HealthStatus || h.healthStatus || 'Good',
    HealthStatus: h.HealthStatus || h.healthStatus || 'Good',
    isActive: h.IsActive !== undefined ? h.IsActive : (h.isActive !== undefined ? h.isActive : true),
    IsActive: h.IsActive !== undefined ? h.IsActive : (h.isActive !== undefined ? h.isActive : true),
  };
}

export const horseHandlers = [
  // GET /api/horses - Danh sách ngựa
  http.get('/api/horses', ({ request }) => {
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId') || url.searchParams.get('ownerUserId');

    let result = getStoredHorses().map(normalizeHorse);
    if (ownerId) {
      const parsedId = Number(ownerId);
      result = result.filter(
        (h) => h.ownerUserId === parsedId || h.ownerUserId === 5 || !h.ownerUserId,
      );
    }

    return HttpResponse.json({
      success: true,
      data: result,
      total: result.length,
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: result.length,
        totalPages: Math.ceil(result.length / 10) || 1,
      },
    });
  }),

  // GET /api/horses/:id - Chi tiết một con ngựa
  http.get('/api/horses/:id', ({ params }) => {
    const horse = getStoredHorseById(params.id);
    if (!horse) {
      return HttpResponse.json({ success: false, message: 'Horse not found' }, { status: 404 });
    }
    const normalized = normalizeHorse(horse);
    return HttpResponse.json({
      success: true,
      data: normalized,
      ...normalized,
    });
  }),

  // POST /api/horses - Tạo mới hồ sơ ngựa
  http.post('/api/horses', async ({ request }) => {
    let body;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        name: formData.get('name') || formData.get('Name'),
        microchipNumber: formData.get('microchipNumber') || formData.get('MicrochipNumber'),
        passportNumber: formData.get('passportNumber') || formData.get('PassportNumber'),
        breed: formData.get('breed') || formData.get('Breed'),
        gender: formData.get('gender') || formData.get('Gender'),
        dateOfBirth: formData.get('dateOfBirth') || formData.get('DateOfBirth'),
        color: formData.get('color') || formData.get('Color'),
        specialCareRequirements: formData.get('specialCareRequirements') || formData.get('SpecialCareRequirements'),
        healthStatus: formData.get('healthStatus') || formData.get('HealthStatus') || 'Good',
        ownerUserId: 5,
        isActive: true,
      };
    } else {
      body = await request.json();
    }

    const horseName = body.name || body.Name;
    if (!horseName || !horseName.trim()) {
      return HttpResponse.json(
        { success: false, message: 'Tên ngựa là bắt buộc' },
        { status: 400 },
      );
    }

    const newHorse = addStoredHorse({
      Name: horseName,
      Breed: body.breed || body.Breed || 'Thoroughbred',
      Gender: body.gender || body.Gender || 'Stallion',
      DateOfBirth: body.dateOfBirth || body.DateOfBirth,
      Color: body.color || body.Color || '',
      MicrochipNumber: body.microchipNumber || body.MicrochipNumber || '',
      PassportNumber: body.passportNumber || body.PassportNumber || '',
      SpecialCareRequirements: body.specialCareRequirements || body.SpecialCareRequirements || '',
      HealthStatus: body.healthStatus || body.HealthStatus || 'Good',
      OwnerUserID: 5,
      IsActive: true,
    });

    const normalized = normalizeHorse(newHorse);
    return HttpResponse.json({
      success: true,
      message: 'Tạo hồ sơ ngựa thành công',
      data: normalized,
      ...normalized,
    }, { status: 201 });
  }),

  // PUT /api/horses/:id - Cập nhật thông tin ngựa
  http.put('/api/horses/:id', async ({ params, request }) => {
    const horseId = Number(params.id);
    let body;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        name: formData.get('name') || formData.get('Name'),
        microchipNumber: formData.get('microchipNumber') || formData.get('MicrochipNumber'),
        passportNumber: formData.get('passportNumber') || formData.get('PassportNumber'),
        breed: formData.get('breed') || formData.get('Breed'),
        gender: formData.get('gender') || formData.get('Gender'),
        dateOfBirth: formData.get('dateOfBirth') || formData.get('DateOfBirth'),
        color: formData.get('color') || formData.get('Color'),
        specialCareRequirements: formData.get('specialCareRequirements') || formData.get('SpecialCareRequirements'),
        healthStatus: formData.get('healthStatus') || formData.get('HealthStatus'),
      };
    } else {
      body = await request.json();
    }

    const updated = updateStoredHorse(horseId, {
      Name: body.name || body.Name,
      Breed: body.breed || body.Breed,
      Gender: body.gender || body.Gender,
      DateOfBirth: body.dateOfBirth || body.DateOfBirth,
      Color: body.color || body.Color,
      MicrochipNumber: body.microchipNumber || body.MicrochipNumber,
      PassportNumber: body.passportNumber || body.PassportNumber,
      SpecialCareRequirements: body.specialCareRequirements || body.SpecialCareRequirements,
      HealthStatus: body.healthStatus || body.HealthStatus,
    });

    if (!updated) {
      return HttpResponse.json({ success: false, message: 'Horse not found' }, { status: 404 });
    }

    const normalized = normalizeHorse(updated);
    return HttpResponse.json({
      success: true,
      message: 'Cập nhật hồ sơ ngựa thành công',
      data: normalized,
      ...normalized,
    });
  }),

  // DELETE /api/horses/:id - Xóa hồ sơ ngựa
  http.delete('/api/horses/:id', ({ params }) => {
    const horseId = Number(params.id);
    const success = deleteStoredHorse(horseId);

    if (!success) {
      return HttpResponse.json({ success: false, message: 'Horse not found' }, { status: 404 });
    }

    return HttpResponse.json({ success: true, message: 'Xóa hồ sơ ngựa thành công' });
  }),
];
