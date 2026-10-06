import { http, HttpResponse } from 'msw';
import usersData from '../data/users.json';

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    const user = usersData.find((u) => u.Email === body.email);
    if (!user) {
      return HttpResponse.json({ message: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
    }
    return HttpResponse.json({
      token: `mock-token-${user.UserID}`,
      user,
    });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: `Mã xác minh 6 chữ số đã được gửi tới email ${body.Email || body.email}`,
      email: body.Email || body.email,
    });
  }),

  http.post('/api/auth/google', async ({ request }) => {
    const body = await request.json();
    const email = body.email || body.Email || 'google_user@gmail.com';
    const fullName = body.FullName || body.fullName || body.name || 'Google User';
    const user = {
      UserID: Date.now(),
      FullName: fullName,
      Email: email,
      PhoneNumber: '+84988000999',
      Role: 'Customer',
      IsActive: true,
      CreatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      token: `mock-google-token-${user.UserID}`,
      user,
    });
  }),

  http.post('/api/auth/verify-email', async ({ request }) => {
    const body = await request.json();
    const newUser = {
      UserID: Date.now(),
      FullName: body.FullName || body.fullName || 'New Customer',
      Email: body.Email || body.email,
      PhoneNumber: body.PhoneNumber || '+84988000999',
      Role: 'Customer',
      IsActive: true,
      CreatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      token: `mock-token-${newUser.UserID}`,
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
      message: `Mã OTP đã được gửi đến email ${body.email}`,
    });
  }),

  http.post('/api/auth/verify-code', async ({ request }) => {
    const body = await request.json();
    // Chấp nhận mọi mã 6 ký tự hoặc 123456
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
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = authHeader.replace('Bearer mock-token-', '');
    const user = usersData.find((u) => u.UserID === Number(userId));
    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json(user);
  }),
];
