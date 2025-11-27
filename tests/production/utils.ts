import type { ConsoleMessage, Page, Response } from '@playwright/test';

const networkIgnorePatterns = [
  /\.map($|\?)/,
  /chrome-extension:\/\//,
  /\/manifest\.json$/,
];

export function monitorConsole(page: Page) {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', (msg: ConsoleMessage) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    }
    if (msg.type() === 'warning') {
      warnings.push(text);
    }
  });

  return { errors, warnings };
}

export function monitorNetwork(page: Page) {
  const failures: string[] = [];

  page.on('response', (response: Response) => {
    const status = response.status();
    if (status >= 400) {
      const url = response.url();
      if (!networkIgnorePatterns.some((pattern) => pattern.test(url))) {
        failures.push(`${status} ${url}`);
      }
    }
  });

  return { failures };
}

export function hasSevereConsoleError(errors: string[]) {
  return errors.some((err) =>
    /FirebaseError|Missing or insufficient permissions|projectId|apiKey|auth|Firestore/i.test(
      err
    )
  );
}

export async function waitForQuiet(page: Page, ms = 2000) {
  await page.waitForTimeout(ms);
}
