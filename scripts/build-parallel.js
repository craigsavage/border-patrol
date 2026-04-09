#!/usr/bin/env node

/**
 * Builds all rollup entry points in parallel using the JS API.
 * Equivalent to `rollup -c` but runs all configs concurrently instead of sequentially.
 */

import { rollup } from 'rollup';
import { loadConfigFile } from 'rollup/loadConfigFile';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../rollup.config.js');

const { options, warnings } = await loadConfigFile(configPath);
warnings.flush();

await Promise.all(
  options.map(async inputOptions => {
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
  }),
);
