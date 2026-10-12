#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
TOONHUB / 于文雅 VISUAL-AIGC —— 网站素材统一处理脚本

职责（与《网站素材自动优化与发布规范》一一对应）：
  1. 保留原始图片（归档到 assets/originals/<分类>/，该目录不在 public 下，不会被部署）
  2. 按用途生成多规格 WebP（缩略图 / 作品封面 / 详情大图 / 图标）
  3. 保持原始宽高比例，绝不放大原图
  4. 已有透明通道的图片保留透明通道
  5. 文字细节多、边缘锐利的图自动提高质量（必要时近无损）
  6. 输出压缩前后体积报告；同一尺寸不重复存放
  7. --verify 模式：校验 WebP 可打开 + 扫描源码引用，确认没有资源 404

依赖：Pillow（复用本机已装的托管 Python，不引入新的第三方依赖）
用法：
  # 处理一批作品图（生成 thumb/cover/full 三档）
  python tools/media/optimize.py 源图.png --category poster --slug poster-001

  # 处理图标（单档 512）
  python tools/media/optimize.py icon.png --category icons --preset icon --slug category-poster

  # 处理首屏大图（缩略图 + 封面两档，够用即可）
  python tools/media/optimize.py 角色.png --category characters --preset hero --slug bomi-wave

  # 校验：WebP 是否可打开 + 源码引用的资源是否存在
  python tools/media/optimize.py --verify
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

try:
    from PIL import Image, ImageFilter, ImageOps
except ImportError:  # pragma: no cover
    sys.stderr.write("缺少 Pillow。请使用托管 Python：\n"
                     '  "C:/Users/PC/.workbuddy/binaries/python/versions/3.13.12/python.exe" tools/media/optimize.py ...\n')
    raise SystemExit(2)

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public'
ORIGINALS = ROOT / 'assets' / 'originals'
MANIFEST = ROOT / 'assets' / 'media-manifest.json'

# ── 规格参数（规范里的推荐配置，允许按实际图片质量调整）──────────────────────
@dataclass(frozen=True)
class Spec:
    name: str            # 文件后缀名：-thumb / -cover / -full
    max_width: int       # 最大宽度（px）
    quality: int         # WebP 质量
    max_height: int = 0  # 竖长图保护：为 0 表示不限


SPECS: dict[str, Spec] = {
    'thumb': Spec('thumb', 600, 80),
    'thumb-lg': Spec('thumb-lg', 800, 85),
    'cover': Spec('cover', 1200, 85),
    'full': Spec('full', 1920, 88),
    'icon': Spec('icon', 512, 90, max_height=512),
}

# 用途预设 → 需要的规格（从大到小，便于去重时保留高质量档）
PRESETS: dict[str, tuple[str, ...]] = {
    'work': ('full', 'cover', 'thumb'),   # 作品：详情大图 + 封面 + 缩略图
    'typo': ('full', 'thumb-lg'),         # 字体设计：高清浏览图 + 大缩略图（双列展示，笔画细节优先）
    'hero': ('cover', 'thumb'),           # 首屏大图：够用即可的两档响应式（不追 1920）
    'single': ('cover',),                 # 单档图（照片等）
    'icon': ('icon',),                    # 图标素材
}

# UI 上实际渲染宽度 → 供 srcset 用；脚本只负责产出文件，这里仅作注释参考
SHARP_QUALITY_BOOST = 95  # 文字 / 锐利线条图的质量下限


# ── 小工具 ────────────────────────────────────────────────────────────────
def human(size: int) -> str:
    for unit in ('B', 'KB', 'MB'):
        if size < 1024 or unit == 'MB':
            return f'{size:.1f} {unit}' if unit != 'B' else f'{size} B'
        size /= 1024.0
    return f'{size:.1f} MB'


def is_sharp_graphic(image: Image.Image) -> bool:
    """
    判断是否为「文字细节多、图形边缘锐利」的作品。

    做法：缩到 256px 灰度后求边缘强度均值与颜色丰富度。
    边缘能量高 + 颜色数偏少 → 多为字体 / 版式 / 线性图形，这类图压缩易糊，
    需要提高质量而不是一味压体积。
    """
    try:
        grey = image.convert('L')
        grey.thumbnail((256, 256), Image.LANCZOS)
        edges = grey.filter(ImageFilter.FIND_EDGES)
        histogram_ = edges.histogram()[:256]
        total = sum(histogram_)
        if not total:
            return False
        mean = sum(index * count for index, count in enumerate(histogram_)) / total
        variance = sum(count * (index - mean) ** 2 for index, count in enumerate(histogram_)) / total
        edge_energy = (variance ** 0.5) / 255.0

        colors = image.convert('RGB').resize((128, 128), Image.NEAREST).getcolors(maxcolors=1 << 16)
        color_count = len(colors) if colors else 1 << 16
        # 边缘能量高（线条多）且颜色数不算爆炸（非照片）→ 判为锐利图形
        return edge_energy > 0.055 and color_count < 12000
    except Exception:
        return False


def load_source(path: Path) -> tuple[Image.Image, dict]:
    """打开原图并按 EXIF 摆正方向，返回 (图像, 元信息)"""
    image = Image.open(path)
    image = ImageOps.exif_transpose(image)
    has_alpha = image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info)
    meta = {
        'source': str(path.name),
        'format': image.format or path.suffix.lstrip('.').upper(),
        'mode': image.mode,
        'width': image.width,
        'height': image.height,
        'alpha': bool(has_alpha),
        'bytes': path.stat().st_size,
    }
    return image, meta


def to_rgba_or_rgb(image: Image.Image, keep_alpha: bool) -> Image.Image:
    """透明通道：原图有 alpha 就必须保留；没有则转 RGB 以拿到更小的体积"""
    return image.convert('RGBA' if keep_alpha else 'RGB')


def resized(image: Image.Image, spec: Spec, keep_alpha: bool) -> tuple[Image.Image, tuple[int, int]]:
    """按规格等比缩放（绝不放大），返回新图与最终尺寸"""
    width, height = image.size
    scale = spec.max_width / width if width > spec.max_width else 1.0
    if spec.max_height and height * scale > spec.max_height:
        scale = min(scale, spec.max_height / height)
    if scale >= 1.0:
        target = (width, height)          # 原图更小 —— 保持原尺寸，不放大
    else:
        target = (max(1, round(width * scale)), max(1, round(height * scale)))
    out = image if target == (width, height) else image.resize(target, Image.LANCZOS)
    return to_rgba_or_rgb(out, keep_alpha), target


def save_webp(image: Image.Image, target: Path, quality: int) -> int:
    target.parent.mkdir(parents=True, exist_ok=True)
    params = dict(format='WEBP', quality=quality, method=6, alpha_quality=100 if image.mode == 'RGBA' else 0)
    if not image.mode == 'RGBA':
        params.pop('alpha_quality')
    image.save(target, **params)
    return target.stat().st_size


# ── 核心处理 ─────────────────────────────────────────────────────────────
def optimize(
    sources: list[Path],
    category: str,
    preset: str,
    slug: str | None,
    out_root: Path,
    keep_original: bool = True,
    force_quality: int | None = None,
) -> dict:
    """处理一批图片，返回本次的报告数据结构"""
    if preset not in PRESETS:
        raise SystemExit(f'未知预设：{preset}（可选 {", ".join(PRESETS)}）')

    out_dir = out_root if out_root.name == category else out_root / category
    origin_dir = ORIGINALS / category
    order = PRESETS[preset]

    report = {
        'category': category,
        'preset': preset,
        'total': len(sources),
        'succeeded': 0,
        'failed': [],
        'items': [],
        'originalBytes': 0,
        'outputBytes': 0,
    }
    used_slugs: dict[str, int] = {}

    for index, source in enumerate(sources):
        if not source.exists():
            report['failed'].append({'source': str(source), 'reason': '文件不存在'})
            continue
        try:
            image, meta = load_source(source)
            sharp = is_sharp_graphic(image)
            base_slug = slug or re.sub(r'[^a-zA-Z0-9._-]+', '-', source.stem).strip('-').lower()
            # 只在批内真正重名时才追加序号，保持文件名干净
            if base_slug in used_slugs:
                used_slugs[base_slug] += 1
                base_slug = f'{base_slug}-{used_slugs[base_slug]:02d}'
            used_slugs.setdefault(base_slug, 0)

            outputs: dict[str, dict] = {}
            emitted_widths: set[int] = set()
            for spec_name in order:
                spec = SPECS[spec_name]
                frame, (width, height) = resized(image, spec, meta['alpha'])
                # 同一尺寸不重复存放：小档若和大档实际同宽，跳过（大档质量更高）
                if width in emitted_widths:
                    continue
                quality = force_quality or spec.quality
                if sharp and quality < SHARP_QUALITY_BOOST and spec_name in ('cover', 'full', 'icon'):
                    quality = SHARP_QUALITY_BOOST
                suffix = '' if spec_name == 'icon' else f'-{spec.name}'
                if preset == 'single':
                    suffix = ''
                target = out_dir / f'{base_slug}{suffix}.webp'
                size = save_webp(frame, target, quality)
                outputs[spec_name] = {
                    'file': f'/{target.relative_to(PUBLIC).as_posix()}',
                    'width': width,
                    'height': height,
                    'quality': quality,
                    'bytes': size,
                }
                emitted_widths.add(width)

            if keep_original:
                origin_dir.mkdir(parents=True, exist_ok=True)
                archived = origin_dir / meta['source']
                if not archived.exists():
                    shutil.copy2(source, archived)

            report['succeeded'] += 1
            report['originalBytes'] += meta['bytes']
            report['outputBytes'] += sum(o['bytes'] for o in outputs.values())
            report['items'].append({
                'slug': base_slug,
                'source': str(source),
                'original': meta,
                'archivedTo': str((origin_dir / meta['source']).relative_to(ROOT).as_posix()) if keep_original else None,
                'sharp': sharp,
                'outputs': outputs,
            })
        except Exception as error:  # 单个失败不影响其余
            report['failed'].append({'source': str(source), 'reason': f'{type(error).__name__}: {error}'})

    return report


def merge_manifest(report: dict) -> None:
    data = {'updatedAt': datetime.now().isoformat(timespec='seconds'), 'categories': {}, 'items': [], 'history': []}
    if MANIFEST.exists():
        try:
            data = json.loads(MANIFEST.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            pass
    data.setdefault('items', [])
    data.setdefault('history', [])
    data.setdefault('categories', {})
    for item in report['items']:
        key = f"{report['category']}/{item['slug']}"
        data['items'] = [existing for existing in data['items'] if f"{existing.get('category')}/{existing.get('slug')}" != key]
        data['items'].append({
            'category': report['category'],
            'slug': item['slug'],
            'sharp': item['sharp'],
            'original': item['original'],
            'outputs': item['outputs'],
            'updatedAt': datetime.now().isoformat(timespec='seconds'),
        })
    data['categories'][report['category']] = len([i for i in data['items'] if i['category'] == report['category']])
    data['updatedAt'] = datetime.now().isoformat(timespec='seconds')
    data['history'].append({
        'at': data['updatedAt'],
        'category': report['category'],
        'preset': report['preset'],
        'total': report['total'],
        'succeeded': report['succeeded'],
        'originalBytes': report['originalBytes'],
        'outputBytes': report['outputBytes'],
        'failed': report['failed'],
    })
    data['history'] = data['history'][-40:]
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


def print_report(report: dict) -> None:
    saved = report['originalBytes'] - report['outputBytes']
    ratio = (saved / report['originalBytes'] * 100) if report['originalBytes'] else 0
    print('─' * 64)
    print(f"分类：{report['category']}    预设：{report['preset']}")
    print(f"原始图片：{report['total']} 张    成功转码：{report['succeeded']} 张")
    print(f"压缩前：{human(report['originalBytes'])}   压缩后：{human(report['outputBytes'])}   "
          f"节省：{human(saved)} ({ratio:.1f}%)")
    for item in report['items']:
        flag = '  [锐利图形→高质量]' if item['sharp'] else ''
        print(f"  · {item['slug']}{flag}")
        for name, out in item['outputs'].items():
            print(f"      {name:<5} {out['width']}×{out['height']:<5} q{out['quality']:<3} "
                  f"{human(out['bytes']):>9}  {out['file']}")
    if report['failed']:
        print('失败资源：')
        for failure in report['failed']:
            print(f"  ✗ {failure['source']} —— {failure['reason']}")
    else:
        print('失败资源：无')
    print('─' * 64)


# ── 校验模式 ─────────────────────────────────────────────────────────────
REF_RE = re.compile(r"['\"`](/(?:works|icons|characters|images)/[A-Za-z0-9._/-]+)['\"`]")
# 历史遗留的死代码目录（未参与构建），扫描时跳过
DEAD_DIRS = ('src/pages', 'src/context')


def strip_comment(line: str) -> str:
    """去掉行尾 // 注释（保留 https:// 这类协议头）"""
    index = 0
    while True:
        index = line.find('//', index)
        if index < 0:
            return line
        if index > 0 and line[index - 1] == ':':  # 协议头
            index += 2
            continue
        return line[:index]


def verify() -> int:
    print('== 1/2 校验已产出的 WebP ========================================')
    problems = 0
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
        files = [out['file'] for item in manifest.get('items', []) for out in item['outputs'].values()]
        print(f"清单记录：{len(manifest.get('items', []))} 条作品 / {len(files)} 个文件")
        for file in sorted(set(files)):
            path = PUBLIC / file.lstrip('/')
            if not path.exists():
                print(f'  ✗ 缺失 {file}')
                problems += 1
                continue
            try:
                with Image.open(path) as image:
                    image.verify()
                with Image.open(path) as image:
                    print(f"  ✓ {file}  {image.width}×{image.height}  {human(path.stat().st_size)}")
            except Exception as error:
                print(f'  ✗ 无法打开 {file} —— {error}')
                problems += 1
    else:
        print('  清单尚不存在（还没有处理过素材）')

    print()
    print('== 2/2 校验源码引用的资源是否存在 ================================')
    refs: dict[str, set[str]] = {}
    for source in list((ROOT / 'src').rglob('*.ts')) + list((ROOT / 'src').rglob('*.tsx')) + [ROOT / 'index.html']:
        rel = source.relative_to(ROOT).as_posix()
        if any(rel.startswith(dead) for dead in DEAD_DIRS):
            continue
        text = '\n'.join(strip_comment(line) for line in source.read_text(encoding='utf-8').splitlines())
        for match in REF_RE.finditer(text):
            refs.setdefault(match.group(1), set()).add(rel)
    for ref in sorted(refs):
        # 模板拼路径（如 /works/${id}/）跳过，交由运行时兜底
        if '$' in ref:
            continue
        path = PUBLIC / ref.lstrip('/')
        if path.exists():
            print(f'  ✓ {ref}   ← {", ".join(sorted(refs[ref]))}')
        else:
            print(f'  ✗ 缺失 {ref}   ← {", ".join(sorted(refs[ref]))}')
            problems += 1

    print()
    print(f'校验结论：{"全部通过 ✔" if problems == 0 else f"发现 {problems} 个问题 ✘"}')
    return 1 if problems else 0


# ── CLI ─────────────────────────────────────────────────────────────────
def main() -> int:
    parser = argparse.ArgumentParser(description='TOONHUB 网站素材统一处理')
    parser.add_argument('sources', nargs='*', help='原始图片路径（可多个）')
    parser.add_argument('--category', help='分类目录，如 poster / banner / typography / ip-vi / ai-film / app / icons / characters / about')
    parser.add_argument('--preset', default='work', choices=sorted(PRESETS), help='用途预设（默认 work）')
    parser.add_argument('--slug', help='输出文件名的基名，如 poster-001')
    parser.add_argument('--quality', type=int, help='强制覆盖质量（调试用）')
    parser.add_argument('--out', help='输出根目录（默认 public/works，icons 预设默认 public）')
    parser.add_argument('--verify', action='store_true', help='只做校验，不处理图片')
    args = parser.parse_args()

    if args.verify:
        return verify()

    if not args.sources or not args.category:
        parser.error('处理模式下必须提供源图与 --category')

    out_root = (Path(args.out) if args.out else (PUBLIC if args.preset == 'icon' else PUBLIC / 'works')).resolve()
    sources = [Path(s) for s in args.sources]
    report = optimize(sources, args.category, args.preset, args.slug, out_root, force_quality=args.quality)
    merge_manifest(report)
    print_report(report)
    return 1 if report['failed'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
