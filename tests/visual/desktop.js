// Checks the phone frame fits desktop windows without page scroll; saves tests/visual/desktop-<w>x<h>.png.
// Usage: node tests/visual/desktop.js
const path = require('path');
const { chromium } = require('@playwright/test');
const { app } = require('../../server');

(async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  let ok = true;
  for (const [w, h] of [[1366, 768], [1920, 1080]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.route('**/logos-local/**', (route) => route.fulfill({ status: 404, body: '' })); // committed image: no local logos
    await page.goto(url);
    await page.waitForSelector('.agency');
    const r = await page.evaluate(() => {
      const b = document.querySelector('.phone').getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, height: b.height, scrollH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth, scrollY: (window.scrollTo(0, 9999), window.scrollY) };
    });
    const fits = r.top >= 0 && r.bottom <= h && r.height <= h * 0.92 + 1 && r.scrollY === 0;
    ok = ok && fits;
    console.log(`${w}x${h}: frame ${r.height.toFixed(0)}px (${((r.height / h) * 100).toFixed(1)}% of height), top ${r.top.toFixed(0)}, bottom ${r.bottom.toFixed(0)}, page scroll ${r.scrollY} → ${fits ? 'OK' : 'FAIL'}`);
    await page.screenshot({ path: path.join(__dirname, `desktop-${w}x${h}.png`) });
    await page.close();
  }
  await browser.close();
  server.close();
  process.exit(ok ? 0 : 1);
})();
