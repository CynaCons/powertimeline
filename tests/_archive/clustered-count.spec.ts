import { test, expect } from '@playwright/test';

async function openDev(page) {
  await page.goto('/');
  // Enable Dev and open Dev panel
  const toggle = page.locator('button[aria-label="Toggle developer options"]');
  await toggle.click();
  const panelBtn = page.locator('button[aria-label="Developer Panel"]');
  // Some envs may delay React state; try a short wait loop
  for (let i = 0; i < 5; i++) {
    if (await panelBtn.isEnabled()) break;
    await page.waitForTimeout(150);
  }
  if (await panelBtn.isEnabled()) {
    await panelBtn.click();
  } else {
    // Fallback: try clicking the toggle again and wait
    await toggle.click();
    for (let i = 0; i < 5; i++) {
      if (await panelBtn.isEnabled()) break;
      await page.waitForTimeout(150);
    }
    if (await panelBtn.isEnabled()) {
      await panelBtn.click();
    } else {
      // As ultimate fallback, rely on seeding buttons being queryable even without panel open in test env
      // No-op here; seeding function will click buttons by text which require panel, so ensure visibility below
    }
  }
}

async function seedClustered(page, times: number) {
  for (let i = 0; i < times; i++) {
    const btn = page.locator('button:has-text("Clustered")');
    if (!(await btn.isVisible())) {
      // Try to open panel if not already
      const panelBtn = page.locator('button[aria-label="Developer Panel"]');
      if (await panelBtn.isEnabled()) {
        await panelBtn.click();
      }
    }
    await btn.click();
  }
}

async function fitAll(page) {
  const fit = page.locator('button:has-text("Fit All")');
  if (await fit.count()) {
    await fit.click();
  }
}

function parseSummaryCount(title: string): number | null {
  // Accept patterns like "7 events" or "1 events" (lowercase)
  const m = title.trim().match(/^(\d+)\s+events$/i);
  return m ? parseInt(m[1], 10) : null;
}

async function getVisibleEventCounts(page) {
  // Return { singles: number, multi: number, multiTotal: number, summary: number, summaryTotal: number, totalVisible: number }
  const cards = page.locator('[data-testid="event-card"]');
  // Snapshot handles to avoid race with re-rendering while iterating
  const handles = await cards.elementHandles();
  const count = handles.length;

  let singles = 0;
  let multi = 0;
  let multiTotal = 0;
  let summary = 0;
  let summaryTotal = 0;

  for (let i = 0; i < count; i++) {
    const el = handles[i];
    const isSummary = await el.getAttribute('data-summary');
    const isMulti = await el.getAttribute('data-multi');
    if (isSummary === 'true') {
      summary++;
      // The title for summary card is the only text in the h3
      const h3 = await el.$('h3');
      const title = h3 ? (await h3.innerText()) : '';
      const n = parseSummaryCount(title) ?? 0;
      summaryTotal += n;
    } else if (isMulti === 'true') {
      multi++;
      const h3 = await el.$('h3');
      const title = h3 ? (await h3.innerText()) : '';
      const n = parseSummaryCount(title) ?? 0;
      multiTotal += n > 0 ? n : 1; // fallback to 1 if parsing fails
    } else {
      singles++;
    }
  }

  return { singles, multi, multiTotal, summary, summaryTotal, totalVisible: count };
}

async function assertNoOverlaps(page) {
  const ratioOverlap = (a:any,b:any, slack=0.25) => {
    const left = Math.max(a.x, b.x);
    const right = Math.min(a.x + a.w, b.x + b.w);
    const top = Math.max(a.y, b.y);
    const bottom = Math.min(a.y + a.h, b.y + b.h);
    const iw = right - left;
    const ih = bottom - top;
    if (iw <= 0 || ih <= 0) return 0;
    const overlapArea = iw * ih;
    const smaller = Math.min(a.w * a.h, b.w * b.h);
    return overlapArea / smaller;
  };
  // Poll for stabilization up to ~1.5s
  const deadline = Date.now() + 1500;
  let lastBoxes: any[] = [];
  for (;;) {
    const cards = page.locator('[data-testid="event-card"]');
    const handles = await cards.elementHandles();
    const boxes = [] as {x:number,y:number,w:number,h:number}[];
    for (const h of handles) {
      const box = await h.boundingBox();
      if (box) boxes.push({ x: box.x, y: box.y, w: box.width, h: box.height });
    }
    lastBoxes = boxes;
    let bad = false;
    outer: for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const r = ratioOverlap(boxes[i], boxes[j]);
        if (r > 0.25) { bad = true; break outer; }
      }
    }
    if (!bad) return;
    if (Date.now() > deadline) break;
    await page.waitForTimeout(60);
  }
  // If still bad at deadline, report the first offending pair
  for (let i = 0; i < lastBoxes.length; i++) {
    for (let j = i + 1; j < lastBoxes.length; j++) {
      const r = ((): number => {
        const a = lastBoxes[i], b = lastBoxes[j];
        const left = Math.max(a.x, b.x);
        const right = Math.min(a.x + a.w, b.x + b.w);
        const top = Math.max(a.y, b.y);
        const bottom = Math.min(a.y + a.h, b.y + b.h);
        const iw = right - left;
        const ih = bottom - top;
        if (iw <= 0 || ih <= 0) return 0;
        const overlapArea = iw * ih;
        const smaller = Math.min(a.w * a.h, b.w * b.h);
        return overlapArea / smaller;
      })();
      if (r > 0.25) {
        // Try to include ids for easier diagnosis
        const cards = await page.locator('[data-testid="event-card"]').elementHandles();
        const idI = await cards[i].getAttribute('data-event-id');
        const idJ = await cards[j].getAttribute('data-event-id');
        const cidI = await cards[i].getAttribute('data-cluster-id');
        const cidJ = await cards[j].getAttribute('data-cluster-id');
        throw new Error(`Significant overlap between cards ${i}(${idI}|c:${cidI}) and ${j}(${idJ}|c:${cidJ}) ratio=${r.toFixed(3)}`);
      }
    }
  }
}

async function assertPerClusterOrderForSummaries(page) {
  const cards = await page.locator('[data-testid="event-card"]').elementHandles();
  const clusters: Record<string, { hasSummary: boolean; hasCompact: boolean; hasMulti: boolean }> = {};
  for (const el of cards) {
    const cid = await el.getAttribute('data-cluster-id');
    if (!cid) continue;
    const summary = (await el.getAttribute('data-summary')) === 'true';
    const density = await el.getAttribute('data-density');
    const multi = (await el.getAttribute('data-multi')) === 'true';
    clusters[cid] ||= { hasSummary: false, hasCompact: false, hasMulti: false };
    clusters[cid].hasSummary ||= summary;
    clusters[cid].hasCompact ||= density === 'compact';
    clusters[cid].hasMulti ||= multi;
  }
  for (const [cid, flags] of Object.entries(clusters)) {
    if (flags.hasSummary && (!flags.hasCompact || !flags.hasMulti)) {
      throw new Error(`Cluster ${cid} has a summary but missing compact(${flags.hasCompact ? 1 : 0}) or multi(${flags.hasMulti ? 1 : 0}) card`);
    }
  }
}

async function saveViewportScreenshot(page, name: string, info: any) {
  const path = info.outputPath(name);
  await page.screenshot({ path, fullPage: false });
  await test.info().attach(name, { path, contentType: 'image/png' });
}

async function getTotalEventsFromOverlay(page): Promise<number> {
  // Extract the number after "Events:" from the HUD overlay
  const text = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div')) as HTMLElement[];
    const hud = divs.find(d => d.textContent && d.textContent.includes('Events:'));
    return hud?.textContent || '';
  });
  const m = text.match(/Events:\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// This focused suite checks that no events "disappear":
// seed clustered repeatedly and ensure total displayed = individual cards + sum(summary counts)
// equals the seeded event count.
// It also saves a screenshot for manual visual inspection.

test.describe('Clustered seeding accounting', () => {
  test('repeated clustered seeding reconciles counts', async ({ page }, testInfo) => {
    await openDev(page);

    // Clear previous stored events to make run deterministic enough
    await page.evaluate(() => localStorage.removeItem('chronochart-events'));
    await page.reload();
    await openDev(page);

    const runs = 3; // 3 x 30 = 90 events expected
    await seedClustered(page, runs);

    // Close dev panel to avoid occlusion
    await page.locator('button[aria-label="Developer Panel"]').click();

    // Optionally fit all for stable framing
    await fitAll(page);

    // Wait for at least one card
    await page.locator('[data-testid="event-card"]').first().waitFor();

    // Capture screenshot for manual inspection
    await saveViewportScreenshot(page, 'clustered-multi-runs.png', testInfo);

    // Gather counts (singles + multiTotal + summaryTotal)
  const { singles, multi, multiTotal, summary, summaryTotal, totalVisible } = await getVisibleEventCounts(page);

  const expectedTotal = await getTotalEventsFromOverlay(page);

    // Assert that we account for all events via singles + multi-card totals + summary totals
  expect(singles + multiTotal + summaryTotal).toBe(expectedTotal);

    // Also assert we at least have one summary when density is high
    expect(summary).toBeGreaterThanOrEqual(1);

  // No overlaps in final layout
  await assertNoOverlaps(page);
  // Per-cluster order: summaries imply compact+multi exist in same cluster
  await assertPerClusterOrderForSummaries(page);

    // Log helpful diagnostics
  console.log(`Visible cards: ${totalVisible} | Singles: ${singles} | Multi cards: ${multi} (total ${multiTotal}) | Summary cards: ${summary} (total ${summaryTotal}) | Expected: ${expectedTotal}`);
  });
});
