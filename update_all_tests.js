const fs = require('''fs''');

function updateFile(filepath) {
  if (!fs.existsSync(filepath)) {
    return false;
  }

  let content = fs.readFileSync(filepath, '''utf8''');
  const original = content;
  const filename = filepath.split(''/''').pop();

  if (!content.includes('''loginAsTestUser''') && !content.includes('''loadTestTimeline''')) {
    content = content.replace(
      "import { test, expect } from '''@playwright/test''';",
      "import { test, expect } from '''@playwright/test''';//nimport { loginAsTestUser, loadTestTimeline } from '''../utils/timelineTestUtils''';".replace('//n', String.fromCharCode(10))
    );
  } else if (!content.includes('''loginAsTestUser''')) {
    content = content.replace(
      "import { test, expect } from '''@playwright/test''';",
      "import { test, expect } from '''@playwright/test''';//nimport { loginAsTestUser } from '''../utils/timelineTestUtils''';".replace('//n', String.fromCharCode(10))
    );
  }

  content = content.replace(
    /await page\.goto\('\/'\);\s+await page\.waitForTimeout\(\d+\);\s+
\s+\/\/ Enable dev mode and load Napoleon timeline\s+
\s+await page\.getByRole\('button', \{ name: '''Developer Panel''' \}\)\.click\(\);\s+
\s+await page\.getByRole\('button', \{ name: '''Napoleon 1769-1821''' \}\)\.click\(\);\s+
\s+await page\.keyboard\.press\('Escape'\);\s*(?:\/\/ Close dev panel)?\s+
\s+await page\.waitForTimeout\(\d+\);/g,
    `await loginAsTestUser(page);
    await loadTestTimeline(page, '''timeline-napoleon''');
    await expect(page.locator('''[data-testid="event-card"]''').first()).toBeVisible({ timeout: 10000 });`
  );

  if (content !== original) {
    fs.writeFileSync(filepath, content, '''utf8''');
    return true;
  }
  return false;
}

const files = ["'''tests/v5/12-alternating-pattern.spec.ts'''", "'''tests/v5/13-overflow-logic.spec.ts'''", "'''tests/v5/14-navigation-rail-overlap.spec.ts'''", "'''tests/v5/15-overflow-label-overflow.spec.ts'''", "'''tests/v5/16-real-viewport-layout.spec.ts'''", "'''tests/v5/18-zoom-stability.spec.ts'''", "'''tests/v5/19-zoom-edge-cases.spec.ts'''", "'''tests/v5/20-timeline-cursor-zoom.spec.ts'''", "'''tests/v5/21-timeline-minimap.spec.ts'''", "'''tests/v5/23-zoom-stability.spec.ts'''"];

let updated = 0;
files.forEach(f => { if (updateFile(f)) updated++; });
console.log(`Updated ${updated} files`);
