# 网站素材自动优化与发布规范

本目录是 TOONHUB（于文雅 VISUAL/AIGC）作品集网站的**素材处理统一入口**。
从现在起，所有新增图片与视频按本规范执行。

## 一、目录约定

```
assets/
  originals/<分类>/        原始素材归档（不在 public 下，Vite 不部署）
  media-manifest.json      转码清单（自动生成，含尺寸/体积/来源，勿手改）
public/
  works/<分类>/            作品图（poster / banner / typography / ip-vi / ai-film / app）
  icons/                   分类图标
  characters/              首屏 3D 角色图
  images/about/            ABOUT 真人照片
tools/media/
  optimize.py              图像处理脚本（转码 / 报告 / 校验）
  inspect.py               WebP 体检（尺寸 / 模式 / 透明通道）
```

原始图片**永远保留**：脚本会自动把源文件复制到 `assets/originals/<分类>/`，
之后对 `public/` 下产物的任何改动都不影响原件。

## 二、规格参数（可按图片实际质量微调）

| 用途 | 档位 | 最大宽度 | 质量 | 文件名 |
|---|---|---|---|---|
| 缩略图 | thumb | 600px | 80 | `<slug>-thumb.webp` |
| 作品封面 | cover | 1200px | 85 | `<slug>-cover.webp` |
| 详情大图 | full | 1920px | 88 | `<slug>-full.webp` |
| 图标素材 | icon | 512px | 90 | `<slug>.webp` |

内置预设：`work`=thumb+cover+full，`hero`=cover+thumb（首屏大图两档响应式），
`single`=仅 cover，`icon`=仅 icon。
源图小于目标宽度时**不放大**；两个档位算出同一尺寸时**只保留高质量那份**，不重复存放。
文字细节多、边缘锐利的图（字体 / 版式 / 线条作品）会自动把 cover/full/icon 提到 q95。

## 三、常用命令

使用托管 Python（系统无 pip 环境，勿用全局 python）：

```bash
# 1. 作品图（生成 thumb/cover/full 三档）
"C:/Users/PC/.workbuddy/binaries/python/versions/3.13.12/python.exe" \
  tools/media/optimize.py 原图1.png 原图2.png \
  --category poster --slug poster-001

# 2. 首屏 / 大幅展示图（cover+thumb 两档）
... optimize.py 角色.png --category characters --preset hero --out public

# 3. 图标
... optimize.py icon.png --category icons --preset icon --slug category-poster

# 4. 转码后体检：WebP 能否打开、透明通道是否保留
"C:/Users/PC/.workbuddy/binaries/python/versions/3.13.12/python.exe" tools/media/inspect.py

# 5. 上传后校验：清单里的文件都在 + 源码引用的资源无 404
... optimize.py --verify
```

slug 命名规则：`<分类或项目>-<序号>`，如 `poster-001`、`ip01-turnaround`。
批量处理且文件名本身唯一时，不加序号后缀。

## 四、前端接入约定

作品数据统一放 `src/data/visual.ts`（平面与 IP 作品）与 `src/data/ai-film.ts`（AI 影视）。
新增作品**只需**：① 素材跑一遍 optimize.py；② 在数据文件里加一条记录。
页面布局、组件不需要动。

数据字段：

```ts
{
  slug: 'poster-001',
  thumb: '/works/poster/poster-001-thumb.webp',   // 列表用
  cover: '/works/poster/poster-001-cover.webp',   // 网格 / 焦点用
  full:  '/works/poster/poster-001-full.webp',    // 灯箱放大用
  width: 1200, height: 1697,                      // 防布局跳动的占位比例
  title: '作品名', meta: '尺寸 / 年份 / 客户',
}
```

组件统一用 `src/components/media/WorkImage.tsx` 渲染：
自动 srcset/sizes 选档、非首屏 lazy、首屏 eager+高优先级、按宽高比占位、加载失败兜底。

## 五、B 站视频

- AI 影视**不上传视频文件**，只登记 B 站链接（`src/data/ai-film.ts`）
- 只存 BV 号 + 分 P，播放用官方 `player.bilibili.com` iframe
- 封面若有授权图片，按规范转 WebP；否则用 B 站封面域名（i0.hdslb.com，官方允许外链的封面域）
- 前端 `BilibiliEmbed` 组件：封面门面式加载（点击才挂 iframe）+「前往B站观看」按钮
- 不下载视频、不接第三方解析服务；平台限制内嵌时展示封面 + 原始链接

## 六、每次上传后的检查清单

- [ ] optimize.py 报告：原始数量 / 成功数量 / 压缩前后体积 / 失败原因
- [ ] inspect.py：WebP 可打开、模式与透明通道正确
- [ ] optimize.py --verify：清单文件齐全、源码引用无 404
- [ ] 浏览器确认缩略图 ↔ 详情图对应、比例正确、无布局跳动
- [ ] 视频链接指向正确作品、嵌入可播（或回落到封面+链接）
- [ ] 移动端布局正常，不影响现有交互动效
