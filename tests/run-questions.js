// Runs the ten acceptance questions through /api/chat with a real provider and writes tests/questions.md.
// Usage: node tests/run-questions.js [provider]   (default: claude-cli)
const fs = require('fs');
const path = require('path');
const { app } = require('../server');
const QUESTIONS = require('./questions.config');
const { grade } = require('./grade');

const provider = process.argv[2] || 'claude-cli';
const OUT = path.join(__dirname, 'questions.md');

async function askOne(base, q) {
  const started = Date.now();
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: q }], settings: { provider } }),
  });
  const data = await res.json();
  return { answer: data.ok ? data.reply : `ERROR: ${data.error}`, seconds: ((Date.now() - started) / 1000).toFixed(1) };
}

(async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const rows = [];
  for (const [i, item] of QUESTIONS.entries()) {
    const { answer, seconds } = await askOne(base, item.q);
    const g = grade(item, answer);
    rows.push({ n: i + 1, ...item, answer, seconds, ...g });
    console.log(`${g.pass ? 'PASS' : 'FAIL'} ${i + 1}. ${item.q} (${seconds}s) ${g.reasons.join('; ')}`);
  }
  server.close();

  const passed = rows.filter((r) => r.pass).length;
  const md = [
    '# Acceptance questions — results',
    '',
    `Run: ${new Date().toISOString()} · provider: ${provider} · result: ${passed}/${rows.length} PASS`,
    '',
    'Each answer was produced by `/api/chat` and checked automatically (tests/grade.js): required service/agency names, a "خدمات ←" path, no greeting, no "anything else?", no headings/tables, fee rule, refusal rule.',
    '',
    ...rows.flatMap((r) => [
      `## ${r.n}. ${r.q} — ${r.pass ? 'PASS' : 'FAIL'}`,
      '',
      `Time: ${r.seconds}s${r.reasons.length ? ` · Problems: ${r.reasons.join('; ')}` : ''}`,
      '',
      ...r.answer.split('\n').map((l) => `> ${l}`),
      '',
    ]),
  ].join('\n');
  fs.writeFileSync(OUT, md, 'utf8');
  console.log(`\n${passed}/${rows.length} PASS — written to tests/questions.md`);
  process.exit(passed === rows.length ? 0 : 1);
})();
