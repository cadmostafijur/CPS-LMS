#!/usr/bin/env node
/**
 * Railway requires bind 0.0.0.0 + process.env.PORT.
 * Logs the bind so the public-domain "Target port" can match.
 */
const { spawn } = require('child_process');
const dns = require('dns');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  /* ignore */
}

const port = process.env.PORT || '1337';
process.env.HOST = '0.0.0.0';
process.env.PORT = String(port);

console.log(`[LMS] Listening on 0.0.0.0:${port} (set Railway domain Target port to ${port})`);

const child = spawn('npx', ['strapi', 'start'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 1));
