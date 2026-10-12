import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// 首次成功访问后缓存站点外壳与已浏览素材；后续在弱网、断网时仍可打开。
const isProduction = (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD === true;
if ('serviceWorker' in navigator && isProduction) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 缓存能力是渐进增强，注册失败不影响页面正常使用。
    });
  });
}
