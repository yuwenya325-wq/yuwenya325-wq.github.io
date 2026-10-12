/**
 * 极简 PNG 取色器（8-bit RGB/RGBA 非隔行，本地验证用）。
 * 用法：node tools/pixel.mjs <png> x,y [x,y ...]
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

const file = process.argv[2];
const points = process.argv.slice(3);
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
  } else if (type === 'IDAT') {
    idat.push(data);
  } else if (type === 'IEND') {
    break;
  }
  off += 12 + len;
}

if (bitDepth !== 8) throw new Error(`unsupported bitDepth ${bitDepth}`);
const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
if (!channels) throw new Error(`unsupported colorType ${colorType}`);

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

const hex = (v) => v.toString(16).padStart(2, '0');
for (const point of points) {
  const [xs, ys] = point.split(',');
  const x = Math.round(Number(xs));
  const y = Math.round(Number(ys));
  if (x < 0 || y < 0 || x >= width || y >= height) {
    console.log(`${point} out of range (${width}x${height})`);
    continue;
  }
  const i = y * stride + x * bpp;
  if (channels >= 3) {
    console.log(`${point} -> #${hex(pixels[i])}${hex(pixels[i + 1])}${hex(pixels[i + 2])}`);
  } else {
    console.log(`${point} -> gray ${pixels[i]}`);
  }
}
console.log(`(${width}x${height}, colorType=${colorType})`);
