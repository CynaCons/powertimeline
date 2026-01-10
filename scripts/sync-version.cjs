#!/usr/bin/env node

/**
 * Version Sync Script
 *
 * Updates version numbers across all key files in the PowerTimeline project.
 *
 * Usage: node scripts/sync-version.js <version>
 * Example: node scripts/sync-version.js 0.5.29
 */

const fs = require('fs');
const path = require('path');

// Parse version from command line
const version = process.argv[2];
if (!version) {
  console.error('❌ Error: No version specified');
  console.error('Usage: node scripts/sync-version.js <version>');
  console.error('Example: node scripts/sync-version.js 0.5.29');
  process.exit(1);
}

// Validate version format (basic semver check)
if (!/^\d+\.\d+\.\d+(\.\d+)?$/.test(version)) {
  console.error(`❌ Error: Invalid version format "${version}"`);
  console.error('Expected format: X.Y.Z or X.Y.Z.W (e.g., 0.5.29 or 0.5.29.1)');
  process.exit(1);
}

console.log(`\n🔄 Syncing version to v${version}...\n`);

const rootDir = path.resolve(__dirname, '..');
const updates = [];

/**
 * Update a file with regex replacement
 * @param {string} filePath - Relative path from project root
 * @param {RegExp} pattern - Regex pattern to match
 * @param {string} replacement - Replacement string (can use $1, $2, etc.)
 * @param {string} description - Human-readable description of what was updated
 */
function updateFile(filePath, pattern, replacement, description) {
  const fullPath = path.join(rootDir, filePath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipped: ${filePath} (file not found)`);
    return;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const newContent = content.replace(pattern, replacement);

    // Check if anything changed
    if (content === newContent) {
      console.log(`ℹ️  No change: ${filePath} (pattern not found or already at v${version})`);
      return;
    }

    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    console.log(`   ${description}`);
    updates.push(filePath);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update package.json - "version" field
updateFile(
  'package.json',
  /"version":\s*"[^"]+"/,
  `"version": "${version}"`,
  `Set version to "${version}"`
);

// Update PLAN.md - Quick Summary "Current Version" line
updateFile(
  'PLAN.md',
  /\*\*Current Version:\*\*\s*v[\d.]+[^\n]*/,
  `**Current Version:** v${version}`,
  `Set current version to v${version}`
);

// Update docs/SRS_INDEX.md - version header
updateFile(
  'docs/SRS_INDEX.md',
  /\*\*Version:\*\*\s*v[\d.]+/,
  `**Version:** v${version}`,
  `Set SRS version to v${version}`
);

// Update AGENTS.md - version reference
updateFile(
  'AGENTS.md',
  /\*\*Current State:\*\*\s*v[\d.]+/,
  `**Current State:** v${version}`,
  `Set agent context version to v${version}`
);

// Update README.md - version in header line
updateFile(
  'README.md',
  /\*\*Version:\*\*\s*v[\d.]+/,
  `**Version:** v${version}`,
  `Set README version to v${version}`
);

// Update README.md - "Last Updated" footer
updateFile(
  'README.md',
  /\*\*Last Updated:\*\*\s*[\d-]+\s*\|\s*\*\*Version:\*\*\s*v[\d.]+/,
  `**Last Updated:** ${new Date().toISOString().split('T')[0]} | **Version:** v${version}`,
  `Set README footer to v${version}`
);

// Update docs/TESTS.md - version header
updateFile(
  'docs/TESTS.md',
  /\*\*Version:\*\*\s*v[\d.]+/,
  `**Version:** v${version}`,
  `Set TESTS.md version to v${version}`
);

// Summary
console.log(`\n${'='.repeat(60)}`);
if (updates.length > 0) {
  console.log(`✅ Successfully updated ${updates.length} file(s) to v${version}`);
  console.log(`\nUpdated files:`);
  updates.forEach(file => console.log(`   - ${file}`));
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review changes: git diff`);
  console.log(`   2. Commit changes: git add -A && git commit -m "chore: bump version to v${version}"`);
} else {
  console.log(`⚠️  No files were updated`);
  console.log(`   All files may already be at v${version}, or patterns didn't match`);
}
console.log(`${'='.repeat(60)}\n`);

process.exit(updates.length > 0 ? 0 : 1);
