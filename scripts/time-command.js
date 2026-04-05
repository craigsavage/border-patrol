#!/usr/bin/env node

/**
 * Times an npm script execution and displays the duration at the end.
 * Usage: node scripts/time-command.js "npm run build"
 */

import { spawn } from 'child_process';

const command = process.argv.slice(2).join(' ');

if (!command) {
  console.error('Usage: node scripts/time-command.js "command to run"');
  process.exit(1);
}

const startTime = Date.now();

// Run the command through shell to support pipes and environment variables
const child = spawn(command, {
  shell: true,
  stdio: 'inherit',
});

child.on('close', code => {
  const duration = Date.now() - startTime;
  const seconds = (duration / 1000).toFixed(2);

  console.log(`\n✨ Build completed in ${seconds}s`);
  process.exit(code);
});
