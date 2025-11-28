import { nodeResolve } from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';
import postcssRollup from 'rollup-plugin-postcss';
import postcss from 'postcss';

import postcssScss from 'postcss-scss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

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

/**
 * PostCSS plugin configuration for Rollup.
 *
 * @param {string} outputPath - The path where the CSS file will be extracted.
 * @returns {Object} - The PostCSS plugin configuration.
 */
const postcssPlugin = outputPath => {
  return postcssRollup({
    extract: outputPath,
    minimize: isProduction,
    sourceMap: !isProduction,
    plugins: [autoprefixer(), isProduction ? cssnano() : null].filter(Boolean),
    syntax: postcssScss,
    use: {
      sass: {
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  });
};

// Determine if we are in production mode
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Building for ${isProduction ? 'production' : 'development'}...`);

// Common plugins for all builds
const commonPlugins = [
  replace({
    preventAssignment: true,
    include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'production'
    ),
    __BP_APP_VERSION__: pkg.version
      ? JSON.stringify('v' + pkg.version)
      : JSON.stringify(''),
  }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    presets: [
      ['@babel/preset-react', { runtime: 'automatic' }],
      '@babel/preset-typescript',
    ],
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
      { src: 'src/assets/fonts/*.woff2', dest: 'dist/assets/fonts' },
      // Copy Ant Design styles
      {
        src: 'node_modules/antd/dist/reset.css',
        dest: 'dist/popup',
        transform: async (contents, filename) => {
          if (isProduction) {
            const postcssResult = await postcss([
              autoprefixer(),
              cssnano(),
            ]).process(contents, {
              from: filename,
              to: 'reset.css',
            });
            return postcssResult.css;
          }
          return contents; // Return the original contents in development mode
        },
      },
    ],
    hook: 'writeBundle',
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
    cssFilename: null, // No CSS output for background script
  },
  {
    input: 'src/scripts/main-content.ts',
    output: 'scripts/main-content',
    format: 'iife', // IIFE
    cssFilename: 'main-content.css',
  },
  {
    input: 'src/popup/menu.tsx',
    output: 'popup/menu',
    format: 'iife', // IIFE
    cssFilename: 'menu.css',
  },
];

// Generate a config for each entry point
export default entryPoints.map(({ input, output, format, cssFilename }) => {
  const pluginsForThisEntry = [
    ...commonPlugins,
    cssFilename && postcssPlugin(cssFilename),
  ].filter(Boolean);

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
    plugins: pluginsForThisEntry,
  };

  // Add additional plugins for IIFE format
  if (format === 'iife') {
    config.output.name = output.replace(/[\/.-]/g, '_');
  }

  return config;
});
