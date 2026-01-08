/**
 * URL Validator for YAML Timeline Files
 * Validates all source URLs in a timeline YAML file
 */

import * as fs from 'fs';
import * as yaml from 'yaml';

interface TimelineEvent {
  id: string;
  title: string;
  sources?: string[];
}

interface Timeline {
  events: TimelineEvent[];
}

async function checkUrl(url: string): Promise<{ valid: boolean; status?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeout);

    // Consider 2xx, 3xx as valid (redirects are fine)
    // 403 often means bot protection but URL exists
    const valid = response.status < 500 && response.status !== 404;
    return { valid, status: response.status };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { valid: false, error: 'Timeout' };
    }
    return { valid: false, error: error.message };
  }
}

async function main() {
  const yamlFile = process.argv[2];
  if (!yamlFile) {
    console.error('Usage: npx tsx scripts/validate-yaml-urls.ts <yaml-file>');
    process.exit(1);
  }

  console.log(`\nValidating URLs in: ${yamlFile}\n`);

  const content = fs.readFileSync(yamlFile, 'utf-8');
  const timeline = yaml.parse(content) as Timeline;

  const urlMap = new Map<string, string[]>(); // url -> event titles

  // Collect all URLs
  for (const event of timeline.events) {
    if (event.sources) {
      for (const source of event.sources) {
        if (source.startsWith('http')) {
          const events = urlMap.get(source) || [];
          events.push(event.title);
          urlMap.set(source, events);
        }
      }
    }
  }

  const urls = Array.from(urlMap.keys());
  console.log(`Found ${urls.length} unique URLs to validate\n`);

  const results: { url: string; valid: boolean; status?: number; error?: string; events: string[] }[] = [];

  // Check URLs in batches of 5 to avoid overwhelming servers
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const result = await checkUrl(url);
        const events = urlMap.get(url) || [];
        return { url, ...result, events };
      })
    );
    results.push(...batchResults);

    // Progress indicator
    process.stdout.write(`\rChecked ${Math.min(i + 5, urls.length)}/${urls.length} URLs...`);
  }

  console.log('\n');

  // Report results
  const valid = results.filter(r => r.valid);
  const invalid = results.filter(r => !r.valid);

  console.log(`=== RESULTS ===`);
  console.log(`Valid: ${valid.length}/${results.length}`);
  console.log(`Invalid: ${invalid.length}/${results.length}\n`);

  if (invalid.length > 0) {
    console.log('=== INVALID URLs ===\n');
    for (const r of invalid) {
      console.log(`URL: ${r.url}`);
      console.log(`  Status: ${r.status || 'N/A'} | Error: ${r.error || 'N/A'}`);
      console.log(`  Events: ${r.events.join(', ')}`);
      console.log('');
    }
  }

  if (valid.length > 0) {
    console.log('=== VALID URLs ===\n');
    for (const r of valid) {
      console.log(`[${r.status}] ${r.url}`);
    }
  }

  // Summary by event
  console.log('\n=== EVENTS WITH SOURCES ===');
  const eventsWithSources = timeline.events.filter(e => e.sources && e.sources.length > 0);
  const eventsWithoutSources = timeline.events.filter(e => !e.sources || e.sources.length === 0);
  console.log(`Events with sources: ${eventsWithSources.length}/${timeline.events.length}`);
  console.log(`Events without sources: ${eventsWithoutSources.length}/${timeline.events.length}`);

  process.exit(invalid.length > 0 ? 1 : 0);
}

main().catch(console.error);
