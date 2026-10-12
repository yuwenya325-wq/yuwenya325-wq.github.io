# 于文雅 · VISUAL / AIGC 作品集

在线访问：**https://yuwenya325-wq.github.io/**

## 技术栈

Vite 6 · React 19 · TypeScript 5.7 · Tailwind CSS 3，路由与 3D 图标均为零依赖手写实现。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm run build   # 产物输出到 dist/
pnpm preview     # 本地预览构建结果
```

## 部署

推送到 `main` 分支即由 GitHub Actions 自动构建并发布到 GitHub Pages，配置见
`.github/workflows/deploy.yml`。

两点必须注意：

1. 页面内所有资源引用都是**根路径绝对地址**（`/works/...`、`/characters/...`），
   因此本站必须发布在 `yuwenya325-wq.github.io` 这个**根域名**下，不能放到子路径仓库上。
2. GitHub Pages 没有服务端 rewrite，构建流程会把 `dist/index.html` 复制为
   `dist/404.html`，用于承接 `/visual/poster`、`/film/<slug>` 这类深链刷新。
