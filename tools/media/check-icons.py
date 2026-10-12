#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""查看剪贴板图标素材的尺寸与体积"""
from pathlib import Path
from PIL import Image

src = Path(r'C:/Users/PC/.workbuddy/clipboard-images')
files = [
    'clipboard-2026-10-10T08-43-56-177Z-fecc0252.jpg',   # 海报：三层悬浮海报
    'clipboard-2026-10-10T08-43-56-178Z-04c483d4.jpg',   # 字体：紫蓝 Aa
    'clipboard-2026-10-10T08-43-56-179Z-51b976f7.jpg',   # Banner：蓝白横幅
    'clipboard-2026-10-10T08-43-56-179Z-3770c1ea.jpg',   # IP：吉祥物
]
for name in files:
    path = src / name
    with Image.open(path) as image:
        print(f'{name}  {image.size[0]}x{image.size[1]}  {image.mode}  {path.stat().st_size} B')
