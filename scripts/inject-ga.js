#!/usr/bin/env node
/**
 * inject-ga.js — post-build script
 *
 * Expo SDK 52 + Metro web export does not substitute %EXPO_PUBLIC_*% tokens
 * from web/index.html into the generated dist/index.html. This script runs
 * after `expo export --platform web` and injects the GA4 script tag directly
 * into dist/index.html.
 *
 * Usage (called automatically by `npm run build`):
 *   node scripts/inject-ga.js
 *
 * The GA4 Measurement ID is read from (in priority order):
 *   1. EXPO_PUBLIC_GA_ID environment variable
 *   2. .env file in the project root
 *   3. Hardcoded default: G-X09N3J8X17 (marketplace.alphinium.com)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_HTML = path.join(ROOT, 'dist', 'index.html');
const ENV_FILE = path.join(ROOT, '.env');
const DEFAULT_GA_ID = 'G-X09N3J8X17';

function readGaIdFromEnv() {
  // 1. Check process environment
  if (process.env.EXPO_PUBLIC_GA_ID) {
    return process.env.EXPO_PUBLIC_GA_ID;
  }
  // 2. Parse .env file
  if (fs.existsSync(ENV_FILE)) {
    const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^EXPO_PUBLIC_GA_ID\s*=\s*(.+)$/);
      if (match) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return DEFAULT_GA_ID;
}

function buildGaSnippet(gaId) {
  return `    <!-- Google Analytics — injected by scripts/inject-ga.js -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    </script>`;
}

function main() {
  if (!fs.existsSync(DIST_HTML)) {
    console.error('[inject-ga] dist/index.html not found — run `expo export --platform web` first.');
    process.exit(1);
  }

  const gaId = readGaIdFromEnv();
  let html = fs.readFileSync(DIST_HTML, 'utf8');

  // Idempotent: skip if already injected
  if (html.includes('googletagmanager.com')) {
    console.log(`[inject-ga] GA4 already present in dist/index.html — skipping (ID: ${gaId})`);
    return;
  }

  const snippet = buildGaSnippet(gaId);

  // Inject before </head>
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${snippet}\n  </head>`);
  } else {
    // Fallback: append before </html>
    html = html.replace('</html>', `  <head>${snippet}\n  </head>\n</html>`);
  }

  fs.writeFileSync(DIST_HTML, html, 'utf8');
  console.log(`[inject-ga] ✅ GA4 script injected into dist/index.html (ID: ${gaId})`);
}

main();
