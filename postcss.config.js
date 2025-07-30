import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export const plugins = [
  autoprefixer,
  // Only minify in production environment
  process.env.NODE_ENV === 'production' ? cssnano : null,
].filter(Boolean);
