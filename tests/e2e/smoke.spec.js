// Smoke test: open page, expand PACI, tap "تجديد البطاقة", drawer opens with the prefilled question.
// /api/chat is stubbed so the test needs no provider.
const { test, expect } = require('@playwright/test');

test('PACI → خدمات البطاقة → تجديد البطاقة opens the agent with the prefilled question', async ({ page }) => {
  let sent = null;
  await page.route('**/api/chat', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true, reply: 'رد تجريبي' } });
  });
  await page.goto('/');
  await expect(page).toHaveTitle('نموذج إيجنت سهل — تجريبي');
  await expect(page.locator('.demo-bar')).toHaveText('نموذج تجريبي — ليس التطبيق الرسمي');
  await expect(page.locator('.agency').first()).toContainText('تُواصل');

  await page.locator('.agency', { hasText: 'الهيئة العامة للمعلومات المدنية' }).first().click();
  await page.locator('.category', { hasText: 'خدمات البطاقة' }).click();
  await page.locator('.service', { hasText: /^تجديد البطاقة$/ }).click();

  await expect(page.locator('#app')).toHaveClass(/chat-open/);
  await expect(page.locator('#drawer')).toBeInViewport();
  await expect(page.locator('.bubble.user').last()).toHaveText('شلون أسوي تجديد البطاقة؟');
  await expect(page.locator('.bubble.agent').last()).toHaveText('رد تجريبي');
  expect(sent.messages.at(-1)).toEqual({ role: 'user', content: 'شلون أسوي تجديد البطاقة؟' });
});

test('search filters live and the data tab shows the invented profile', async ({ page }) => {
  await page.goto('/');
  await page.fill('#search', 'مخالفات المرور');
  await expect(page.locator('.service', { hasText: 'دفع مخالفات المرور' })).toBeVisible();
  await page.click('nav button[data-tab=data]');
  await expect(page.locator('.profile')).toContainText('عبدالله محمد سالم الكويتي');
  await expect(page.locator('.profile')).toContainText('288010100124');
  await expect(page.locator('.viewmode')).toContainText('طريقة العرض');
  await page.locator('.agency', { hasText: 'وزارة الداخلية' }).click();
  await page.locator('.sub', { hasText: 'جواز السفر' }).first().click();
  await expect(page.locator('.fbox', { hasText: 'P00123456' })).toBeVisible();
  await page.click('nav button[data-tab=report]');
  await expect(page.locator('#view')).toHaveText('هذا القسم خارج نطاق النموذج التجريبي');
});

test('no provider gives a clear Arabic message, not a crash', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sahel.provider', 'anthropic'));
  await page.click('#agentBtn');
  await page.locator('#quick button', { hasText: 'تجديد الإقامة' }).click();
  await expect(page.locator('.bubble.error')).toContainText('مفتاح API');
});
