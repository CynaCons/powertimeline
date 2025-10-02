import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'tmp', 'test-docs');

fs.mkdirSync(outputDir, { recursive: true });

const summaryPathCandidates = [
  path.join(outputDir, 'test-results.json'),
  path.join(repoRoot, 'test-results.json'),
  path.join(outputDir, 'test-summary.json'),
  path.join(repoRoot, 'test-summary.json')
];

const summaryPath = summaryPathCandidates.find((candidate) => fs.existsSync(candidate));

if (!summaryPath) {
  throw new Error('Missing test-summary.json. Expected at tmp/test-docs/ or repository root.');
}

const rawData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

const args = process.argv.slice(2);
const shouldWriteDoc = args.includes('--write-doc');

const normalized = normalizeSummaryData(rawData);
const summary = {
  counts: normalized.counts,
  summary: normalized.summaryEntries
};

const metadata = normalized.metadata || {};
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const playwrightVersionRaw = metadata.playwrightVersion || packageJson.devDependencies?.['@playwright/test'] || packageJson.dependencies?.['@playwright/test'] || '';
const playwrightVersion = playwrightVersionRaw.replace(/^[^0-9]*/, '') || 'unknown';
const runDate = metadata.startTime ? new Date(metadata.startTime).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
const runnerCommand = 'npm run test:update-doc';

const persistedSummary = {
  ...summary,
  metadata: {
    startTime: metadata.startTime,
    playwrightVersion
  }
};

fs.writeFileSync(path.join(outputDir, 'test-summary.json'), JSON.stringify(persistedSummary, null, 2));

const mapping = {
  'v5/01-foundation.smoke.spec.ts': {
    category: 'Foundation & Core Tests',
    summary: 'Verifies app loads and timeline axis is visible',
    requirements: 'CC-REQ-FOUND-001'
  },
  'v5/02-cards-placement.spec.ts': {
    category: 'Foundation & Core Tests',
    summary: 'Ensures cards render above and below the axis',
    requirements: 'CC-REQ-CARDS-001'
  },
  'v5/03-non-overlap-fit.spec.ts': {
    category: 'Foundation & Core Tests',
    summary: 'Prevents card overlaps including Napoleon Fit-All scenario',
    requirements: 'CC-REQ-CARDS-002'
  },
  'v5/04-dispatch-band.spec.ts': {
    category: 'Telemetry & Monitoring Tests',
    summary: 'Monitors dispatch band average events per cluster',
    requirements: '-'
  },
  'v5/05-capacity-model.spec.ts': {
    category: 'Telemetry & Monitoring Tests',
    summary: 'Reports total and used cells with utilization telemetry',
    requirements: 'CC-REQ-CAPACITY-001'
  },
  'v5/06-degrade-promote.spec.ts': {
    category: 'Telemetry & Monitoring Tests',
    summary: 'Checks degradation counts and placeholder telemetry',
    requirements: 'CC-REQ-DEGRADATION-001'
  },
  'v5/07-aggregation-policy.spec.ts': {
    category: 'Telemetry & Monitoring Tests',
    summary: 'Validates aggregation metrics reconcile with event counts',
    requirements: '-'
  },
  'v5/08-stability-churn.spec.ts': {
    category: 'Telemetry & Monitoring Tests',
    summary: 'Confirms layout stability with minimal churn after viewport change',
    requirements: 'CC-REQ-LAYOUT-004'
  },
  'v5/09-seeding-scenarios.spec.ts': {
    category: 'Integration & Scenarios Tests',
    summary: 'Covers seeded historical scenarios and screenshot baselines',
    requirements: '-'
  },
  'v5/10-space-optimization.spec.ts': {
    category: 'Layout & Positioning Tests',
    summary: 'Measures horizontal space usage and spatial distribution metrics',
    requirements: 'CC-REQ-LAYOUT-SEMICOL-001'
  },
  'v5/11-half-column-telemetry.spec.ts': {
    category: 'Telemetry & Monitoring Tests',
    summary: 'Validates half-column slot telemetry structure',
    requirements: '-'
  },
  'v5/12-alternating-pattern.spec.ts': {
    category: 'Layout & Positioning Tests',
    summary: 'Ensures alternating pattern between upper and lower semi-columns',
    requirements: 'CC-REQ-LAYOUT-003'
  },
  'v5/13-overflow-logic.spec.ts': {
    category: 'Overflow Management Tests',
    summary: 'Verifies half-column overflow thresholds and regression scenarios',
    requirements: 'CC-REQ-OVERFLOW-001/002'
  },
  'v5/14-navigation-rail-overlap.spec.ts': {
    category: 'Layout & Positioning Tests',
    summary: 'Prevents cards from colliding with navigation rail',
    requirements: 'CC-REQ-LAYOUT-002'
  },
  'v5/15-overflow-label-overlap.spec.ts': {
    category: 'Overflow Management Tests',
    summary: 'Checks overflow label spacing to avoid overlaps',
    requirements: 'CC-REQ-OVERFLOW-004'
  },
  'v5/16-real-viewport-layout.spec.ts': {
    category: 'Layout & Positioning Tests',
    summary: 'Confirms layout positions in realistic and narrow viewport sizes',
    requirements: '-'
  },
  'v5/17-zoom-functionality.spec.ts': {
    category: 'Zoom & Navigation Tests',
    summary: 'Exercises zoom controls, mouse wheel, and filtering',
    requirements: 'CC-REQ-ZOOM-001'
  },
  'v5/18-zoom-stability.spec.ts': {
    category: 'Zoom & Navigation Tests',
    summary: 'Covers zoom stability, cursor anchoring, and range limits',
    requirements: 'CC-REQ-ZOOM-002'
  },
  'v5/19-zoom-edge-cases.spec.ts': {
    category: 'Zoom & Navigation Tests',
    summary: 'Tests extreme zoom edge cases and performance',
    requirements: 'CC-REQ-ZOOM-002'
  },
  'v5/20-timeline-cursor-zoom.spec.ts': {
    category: 'Zoom & Navigation Tests',
    summary: 'Validates timeline cursor zoom anchoring and overflow targeting',
    requirements: 'CC-REQ-ZOOM-001'
  },
  'v5/21-timeline-minimap.spec.ts': {
    category: 'Minimap Tests',
    summary: 'Examines minimap rendering, range indicator, density, navigation',
    requirements: 'CC-REQ-MINIMAP-001'
  },
  'v5/22-minimap-basic.spec.ts': {
    category: 'Minimap Tests',
    summary: 'Validates minimap basic behavior and empty states',
    requirements: 'CC-REQ-MINIMAP-001'
  },
  'v5/23-zoom-stability.spec.ts': {
    category: 'Zoom & Navigation Tests',
    summary: 'Checks zoom stability across repeated cycles and cursor positions',
    requirements: 'CC-REQ-ZOOM-002'
  },
  'v5/24-zoom-boundaries.spec.ts': {
    category: 'Zoom & Navigation Tests',
    summary: 'Ensures zoom boundaries clamp correctly',
    requirements: 'CC-REQ-ZOOM-001'
  },
  'v5/25-max-zoom-sliding.spec.ts': {
    category: 'Zoom & Navigation Tests',
    summary: 'Verifies max zoom sliding constraints and cursor alignment',
    requirements: 'CC-REQ-ZOOM-003'
  },
  'v5/26-minimap-drag.spec.ts': {
    category: 'Minimap Tests',
    summary: 'Validates minimap drag interactions and boundary enforcement',
    requirements: 'CC-REQ-MINIMAP-002'
  },
  'v5/27-minimap-timeline-sync.spec.ts': {
    category: 'Minimap Tests',
    summary: 'Ensures minimap and timeline stay synchronized during interaction',
    requirements: 'CC-REQ-MINIMAP-002'
  },
  'v5/28-napoleon-sliding-validation.spec.ts': {
    category: 'Zoom & Navigation Tests',
    summary: 'Runs sliding validation across Napoleon timeline view windows',
    requirements: '-'
  },
  'v5/29-deep-zoom-comprehensive-sliding.spec.ts': {
    category: 'Zoom & Navigation Tests',
    summary: 'Exercises deep zoom sliding scenarios for overflow consistency',
    requirements: 'CC-REQ-ZOOM-003'
  },
  'v5/30-leftover-overflow-detection.spec.ts': {
    category: 'Overflow Management Tests',
    summary: 'Detects leftover overflow badges across navigation sequences',
    requirements: 'CC-REQ-OVERFLOW-001/002'
  },
  'v5/31-aggressive-leftover-detection.spec.ts': {
    category: 'Overflow Management Tests',
    summary: 'Stresses overflow detection via aggressive navigation patterns',
    requirements: 'CC-REQ-ANCHOR-001'
  },
  'v5/32-view-window-overflow-bug.spec.ts': {
    category: 'Overflow Management Tests',
    summary: 'Recreates view window overflow bug scenarios to ensure cleanup',
    requirements: 'CC-REQ-ANCHOR-001'
  },
  'v5/33-directional-anchors.spec.ts': {
    category: 'Anchor & Timeline Alignment Tests',
    summary: 'Validates directional anchor connectors and cleanup behavior',
    requirements: 'CC-REQ-ANCHOR-001/003'
  },
  'v5/33-timeline-separators.spec.ts': {
    category: 'Timeline Axis Tests',
    summary: 'Ensures timeline separators render according to scale settings',
    requirements: 'CC-REQ-AXIS-001'
  },
  'v5/34-adaptive-timeline-scales.spec.ts': {
    category: 'Timeline Axis Tests',
    summary: 'Checks adaptive timeline scale labels across zoom levels',
    requirements: 'CC-REQ-AXIS-001'
  },
  'v5/35-adaptive-scale-visibility.spec.ts': {
    category: 'Timeline Axis Tests',
    summary: 'Ensures adaptive scale visibility and axis styling remain legible',
    requirements: 'CC-REQ-AXIS-001'
  },
  'v5/36-card-degradation-system.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Validates card degradation transitions from full to compact',
    requirements: 'CC-REQ-DEGRADATION-001'
  },
  'v5/37-degradation-system-validation.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Verifies degradation across Napoleon, RFK, WWII datasets and telemetry',
    requirements: 'CC-REQ-DEGRADATION-001'
  },
  'v5/38-degradation-with-real-data.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Runs degradation engine against real Napoleon dataset',
    requirements: 'CC-REQ-DEGRADATION-001'
  },
  'v5/39-simple-degradation-test.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Covers basic degradation behavior and telemetry math checks',
    requirements: 'CC-REQ-DEGRADATION-001'
  },
  'v5/40-card-color-system.spec.ts': {
    category: 'Visual Design Tests',
    summary: 'Validates card color system visuals and accessibility guidance',
    requirements: 'CC-REQ-VISUAL-001'
  },
  'v5/41-visual-color-demo.spec.ts': {
    category: 'Visual Design Tests',
    summary: 'Provides visual demo coverage for card color variations',
    requirements: 'CC-REQ-VISUAL-001'
  },
  'v5/42-degradation-investigation.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Investigates degradation triggers within Napoleon timeline',
    requirements: '-'
  },
  'v5/43-degradation-fix-validation.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Validates degradation fixes for green cards and consistency',
    requirements: '-'
  },
  'v5/44-simple-degradation-validation.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Checks simplified degradation validation and telemetry output',
    requirements: '-'
  },
  'v5/45-degradation-with-generated-data.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Runs degradation engine with generated dense event sets',
    requirements: '-'
  },
  'v5/46-degradation-reality-check.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Performs degradation reality check on Napoleon timeline data',
    requirements: '-'
  },
  'v5/47-jfk-fitall-overflow-semi.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Ensures JFK Fit-All semi-columns avoid overflow stacking issues',
    requirements: 'CC-REQ-SEMICOL-002'
  },
  'v5/48-title-only-degradation.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Validates title-only degradation under dense clusters',
    requirements: 'CC-REQ-CARD-TITLE-ONLY'
  },
  'v5/49-title-only-capacity-and-width.spec.ts': {
    category: 'Card Degradation Tests',
    summary: 'Checks title-only card capacity limits and width targets',
    requirements: 'CC-REQ-CARD-TITLE-ONLY'
  },
  'v5/50-panels-visibility.spec.ts': {
    category: 'UI & Panels Tests',
    summary: 'Verifies panels visibility, Create overlay behavior, Dev panel sizing',
    requirements: 'CC-REQ-UI-001'
  },
  'v5/51-authoring-overlay.spec.ts': {
    category: 'UI & Panels Tests',
    summary: 'Validates authoring overlay interactions and validation states',
    requirements: 'CC-REQ-UI-002'
  },
  'v5/52-panel-scroll-behavior.spec.ts': {
    category: 'UI & Panels Tests',
    summary: 'Ensures side panel scrolling is isolated from timeline canvas',
    requirements: 'CC-REQ-UI-001'
  },
  'v5/53-inline-plus-create.spec.ts': {
    category: 'UI & Panels Tests',
    summary: 'Confirms inline \'plus\' affordances launch Create overlay',
    requirements: '-'
  },
  'v5/55-navigation-enhancements.spec.ts': {
    category: 'UI & Panels Tests',
    summary: 'Checks enhanced navigation shortcuts, command palette, breadcrumbs',
    requirements: 'CC-REQ-UI-003'
  },
  'v5/55-yaml-export-import.spec.ts': {
    category: 'Data Management Tests',
    summary: 'Verifies YAML export/import availability and gating',
    requirements: 'CC-REQ-DATA-001'
  },
  'v5/56-overflow-indicators-visibility.spec.ts': {
    category: 'Overflow Management Tests',
    summary: 'Validates overflow indicator visibility and positioning accuracy',
    requirements: 'CC-REQ-OVERFLOW-003'
  },
  'v5/57-anchor-date-alignment.spec.ts': {
    category: 'Anchor & Timeline Alignment Tests',
    summary: 'Checks anchor date alignment across zoom and panning',
    requirements: 'CC-REQ-ANCHOR-002'
  },
  'v5/58-comprehensive-anchor-alignment.spec.ts': {
    category: 'Anchor & Timeline Alignment Tests',
    summary: 'Performs comprehensive anchor alignment across datasets and zooms',
    requirements: 'CC-REQ-ANCHOR-002'
  },
  'v5/59-necker-demo.spec.ts': {
    category: 'Integration & Scenarios Tests',
    summary: 'Demonstrates Necker event alignment issue and resolution',
    requirements: '-'
  },
  'v5/60-necker-zoom-demo.spec.ts': {
    category: 'Integration & Scenarios Tests',
    summary: 'Shows Necker alignment across multiple zoom levels',
    requirements: '-'
  },
  'v5/61-anchor-persistence-french-revolution.spec.ts': {
    category: 'Anchor & Timeline Alignment Tests',
    summary: 'Ensures anchor persistence across zooms for French Revolution data',
    requirements: 'CC-REQ-ANCHOR-004, CC-REQ-LAYOUT-004'
  },
  'v5/62-timeline-scale-date-alignment.spec.ts': {
    category: 'Timeline Axis Tests',
    summary: 'Validates timeline scale labels align with hover dates',
    requirements: 'CC-REQ-AXIS-002'
  },
  'v5/63-minimap-overlay-visibility.spec.ts': {
    category: 'Minimap Tests',
    summary: 'Ensures minimap stays visible and highlights under overlays',
    requirements: '-'
  },
  'v5/64-axis-black-styling.spec.ts': {
    category: 'Timeline Axis Tests',
    summary: 'Ensures axis bar, ticks, and labels render solid black',
    requirements: 'CC-REQ-AXIS-003'
  },
  'v5/65-minimap-manual-verification.spec.ts': {
    category: 'Minimap Tests',
    summary: 'Manual minimap verification for z-index and loading integrity',
    requirements: '-'
  }
};

const categoryOrder = [
  'Foundation & Core Tests',
  'Telemetry & Monitoring Tests',
  'Layout & Positioning Tests',
  'Card Degradation Tests',
  'Overflow Management Tests',
  'Anchor & Timeline Alignment Tests',
  'Zoom & Navigation Tests',
  'Minimap Tests',
  'Timeline Axis Tests',
  'UI & Panels Tests',
  'Data Management Tests',
  'Visual Design Tests',
  'Integration & Scenarios Tests'
];

const statusByFile = new Map(summary.summary.map((entry) => [
  entry.file,
  {
    ok: entry.ok,
    failingSpecs: entry.specs.filter((spec) => !spec.ok).map((spec) => spec.title),
    totalSpecs: entry.specs.length,
    passingSpecs: entry.specs.filter((spec) => spec.ok).length
  }
]));

const unknownFiles = Array.from(statusByFile.keys()).filter((file) => !mapping[file]);
if (unknownFiles.length) {
  throw new Error(`Missing mapping entries for files: ${unknownFiles.join(', ')}`);
}

const grouped = {};
for (const [file, meta] of Object.entries(mapping)) {
  const status = statusByFile.get(file);
  const category = meta.category;
  if (!grouped[category]) {
    grouped[category] = [];
  }
  let statusCode = 'not-run';
  let statusText = '⚪ Not run';
  if (status) {
    if (status.ok) {
      statusCode = 'pass';
      statusText = '✅ Pass';
    } else {
      statusCode = 'fail';
      const detail = status.failingSpecs[0] ? ` — ${status.failingSpecs[0]}` : '';
      statusText = `❌ Fail${detail}`;
    }
  }
  grouped[category].push({
    file,
    ...meta,
    statusText,
    statusCode
  });
}

for (const category of Object.keys(grouped)) {
  grouped[category].sort((a, b) => a.file.localeCompare(b.file));
}

let tableLines = [];
tableLines.push(`| Test File | Summary | Category | Linked Requirements | Status (${runDate}) |`);
tableLines.push('|---|---|---|---|---|');
for (const category of categoryOrder) {
  if (!grouped[category]) continue;
  tableLines.push(`| **${category}** | | | | |`);
  for (const row of grouped[category]) {
    tableLines.push(`| ${row.file} | ${row.summary} | ${category.replace(/\|/g, '&#124;')} | ${row.requirements} | ${row.statusText} |`);
  }
}

fs.writeFileSync(path.join(outputDir, 'generated-tests-table.md'), tableLines.join('\n'));

const categorySummary = [];
for (const category of categoryOrder) {
  if (!grouped[category]) continue;
  const total = grouped[category].length;
  const passing = grouped[category].filter((row) => row.statusCode === 'pass').length;
  const failing = total - passing;
  const passRate = total ? Math.round((passing / total) * 100) : 0;
  categorySummary.push({ category, total, passing, failing, passRate });
}

let summaryLines = [];
summaryLines.push('| Category | Total Tests | Passing | Failing | Pass Rate |');
summaryLines.push('|---|---|---|---|---|');
for (const row of categorySummary) {
  summaryLines.push(`| ${row.category} | ${row.total} | ${row.passing} | ${row.failing} | ${row.passRate}% |`);
}

fs.writeFileSync(path.join(outputDir, 'generated-category-summary.md'), summaryLines.join('\n'));

const overallSpecs = summary.summary.reduce((acc, entry) => acc + entry.specs.length, 0);
const overallPassingSpecs = summary.summary.reduce((acc, entry) => acc + entry.specs.filter((spec) => spec.ok).length, 0);
const overallFailingSpecs = overallSpecs - overallPassingSpecs;
const overall = {
  specFilesPassing: summary.counts.passed,
  specFilesFailing: summary.counts.failed,
  totalSpecFiles: summary.counts.passed + summary.counts.failed,
  playwrightTestsPassing: overallPassingSpecs,
  playwrightTestsFailing: overallFailingSpecs,
  totalPlaywrightTests: overallSpecs
};
fs.writeFileSync(path.join(outputDir, 'generated-overall-summary.json'), JSON.stringify(overall, null, 2));

if (shouldWriteDoc) {
  const docPath = path.join(repoRoot, 'docs', 'TESTS.md');
  if (!fs.existsSync(docPath)) {
    throw new Error('Expected docs/TESTS.md to exist when using --write-doc');
  }

  const docContent = fs.readFileSync(docPath, 'utf8');

  const runSummaryContent = [
    `- **Date:** ${runDate}`,
    `- **Runner:** \`${runnerCommand}\` (Playwright ${playwrightVersion})`,
    `- **Spec files:** ${overall.specFilesPassing} passing / ${overall.specFilesFailing} failing (${overall.totalSpecFiles} total)`,
    `- **Individual tests:** ${overall.playwrightTestsPassing} passing / ${overall.playwrightTestsFailing} failing (${overall.totalPlaywrightTests} total)`
  ].join('\n');

  const detailsContent = tableLines.join('\n');
  const categorySummaryContent = summaryLines.join('\n');

  let updatedDoc = replaceGeneratedSection(docContent, 'RUN-SUMMARY', runSummaryContent);
  updatedDoc = replaceGeneratedSection(updatedDoc, 'DETAILS', detailsContent);
  updatedDoc = replaceGeneratedSection(updatedDoc, 'CATEGORY-SUMMARY', categorySummaryContent);

  fs.writeFileSync(docPath, updatedDoc);
}

function replaceGeneratedSection(source, marker, innerContent) {
  const startMarker = `<!-- GENERATED:${marker} -->`;
  const endMarker = `<!-- /GENERATED:${marker} -->`;
  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Missing markers ${startMarker} or ${endMarker} in docs/TESTS.md`);
  }

  const before = source.slice(0, startIndex);
  const after = source.slice(endIndex + endMarker.length);
  const replacement = `${startMarker}\n${innerContent}\n${endMarker}`;

  return `${before}${replacement}${after}`;
}

function normalizeSummaryData(data) {
  if (Array.isArray(data.summary) && data.counts) {
    return {
      summaryEntries: data.summary,
      counts: data.counts,
      metadata: {
        startTime: data.metadata?.startTime,
        playwrightVersion: data.metadata?.playwrightVersion || data.playwrightVersion
      }
    };
  }

  return buildSummaryFromResults(data);
}

function buildSummaryFromResults(results) {
  const fileMap = new Map();

  const visitSuite = (suite) => {
    for (const spec of suite.specs || []) {
      const file = spec.file || suite.file || 'unknown';
      const ok = computeSpecOk(spec);
      const entry = fileMap.get(file);
      const specRecord = { title: spec.title, ok };
      if (entry) {
        entry.specs.push(specRecord);
        entry.ok = entry.ok && ok;
      } else {
        fileMap.set(file, { file, specs: [specRecord], ok });
      }
    }

    for (const child of suite.suites || []) {
      visitSuite(child);
    }
  };

  for (const suite of results.suites || []) {
    visitSuite(suite);
  }

  const summaryEntries = Array.from(fileMap.values())
    .map((entry) => ({
      file: entry.file,
      specs: entry.specs,
      ok: entry.specs.every((spec) => spec.ok)
    }))
    .sort((a, b) => a.file.localeCompare(b.file));

  const counts = {
    passed: summaryEntries.filter((entry) => entry.ok).length,
    failed: summaryEntries.filter((entry) => !entry.ok).length
  };

  const metadata = {
    startTime: results.stats?.startTime,
    playwrightVersion: results.config?.version
  };

  return { summaryEntries, counts, metadata };
}

function computeSpecOk(spec) {
  if (typeof spec.ok === 'boolean') {
    return spec.ok;
  }
  if (Array.isArray(spec.tests)) {
    return spec.tests.every((test) =>
      (test.results || []).every((result) => result.status === 'passed')
    );
  }
  return false;
}
