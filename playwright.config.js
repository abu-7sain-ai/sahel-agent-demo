const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:5319' },
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:5319',
    env: { PORT: '5319' },
    reuseExistingServer: false,
  },
});
