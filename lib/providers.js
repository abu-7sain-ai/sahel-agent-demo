// The three ways سهّال can answer: Claude Code CLI, Codex CLI, or an API key sent per request from the browser.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');

const { resolveCommand, childEnv } = require('./platform');

const CLAUDE_MODEL = process.env.SAHEL_CLAUDE_MODEL || 'claude-sonnet-5-5';
const TIMEOUT_MS = 120000;

// Quote one argument for cmd.exe (only used for Windows .cmd/.bat shims).
function q(arg) {
  return `"${String(arg).replace(/"/g, '""')}"`;
}

function run(name, args, input) {
  return new Promise((resolve, reject) => {
    const bin = resolveCommand(name);
    if (!bin) return reject(new Error('not_installed'));
    // Windows .cmd shims can only run through cmd.exe, as one pre-quoted command line; everything else runs directly.
    const viaShell = /\.(cmd|bat)$/i.test(bin);
    const child = spawn(viaShell ? [q(bin), ...args.map(q)].join(' ') : bin, viaShell ? [] : args, {
      shell: viaShell,
      cwd: os.tmpdir(),
      windowsHide: true,
      env: childEnv(),
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('timeout'));
    }, TIMEOUT_MS);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e.code === 'ENOENT' ? new Error('not_installed') : e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0 && !out) {
        const notFound = /not recognized|not found|ENOENT/i.test(err);
        return reject(new Error(notFound ? 'not_installed' : err.trim().slice(0, 300) || `exit ${code}`));
      }
      resolve(out);
    });
    child.stdin.end(input, 'utf8');
  });
}

function tmpFile(content) {
  const file = path.join(os.tmpdir(), `sahel-${crypto.randomUUID()}.txt`);
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

// Lean mode: our system prompt only, no tools, no MCP, no saved session.
async function claudeCli(system, prompt) {
  const sysFile = tmpFile(system);
  try {
    const out = await run('claude', [
      '-p',
      '--output-format', 'json',
      '--model', CLAUDE_MODEL,
      '--system-prompt-file', sysFile,
      '--tools', '',
      '--strict-mcp-config',
      '--no-session-persistence',
    ], prompt);
    const data = JSON.parse(out.slice(out.indexOf('{')));
    if (data.is_error) throw new Error(String(data.result || data.subtype || 'claude error').slice(0, 300));
    return String(data.result || '').trim();
  } finally {
    fs.rm(sysFile, { force: true }, () => {});
  }
}

// Codex has no system-prompt flag: instructions and conversation go in one prompt on stdin.
async function codexCli(system, prompt) {
  const out = await run('codex', ['exec', '--skip-git-repo-check', '-'], `${system}\n\n---\n\n${prompt}`);
  return out.trim();
}

async function anthropicApi(system, messages, key) {
  const client = new Anthropic({ apiKey: key, maxRetries: 1, timeout: TIMEOUT_MS });
  const res = await client.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system,
    messages,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });
  if (res.stop_reason === 'refusal') throw new Error('refusal');
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
}

async function openaiApi(system, messages, key, model) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: model || 'gpt-4.1-mini', messages: [{ role: 'system', content: system }, ...messages] }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message?.slice(0, 300) || `HTTP ${res.status}`);
  return String(data.choices?.[0]?.message?.content || '').trim();
}

const { transcript } = require('./prompt');

// settings: { provider: 'claude-cli' | 'codex-cli' | 'anthropic' | 'openai', apiKey?, openaiModel? }
async function ask(settings, system, messages) {
  switch (settings.provider) {
    case 'claude-cli':
      return claudeCli(system, transcript(messages));
    case 'codex-cli':
      return codexCli(system, transcript(messages));
    case 'anthropic':
      if (!settings.apiKey) throw new Error('no_key');
      return anthropicApi(system, messages, settings.apiKey);
    case 'openai':
      if (!settings.apiKey) throw new Error('no_key');
      return openaiApi(system, messages, settings.apiKey, settings.openaiModel);
    default:
      throw new Error('no_provider');
  }
}

module.exports = { ask, CLAUDE_MODEL };
