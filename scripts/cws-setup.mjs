#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONFIG_FILE = resolve(ROOT, '.cws-config.json');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, a => r(a.trim())));

function findClientSecret() {
  const files = readdirSync(ROOT).filter(f => f.startsWith('client_secret_') && f.endsWith('.json'));
  return files.length ? resolve(ROOT, files[0]) : null;
}

async function main() {
  const secretPath = process.env.CWS_CLIENT_SECRET || findClientSecret();
  if (!secretPath || !existsSync(secretPath)) {
    console.error('client_secret JSON not found.');
    console.error('Place client_secret_*.json in project root.');
    process.exit(1);
  }

  const secrets = JSON.parse(readFileSync(secretPath, 'utf8')).installed;
  const { client_id, client_secret } = secrets;

  let config = {};
  if (existsSync(CONFIG_FILE)) {
    try { config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); } catch {}
  }

  console.log('\n=== Chrome Web Store — настройка публикации ===\n');

  const extensionId = process.env.CWS_ITEM_ID || config.extensionId
    || await ask('Chrome Web Store Item ID: ');
  const publisherId = process.env.PUBLISHER_ID || config.publisherId
    || await ask('Publisher ID: ');

  if (!extensionId) { console.error('Item ID is required.'); process.exit(1); }
  if (!publisherId) { console.error('Publisher ID is required.'); process.exit(1); }

  const hasRefresh = config.refreshToken;

  if (!hasRefresh) {
    console.log('\n=== Получение Refresh Token через OAuth Playground ===\n');
    console.log('1. Откройте https://developers.google.com/oauthplayground');
    console.log('2. Нажмите ⚙️ (шестерёнку) → Use your own OAuth credentials');
    console.log('3. Вставьте следующие данные и нажмите Close:\n');
    console.log('   Client ID:     ' + client_id);
    console.log('   Client Secret: ' + client_secret);
    console.log('');
    console.log('4. Справа в поле Scopes введите:');
    console.log('   https://www.googleapis.com/auth/chromewebstore');
    console.log('5. Нажмите Authorize APIs — авторизуйтесь своим аккаунтом');
    console.log('6. Нажмите Exchange authorization code for tokens');
    console.log('7. Скопируйте Refresh token из правой панели');
    console.log('');
  }

  const refreshToken = config.refreshToken
    || await ask('Paste Refresh token: ');

  if (!refreshToken) { console.error('Refresh token is required.'); process.exit(1); }

  const configData = { extensionId, publisherId, refreshToken };
  writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2) + '\n');
  console.log('\nDone. Config saved to ' + CONFIG_FILE);
  rl.close();
}

main().catch(err => { console.error(err.message); process.exit(1); });
