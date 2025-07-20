import { nodeResolve } from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import path from 'path';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

// Common plugins for all builds
const commonPlugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
    preventAssignment: true,
  }),
  nodeResolve({
    browser: true,
    preferBuiltins: false,
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  }),
  commonjs({ include: /node_modules/ }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    presets: [['@babel/preset-react', { runtime: 'automatic' }]],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  }),
  postcss({
    extensions: ['.css'],
    extract: true,
    minimize: true,
  }),
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
        src: 'src/assets/img/*.svg',
        dest: 'dist/assets/img',
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
  terser(),
];

// Define entry points with their formats (ES module or IIFE)
const entryPoints = [
  {
    input: 'src/background.js',
    output: 'background',
    format: 'es', // ES module
  },
  {
    input: 'src/scripts/main-content.js',
    output: 'scripts/main-content',
    format: 'iife', // IIFE
  },
  {
    input: 'src/popup/menu.js',
    output: 'popup/menu',
    format: 'iife', // IIFE
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
