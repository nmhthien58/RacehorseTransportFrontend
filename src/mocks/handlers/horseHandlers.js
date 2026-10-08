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
      const parsedId = Number(ownerId);
      // Luôn đảm bảo tài khoản Customer thấy cả ngựa mẫu (ID=5) lẫn các cá thể mình tạo mới
      result = horses.filter(
        (h) => h.OwnerUserID === parsedId || h.OwnerUserID === 5,
      );
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

    // 1. Kiểm tra các trường dữ liệu bắt buộc theo DB schema
    if (!body.Name || !body.Name.trim()) {
      return HttpResponse.json(
        { message: 'Tên ngựa (Name) là bắt buộc' },
        { status: 400 },
      );
    }

    if (!body.MicrochipNumber || !body.MicrochipNumber.trim()) {
      return HttpResponse.json(
        { message: 'Mã vi mạch (MicrochipNumber) là bắt buộc' },
        { status: 400 },
      );
    }

    const trimmedMicrochip = body.MicrochipNumber.trim();
    const trimmedPassport = body.PassportNumber ? body.PassportNumber.trim() : '';

    // 2. Kiểm tra trùng lặp mã vi mạch (Unique constraint)
    const duplicateChip = horses.find(
      (h) => h.MicrochipNumber && h.MicrochipNumber.toLowerCase() === trimmedMicrochip.toLowerCase(),
    );
    if (duplicateChip) {
      return HttpResponse.json(
        { message: 'Mã vi mạch này đã tồn tại trong hệ thống' },
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
          { message: 'Số hộ chiếu này đã tồn tại trong hệ thống' },
          { status: 409 },
        );
      }
    }

    // 4. Sinh HorseID tuần tự kiểu số nguyên chuẩn DB IDENTITY
    const maxId = horses.reduce((max, h) => Math.max(max, Number(h.HorseID) || 0), 0);
    const newHorseId = maxId + 1;

    const newHorse = {
      HorseID: newHorseId,
      OwnerUserID: Number(body.OwnerUserID) || 5, // Mặc định tài khoản Customer demo nếu không truyền
      Name: body.Name.trim(),
      MicrochipNumber: trimmedMicrochip,
      PassportNumber: trimmedPassport || `FEI-VN-2026-${String(newHorseId).padStart(2, '0')}`,
      Breed: body.Breed || 'Thoroughbred',
      Gender: body.Gender || 'Stallion',
      DateOfBirth: body.DateOfBirth || null,
      Color: body.Color ? body.Color.trim() : '',
      SpecialCareRequirements: body.SpecialCareRequirements ? body.SpecialCareRequirements.trim() : null,
      PhotoUrl: body.PhotoUrl || null,
      IsActive: true,
      CreatedAt: new Date().toISOString(),
    };

    // Đưa ngựa mới lên đầu danh sách để hiển thị ngay lập tức
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
