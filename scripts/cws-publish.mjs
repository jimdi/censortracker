#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chromeWebstoreUpload from 'chrome-webstore-upload';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONFIG_FILE = resolve(ROOT, '.cws-config.json');
const BUILD_DIR = resolve(ROOT, 'dist', 'chrome', 'prod');

function findClientSecret() {
  const files = readdirSync(ROOT).filter(f => f.startsWith('client_secret_') && f.endsWith('.json'));
  return files.length ? resolve(ROOT, files[0]) : null;
}

function loadConfig() {
  if (!existsSync(CONFIG_FILE)) return null;
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); } catch { return null; }
}

async function main() {
  const shouldPublish = process.argv.includes('--publish');

  // 1. Load config or env vars
  let config = loadConfig();
  let extensionId = config?.extensionId || process.env.CWS_ITEM_ID;
  let publisherId = config?.publisherId || process.env.PUBLISHER_ID;
  let refreshToken = config?.refreshToken || process.env.CWS_REFRESH_TOKEN;

  let missing = [];
  if (!extensionId) missing.push('extensionId (CWS_ITEM_ID)');
  if (!publisherId) missing.push('publisherId (PUBLISHER_ID)');
  if (!refreshToken) missing.push('refreshToken');

  if (missing.length > 0) {
    console.error('[CWS] Missing required config: ' + missing.join(', '));
    console.error('Run "node scripts/cws-setup.mjs" to configure,');
    console.error('or create .cws-config.json manually (see PUBLISH.md).');
    process.exit(1);
  }

  // 2. Read client credentials from client_secret JSON
  const secretPath = process.env.CWS_CLIENT_SECRET || findClientSecret();
  if (!secretPath || !existsSync(secretPath)) {
    console.error('[CWS] client_secret JSON not found. Place client_secret_*.json in project root.');
    process.exit(1);
  }
  const { client_id, client_secret } = JSON.parse(readFileSync(secretPath, 'utf8')).installed;

  if (!existsSync(BUILD_DIR)) {
    console.error(`[CWS] Build not found: ${BUILD_DIR}. Run "build.bat chrome" first.`);
    process.exit(1);
  }

  // 3. Upload & publish
  const api = chromeWebstoreUpload({
    extensionId,
    publisherId,
    clientId: client_id,
    clientSecret: client_secret,
    refreshToken,
  });

  console.log('[CWS] Fetching token…');
  const token = await api.fetchToken();

  console.log('[CWS] Uploading…');
  const uploadResult = await api.uploadExisting(BUILD_DIR, token);
  console.log('[CWS] Upload OK —', uploadResult.uploadState);

  if (shouldPublish) {
    console.log('[CWS] Publishing to trusted testers…');
    const publishResult = await api.publish('trustedTesters', token);
    console.log('[CWS] Publish OK —', publishResult.status?.[0] || 'published');
  } else {
    console.log('[CWS] Use --publish to also publish to trusted testers.');
  }

  console.log('[CWS] Done.');
}

main().catch(err => {
  console.error('[CWS] Error:', err.message);
  process.exit(1);
});
