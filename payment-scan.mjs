import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const BANNED = [
  'payoneer',
  'paypal',
  'stripe',
  'binance',
  'okx',
  'bybit',
  'kucoin',
  'skrill',
  'wise',
  'revolut',
  'bank_transfer',
  'western_union',
  'moneygram',
  'usdt',
  'crypto_wallet',
  'qi_card',
  'fastpay',
  'asia_hawala',
];

const IGNORE_DIR_NAMES = new Set(['node_modules', 'dist', '.git', '.vs']);
const IGNORE_FILE_NAMES = new Set(['package-lock.json']);

const TEXT_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.txt', '.html', '.css', '.scss', '.env',
]);

function shouldIgnoreFile(filePath) {
  const base = path.basename(filePath);
  if (IGNORE_FILE_NAMES.has(base)) return true;
  if (base.endsWith('.test.ts') || base.endsWith('.test.tsx') || base.endsWith('.test.js') || base.endsWith('.test.jsx')) return true;
  if (base === 'payment-scan.mjs' || base === 'payment-api-check.mjs') return true;
  return false;
}

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (IGNORE_DIR_NAMES.has(ent.name)) continue;
      if (ent.name === 'tests') continue;
      walk(full, results);
    } else if (ent.isFile()) {
      if (shouldIgnoreFile(full)) continue;
      if (!TEXT_EXTS.has(path.extname(ent.name))) continue;
      results.push(full);
    }
  }
  return results;
}

function scan() {
  const files = walk(root);
  const hits = [];

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lower = content.toLowerCase();

    for (const token of BANNED) {
      if (lower.includes(token)) {
        hits.push({ file, token });
      }
    }
  }

  if (hits.length) {
    console.error('BANNED PAYMENT TOKENS FOUND:');
    for (const h of hits) {
      console.error(`- ${path.relative(root, h.file)}  (token: ${h.token})`);
    }
    process.exit(1);
  }

  console.log('OK: No banned payment tokens found.');
}

scan();
