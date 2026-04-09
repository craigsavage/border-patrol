#!/usr/bin/env node

/**
 * Times a command execution and displays the duration at the end.
 * Usage: node scripts/time-command.js "command to run"
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

  const isBuild = /\bbuild\b/.test(command) || /npm run build/.test(command);

  if (code === 0) {
    const label = isBuild ? 'Build completed' : 'Command completed';
    console.log(`\n✨ ${label} in ${seconds}s`);
    process.exit(0);
  }

  const label = isBuild ? 'Build failed' : 'Command failed';
  console.error(
    `\n✖ ${label} after ${seconds}s (exit code: ${code ?? 'unknown'})`,
  );
  process.exit(code ?? 1);
});
