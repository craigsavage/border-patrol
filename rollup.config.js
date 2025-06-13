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

// Define entry points with their formats (ES module or IIFE)
const entryPoints = [
  {
    input: 'src/background.js',
    output: 'background',
    format: 'es', // ES module
  },
  {
    input: 'src/scripts/overlay.js',
    output: 'scripts/overlay',
    format: 'iife', // IIFE
  },
  {
    input: 'src/scripts/border.js',
    output: 'scripts/border',
    format: 'iife', // IIFE
  },
  {
    input: 'src/popup/menu.js',
    output: 'popup/menu',
    format: 'es', // ES module
  },
];

// Generate a config for each entry point
export default entryPoints.map(({ input, output, format }) => {
  const config = {
    input,
    output: {
      file: `dist/${output}.js`,
      format,
      sourcemap: true,
      globals: {},
    },
    plugins: commonPlugins,
  };

  // Add name for IIFE modules (not needed for ES modules)
  if (format === 'iife') {
    config.output.name = output.replace(/[\/.-]/g, '_');
  }

  return config;
});
