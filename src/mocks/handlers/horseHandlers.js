import { http, HttpResponse } from 'msw';
import initialHorses from '../data/horses.json';

// Bộ nhớ đệm tạm thời cho mock API trong phiên làm việc
let horses = [...initialHorses];

export const horseHandlers = [
  // GET /api/horses - Danh sách ngựa
  http.get('/api/horses', ({ request }) => {
    const url = new URL(request.url);
    const ownerId = url.searchParams.get('ownerId') || url.searchParams.get('ownerUserId');

    let result = horses;
    if (ownerId) {
      const parsedId = Number(ownerId);
      // Luôn đảm bảo tài khoản Customer thấy cả ngựa mẫu (ID=5) lẫn các cá thể mình tạo mới
      result = horses.filter(
        (h) => h.OwnerUserID === parsedId || h.OwnerUserID === 5,
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
    const horse = horses.find((h) => h.HorseID === Number(params.id));
    if (!horse) {
      return HttpResponse.json({ success: false, message: 'Horse not found' }, { status: 404 });
    }
    return HttpResponse.json({
      success: true,
      data: horse,
      ...horse,
    });
  }),

  // POST /api/horses - Tạo mới hồ sơ ngựa
  http.post('/api/horses', async ({ request }) => {
    let body;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        name: formData.get('name'),
        microchipNumber: formData.get('microchipNumber'),
        passportNumber: formData.get('passportNumber'),
        breed: formData.get('breed'),
        gender: formData.get('gender'),
        dateOfBirth: formData.get('dateOfBirth'),
        color: formData.get('color'),
        specialCareRequirements: formData.get('specialCareRequirements'),
      };
    } else {
      body = await request.json();
    }

    const horseName = body.Name || body.name;
    const microchip = body.MicrochipNumber || body.microchipNumber;

    // 1. Kiểm tra các trường dữ liệu bắt buộc theo DB schema
    if (!horseName || !String(horseName).trim()) {
      return HttpResponse.json(
        { success: false, message: 'Tên ngựa (Name) là bắt buộc' },
        { status: 400 },
      );
    }

    if (!microchip || !String(microchip).trim()) {
      return HttpResponse.json(
        { success: false, message: 'Mã vi mạch (MicrochipNumber) là bắt buộc' },
        { status: 400 },
      );
    }

    const trimmedMicrochip = String(microchip).trim();
    const passport = body.PassportNumber || body.passportNumber;
    const trimmedPassport = passport ? String(passport).trim() : '';

    // 2. Kiểm tra trùng lặp mã vi mạch (Unique constraint)
    const duplicateChip = horses.find(
      (h) => h.MicrochipNumber && h.MicrochipNumber.toLowerCase() === trimmedMicrochip.toLowerCase(),
    );
    if (duplicateChip) {
      return HttpResponse.json(
        { success: false, message: 'Mã vi mạch này đã tồn tại trong hệ thống' },
        { status: 409 },
      );
    }

    // 3. Kiểm tra trùng lặp số hộ chiếu (nếu có nhập)
    if (trimmedPassport) {
      const duplicatePassport = horses.find(
        (h) => h.PassportNumber && h.PassportNumber.toLowerCase() === trimmedPassport.toLowerCase(),
      );
      if (duplicatePassport) {
        return HttpResponse.json(
          { success: false, message: 'Số hộ chiếu này đã tồn tại trong hệ thống' },
          { status: 409 },
        );
      }
    }

    // 4. Sinh HorseID tuần tự kiểu số nguyên chuẩn DB IDENTITY
    const maxId = horses.reduce((max, h) => Math.max(max, Number(h.HorseID) || 0), 0);
    const newHorseId = maxId + 1;

    const newHorse = {
      HorseID: newHorseId,
      OwnerUserID: Number(body.OwnerUserID || body.ownerUserId) || 5,
      Name: String(horseName).trim(),
      MicrochipNumber: trimmedMicrochip,
      PassportNumber: trimmedPassport || `FEI-VN-2026-${String(newHorseId).padStart(2, '0')}`,
      Breed: body.Breed || body.breed || 'Thoroughbred',
      Gender: body.Gender || body.gender || 'Stallion',
      DateOfBirth: body.DateOfBirth || body.dateOfBirth || null,
      Color: body.Color || body.color ? String(body.Color || body.color).trim() : '',
      SpecialCareRequirements: body.SpecialCareRequirements || body.specialCareRequirements
        ? String(body.SpecialCareRequirements || body.specialCareRequirements).trim()
        : null,
      PhotoUrl: body.PhotoUrl || body.photoUrl || null,
      IsActive: true,
      CreatedAt: new Date().toISOString(),
    };

    // Đưa ngựa mới lên đầu danh sách để hiển thị ngay lập tức
    horses.unshift(newHorse);
    return HttpResponse.json({
      success: true,
      message: 'Tạo hồ sơ ngựa thành công',
      data: newHorse,
      ...newHorse,
    }, { status: 201 });
  }),

  // PUT /api/horses/:id - Cập nhật thông tin ngựa
  http.put('/api/horses/:id', async ({ params, request }) => {
    const horseId = Number(params.id);
    const body = await request.json();
    const index = horses.findIndex((h) => h.HorseID === horseId);

    if (index === -1) {
      return HttpResponse.json({ success: false, message: 'Horse not found' }, { status: 404 });
    }

    horses[index] = {
      ...horses[index],
      ...body,
      HorseID: horseId,
    };

    return HttpResponse.json({
      success: true,
      message: 'Cập nhật thông tin ngựa thành công',
      data: horses[index],
      ...horses[index],
    });
  }),

  // DELETE /api/horses/:id - Xóa hồ sơ ngựa
  http.delete('/api/horses/:id', ({ params }) => {
    const horseId = Number(params.id);
    const index = horses.findIndex((h) => h.HorseID === horseId);

    if (index === -1) {
      return HttpResponse.json({ success: false, message: 'Horse not found' }, { status: 404 });
    }

    horses.splice(index, 1);
    return HttpResponse.json({ success: true, message: 'Horse deleted successfully' });
  }),
];
