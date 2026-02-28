#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('The script requires the `sharp` package. Run `npm install --save-dev sharp` then re-run this script.');
  process.exit(1);
}

const SRC = path.join(__dirname, '..', 'assets', 'images', 'punch-clock.png');
const OUT = path.join(__dirname, '..', 'assets', 'icons');

if (!fs.existsSync(SRC)) {
  console.error('Source image not found:', SRC);
  process.exit(1);
}

const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };

const androidSizes = [48, 72, 96, 144, 192]; // mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
const iosSizes = [20, 29, 40, 60, 76, 83.5, 120, 152, 167, 180, 1024];

ensureDir(OUT);
ensureDir(path.join(OUT, 'android'));
ensureDir(path.join(OUT, 'ios'));

async function generate() {
  console.log('Generating icons from', SRC);

  // Android
  for (const size of androidSizes) {
    const name = `android/icon-${size}.png`;
    const dest = path.join(OUT, name);
    await sharp(SRC).resize(Math.round(size), Math.round(size), { fit: 'contain' }).toFile(dest);
    console.log('Created', dest);
  }

  // iOS
  for (const size of iosSizes) {
    const s = Math.round(size);
    const name = `ios/icon-${s}.png`;
    const dest = path.join(OUT, name);
    await sharp(SRC).resize(s, s, { fit: 'contain' }).toFile(dest);
    console.log('Created', dest);
  }

  // favicon
  const favicon = path.join(OUT, 'favicon-32.png');
  await sharp(SRC).resize(32, 32).toFile(favicon);
  console.log('Created', favicon);

  // splash preview (512)
  const splash = path.join(OUT, 'splash-512.png');
  await sharp(SRC).resize(512, 512, { fit: 'contain' }).toFile(splash);
  console.log('Created', splash);

  console.log('\nAll icons generated in', OUT);
}

generate().catch(err => { console.error(err); process.exit(1); });
