const test = require('node:test');
const assert = require('node:assert');
const profile = require('../../data/profile.json');

// Kuwaiti civil-ID check digit (weights 2,1,6,3,7,9,10,5,8,4,2 over the first 11 digits).
function civilIdChecksumOk(id) {
  if (!/^\d{12}$/.test(id)) return false;
  const w = [2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const sum = w.reduce((s, wi, i) => s + wi * Number(id[i]), 0);
  const check = 11 - (sum % 11);
  return check < 10 && check === Number(id[11]);
}

const ORDER = [
  'المؤسسة العامة للتأمينات الإجتماعية', 'الهيئة العامة للمعلومات المدنية', 'وزارة الصحة', 'وزارة التجارة والصناعة',
  'وزارة المواصلات', 'وزارة الداخلية', 'بنك الائتمان الكويتي', 'وزارة العدل', 'وزارة التربية', 'وزارة الشئون الإسلامية',
  'وزارة الشئون الاجتماعية', 'وزارة الكهرباء والماء والطاقة المتجددة', 'المؤسسة العامة للرعاية السكنية',
];

test('the invented citizen is the one agreed in Phase 1', () => {
  assert.strictEqual(profile.name, 'عبدالله محمد سالم الكويتي');
  assert.strictEqual(profile.civilId, '288010100124');
  assert.strictEqual(profile.badge, 4);
});

test('no 12-digit civil ID in the profile passes the check digit, so none can belong to a real person', () => {
  const ids = JSON.stringify(profile).match(/(?<!\d)\d{12}(?!\d)/g);
  assert.ok(ids.length >= 5);
  for (const id of ids) assert.strictEqual(civilIdChecksumOk(id), false, `${id} passes the check digit`);
  // sanity: the checker accepts a number whose check digit is computed here (no valid ID is stored in the repo)
  const base = '00000000001';
  const w = [2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const check = 11 - (w.reduce((s, wi, i) => s + wi * Number(base[i]), 0) % 11);
  assert.strictEqual(civilIdChecksumOk(base + check), true);
});

test('data tab agencies follow the app order', () => {
  assert.deepStrictEqual(profile.data.map((d) => d.agency), ORDER);
});

test('sub-sections and labels mirror the screenshots', () => {
  const by = Object.fromEntries(profile.data.map((d) => [d.agency, d]));
  assert.deepStrictEqual(by['الهيئة العامة للمعلومات المدنية'].sections.map((s) => s.title), ['الأبناء', 'حالة  البطاقة']);
  assert.deepStrictEqual(by['وزارة الداخلية'].sections.map((s) => s.title), ['التأشيرات', 'الكفالات', 'تراخيص المركبات', 'جواز السفر', 'جوازات سفر الأبناء', 'جوازات سفر المكفولين', 'رخص قيادة المكفولين', 'رخصة القيادة', 'مخالفات المرور']);
  assert.deepStrictEqual(by['وزارة العدل'].sections.map((s) => s.title), ['الملكيات العقارية', 'بيانات المحرر']);
  assert.deepStrictEqual(by['وزارة التربية'].sections.map((s) => s.title), ['بيانات الأبناء']);
  const labels = new Set(profile.data.flatMap((d) => d.sections.map((s) => s.label)));
  for (const l of ['الرقم المدني', 'رقم التأشيرة', 'رقم اللوحة', 'رقم الجواز', 'الإسم', 'النوع', 'رقم المخالفة', 'الرقم الآلي', 'دليل الملكية العقارية', 'الأبناء']) assert.ok(labels.has(l), `missing label ${l}`);
  assert.strictEqual(by['وزارة الداخلية'].alert, 'red');
});

test('every value is one of the invented values', () => {
  const values = profile.data.flatMap((d) => d.sections.flatMap((s) => s.values.map((v) => v.text)));
  const allowed = /^(288010100124|P00123456|00-12345|00-67890|30000000[12]|30001010000[1-4](-خاصة)?|00000[12]-0000[12]-2026-000|خاصة|(عبدالرحمن|نورة|فهد|سارة|يوسف)(-جواز عادي| عبدالله محمد الكويتي)?|بيت-عقار تجريبي-بيع-2026-0001|2024-01-15 توكيل عام 1001|2025-03-10 توكيل خاص 1002|موكّل تجريبي (أول|ثاني))$/;
  for (const v of values) assert.match(v, allowed);
});
