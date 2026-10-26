const test = require('node:test');
const assert = require('node:assert');
const { buildSystemPrompt, readSection4, transcript } = require('../../lib/prompt');
const { redact, hasIdentifier } = require('../../lib/redact');
const { cleanMessages } = require('../../server');

test('system prompt contains constitution section 4 verbatim', () => {
  const s4 = readSection4();
  assert.ok(s4.startsWith('## 4. The agent "سهّال"'));
  assert.ok(buildSystemPrompt().includes(s4));
});

test('system prompt includes the five-part answer format', () => {
  const p = buildSystemPrompt();
  assert.ok(p.includes('Fixed answer format'));
  for (const part of ['(1) one line: service name and agency', '(2) path: خدمات ← [agency] ← [category] ← [service]', '(3) requirements/documents', '(4) fees if known', '(5) one warning']) {
    assert.ok(p.includes(part), `missing format part: ${part}`);
  }
});

test('system prompt includes refusal rules and the full knowledge base', () => {
  const p = buildSystemPrompt();
  for (const s of ['أنا أساعد في خدمات سهل بس', 'هالجهة موجودة في سهل بس لسا ما انضافت للنموذج التجريبي', 'لا، أنا نموذج تجريبي مستقل', 'ما عندي معلومة مؤكدة عن الرسوم']) {
    assert.ok(p.includes(s), `missing phrase ${s}`);
  }
  assert.ok(p.includes('"name":"تجديد البطاقة"'));
  assert.ok(p.includes('"name":"تُواصل"'));
});

test('redact strips 12-digit civil IDs (Western and Eastern digits) and passport-like tokens', () => {
  assert.strictEqual(redact('رقمي 123456789012 شكرا'), 'رقمي [ID] شكرا');
  assert.strictEqual(redact('رقمي ١٢٣٤٥٦٧٨٩٠١٢'), 'رقمي [ID]');
  assert.strictEqual(redact('جوازي P12345678'), 'جوازي [PASSPORT]');
  assert.strictEqual(redact('أجدد البطاقة'), 'أجدد البطاقة');
  assert.strictEqual(redact('رقم 12345'), 'رقم 12345');
  assert.ok(hasIdentifier('123456789012'));
  assert.ok(!hasIdentifier('شلون أجدد الإقامة؟'));
});

test('cleanMessages keeps the last 6, redacts, and starts with a user turn', () => {
  const raw = Array.from({ length: 9 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
  const out = cleanMessages(raw);
  assert.ok(out.length <= 6);
  assert.strictEqual(out[0].role, 'user');
  assert.strictEqual(out[out.length - 1].content, 'm8');
  assert.strictEqual(cleanMessages([{ role: 'user', content: 'ID 123456789012' }])[0].content, 'ID [ID]');
  assert.deepStrictEqual(cleanMessages([{ role: 'system', content: 'x' }, 'junk', null]), []);
});

test('transcript labels both sides for the CLI providers', () => {
  const t = transcript([{ role: 'user', content: 'سؤال' }, { role: 'assistant', content: 'جواب' }]);
  assert.ok(t.includes('المستخدم: سؤال'));
  assert.ok(t.includes('سهّال: جواب'));
});
