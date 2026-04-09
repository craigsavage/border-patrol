#!/usr/bin/env node

/**
 * Processes antd/dist/reset.css with PostCSS (autoprefixer + cssnano) and caches the
 * result in .build-cache/ keyed by antd version. On a cache hit the script exits
 * immediately so subsequent builds pay only a file-read cost.
 *
 * Output: .build-cache/vendor-reset.css  (copied to dist/popup/reset.css by the copy plugin)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const cacheDir = resolve(rootDir, '.build-cache');
const cacheFile = resolve(cacheDir, 'vendor-reset.css');
const versionFile = resolve(cacheDir, 'vendor-reset.version');

const antdPkg = JSON.parse(
  readFileSync(resolve(rootDir, 'node_modules/antd/package.json'), 'utf8'),
);
const antdVersion = antdPkg.version;

const cacheValid =
  existsSync(cacheFile) &&
  existsSync(versionFile) &&
  readFileSync(versionFile, 'utf8').trim() === antdVersion;

if (cacheValid) {
  console.log(`  vendor-reset.css: cache hit (antd ${antdVersion})`);
  process.exit(0);
}

const resetCssPath = resolve(rootDir, 'node_modules/antd/dist/reset.css');
const contents = readFileSync(resetCssPath, 'utf8');

const result = await postcss([autoprefixer(), cssnano()]).process(contents, {
  from: resetCssPath,
  to: 'reset.css',
});

mkdirSync(cacheDir, { recursive: true });
writeFileSync(cacheFile, result.css);
writeFileSync(versionFile, antdVersion);
console.log(`  vendor-reset.css: processed and cached (antd ${antdVersion})`);
