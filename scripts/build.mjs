#!/usr/bin/env node
/**
 * Bundles src/ into a single self-contained index.html.
 *
 *   node scripts/build.mjs           -> writes index.html
 *   node scripts/build.mjs --check   -> exits 1 if index.html is stale
 *
 * No dependencies: the prototype must stay openable from the file system.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = name => readFileSync(join(root, 'src', name), 'utf8');

const i18n = JSON.parse(src('i18n.json'));
const langs = Object.keys(i18n);
for (const lang of langs) {
  for (const other of langs) {
    const missing = Object.keys(i18n[lang]).filter(k => !(k in i18n[other]));
    if (missing.length) {
      console.error(`i18n: keys present in "${lang}" but missing in "${other}": ${missing.join(', ')}`);
      process.exit(1);
    }
  }
}

// Inline JSON must never be able to close the <script> tag.
const i18nLiteral = JSON.stringify(i18n).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const guard = (name, code) => {
  if (/<\/script/i.test(code)) throw new Error(`${name} contains "</script>", which would break the bundle`);
  return code.trim();
};

const html = src('template.html')
  .replace('{{STYLES}}', () => src('styles.css').trim())
  .replace('{{I18N}}', () => i18nLiteral)
  .replace('{{CORE}}', () => guard('core.js', src('core.js')))
  .replace('{{APP}}', () => guard('app.js', src('app.js')));

const out = join(root, 'index.html');
if (process.argv.includes('--check')) {
  const current = existsSync(out) ? readFileSync(out, 'utf8') : '';
  if (current !== html) {
    console.error('index.html is out of date. Run: npm run build');
    process.exit(1);
  }
  console.log('index.html is up to date.');
} else {
  writeFileSync(out, html);
  console.log(`Wrote ${out} (${(html.length / 1024).toFixed(1)} KB)`);
}
