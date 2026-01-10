#!/usr/bin/env node

/**
 * Version Check Script
 *
 * Validates that version numbers are consistent across all key files.
 * Use as a pre-commit hook to catch version drift.
 *
 * Usage: node scripts/check-version.cjs
 * Exit code: 0 if all versions match, 1 if mismatch found
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

/**
 * Extract version from a file using a regex pattern
 */
function extractVersion(filePath, pattern, groupIndex = 1) {
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    return { found: false, error: 'File not found' };
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const match = content.match(pattern);
    if (match && match[groupIndex]) {
      return { found: true, version: match[groupIndex] };
    }
    return { found: false, error: 'Pattern not matched' };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

// Define all version locations
const versionLocations = [
  {
    file: 'package.json',
    pattern: /"version":\s*"([\d.]+)"/,
    description: 'package.json version field',
    isSource: true  // This is the source of truth
  },
  {
    file: 'PLAN.md',
    pattern: /\*\*Current Version:\*\*\s*v([\d.]+)/,
    description: 'PLAN.md Current Version'
  },
  {
    file: 'README.md',
    pattern: /\*\*Version:\*\*\s*v([\d.]+)/,
    description: 'README.md Version header'
  },
  {
    file: 'docs/SRS_INDEX.md',
    pattern: /\*\*Version:\*\*\s*v([\d.]+)/,
    description: 'SRS_INDEX.md Version'
  },
  {
    file: 'AGENTS.md',
    pattern: /\*\*Current State:\*\*\s*v([\d.]+)/,
    description: 'AGENTS.md Current State'
  }
];

console.log('\n🔍 Checking version consistency...\n');

// Extract all versions
const results = versionLocations.map(loc => ({
  ...loc,
  ...extractVersion(loc.file, loc.pattern)
}));

// Find source of truth (package.json)
const source = results.find(r => r.isSource);
if (!source || !source.found) {
  console.error('❌ Could not read version from package.json');
  process.exit(1);
}

const expectedVersion = source.version;
console.log(`📦 Source of truth (package.json): v${expectedVersion}\n`);

// Check each location
let hasError = false;
const mismatches = [];

results.forEach(result => {
  const icon = result.found
    ? (result.version === expectedVersion ? '✅' : '❌')
    : '⚠️';

  if (result.found) {
    const status = result.version === expectedVersion
      ? `v${result.version}`
      : `v${result.version} (expected v${expectedVersion})`;
    console.log(`${icon} ${result.file}: ${status}`);

    if (result.version !== expectedVersion) {
      hasError = true;
      mismatches.push(result.file);
    }
  } else {
    console.log(`${icon} ${result.file}: ${result.error}`);
  }
});

console.log('');

if (hasError) {
  console.log('═'.repeat(60));
  console.log('❌ Version mismatch detected!\n');
  console.log('Mismatched files:');
  mismatches.forEach(f => console.log(`   - ${f}`));
  console.log('\n💡 Fix with: npm run version:sync ' + expectedVersion);
  console.log('═'.repeat(60) + '\n');
  process.exit(1);
} else {
  console.log('✅ All versions are consistent!\n');
  process.exit(0);
}
