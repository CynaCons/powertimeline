import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'tmp', 'test-docs');

fs.mkdirSync(outputDir, { recursive: true });

const summaryPath = path.join(outputDir, 'test-summary.json');
const summaryArgPath = path.relative(repoRoot, summaryPath).split(path.sep).join(path.posix.sep);

const passthroughArgs = process.argv.slice(2);

const playwrightArgs = [
  'playwright',
  'test',
  `--reporter=list,json=${summaryArgPath}`,
  ...passthroughArgs
];

const playwrightResult = spawnSync('npx', playwrightArgs, {
  stdio: 'inherit',
  cwd: repoRoot,
  shell: true
});

if (playwrightResult.error) {
  throw playwrightResult.error;
}

const generatorArgs = [
  path.join(repoRoot, 'scripts', 'generate-test-doc.js'),
  '--write-doc'
];

const generatorResult = spawnSync(process.execPath, generatorArgs, {
  stdio: 'inherit',
  cwd: repoRoot
});

if (generatorResult.error) {
  throw generatorResult.error;
}

const exitCode = playwrightResult.status ?? 0;
process.exit(exitCode);
