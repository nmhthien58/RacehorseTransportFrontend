import React, { useState } from 'react';
import { message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@features/auth/store/authStore';
import { googleLoginApi } from '@features/auth/services/authService';
import { ROUTES } from '@routes/routes';

/**
 * Hook xử lý đăng nhập Google OAuth 2.0 bằng Google Identity Services (GSI)
 * @returns {{ loginWithGoogle: () => void, isGoogleLoading: boolean }}
 */
export const useGoogleAuth = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const loginWithGoogle = () => {
    // 1. Trường hợp đã cấu hình Google Client ID thật trong file .env
    if (clientId && clientId.trim().length > 10) {
      if (!window.google?.accounts?.oauth2) {
        message.error('Thư viện Google SDK đang tải, vui lòng thử lại sau 2 giây.');
        return;
      }

      setIsGoogleLoading(true);
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId.trim(),
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setIsGoogleLoading(false);
              message.error('Đăng nhập Google bị hủy hoặc thất bại.');
              return;
            }

            try {
              // Lấy profile thật của người dùng từ Google userinfo API
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              });
              const profile = await res.json();

              // Gửi token và thông tin xác thực tới Backend
              const authRes = await googleLoginApi({
                email: profile.email,
                fullName: profile.name || profile.given_name || 'Google Customer',
                avatar: profile.picture,
                googleToken: tokenResponse.access_token,
              });

              const user = authRes.user || {
                userId: Date.now(),
                fullName: profile.name || 'Google Customer',
                email: profile.email,
                role: 'Customer',
                isActive: true,
              };
              const token = authRes.token || `mock-google-token-${user.userId}`;

              login(user, token);
              message.success(`Đăng nhập thành công với tài khoản Google: ${profile.email}`);
              navigate(ROUTES.CUSTOMER_DASHBOARD, { replace: true });
            } catch {
              message.error('Lỗi kết nối khi xác thực tài khoản Google.');
            } finally {
              setIsGoogleLoading(false);
            }
          },
        });

        client.requestAccessToken();
      } catch (err) {
        setIsGoogleLoading(false);
        console.error('Google OAuth init error:', err);
        message.error('Không thể khởi tạo phiên đăng nhập Google.');
      }
      return;
    }

    // 2. Trường hợp chưa cấu hình Google Client ID trong .env:
    // Mở hộp thoại thông báo hướng dẫn và cung cấp nút đăng nhập test với tài khoản Google giả lập
    Modal.confirm({
      title: 'Cấu hình Google OAuth Client ID',
      width: 480,
      content: React.createElement(
        'div',
        { style: { fontSize: 13, lineHeight: 1.6, color: '#334155' } },
        React.createElement(
          'p',
          null,
          'Tính năng đăng nhập Google thật cần ',
          React.createElement('strong', null, 'Google Client ID'),
          ' từ Google Cloud Console.',
        ),
        React.createElement(
          'div',
          {
            style: {
              background: '#F8FAFC',
              padding: 10,
              borderRadius: 6,
              border: '1px solid #E2E8F0',
              marginBottom: 12,
            },
          },
          React.createElement('strong', null, 'Cách thêm Client ID:'),
          React.createElement(
            'ol',
            { style: { paddingLeft: 18, margin: '6px 0 0 0' } },
            React.createElement(
              'li',
              null,
              'Vào console.cloud.google.com tạo OAuth 2.0 Client ID.',
            ),
            React.createElement('li', null, 'Thêm Authorized JavaScript Origin: http://localhost:3000'),
            React.createElement(
              'li',
              null,
              'Dán Client ID vào biến VITE_GOOGLE_CLIENT_ID trong file .env.',
            ),
          ),
        ),
        React.createElement(
          'p',
          { style: { margin: 0 } },
          'Bạn có thể đăng nhập thử nghiệm ngay bây giờ bằng tài khoản Google demo (',
          React.createElement('strong', null, 'Jane Smith'),
          ' - customer@test.com)?',
        ),
      ),
      okText: 'Đăng nhập Google Test',
      cancelText: 'Để sau',
      onOk: async () => {
        setIsGoogleLoading(true);
        try {
          const authRes = await googleLoginApi({
            email: 'customer@test.com',
            fullName: 'Jane Smith (Google)',
          });
          login(authRes.user, authRes.token);
          message.success('Đăng nhập thành công với tài khoản Google test!');
          navigate(ROUTES.CUSTOMER_DASHBOARD, { replace: true });
        } finally {
          setIsGoogleLoading(false);
        }
      },
    });
  };

  return { loginWithGoogle, isGoogleLoading };
};
