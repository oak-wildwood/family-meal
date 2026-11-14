#!/usr/bin/env node
// Removes EXIF, GPS, XMP, IPTC, ICC and comment segments from a JPEG, in place.
// Keeps APP0 (JFIF) and the image data untouched. Every committed photo goes
// through this: the repo is public and git history is permanent.
//
//   node scripts/strip-jpeg-metadata.mjs <file.jpg>
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: strip-jpeg-metadata.mjs <file.jpg>');
  process.exit(2);
}

const data = readFileSync(file);
if (data[0] !== 0xff || data[1] !== 0xd8) {
  console.error(`${file} is not a JPEG. Convert it first: sips -s format jpeg <in> --out <out.jpg>`);
  process.exit(1);
}

const kept = [data.subarray(0, 2)];
const dropped = [];
let i = 2;
while (i < data.length) {
  if (data[i] !== 0xff) throw new Error(`bad marker at byte ${i}`);
  const marker = data[i + 1];
  if (marker === 0xda) {
    // Start of scan: everything from here is image data.
    kept.push(data.subarray(i));
    break;
  }
  const length = data.readUInt16BE(i + 2);
  const segment = data.subarray(i, i + 2 + length);
  if ((marker >= 0xe1 && marker <= 0xef) || marker === 0xfe) dropped.push(`0x${marker.toString(16)}`);
  else kept.push(segment);
  i += 2 + length;
}

const out = Buffer.concat(kept);
writeFileSync(file, out);
console.log(`${file}: dropped ${dropped.join(', ') || 'nothing'} (${data.length} -> ${out.length} bytes)`);
