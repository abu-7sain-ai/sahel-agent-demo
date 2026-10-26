const test = require('node:test');
const assert = require('node:assert');
const { lanAddresses, pickWindows } = require('../../lib/platform');

const v4 = (address, internal = false) => ({ family: 'IPv4', address, internal });

test('macOS: en0 Wi-Fi first, en1 next; utun/awdl/bridge/llw and link-local skipped', () => {
  const ifaces = {
    lo0: [v4('127.0.0.1', true)],
    utun3: [v4('10.8.0.2')],
    awdl0: [v4('169.254.1.2')],
    llw0: [v4('169.254.1.3')],
    bridge100: [v4('192.168.64.1')],
    en1: [v4('192.168.1.40')],
    en0: [v4('192.168.1.23'), { family: 'IPv6', address: 'fe80::1', internal: false }],
  };
  assert.deepStrictEqual(lanAddresses(ifaces), ['192.168.1.23', '192.168.1.40']);
});

test('Windows: Wi-Fi first; vEthernet (WSL/Hyper-V), VirtualBox and loopback skipped', () => {
  const ifaces = {
    'vEthernet (WSL)': [v4('172.20.16.1')],
    'VirtualBox Host-Only Network': [v4('192.168.56.1')],
    'Loopback Pseudo-Interface 1': [v4('127.0.0.1', true)],
    'Ethernet 2': [v4('10.0.0.5')],
    'Wi-Fi': [v4('192.168.8.145')],
  };
  assert.deepStrictEqual(lanAddresses(ifaces), ['192.168.8.145', '10.0.0.5']);
});

test('Node 18 numeric family is accepted', () => {
  assert.deepStrictEqual(lanAddresses({ en0: [{ family: 4, address: '192.168.0.9', internal: false }] }), ['192.168.0.9']);
});

test('Windows CLI resolution prefers .exe, then .cmd, never .ps1 or the sh shim', () => {
  assert.strictEqual(pickWindows(['C:\\npm\\claude', 'C:\\npm\\claude.cmd', 'C:\\npm\\claude.ps1']), 'C:\\npm\\claude.cmd');
  assert.strictEqual(pickWindows(['C:\\npm\\claude.cmd', 'C:\\bin\\claude.exe']), 'C:\\bin\\claude.exe');
  assert.strictEqual(pickWindows(['C:\\npm\\claude.ps1']), null);
});
