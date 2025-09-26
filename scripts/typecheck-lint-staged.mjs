#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tscExecutable = resolve(__dirname, '../node_modules/.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');

const result = spawnSync(tscExecutable, ['--noEmit', '--skipLibCheck', '--project', 'tsconfig.app.json'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
  process.exit(result.status ?? 1);
}

process.exit(result.status ?? 0);
