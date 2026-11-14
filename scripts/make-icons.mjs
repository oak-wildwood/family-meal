#!/usr/bin/env node
// Rasterizes the dinner-plate icon SVGs into the PNGs the manifest and iOS need.
// iOS "Add to Home Screen" ignores SVG apple-touch-icons, and some Android
// manifest parsers mishandle SVG, so home-screen icons must be PNG.
// sharp writes no metadata unless asked, so the PNGs carry none.
//
//   npm run icons
import sharp from 'sharp';

const targets = [
  { src: 'scripts/icons/icon.svg', out: 'public/icons/icon-512.png', size: 512 },
  { src: 'scripts/icons/icon.svg', out: 'public/icons/icon-192.png', size: 192 },
  { src: 'scripts/icons/icon.svg', out: 'public/icons/icon-180.png', size: 180 },
  { src: 'scripts/icons/icon.svg', out: 'public/icons/icon-48.png', size: 48 },
  { src: 'scripts/icons/icon-maskable.svg', out: 'public/icons/icon-maskable-512.png', size: 512 },
  { src: 'scripts/icons/icon-maskable.svg', out: 'public/icons/icon-maskable-192.png', size: 192 },
];

for (const { src, out, size } of targets) {
  // Render the vector at the target size rather than scaling a bitmap down.
  await sharp(src, { density: (72 * size) / 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`${out} (${size}x${size})`);
}
