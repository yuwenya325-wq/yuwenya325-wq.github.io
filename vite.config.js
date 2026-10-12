var _a, _b;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
/**
 * 线上发布沙箱会通过反向代理用外部域名访问服务，因此：
 * - host 必须绑 0.0.0.0，否则外部请求进不来；
 * - allowedHosts 必须放开，否则 Vite 会以 "Blocked request. This host is not allowed." 拒绝代理域名；
 * - 端口读取沙箱注入的 PORT 环境变量（服务必须监听该端口），本地未注入时回落到 4173。
 *
 * 本地开发不受影响：CLI 传入的 --host / --port 优先级高于这里的配置。
 * 这里用 globalThis 取环境变量而非直接写 process，避免为配置文件额外引入 @types/node 依赖。
 */
var injectedPort = (_b = (_a = globalThis
    .process) === null || _a === void 0 ? void 0 : _a.env) === null || _b === void 0 ? void 0 : _b.PORT;
var port = Number(injectedPort) || 4173;
export default defineConfig({
    plugins: [react()],
    server: { host: '0.0.0.0', port: port, allowedHosts: true },
    preview: { host: '0.0.0.0', port: port, allowedHosts: true },
});
