/**
 * 扫描 PNG 中出现的主要颜色（本地验证用）。
 * 用法：node tools/scan.mjs <png> [topN]
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

const file = process.argv[2];
const topN = Number(process.argv[3] ?? 18);
const buf = fs.readFileSync(file);

let off = 8;
let width = 0;
let height = 0;
let bitDepth = 0;
let colorType = 0;
const idat = [];

while (off < buf.length) {
  const len = buf.readUInt32BE(off);
  const type = buf.toString('ascii', off + 4, off + 8);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 'IHDR') {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data[8];
    colorType = data[9];
  } else if (type === 'IDAT') idat.push(data);
  else if (type === 'IEND') break;
  off += 12 + len;
}

if (bitDepth !== 8) throw new Error(`unsupported bitDepth ${bitDepth}`);
const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
const raw = zlib.inflateSync(Buffer.concat(idat));
const bpp = channels;
const stride = width * bpp;
const pixels = Buffer.alloc(height * stride);

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

let pos = 0;
for (let y = 0; y < height; y += 1) {
  const filter = raw[pos++];
  const row = raw.subarray(pos, pos + stride);
  pos += stride;
  const out = pixels.subarray(y * stride, (y + 1) * stride);
  for (let x = 0; x < stride; x += 1) {
    const left = x >= bpp ? out[x - bpp] : 0;
    const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
    const ul = y > 0 && x >= bpp ? pixels[(y - 1) * stride + x - bpp] : 0;
    let value = row[x];
    if (filter === 1) value += left;
    else if (filter === 2) value += up;
    else if (filter === 3) value += (left + up) >> 1;
    else if (filter === 4) value += paeth(left, up, ul);
    out[x] = value & 0xff;
  }
}

/** 量化到 16 级/通道，统计主色并记录首个出现的坐标 */
const buckets = new Map();
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const i = y * stride + x * bpp;
    const r = pixels[i];
    const g = channels >= 3 ? pixels[i + 1] : r;
    const b = channels >= 3 ? pixels[i + 2] : r;
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    let entry = buckets.get(key);
    if (!entry) {
      entry = { count: 0, first: [x, y], sample: [r, g, b] };
      buckets.set(key, entry);
    }
    entry.count += 1;
  }
}

const sorted = [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, topN);
const hex = (v) => v.toString(16).padStart(2, '0');
for (const entry of sorted) {
  const [r, g, b] = entry.sample;
  console.log(`#${hex(r)}${hex(g)}${hex(b)}  x${entry.count}  first@(${entry.first[0]},${entry.first[1]})`);
}
console.log(`(${width}x${height})`);
