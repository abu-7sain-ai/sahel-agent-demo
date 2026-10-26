// Compares candidate Arabic fonts against text crops from the Sahel services list (sahel_09).
// For each line and font/weight, the size is fitted so the ink width matches the screenshot,
// then the rendered line is scored against the crop (mean absolute luminance difference, lower = closer).
// Writes assets/<out.png> (default font-compare.png; services-list text crops only) and prints the scores.
// Usage: node scripts/font-compare.js <folder with the candidate .ttf files> [out.png] [weights, e.g. 200,300,400] [families, comma-separated]
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.join(__dirname, '..');
const FONT_DIR = process.argv[2];
const OUT_FILE = process.argv[3] || 'font-compare.png';
const WEIGHTS = (process.argv[4] || '400,500,700').split(',').map(Number);
const ONLY = process.argv[5] ? process.argv[5].split(',') : null;
const SHOT = path.join(ROOT, 'screenshots', 'sahel_09.jpg');

const ALL_FONTS = [
  { family: 'Cairo', files: { 400: 'Cairo.ttf', 500: 'Cairo.ttf', 700: 'Cairo.ttf' } },
  { family: 'Tajawal', files: { 400: 'Tajawal-Regular.ttf', 500: 'Tajawal-Medium.ttf', 700: 'Tajawal-Bold.ttf' } },
  { family: 'IBM Plex Sans Arabic', files: { 400: 'IBMPlexSansArabic-Regular.ttf', 500: 'IBMPlexSansArabic-Medium.ttf', 700: 'IBMPlexSansArabic-Bold.ttf' } },
  { family: 'Noto Kufi Arabic', files: { 400: 'NotoKufiArabic%5Bwght%5D.ttf', 500: 'NotoKufiArabic%5Bwght%5D.ttf', 700: 'NotoKufiArabic%5Bwght%5D.ttf' } },
];
const FONTS = ALL_FONTS.filter((f) => !ONLY || ONLY.includes(f.family));
// Variable fonts cover every weight; static files only the weights they ship.
const VARIABLE = (f) => /%5B|Cairo/.test(Object.values(f.files)[0]);

// Menu text from the services list, with the ink boxes measured in sahel_09 (576-px screenshot pixels).
const LINES = [
  { id: 'title', text: 'خدمات', box: [455, 69, 549, 94], color: '#FFFFFF' },
  { id: 'agency', text: 'الهيئة العامة للمعلومات المدنية', box: [161, 339, 483, 362], color: '#FFFFFF' },
  { id: 'category', text: 'خدمات الجهات والمباني', box: [292, 806, 529, 829], color: '#3A7FE4' },
  { id: 'service', text: 'إصدار شهادة جهة', box: [348, 472, 529, 497], color: '#FFFFFF' },
  { id: 'placeholder', text: 'بحث في الخدمات', box: [305, 177, 482, 200], color: '#B8B8B8', bg: '#141414', italic: true },
];

function faceCss() {
  const seen = new Set();
  const out = [];
  for (const f of FONTS) {
    for (const [w, file] of Object.entries(f.files)) {
      const key = `${f.family}|${w}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const data = fs.readFileSync(path.join(FONT_DIR, decodeURIComponent(file) === file ? file : file)).toString('base64');
      const range = VARIABLE(f) ? '100 900' : w;
      out.push(`@font-face{font-family:'${f.family}';font-weight:${range};src:url(data:font/ttf;base64,${data});}`);
    }
  }
  return out.join('\n');
}

(async () => {
  const shot = fs.readFileSync(SHOT).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`<style>${faceCss()}</style><canvas id=c></canvas><img id=shot src="data:image/jpeg;base64,${shot}">`);
  await page.evaluate(async ({ fonts, weights }) => {
    for (const f of fonts) for (const w of weights) await document.fonts.load(`${w} 20px '${f.family}'`, 'عربي');
    await new Promise((r) => (document.getElementById('shot').complete ? r() : (document.getElementById('shot').onload = r)));
  }, { fonts: FONTS, weights: WEIGHTS });

  const results = await page.evaluate(({ fonts, lines, weights }) => {
    const img = document.getElementById('shot');
    const out = [];
    const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    for (const line of lines) {
      const [x0, y0, x1, y1] = line.box;
      const pad = 6;
      const W = x1 - x0 + 1 + pad * 2;
      const H = y1 - y0 + 1 + pad * 2;
      const ref = document.createElement('canvas');
      ref.width = W; ref.height = H;
      const rc = ref.getContext('2d');
      rc.drawImage(img, x0 - pad, y0 - pad, W, H, 0, 0, W, H);
      const refData = rc.getImageData(0, 0, W, H).data;
      for (const f of fonts) {
        for (const w of weights) {
          const c = document.createElement('canvas');
          c.width = W; c.height = H;
          const ctx = c.getContext('2d');
          const font = (s) => `${line.italic ? 'italic ' : ''}${w} ${s}px '${f.family}'`;
          // fit size so ink width matches
          let lo = 5, hi = 80;
          for (let k = 0; k < 30; k++) {
            const mid = (lo + hi) / 2;
            ctx.font = font(mid);
            const m = ctx.measureText(line.text);
            (m.actualBoundingBoxLeft + m.actualBoundingBoxRight > x1 - x0 + 1 ? (hi = mid) : (lo = mid));
          }
          const size = (lo + hi) / 2;
          ctx.font = font(size);
          ctx.direction = 'rtl';
          const m = ctx.measureText(line.text);
          const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
          // draw on a big scratch canvas, find the real ink box from pixels, then translate it onto the crop's ink box
          const big = document.createElement('canvas');
          big.width = W * 3; big.height = H * 3;
          const bc = big.getContext('2d');
          const bgc = line.bg || '#1C1C1E';
          bc.fillStyle = bgc; bc.fillRect(0, 0, big.width, big.height);
          bc.font = font(size); bc.direction = 'rtl'; bc.textAlign = 'right'; bc.textBaseline = 'alphabetic';
          bc.fillStyle = line.color;
          bc.fillText(line.text, big.width - W, H * 1.8);
          const bd = bc.getImageData(0, 0, big.width, big.height).data;
          const bgL = lum(bd, 0);
          let ix0 = 1e9, iy0 = 1e9, ix1 = -1, iy1 = -1;
          for (let y = 0; y < big.height; y++) for (let x = 0; x < big.width; x++) {
            if (Math.abs(lum(bd, (y * big.width + x) * 4) - bgL) > 40) { ix0 = Math.min(ix0, x); ix1 = Math.max(ix1, x); iy0 = Math.min(iy0, y); iy1 = Math.max(iy1, y); }
          }
          ctx.fillStyle = bgc; ctx.fillRect(0, 0, W, H);
          // align right edges and vertical centres of the ink boxes
          const dx = (W - pad - 1) - ix1;
          const dy = Math.round((pad + (y1 - y0) / 2) - (iy0 + iy1) / 2);
          ctx.drawImage(big, dx, dy);
          const data = ctx.getImageData(0, 0, W, H).data;
          let diff = 0;
          for (let i = 0; i < data.length; i += 4) diff += Math.abs(lum(data, i) - lum(refData, i));
          out.push({ line: line.id, family: f.family, weight: w, size: +size.toFixed(2), inkH: +inkH.toFixed(1), refInkH: y1 - y0 + 1, score: +(diff / (W * H)).toFixed(2), png: c.toDataURL() });
        }
      }
      out.push({ line: line.id, ref: ref.toDataURL() });
    }
    return out;
  }, { fonts: FONTS, lines: LINES, weights: WEIGHTS });

  // Summary: best weight per font per line, and total per font.
  const totals = {};
  const best = {};
  for (const r of results.filter((x) => x.family)) {
    const k = `${r.line}|${r.family}`;
    if (!best[k] || r.score < best[k].score) best[k] = r;
  }
  for (const r of Object.values(best)) totals[r.family] = (totals[r.family] || 0) + r.score;
  console.log('line\tfamily\tweight\tsize(px@576)\tinkH/ref\tscore');
  for (const r of Object.values(best)) console.log(`${r.line}\t${r.family}\t${r.weight}\t${r.size}\t${r.inkH}/${r.refInkH}\t${r.score}`);
  console.log('\nTotal score per font (lower = closer):');
  for (const [f, s] of Object.entries(totals).sort((a, b) => a[1] - b[1])) console.log(`  ${f}: ${s.toFixed(2)}`);

  // Composite: per line, the screenshot crop then each font's best render.
  const rows = LINES.map((l) => ({ id: l.id, ref: results.find((r) => r.line === l.id && r.ref).ref, fonts: FONTS.map((f) => best[`${l.id}|${f.family}`]) }));
  const html = `<body style="margin:0;background:#2a2a2e;font:12px sans-serif;color:#ccc">
    <table cellspacing=8><tr><th></th><th>Sahel screenshot</th>${FONTS.map((f) => `<th>${f.family}</th>`).join('')}</tr>
    ${rows.map((r) => `<tr><td>${r.id}</td><td><img src="${r.ref}"></td>${r.fonts.map((b) => `<td><img src="${b.png}"><br>${b.weight} · score ${b.score}</td>`).join('')}</tr>`).join('')}
    <tr><td></td><td>total</td>${FONTS.map((f) => `<td><b>${totals[f.family].toFixed(2)}</b></td>`).join('')}</tr></table></body>`;
  const p2 = await browser.newPage({ deviceScaleFactor: 1 });
  await p2.setContent(html);
  await p2.screenshot({ path: path.join(ROOT, 'assets', OUT_FILE), fullPage: true });
  await browser.close();
  console.log(`
Wrote assets/${OUT_FILE}`);
})();
