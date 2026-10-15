import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import App from './App';
import './i18n';
import './index.css';
import { resetToCleanData } from './utils/dataReset';

// Khởi tạo chế độ dữ liệu trắng theo yêu cầu người dùng (giữ nguyên 100% tài khoản)
if (typeof window !== 'undefined' && localStorage.getItem('racehorse_data_initialized_v2') !== 'true') {
  resetToCleanData();
  localStorage.setItem('racehorse_data_initialized_v2', 'true');
}

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK === 'false') {
    return;
  }
  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#F59E0B',
              borderRadius: 8,
            },
          }}
        >
          <AntApp>
            <App />
          </AntApp>
        </ConfigProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}

// Mock (MSW) lỗi thì vẫn render app, tránh màn hình trắng; các request khi đó đi thẳng tới backend
void enableMocking()
  .catch((err) => {
    console.error('Failed to start mock service worker, continuing without mocks:', err);
  })
  .finally(renderApp);
