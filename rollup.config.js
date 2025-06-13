import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import copy from 'rollup-plugin-copy';
import path from 'path';

// Common plugins for all builds
const commonPlugins = [
  nodeResolve({
    browser: true,
    preferBuiltins: true,
  }),
  commonjs({
    include: /node_modules/,
  }),
  nodePolyfills(),
  copy({
    targets: [
      {
        src: 'src/popup/*.html',
        dest: 'dist/popup',
        rename: (name, extension, fullPath) => path.basename(fullPath),
      },
      {
        src: 'src/popup/*.css',
        dest: 'dist/popup',
        rename: (name, extension, fullPath) => path.basename(fullPath),
      },
      {
        src: 'src/styles/*.css',
        dest: 'dist/styles',
        rename: (name, extension, fullPath) => path.basename(fullPath),
      },
      {
        src: 'src/assets/icons/*.png',
        dest: 'dist/assets/icons',
        rename: (name, extension, fullPath) => path.basename(fullPath),
      },
      {
        src: 'src/manifest.json',
        dest: 'dist',
        rename: () => 'manifest.json',
      },
    ],
    hook: 'writeBundle',
  }),
];

// Create an array of configurations, one for each entry point
const entryPoints = [
  { input: 'src/background.js', output: 'background' },
  { input: 'src/scripts/overlay.js', output: 'scripts/overlay' },
  { input: 'src/scripts/border.js', output: 'scripts/border' },
  { input: 'src/popup/menu.js', output: 'popup/menu' },
];

// Generate a config for each entry point
export default entryPoints.map(({ input, output }) => ({
  input,
  output: {
    file: `dist/${output}.js`,
    format: 'iife',
    sourcemap: true,
    name: output.replace(/[\/.-]/g, '_'),
    globals: {},
  },
  plugins: commonPlugins,
}));
