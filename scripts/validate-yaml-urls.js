#!/usr/bin/env node
/**
 * URL Validator for PowerTimeline YAML files
 * Parses YAML, finds all URLs in sources, validates each one
 *
 * Usage: node scripts/validate-yaml-urls.js <yaml-file>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple YAML parser for our specific format
function parseYamlSources(content) {
  const events = [];
  const lines = content.split('\n');

  let currentEvent = null;
  let inSources = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect new event
    if (line.match(/^\s*- id:\s*"([^"]+)"/)) {
      if (currentEvent) {
        events.push(currentEvent);
      }
      currentEvent = {
        id: line.match(/^\s*- id:\s*"([^"]+)"/)[1],
        title: '',
        sources: [],
        lineNumbers: { sources: [] }
      };
      inSources = false;
    }

    // Get title
    if (currentEvent && line.match(/^\s+title:\s*"([^"]+)"/)) {
      currentEvent.title = line.match(/^\s+title:\s*"([^"]+)"/)[1];
    }

    // Detect sources section
    if (line.match(/^\s+sources:\s*$/)) {
      inSources = true;
      continue;
    }

    // Parse source URLs
    if (inSources && currentEvent) {
      const urlMatch = line.match(/^\s+-\s*"([^"]+)"/);
      if (urlMatch) {
        currentEvent.sources.push(urlMatch[1]);
        currentEvent.lineNumbers.sources.push(i + 1);
      } else if (line.match(/^\s+\w+:/) || line.match(/^\s*- id:/)) {
        inSources = false;
      }
    }
  }

  if (currentEvent) {
    events.push(currentEvent);
  }

  return events.filter(e => e.sources.length > 0);
}

// Check if URL is valid (returns status)
async function checkUrl(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });
    clearTimeout(timeoutId);
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      finalUrl: response.url
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // Try GET if HEAD fails (some servers don't support HEAD)
    if (error.name !== 'AbortError') {
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(timeout),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          redirect: 'follow'
        });
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          finalUrl: response.url
        };
      } catch (getError) {
        return {
          ok: false,
          status: 0,
          statusText: getError.message,
          error: true
        };
      }
    }

    return {
      ok: false,
      status: 0,
      statusText: error.message,
      error: true
    };
  }
}

// Main validation function
async function validateYamlUrls(yamlPath) {
  console.log(`\n📄 Validating URLs in: ${yamlPath}\n`);

  const content = fs.readFileSync(yamlPath, 'utf-8');
  const events = parseYamlSources(content);

  const allUrls = [];
  for (const event of events) {
    for (let i = 0; i < event.sources.length; i++) {
      allUrls.push({
        url: event.sources[i],
        eventId: event.id,
        eventTitle: event.title,
        lineNumber: event.lineNumbers.sources[i]
      });
    }
  }

  console.log(`Found ${allUrls.length} URLs across ${events.length} events\n`);
  console.log('Checking URLs...\n');

  const results = {
    valid: [],
    invalid: [],
    redirected: [],
    botBlocked: []  // URLs that return 403 but are likely valid (Reddit, DOI, etc.)
  };

  // Domains known to block bots but have valid URLs
  const botBlockedDomains = ['reddit.com', 'doi.org', 'researchgate.net'];

  for (const urlInfo of allUrls) {
    process.stdout.write(`  Checking: ${urlInfo.url.substring(0, 60)}...`);

    // Skip placeholder URLs (contain obvious placeholders)
    if (urlInfo.url.includes('-JPP-') || urlInfo.url.includes('odla-interview')) {
      console.log(' ⚠️  PLACEHOLDER');
      results.invalid.push({
        ...urlInfo,
        status: 'PLACEHOLDER',
        statusText: 'Placeholder URL - needs real link'
      });
      continue;
    }

    const result = await checkUrl(urlInfo.url);

    if (result.ok) {
      if (result.finalUrl && result.finalUrl !== urlInfo.url) {
        console.log(` ↪️  REDIRECTED (${result.status})`);
        results.redirected.push({
          ...urlInfo,
          ...result
        });
      } else {
        console.log(` ✅ OK (${result.status})`);
        results.valid.push({
          ...urlInfo,
          ...result
        });
      }
    } else {
      // Check if this is a known bot-blocked domain
      const isBotBlocked = result.status === 403 &&
        botBlockedDomains.some(domain => urlInfo.url.includes(domain));

      if (isBotBlocked) {
        console.log(` 🤖 BOT-BLOCKED (${result.status} - likely valid)`);
        results.botBlocked.push({
          ...urlInfo,
          ...result
        });
      } else {
        console.log(` ❌ FAILED (${result.status} ${result.statusText})`);
        results.invalid.push({
          ...urlInfo,
          ...result
        });
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Valid:      ${results.valid.length}`);
  console.log(`↪️  Redirected: ${results.redirected.length}`);
  console.log(`🤖 Bot-blocked: ${results.botBlocked.length} (likely valid, just blocking automated requests)`);
  console.log(`❌ Invalid:    ${results.invalid.length}`);

  if (results.invalid.length > 0) {
    console.log('\n❌ INVALID URLs:');
    console.log('-'.repeat(70));
    for (const item of results.invalid) {
      console.log(`  Event: ${item.eventId}`);
      console.log(`  Title: ${item.eventTitle}`);
      console.log(`  Line:  ${item.lineNumber}`);
      console.log(`  URL:   ${item.url}`);
      console.log(`  Error: ${item.status} ${item.statusText}`);
      console.log();
    }
  }

  if (results.botBlocked.length > 0) {
    console.log('\n🤖 BOT-BLOCKED URLs (valid but block automated requests):');
    console.log('-'.repeat(70));
    for (const item of results.botBlocked) {
      console.log(`  Event: ${item.eventId}`);
      console.log(`  URL:   ${item.url}`);
      console.log();
    }
  }

  if (results.redirected.length > 0) {
    console.log('\n↪️  REDIRECTED URLs (consider updating):');
    console.log('-'.repeat(70));
    for (const item of results.redirected) {
      console.log(`  Event: ${item.eventId}`);
      console.log(`  From:  ${item.url}`);
      console.log(`  To:    ${item.finalUrl}`);
      console.log();
    }
  }

  return results;
}

// Run if called directly
const yamlFile = process.argv[2] || 'jcm_timeline.yaml';
const yamlPath = path.resolve(process.cwd(), yamlFile);

if (!fs.existsSync(yamlPath)) {
  console.error(`Error: File not found: ${yamlPath}`);
  process.exit(1);
}

validateYamlUrls(yamlPath).then(results => {
  process.exit(results.invalid.length > 0 ? 1 : 0);
});
