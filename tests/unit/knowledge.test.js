const test = require('node:test');
const assert = require('node:assert');
const { loadServices } = require('../../lib/prompt');

const COVERED = [
  'الهيئة العامة للمعلومات المدنية',
  'وزارة الداخلية',
  'وزارة العدل',
  'وزارة الصحة',
  'وزارة الكهرباء والماء والطاقة المتجددة',
  'الهيئة العامة للقوى العاملة',
];
const FIELDS = ['name', 'agency', 'category', 'requirements', 'documents', 'fees', 'duration', 'last_verified', 'source_url'];

const kb = loadServices();

test('lists all 40 agencies in the app order, starting with تُواصل and ending with وزارة المواصلات', () => {
  assert.strictEqual(kb.agencies.length, 40);
  assert.strictEqual(kb.agencies[0].name, 'تُواصل');
  assert.strictEqual(kb.agencies[39].name, 'وزارة المواصلات');
  assert.strictEqual(new Set(kb.agencies.map((a) => a.name)).size, 40);
});

test('the six covered agencies are present, marked covered, and have services', () => {
  for (const name of COVERED) {
    const a = kb.agencies.find((x) => x.name === name);
    assert.ok(a, `missing agency ${name}`);
    assert.strictEqual(a.covered, true, `${name} not marked covered`);
    assert.ok(kb.services.some((s) => s.agency === name), `${name} has no services`);
  }
  assert.strictEqual(kb.agencies.filter((a) => a.covered).length, 6);
});

test('only covered agencies have services', () => {
  const covered = new Set(kb.agencies.filter((a) => a.covered).map((a) => a.name));
  for (const s of kb.services) assert.ok(covered.has(s.agency), `${s.name}: agency ${s.agency} is not covered`);
});

test('every service has name, agency, category and all record fields', () => {
  for (const s of kb.services) {
    for (const f of FIELDS) assert.ok(f in s, `${s.name || '?'} missing field ${f}`);
    assert.ok(s.name && s.name.trim(), 'empty name');
    assert.ok(s.agency && s.agency.trim(), `${s.name}: empty agency`);
    assert.ok(s.category && s.category.trim(), `${s.name}: empty category`);
    assert.ok(Array.isArray(s.requirements) && Array.isArray(s.documents), `${s.name}: requirements/documents must be arrays`);
  }
});

test('a record with a fee, requirement or duration cites an official source', () => {
  for (const s of kb.services) {
    const hasFacts = s.fees || s.duration || s.requirements.length || s.documents.length;
    if (hasFacts) {
      assert.match(s.source_url, /^https:\/\//, `${s.name}: facts without source_url`);
      assert.match(s.last_verified, /^\d{4}-\d{2}-\d{2}$/, `${s.name}: facts without last_verified`);
    }
  }
});

test('PACI has 40 and MOI has 50 services from the screenshots', () => {
  assert.strictEqual(kb.services.filter((s) => s.agency === 'الهيئة العامة للمعلومات المدنية' && s.path_verified).length, 40);
  assert.strictEqual(kb.services.filter((s) => s.agency === 'وزارة الداخلية' && s.path_verified).length, 50);
});

test('service names are unique within an agency', () => {
  const seen = new Set();
  for (const s of kb.services) {
    const k = `${s.agency}|${s.name}`;
    assert.ok(!seen.has(k), `duplicate ${k}`);
    seen.add(k);
  }
});
