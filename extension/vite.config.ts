import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const extensionRoot = dirname(fileURLToPath(import.meta.url));

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const distDir = resolve(extensionRoot, 'dist');
      mkdirSync(distDir, { recursive: true });
      copyFileSync(resolve(extensionRoot, 'manifest.json'), resolve(distDir, 'manifest.json'));

      const iconsDir = resolve(extensionRoot, 'icons');
      const distIcons = resolve(distDir, 'icons');
      mkdirSync(distIcons, { recursive: true });
      for (const file of readdirSync(iconsDir)) {
        copyFileSync(resolve(iconsDir, file), resolve(distIcons, file));
      }
    },
  };
}

export default defineConfig({
  root: extensionRoot,
  base: './',
  plugins: [react(), copyExtensionAssets()],
  build: {
    outDir: resolve(extensionRoot, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(extensionRoot, 'background.ts'),
        content: resolve(extensionRoot, 'content.ts'),
        popup: resolve(extensionRoot, 'popup/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: assetInfo => {
          if (assetInfo.name === 'index.html') {
            return 'popup/index.html';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
