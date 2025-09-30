import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'tmp', 'test-docs');

fs.mkdirSync(outputDir, { recursive: true });

const resultsPath = path.join(outputDir, 'test-results.json');
const resultsArgPath = path.relative(repoRoot, resultsPath).split(path.sep).join(path.posix.sep);

const passthroughArgs = process.argv.slice(2);

const quotedArgs = passthroughArgs.map((arg) => JSON.stringify(arg)).join(' ');

const reportersFlag = '--reporter="list,json"';
const command = `npx playwright test ${reportersFlag}${quotedArgs ? ` ${quotedArgs}` : ''}`;

const playwrightResult = spawnSync(command, {
  stdio: 'inherit',
  cwd: repoRoot,
  shell: true,
  env: {
    ...process.env,
    PLAYWRIGHT_JSON_OUTPUT_NAME: resultsArgPath
  }
});

if (playwrightResult.error) {
  throw playwrightResult.error;
}

if (!fs.existsSync(resultsPath)) {
  throw new Error(`Expected Playwright to emit JSON results at ${resultsArgPath}`);
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
