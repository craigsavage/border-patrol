#!/usr/bin/env node

/**
 * Builds all rollup entry points in parallel using the JS API, and builds
 * src/popup/menu.tsx directly with esbuild (bypassing rollup's commonjs plugin,
 * which is slow for antd's CJS-only dependencies).
 */

import { rollup } from 'rollup';
import { loadConfigFile } from 'rollup/loadConfigFile';
import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const configPath = path.resolve(rootDir, 'rollup.config.js');

const pkg = JSON.parse(readFileSync(path.resolve(rootDir, 'package.json'), 'utf8'));
const isProduction = process.env.NODE_ENV === 'production';

const { options, warnings } = await loadConfigFile(configPath);
warnings.flush();

const buildWithRollup = async inputOptions => {
  const start = Date.now();
  const bundle = await rollup(inputOptions);
  const outputs = Array.isArray(inputOptions.output)
    ? inputOptions.output
    : [inputOptions.output];
  for (const output of outputs) {
    await bundle.write(output);
  }
  await bundle.close();
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`  ${inputOptions.input} → ${outputs[0].file} (${elapsed}s)`);
};

const buildMenuWithEsbuild = async () => {
  const start = Date.now();
  await esbuild.build({
    // Use outdir so esbuild can place font assets relative to it via assetNames
    entryPoints: { menu: 'src/popup/menu.tsx' },
    bundle: true,
    format: 'iife',
    globalName: 'popup_menu',
    outdir: 'dist/popup',
    // Fonts: output to dist/assets/fonts/ so CSS references (../assets/fonts/*)
    // match what the copy plugin places there for other entry points.
    assetNames: '../assets/fonts/[name]',
    loader: { '.woff2': 'file' },
    platform: 'browser',
    target: 'chrome100',
    minify: isProduction,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      __BP_APP_VERSION__: JSON.stringify(pkg.version || ''),
    },
    tsconfig: './tsconfig.json',
    plugins: [sassPlugin()],
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`  src/popup/menu.tsx → dist/popup/menu.js (${elapsed}s)`);
};

await Promise.all([...options.map(buildWithRollup), buildMenuWithEsbuild()]);
