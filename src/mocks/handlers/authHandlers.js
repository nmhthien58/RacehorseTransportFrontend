import { http, HttpResponse } from 'msw';
import usersData from '../data/users.json';

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    const rawEmail = (body?.email || '').trim().toLowerCase();

    let candidateUsers = [...usersData];
    try {
      if (typeof window !== 'undefined') {
        const rawUsers = localStorage.getItem('racehorse_users_storage');
        if (rawUsers) {
          const parsed = JSON.parse(rawUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            candidateUsers = parsed;
          }
        }
      }
    } catch {
      // fallback
    }

    let user = candidateUsers.find((u) => (u.email || '').trim().toLowerCase() === rawEmail);

    if (!user) {
      if (rawEmail === 'coordinator@test.com' || rawEmail === 'nam.le@fleet.com' || rawEmail === 'fleet@test.com' || rawEmail === 'coordinator@gmail.com') {
        user = candidateUsers.find((u) => u.role === 'FleetCoordinator') || usersData.find((u) => u.role === 'FleetCoordinator');
      } else if (rawEmail === 'admin@test.com' || rawEmail === 'manager@test.com' || rawEmail === 'admin@admin.com') {
        user = candidateUsers.find((u) => u.role === 'LogisticsManager') || usersData.find((u) => u.role === 'LogisticsManager');
      } else if (rawEmail === 'specialist@test.com' || rawEmail === 'mai.nguyen@vet.com') {
        user = candidateUsers.find((u) => u.role === 'TransportSpecialist') || usersData.find((u) => u.role === 'TransportSpecialist');
      } else if (rawEmail === 'driver@test.com' || rawEmail === 'duc.pham@driver.com') {
        user = candidateUsers.find((u) => u.role === 'Driver') || usersData.find((u) => u.role === 'Driver');
      } else if (rawEmail === 'escort@test.com' || rawEmail === 'elena.rostova@vet.com') {
        user = candidateUsers.find((u) => u.role === 'Escort') || usersData.find((u) => u.role === 'Escort');
      } else if (rawEmail === 'customer@test.com') {
        user = candidateUsers.find((u) => u.role === 'Customer') || usersData.find((u) => u.role === 'Customer');
      }
    }

    if (!user) {
      return HttpResponse.json(
        { success: false, message: 'Email hoặc mật khẩu không đúng', errors: ['Invalid credentials'] },
        { status: 401 },
      );
    }
    const token = `mock-token-${user.userId}`;
    const refreshToken = `mock-refresh-token-${user.userId}`;
    return HttpResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        accessToken: token,
        refreshToken,
        user,
      },
      // Giữ tương thích trực tiếp
      token,
      refreshToken,
      user,
    });
  }),

  http.post('/api/auth/refresh', async ({ request }) => {
    const body = await request.json();
    const refreshedToken = `mock-token-refreshed-${Date.now()}`;
    const newRefreshToken = body.refreshToken || `mock-refresh-token-${Date.now()}`;
    return HttpResponse.json({
      success: true,
      message: 'Làm mới token thành công',
      data: {
        accessToken: refreshedToken,
        refreshToken: newRefreshToken,
      },
      token: refreshedToken,
    });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    // Khớp backend: đăng ký xong trả token ngay, không cần xác minh email
    const user = {
      userId: Date.now(),
      fullName: body.fullName || 'New Customer',
      email: body.email,
      phoneNumber: body.phoneNumber || null,
      role: 'Customer',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(
      {
        success: true,
        message: 'Account registered successfully',
        data: {
          accessToken: `mock-token-${user.userId}`,
          refreshToken: `mock-refresh-${user.userId}`,
          user,
        },
      },
      { status: 201 },
    );
  }),

  http.post('/api/auth/google', async ({ request }) => {
    const body = await request.json();
    const email = body.email || 'google_user@gmail.com';
    const fullName = body.fullName || body.name || 'Google User';
    const user = {
      userId: Date.now(),
      fullName,
      email,
      phoneNumber: '+84988000999',
      role: 'Customer',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const token = `mock-google-token-${user.userId}`;
    const refreshToken = `mock-google-refresh-${user.userId}`;
    return HttpResponse.json({
      success: true,
      message: 'Đăng nhập Google thành công',
      data: {
        accessToken: token,
        refreshToken,
        user,
      },
      token,
      refreshToken,
      user,
    });
  }),

  // Khớp backend: luôn trả 200 và gửi link /reset-password?token=... qua email
  http.post('/api/auth/forgot-password', async () => {
    return HttpResponse.json({
      success: true,
      message: 'If this email is registered, a password reset link has been sent.',
      data: null,
    });
  }),

  http.post('/api/auth/reset-password', async ({ request }) => {
    const body = await request.json();
    if (!body.token) {
      return HttpResponse.json(
        { success: false, message: 'Token is required.', data: null },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      success: true,
      message: 'Password reset successfully',
      data: null,
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true, message: 'Đăng xuất thành công' });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = authHeader.replace('Bearer mock-token-', '');
    const user = usersData.find((u) => u.userId === Number(userId)) || usersData[0];
    return HttpResponse.json({
      success: true,
      data: user,
    });
  }),

  // PUT /api/auth/me - Cập nhật hồ sơ cá nhân
  http.put('/api/auth/me', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const tokenPart = authHeader.replace('Bearer ', '');
    const userIdStr = tokenPart.replace('mock-token-', '').replace('mock-google-token-', '');
    const userId = Number(userIdStr);
    const body = await request.json();

    let user = usersData.find((u) => u.userId === userId);
    if (!user) {
      user = {
        userId: userId || Date.now(),
        email: body.email || 'user@test.com',
        role: body.role || 'Customer',
        isActive: true,
      };
      usersData.push(user);
    }

    if (body.fullName !== undefined) user.fullName = body.fullName;
    if (body.phoneNumber !== undefined) user.phoneNumber = body.phoneNumber;
    if (body.farmName !== undefined) user.farmName = body.farmName;
    if (body.club !== undefined) user.club = body.club;
    if (body.address !== undefined) user.address = body.address;
    if (body.farmAddress !== undefined) user.farmAddress = body.farmAddress;
    if (body.city !== undefined) user.city = body.city;
    if (body.country !== undefined) user.country = body.country;

    return HttpResponse.json({
      success: true,
      message: 'Cập nhật thông tin hồ sơ thành công',
      data: user,
      user,
    });
  }),

  // Dropdown nhân sự
  http.get('/api/users/staff', ({ request }) => {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    let list = usersData;
    if (role) {
      list = usersData.filter((u) => u.role === role);
    }
    return HttpResponse.json({
      success: true,
      data: list.map((u) => ({
        userId: u.userId,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
      })),
    });
  }),
];
