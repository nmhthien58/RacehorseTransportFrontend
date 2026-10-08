import { http, HttpResponse } from 'msw';
import usersData from '../data/users.json';

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    const user = usersData.find((u) => u.email === body.email);
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
    return HttpResponse.json({
      success: true,
      message: `Đăng ký thành công. Mã xác minh đã được gửi tới email ${body.email}`,
      data: {
        email: body.email,
      },
      email: body.email,
    });
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

  http.post('/api/auth/verify-email', async ({ request }) => {
    const body = await request.json();
    const newUser = {
      userId: Date.now(),
      fullName: body.fullName || 'New Customer',
      email: body.email,
      phoneNumber: body.phoneNumber || '+84988000999',
      role: 'Customer',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const token = `mock-token-${newUser.userId}`;
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: token,
        user: newUser,
      },
      token,
      user: newUser,
    });
  }),

  http.post('/api/auth/resend-otp', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: `Mã xác minh mới đã được gửi tới email ${body.email}`,
    });
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: `Mã OTP hoặc liên kết đặt lại đã được gửi đến email ${body.email}`,
    });
  }),

  http.post('/api/auth/verify-code', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      verifyToken: `verify-token-${Date.now()}`,
      email: body.email,
    });
  }),

  http.post('/api/auth/reset-password', async () => {
    return HttpResponse.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
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
