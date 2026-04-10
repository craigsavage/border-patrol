const { spawnSync } = require('child_process');
const path = require('path');

const script = path.resolve(__dirname, '../../scripts/time-command.js');

function run(command) {
  return spawnSync('node', [script, command], { encoding: 'utf8' });
}

test('prints Command completed on success', () => {
  const res = run('node -e "process.exit(0)"');
  expect(res.status).toBe(0);
  expect(res.stdout || '').toMatch(/Command completed/);
});

test('prints Command failed on non-zero exit', () => {
  const res = run('node -e "process.exit(3)"');
  expect(res.status).toBe(3);
  expect(res.stderr || '').toMatch(/Command failed/);
});

test('prints Build failed for build-like failing command', () => {
  const res = run('node -e "process.argv; process.exit(5)" build');
  expect(res.status).toBe(5);
  expect(res.stderr || '').toMatch(/Build failed/);
});
