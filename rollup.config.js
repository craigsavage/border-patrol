import { nodeResolve } from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';

/**
 * Custom warning handler for Rollup.
 *
 * @param {Object} warning - The warning object from Rollup.
 * @param {Function} warn - The default warning handler.
 * @returns {void}
 */
const onwarn = (warning, warn) => {
  // Suppress "use client" warnings from antd
  if (
    warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
    warning.message.includes(`"use client"`)
  ) {
    return;
  }
  warn(warning);
};

// Determine if we are in production mode
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Building for ${isProduction ? 'production' : 'development'}...`);

// Common plugins for all builds
const commonPlugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'production'
    ),
    preventAssignment: true,
  }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    presets: [['@babel/preset-react', { runtime: 'automatic' }]],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  }),
  nodeResolve({
    browser: true,
    preferBuiltins: false,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css'],
    moduleDirectories: ['node_modules'],
  }),
  commonjs({
    include: /node_modules/,
    ignoreGlobal: false,
  }),
  copy({
    targets: [
      { src: 'src/manifest.json', dest: 'dist' },
      { src: 'src/popup/*.html', dest: 'dist/popup' },
      { src: 'src/assets/icons/*.png', dest: 'dist/assets/icons' },
      { src: 'src/assets/img/*.svg', dest: 'dist/assets/img' },
      { src: 'dist/scripts/main-content.css', dest: 'dist/styles/' },
      { src: 'dist/popup/menu.css', dest: 'dist/styles/' },
    ],
    hook: 'writeBundle',
  }),
  del({
    // Deletes the original CSS files after copying
    targets: ['dist/scripts/main-content.css', 'dist/popup/menu.css'],
    hook: 'closeBundle', // Ensure CSS files are deleted after copying
  }),
  isProduction && terser(),
  isProduction &&
    visualizer({
      filename: 'bundle-report.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
].filter(Boolean);

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
    onwarn,
    context: 'window',
    output: {
      file: `dist/${output}.js`,
      format,
      sourcemap: !isProduction,
      globals: {},
    },
    plugins: commonPlugins,
  };

  // Add additional plugins for IIFE format
  if (format === 'iife') {
    config.output.name = output.replace(/[\/.-]/g, '_');
  }

  return config;
});
