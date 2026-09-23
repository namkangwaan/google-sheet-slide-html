import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs so the build works under the GitHub Pages subpath
  // (/google-sheet-slide-html/) as well as from `pnpm preview` at the root.
  base: './',
});
