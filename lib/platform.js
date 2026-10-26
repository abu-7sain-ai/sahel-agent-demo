// Windows / macOS differences in one place: finding CLIs, the PATH they need, and the Wi-Fi address for phones.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const IS_WIN = process.platform === 'win32';

// Where CLIs usually live when the server was started from Finder/Explorer with a short PATH.
function extraDirs() {
  const home = os.homedir();
  const dirs = [path.dirname(process.execPath)];
  if (IS_WIN) {
    if (process.env.APPDATA) dirs.push(path.join(process.env.APPDATA, 'npm'));
    dirs.push(path.join(home, '.local', 'bin'));
  } else {
    dirs.push(
      path.join(home, '.local', 'bin'),
      path.join(home, '.claude', 'local'),
      path.join(home, '.npm-global', 'bin'),
      path.join(home, '.volta', 'bin'),
      '/opt/homebrew/bin',
      '/usr/local/bin',
    );
  }
  return dirs;
}

function childEnv() {
  const parts = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const d of extraDirs()) if (!parts.includes(d)) parts.push(d);
  return { ...process.env, PATH: parts.join(path.delimiter) };
}

// Windows: prefer a real .exe, then the npm .cmd shim; never the .ps1 or the extensionless sh shim.
function pickWindows(candidates) {
  const usable = candidates.filter((c) => /\.(exe|cmd|bat)$/i.test(c));
  return usable.find((c) => /\.exe$/i.test(c)) || usable[0] || null;
}

const cache = new Map();

// Full path of a CLI (e.g. "claude", "codex"), or null when it is not installed.
function resolveCommand(name) {
  if (cache.has(name)) return cache.get(name);
  const env = childEnv();
  let found = null;
  try {
    const out = execFileSync(IS_WIN ? 'where.exe' : 'which', IS_WIN ? [name] : ['-a', name], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
    const lines = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    found = IS_WIN ? pickWindows(lines) : lines[0] || null;
  } catch {
    // Not on PATH; fall through to the usual install folders.
  }
  if (!found) {
    const exts = IS_WIN ? ['.exe', '.cmd'] : [''];
    for (const dir of extraDirs()) {
      const hit = exts.map((e) => path.join(dir, name + e)).find((p) => fs.existsSync(p));
      if (hit) { found = hit; break; }
    }
  }
  cache.set(name, found);
  return found;
}

// Virtual adapters that phones on the Wi-Fi can't reach.
const VIRTUAL = /(vethernet|virtualbox|vmware|hyper-v|wsl|docker|vbox|loopback|bluetooth|tailscale|zerotier|tap-windows|^(utun|awdl|llw|bridge|anpi|ap|gif|stf|vmnet|vnic|tun|tap|lo)\d*$)/i;

function rank(name) {
  if (/^en0$/i.test(name)) return 0; // macOS built-in Wi-Fi (or Ethernet on desktops)
  if (/^en\d+$/i.test(name)) return 1; // other macOS Wi-Fi / Ethernet ports
  if (/wi-?fi|wlan|wireless/i.test(name)) return 0; // Windows Wi-Fi adapter
  if (/ethernet|^eth\d|^enp|^wlp/i.test(name)) return 1; // Windows/Linux wired
  return 2;
}

// IPv4 addresses a phone on the same network can open, best first.
function lanAddresses(interfaces = os.networkInterfaces()) {
  const list = [];
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (VIRTUAL.test(name)) continue;
    for (const a of addrs || []) {
      const v4 = a.family === 'IPv4' || a.family === 4;
      if (!v4 || a.internal || a.address.startsWith('169.254.')) continue;
      list.push({ name, address: a.address, rank: rank(name) });
    }
  }
  return list.sort((x, y) => x.rank - y.rank).map((x) => x.address).filter((a, i, all) => all.indexOf(a) === i);
}

// Opens a URL in the default browser (used when a launcher starts the server).
function openBrowser(url) {
  const { spawn } = require('child_process');
  const [cmd, args] = IS_WIN ? ['cmd', ['/c', 'start', '""', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  } catch {
    // The URL is printed in the console anyway.
  }
}

module.exports = { IS_WIN, resolveCommand, childEnv, lanAddresses, openBrowser, pickWindows };
