#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""列出 public 下所有 WebP 的尺寸 / 色彩模式 / 透明通道范围（用于转码后的视觉与通道校验）"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2] / 'public'
for path in sorted(root.rglob('*.webp')):
    with Image.open(path) as image:
        mode = image.mode
        note = ''
        if mode == 'RGBA':
            note = f'  alpha={image.getchannel("A").getextrema()}'
        print(f'{path.relative_to(root).as_posix():<46} {image.size[0]}x{image.size[1]:<6} {mode}{note}')
