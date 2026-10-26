// Local demo server: serves the page, the knowledge base, and /api/chat. No login, no cookies, no IPs stored.
const express = require('express');
const fs = require('fs');
const path = require('path');
const { buildSystemPrompt, loadServices } = require('./lib/prompt');
const { ask } = require('./lib/providers');
const { redact } = require('./lib/redact');
const { lanAddresses, openBrowser } = require('./lib/platform');

const PORT = Number(process.env.PORT) || 5318;
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'questions.log');
const PROVIDERS = ['claude-cli', 'codex-cli', 'anthropic', 'openai'];

// Arabic messages shown in the drawer when something goes wrong.
const ERRORS = {
  no_provider: 'ما فيه مزوّد متصل. افتح الإعدادات من زر القائمة (☰) فوق، واختار طريقة الاتصال، بعدين اضغط «اختبار الاتصال».',
  no_key: 'ما فيه مفتاح API. افتح الإعدادات وحط المفتاح، أو اختار Claude Code CLI.',
  not_installed: 'الأداة المختارة مو مثبتة على هالجهاز. افتح الإعدادات واختار مزوّد ثاني.',
  timeout: 'الرد تأخر وايد. جرّب مرة ثانية.',
  generic: 'صار خطأ في الاتصال بالمساعد. تأكد من الإعدادات واضغط «اختبار الاتصال».',
};

function errorMessage(e) {
  return ERRORS[e.message] || ERRORS.generic;
}

function logQuestion(text) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const line = `${new Date().toISOString()}\t${redact(text).replace(/\s+/g, ' ').trim()}\n`;
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch {
    // Logging must never break the chat.
  }
}

// Keeps the last 6 messages, redacts identifiers, and makes the list start with a user turn.
function cleanMessages(raw) {
  const list = (Array.isArray(raw) ? raw : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-6)
    .map((m) => ({ role: m.role, content: redact(m.content).slice(0, 2000) }));
  while (list.length && list[0].role !== 'user') list.shift();
  return list;
}

function pickSettings(body) {
  const s = body && typeof body.settings === 'object' && body.settings ? body.settings : {};
  return {
    provider: PROVIDERS.includes(s.provider) ? s.provider : '',
    apiKey: typeof s.apiKey === 'string' ? s.apiKey.trim() : '',
    openaiModel: typeof s.openaiModel === 'string' ? s.openaiModel.trim() : '',
  };
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/services', (req, res) => {
  res.json(loadServices());
});

// The invented citizen shown in the Data tab (all values are made up).
app.get('/api/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'profile.json'));
});

app.post('/api/chat', async (req, res) => {
  const messages = cleanMessages(req.body && req.body.messages);
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') return res.status(400).json({ ok: false, error: 'اكتب سؤالك أول.' });
  logQuestion(last.content);
  const settings = pickSettings(req.body);
  try {
    const reply = await ask(settings, buildSystemPrompt(), messages);
    if (!reply) throw new Error('empty');
    res.json({ ok: true, reply });
  } catch (e) {
    console.error(`[chat] ${settings.provider || 'none'}: ${e.message}`);
    res.json({ ok: false, error: errorMessage(e) });
  }
});

app.post('/api/test', async (req, res) => {
  const settings = pickSettings(req.body);
  try {
    const reply = await ask(settings, 'Reply with the single word: ok', [{ role: 'user', content: 'say ok' }]);
    res.json({ ok: /ok/i.test(reply), reply: reply.slice(0, 100) });
  } catch (e) {
    console.error(`[test] ${settings.provider || 'none'}: ${e.message}`);
    res.json({ ok: false, error: errorMessage(e), detail: e.message.slice(0, 200) });
  }
});

if (require.main === module) {
  const url = `http://127.0.0.1:${PORT}`;
  // Launchers set SAHEL_OPEN=1 so the browser opens only once the server is ready.
  const open = process.env.SAHEL_OPEN === '1';
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  Sahel agent demo (independent demo — not the official app)');
    console.log(`  Local:  ${url}`);
    for (const ip of lanAddresses()) console.log(`  Phone (same Wi-Fi):  http://${ip}:${PORT}`);
    console.log('');
    console.log('  Press Ctrl+C to stop.');
    if (open) openBrowser(url);
  });
  server.on('error', (e) => {
    if (e.code !== 'EADDRINUSE') throw e;
    console.log(`  The demo is already running on ${url}`);
    if (open) openBrowser(url);
    process.exit(0);
  });
}

module.exports = { app, cleanMessages };
