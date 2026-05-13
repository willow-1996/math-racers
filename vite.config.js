import { defineConfig } from 'vite';
import { execSync } from 'child_process';

// Inject git short SHA at build time; fall back gracefully if git is unavailable
let buildSha = 'dev';
try {
  buildSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch { /* not a git repo or git not installed */ }

export default defineConfig({
  base: './',
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
