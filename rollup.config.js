import { nodeResolve } from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import { visualizer } from 'rollup-plugin-visualizer';
import postcssRollup from 'rollup-plugin-postcss';
import postcss from 'postcss';
import path from 'path';
import * as sass from 'sass';

import postcssScss from 'postcss-scss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { existsSync, readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
const tsconfigBaseUrl = tsconfig.compilerOptions?.baseUrl;
if (typeof tsconfigBaseUrl !== 'string') {
  throw new Error(
    'rollup.config.js: set compilerOptions.baseUrl in tsconfig.json (same root Rollup uses for non-node_modules imports).',
  );
}

const tsconfigBaseUrlAbs = path.resolve(path.dirname(tsconfigPath), tsconfigBaseUrl);

/**
 * Custom warning handler for Rollup.
 * Converts unresolved dependencies and missing globals to errors to catch build issues in CI.
 *
 * @param {Object} warning - The warning object from Rollup.
 * @param {Function} warn - The default warning handler.
 * @throws {Error} For unresolved dependencies and missing globals
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

  // Treat unresolved dependencies as errors
  if (warning.code === 'UNRESOLVED_DEPENDENCY') {
    throw new Error(`Unresolved dependency: ${warning.message}`);
  }

  // Treat missing globals as errors
  if (warning.code === 'MISSING_GLOBAL_NAME') {
    throw new Error(`Missing global variable: ${warning.message}`);
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
    exclude: '**/*.shadow.scss',
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

/**
 * Rollup does not read tsconfig; mirror TypeScript resolution for bare specifiers under `baseUrl`

 * We only return a
 * path when a real file exists under `baseUrl`, same as TypeScript would resolve there before
 * falling through to `node_modules`.
 */
const tsconfigBaseUrlResolvePlugin = () => ({
  name: 'tsconfig-baseurl-resolve',
  resolveId(source) {
    // If the source starts with a null byte, a dot, or is an absolute path, return null
    if (
      source.startsWith('\0') ||
      source.startsWith('.') ||
      path.isAbsolute(source)
    ) {
      return null;
    }
    // Join the base URL with the source
    const candidate = path.join(tsconfigBaseUrlAbs, source);
    // Check for the existence of the file with the extensions .ts, .tsx, and .d.ts
    for (const ext of ['.ts', '.tsx', '.d.ts']) {
      const file = candidate + ext;
      if (existsSync(file)) return file;
    }
    return null;
  },
});

/**
 * Compiles SCSS files intended for shadow-root usage into CSS string modules.
 *
 * @returns {import('rollup').Plugin} Rollup plugin.
 */
const shadowScssPlugin = () => ({
  name: 'shadow-scss-plugin',
  resolveId(source, importer) {
    if (!source.endsWith('.shadow.scss')) return null;

    const baseDir = importer ? path.dirname(importer) : process.cwd();
    return path.resolve(baseDir, source);
  },
  async load(id) {
    if (!id.endsWith('.shadow.scss')) return null;

    const result = sass.compile(id, {
      style: isProduction ? 'compressed' : 'expanded',
      silenceDeprecations: ['legacy-js-api'],
    });

    const processedCss = await postcss(
      [autoprefixer(), isProduction ? cssnano() : null].filter(Boolean),
    ).process(result.css, {
      from: id,
      to: id,
    });

    return {
      code: `export default ${JSON.stringify(processedCss.css)};`,
      map: { mappings: '' },
    };
  },
});

// Determine if we are in production mode
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Building for ${isProduction ? 'production' : 'development'}...`);

// Common plugins for all builds
const commonPlugins = [
  tsconfigBaseUrlResolvePlugin(),
  shadowScssPlugin(),
  replace({
    preventAssignment: true,
    include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'production',
    ),
    __BP_APP_VERSION__: pkg.version
      ? JSON.stringify(pkg.version)
      : JSON.stringify(''),
  }),
  json(),
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
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'],
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
      { src: 'src/_locales/**', dest: 'dist/_locales' },
      { src: 'src/offscreen/offscreen.html', dest: 'dist/offscreen' },
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
    input: 'src/background.ts',
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
  {
    input: 'src/offscreen/offscreen.ts',
    output: 'offscreen/offscreen',
    format: 'iife', // IIFE
    cssFilename: null,
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
