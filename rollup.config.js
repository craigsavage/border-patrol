import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import copy from 'rollup-plugin-copy';

export default {
  input: {
    background: 'background.js',
    'scripts/overlay': 'scripts/overlay.js',
    'scripts/border': 'scripts/border.js',
    'popup/menu': 'popup/menu.js'
  },
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    entryFileNames: '[name].js',
    chunkFileNames: 'chunks/[name]-[hash].js',
  },
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: true,
    }),
    commonjs(),
    nodePolyfills(),
    copy({
      targets: [
        { src: 'popup/*.html', dest: 'dist/popup' },
        { src: 'popup/*.css', dest: 'dist/popup' },
        { src: 'styles/*.css', dest: 'dist/styles' },
        { src: 'assets/**/*', dest: 'dist' },
        { src: 'manifest.json', dest: 'dist' },
      ],
      hook: 'writeBundle',
    }),
  ],
};
