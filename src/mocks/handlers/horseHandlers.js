import { http, HttpResponse } from 'msw';
import {
  getStoredHorses,
  getStoredHorseById,
  addStoredHorse,
  updateStoredHorse,
  deleteStoredHorse,
  addHorseVetRecord,
  updateHorseVetRecord,
  deleteHorseVetRecord,
} from '../../utils/horseStorage';

function normalizeHorse(h) {
  if (!h) return h;
  const hasVet = Boolean(
    h.HasVetRecord !== false &&
    h.hasVetRecord !== false &&
    ((h.VetRecords && h.VetRecords.length > 0) ||
      (h.vetRecords && h.vetRecords.length > 0) ||
      h.hasVetRecord ||
      h.HasVetRecord)
  );
  const isCritical = (h.HealthStatus || h.healthStatus) === 'Critical';
  const isEligible = hasVet && !isCritical;
  const rawRecords = h.VetRecords || h.vetRecords || [];
  const records = rawRecords.map((r, idx) => ({
    ...r,
    recordId: r.RecordID || r.recordId || idx + 1,
    RecordID: r.RecordID || r.recordId || idx + 1,
    title: r.Title || r.title || 'Hồ sơ Thú y',
    Title: r.Title || r.title || 'Hồ sơ Thú y',
    recordType: r.RecordType || r.recordType || 'GeneralCheckup',
    RecordType: r.RecordType || r.recordType || 'GeneralCheckup',
    veterinarian: r.Veterinarian || r.veterinarian || 'Dr. Sarah Jenkins',
    Veterinarian: r.Veterinarian || r.veterinarian || 'Dr. Sarah Jenkins',
    clinic: r.Clinic || r.clinic || 'IET Equine Clinic',
    Clinic: r.Clinic || r.clinic || 'IET Equine Clinic',
    date: r.Date || r.date || '',
    Date: r.Date || r.date || '',
    validUntil: r.ValidUntil || r.validUntil || '',
    ValidUntil: r.ValidUntil || r.validUntil || '',
    status: r.Status || r.status || 'Valid',
    Status: r.Status || r.status || 'Valid',
    notes: r.Notes || r.notes || '',
    Notes: r.Notes || r.notes || '',
    fileName: r.FileName || r.fileName || 'Vet_Record.pdf',
    FileName: r.FileName || r.fileName || 'Vet_Record.pdf',
  }));

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
    hasVetRecord: hasVet,
    HasVetRecord: hasVet,
    isEligibleForTransport: isEligible,
    IsEligibleForTransport: isEligible,
    vetRecords: records,
    VetRecords: records,
    isActive: h.IsActive !== undefined ? h.IsActive : (h.isActive !== undefined ? h.isActive : true),
    IsActive: h.IsActive !== undefined ? h.IsActive : (h.isActive !== undefined ? h.isActive : true),
  };
}

async function parseHorseRequestBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return {
      name: formData.get('name') || formData.get('Name'),
      microchipNumber: formData.get('microchipNumber') || formData.get('MicrochipNumber'),
      passportNumber: formData.get('passportNumber') || formData.get('PassportNumber'),
      breed: formData.get('breed') || formData.get('Breed'),
      gender: formData.get('gender') || formData.get('Gender'),
      dateOfBirth: formData.get('dateOfBirth') || formData.get('DateOfBirth'),
      color: formData.get('color') || formData.get('Color'),
      specialCareRequirements: formData.get('specialCareRequirements') || formData.get('SpecialCareRequirements'),
      healthStatus: formData.get('healthStatus') || formData.get('HealthStatus'),
      ownerUserId: 5,
      isActive: true,
    };
  }
  return await request.json();
}

export const horseHandlers = [
  // GET /api/horses - Danh sách ngựa
  http.get('/api/horses', ({ request }) => {
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId') || url.searchParams.get('ownerUserId');

    let result = getStoredHorses().map(normalizeHorse);
    if (ownerId) {
      const parsedId = Number(ownerId);
      if (parsedId === 5) {
        result = result.filter(
          (h) => h.ownerUserId === 5 || !h.ownerUserId,
        );
      } else {
        result = result.filter(
          (h) => h.ownerUserId === parsedId,
        );
      }
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
    const body = await parseHorseRequestBody(request);

    const horseName = body.name || body.Name;
    if (!horseName || !horseName.trim()) {
      return HttpResponse.json(
        { success: false, message: 'Tên ngựa là bắt buộc' },
        { status: 400 },
      );
    }

    try {
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
        vetRecordTitle: body.vetRecordTitle,
        vetRecordType: body.vetRecordType,
        vetRecordFileName: body.vetRecordFileName,
        veterinarian: body.veterinarian,
        clinic: body.clinic,
        issueDate: body.issueDate,
        validUntil: body.validUntil,
        vetNotes: body.vetNotes,
        vetRecord: body.vetRecord,
        VetRecords: body.VetRecords || body.vetRecords,
        hasVetRecord: body.hasVetRecord,
        OwnerUserID: Number(body.ownerUserId || body.OwnerUserID) || 5,
        IsActive: true,
      });

      const normalized = normalizeHorse(newHorse);
      return HttpResponse.json({
        success: true,
        message: 'Tạo hồ sơ ngựa thành công',
        data: normalized,
        ...normalized,
      }, { status: 201 });
    } catch (err) {
      return HttpResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }),

  // PUT /api/horses/:id - Cập nhật thông tin ngựa
  http.put('/api/horses/:id', async ({ params, request }) => {
    const horseId = Number(params.id);
    const body = await parseHorseRequestBody(request);

    try {
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
    } catch (err) {
      return HttpResponse.json({ success: false, message: err.message }, { status: 400 });
    }
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

  // POST /api/horses/:id/vet-records - Thêm hồ sơ thú y
  http.post('/api/horses/:id/vet-records', async ({ params, request }) => {
    const horseId = Number(params.id);
    const body = await request.json();
    const newRecord = addHorseVetRecord(horseId, body);
    if (!newRecord) {
      return HttpResponse.json({ success: false, message: 'Horse not found' }, { status: 404 });
    }
    const updatedHorse = getStoredHorseById(horseId);
    return HttpResponse.json(
      {
        success: true,
        message: 'Bổ sung hồ sơ thú y thành công',
        data: newRecord,
        horse: normalizeHorse(updatedHorse),
      },
      { status: 201 },
    );
  }),

  // PUT /api/horses/:id/vet-records/:recordId - Chỉnh sửa hồ sơ thú y
  http.put('/api/horses/:id/vet-records/:recordId', async ({ params, request }) => {
    const horseId = Number(params.id);
    const recordId = Number(params.recordId);
    const body = await request.json();
    const updated = updateHorseVetRecord(horseId, recordId, body);
    if (!updated) {
      return HttpResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }
    const updatedHorse = getStoredHorseById(horseId);
    return HttpResponse.json({
      success: true,
      message: 'Cập nhật hồ sơ thú y thành công',
      data: updated,
      horse: normalizeHorse(updatedHorse),
    });
  }),

  // DELETE /api/horses/:id/vet-records/:recordId - Xóa hồ sơ thú y
  http.delete('/api/horses/:id/vet-records/:recordId', ({ params }) => {
    const horseId = Number(params.id);
    const recordId = Number(params.recordId);
    const success = deleteHorseVetRecord(horseId, recordId);
    if (!success) {
      return HttpResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }
    const updatedHorse = getStoredHorseById(horseId);
    return HttpResponse.json({
      success: true,
      message: 'Xóa hồ sơ thú y thành công',
      horse: normalizeHorse(updatedHorse),
    });
  }),
];
