// Visual regression: renders each tab/state of the app area (390×866.67 CSS px at 576/390 scale = 576×1280)
// into tests/visual/<state>.png, then builds a side-by-side composite with the matching real screenshot
// (screenshot | ours | difference) in tests/visual/compare/<state>.png. compare/ is git-ignored because it
// contains the real screenshots. Skips the composites when screenshots/ is absent.
// Usage: node tests/visual/capture.js            (starts its own server on a free port)
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { app } = require('../../server');

const ROOT = path.join(__dirname, '..', '..');
const OUT = __dirname;
const COMPARE = path.join(OUT, 'compare');
const SHOTS = path.join(ROOT, 'screenshots');
const SCALE = 576 / 390;

// Each state: clicks to reach it, optional scroll so an element's top sits at the same y as in the screenshot
// (anchor y = the element's top edge in raw screenshot pixels, measured on the matching screenshot).
const STATES = [
  { id: 'services-top', shot: 6, steps: [] },
  { id: 'services-paci-certificates', shot: 9, steps: [['agency', 'الهيئة العامة للمعلومات المدنية'], ['category', 'الشهادات']], anchor: ['agency', 'الهيئة العامة للمعلومات المدنية', 307] },
  { id: 'services-paci-individuals', shot: 10, steps: [['agency', 'الهيئة العامة للمعلومات المدنية'], ['category', 'خدمات الأفراد']], anchor: ['agency', 'الهيئة العامة للمعلومات المدنية', 222] },
  { id: 'services-paci-card', shot: 12, steps: [['agency', 'الهيئة العامة للمعلومات المدنية'], ['category', 'خدمات البطاقة']], anchor: ['agency', 'الهيئة العامة للمعلومات المدنية', 261] },
  { id: 'services-moi-categories', shot: 37, steps: [['agency', 'وزارة الداخلية']], anchor: ['agency', 'وزارة الداخلية', 233] },
  { id: 'services-moi-residency', shot: 43, steps: [['agency', 'وزارة الداخلية'], ['category', 'خدمات الإقامة']], anchor: ['category', 'خدمات الإقامة', 221] },
  { id: 'data-top', shot: 1, steps: [['tab', 'data']] },
  { id: 'data-paci-children', shot: 4, steps: [['tab', 'data'], ['agency', 'الهيئة العامة للمعلومات المدنية'], ['sub', 'الأبناء']], anchor: ['agency', 'الهيئة العامة للمعلومات المدنية', 424], headerShown: true },
  { id: 'data-moi-sponsorships', shot: 19, steps: [['tab', 'data'], ['agency', 'وزارة الداخلية'], ['sub', 'الكفالات']], anchor: ['agency', 'وزارة الداخلية', 337] },
  { id: 'data-justice', shot: 28, steps: [['tab', 'data'], ['agency', 'وزارة العدل'], ['sub', 'الملكيات العقارية']], anchor: ['agency', 'وزارة العدل', 452], headerShown: true },
];

const SEL = { agency: '.agency', category: '.category', sub: '.sub' };

async function reach(page, state) {
  await page.clock.setFixedTime(new Date('2026-10-26T14:13:00'));
  await page.goto('/');
  await page.addStyleTag({ content: '.screen{border-radius:0}' });
  await page.waitForSelector('.agency');
  for (const [kind, value] of state.steps) {
    if (kind === 'tab') { await page.click(`nav button[data-tab=${value}]`); await page.waitForSelector('.agency'); continue; }
    await page.locator(SEL[kind], { has: page.locator('.name, .title', { hasText: new RegExp(`^${value}$`) }) }).first().click();
  }
  await page.waitForTimeout(350);
  if (state.anchor) {
    const [kind, value, yPx] = state.anchor;
    await page.evaluate(({ sel, value, y }) => {
      const view = document.getElementById('view');
      const appTop = document.getElementById('app').getBoundingClientRect().top;
      const node = [...document.querySelectorAll(sel)].find((n) => (n.querySelector('.name, .title') || {}).textContent === value);
      view.scrollTop += node.getBoundingClientRect().top - appTop - y;
      view.dispatchEvent(new Event('scroll'));
    }, { sel: SEL[kind], value, y: yPx / (576 / 390) });
    await page.waitForTimeout(250);
  }
  // Data screenshots taken just after scrolling up show the header again.
  if (state.headerShown) {
    await page.evaluate(() => { const v = document.getElementById('view'); v.scrollTop -= 3; v.dispatchEvent(new Event('scroll')); });
    await page.waitForTimeout(300);
  }
}

async function composite(browser, ours, shotFile, outFile, title) {
  const page = await browser.newPage({ viewport: { width: 1760, height: 1340 } });
  const a = 'data:image/jpeg;base64,' + fs.readFileSync(shotFile).toString('base64');
  const b = 'data:image/png;base64,' + ours.toString('base64');
  await page.setContent('<canvas id=c width=1760 height=1340></canvas>');
  const score = await page.evaluate(async ({ a, b, title }) => {
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const c = document.getElementById('c'); const x = c.getContext('2d');
    x.fillStyle = '#555'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#fff'; x.font = '20px sans-serif';
    x.fillText('Sahel screenshot', 10, 30); x.fillText('Demo (ours)', 596, 30); x.fillText('Difference ×3 — ' + title, 1182, 30);
    x.drawImage(ia, 0, 50, 576, 1280); x.drawImage(ib, 586, 50, 576, 1280);
    const da = x.getImageData(0, 50, 576, 1280).data; const db = x.getImageData(586, 50, 576, 1280).data;
    const out = x.createImageData(576, 1280); let sum = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3;
      sum += d; const v = Math.min(255, d * 3);
      out.data[i] = v; out.data[i + 1] = v * 0.6; out.data[i + 2] = 0; out.data[i + 3] = 255;
    }
    x.putImageData(out, 1172, 50);
    return sum / (576 * 1280);
  }, { a, b, title });
  await page.screenshot({ path: outFile });
  await page.close();
  return score;
}

(async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const baseURL = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL, viewport: { width: 900, height: 1000 }, deviceScaleFactor: SCALE });
  const page = await context.newPage();
  const haveShots = fs.existsSync(SHOTS);
  if (haveShots) fs.mkdirSync(COMPARE, { recursive: true });
  const only = process.argv[2];
  for (const state of STATES.filter((s) => !only || s.id === only)) {
    await reach(page, state);
    const png = await page.locator('#app').screenshot();
    fs.writeFileSync(path.join(OUT, `${state.id}.png`), png);
    let line = `${state.id}: tests/visual/${state.id}.png`;
    if (haveShots) {
      const shot = path.join(SHOTS, `sahel_${String(state.shot).padStart(2, '0')}.jpg`);
      const score = await composite(browser, png, shot, path.join(COMPARE, `${state.id}.png`), state.id);
      line += ` · vs sahel_${String(state.shot).padStart(2, '0')} mean diff ${score.toFixed(1)}`;
    }
    console.log(line);
  }
  await browser.close();
  server.close();
})();
