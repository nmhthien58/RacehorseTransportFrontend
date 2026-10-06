import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App';
import './i18n';
import './index.css';

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') {
    return;
  }
  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
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
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
});
