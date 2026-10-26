// Builds assets/sahel.png (512), assets/sahel.ico (Windows) and assets/sahel.icns (macOS) from one SVG.
// Same drawing as the agent button: navy #1B2A41 circle, white chat bubble with a small star.
// Needs the dev dependency @playwright/test (Chromium renders the SVG). Run: node scripts/make-icons.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const OUT = path.join(__dirname, '..', 'assets');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="244" fill="#1B2A41" stroke="rgba(255,255,255,0.35)" stroke-width="14"/>
  <g transform="translate(96 96) scale(10)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 8.5c0-1.9 1.6-3.5 3.5-3.5h9"/>
    <path d="M26 15.5v2c0 1.9-1.6 3.5-3.5 3.5H14l-5.2 4.3c-.5.4-1.3.1-1.3-.6V21H9.5C7.6 21 6 19.4 6 17.5v-5"/>
    <path d="M24.5 3.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="#fff" stroke-width="1.2"/>
  </g>
</svg>`;

async function render(page, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${SVG.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

// ICO with PNG-compressed entries (supported since Windows Vista).
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = [];
  let offset = 6 + 16 * images.length;
  for (const { size, png } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    dir.push(e);
  }
  return Buffer.concat([header, ...dir, ...images.map((i) => i.png)]);
}

// ICNS with PNG entries (supported since OS X 10.7); no Apple tools needed.
const ICNS_TYPES = [['icp4', 16], ['icp5', 32], ['icp6', 64], ['ic07', 128], ['ic08', 256], ['ic09', 512], ['ic10', 1024], ['ic11', 32], ['ic12', 64], ['ic13', 512], ['ic14', 1024]];
function icns(bySize) {
  const chunks = ICNS_TYPES.map(([type, size]) => {
    const head = Buffer.alloc(8);
    head.write(type, 0, 'ascii');
    head.writeUInt32BE(8 + bySize[size].length, 4);
    return Buffer.concat([head, bySize[size]]);
  });
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(8);
  head.write('icns', 0, 'ascii');
  head.writeUInt32BE(8 + body.length, 4);
  return Buffer.concat([head, body]);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const bySize = {};
  for (const size of [16, 24, 32, 48, 64, 128, 256, 512, 1024]) bySize[size] = await render(page, size);
  await browser.close();

  fs.writeFileSync(path.join(OUT, 'sahel.svg'), SVG + '\n');
  fs.writeFileSync(path.join(OUT, 'sahel.png'), bySize[512]);
  fs.writeFileSync(path.join(OUT, 'sahel.ico'), ico([16, 24, 32, 48, 64, 128, 256].map((size) => ({ size, png: bySize[size] }))));
  fs.writeFileSync(path.join(OUT, 'sahel.icns'), icns(bySize));
  console.log('Wrote assets/sahel.svg, sahel.png (512), sahel.ico, sahel.icns');
})();
