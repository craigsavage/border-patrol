import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import copy from 'rollup-plugin-copy';
import path from 'path';

export default {
  input: {
    'background': 'src/background.js',
    'scripts/overlay': 'src/scripts/overlay.js',
    'scripts/border': 'src/scripts/border.js',
    'popup/menu': 'src/popup/menu.js'
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
        // Copy popup HTML files directly to dist/popup
        { 
          src: 'src/popup/*.html', 
          dest: 'dist/popup',
          rename: (name, extension, fullPath) => {
            return path.basename(fullPath);
          }
        },
        // Copy popup CSS files directly to dist/popup
        { 
          src: 'src/popup/*.css', 
          dest: 'dist/popup',
          rename: (name, extension, fullPath) => {
            return path.basename(fullPath);
          }
        },
        // Copy styles to dist/styles
        { 
          src: 'src/styles/*.css', 
          dest: 'dist/styles',
          rename: (name, extension, fullPath) => {
            return path.basename(fullPath);
          }
        },
        // Copy icons to dist/assets/icons
        { 
          src: 'src/assets/icons/*.png', 
          dest: 'dist/assets/icons',
          rename: (name, extension, fullPath) => {
            return path.basename(fullPath);
          }
        },
        // Copy manifest to dist
        { 
          src: 'src/manifest.json', 
          dest: 'dist',
          rename: () => 'manifest.json'
        },
      ],
      hook: 'writeBundle',
    }),
  ],
};
