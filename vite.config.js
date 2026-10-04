import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs so the build works under the GitHub Pages subpath
  // (/google-sheet-slide-html/) as well as from `pnpm preview` at the root.
  base: './',
  build: {
    rollupOptions: {
      input: {
        // index.html is the hero page; the deck moved to slides.html.
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        slides: fileURLToPath(new URL('./slides.html', import.meta.url)),
        video: fileURLToPath(new URL('./video.html', import.meta.url)),
      },
    },
  },
});
