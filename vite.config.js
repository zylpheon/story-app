import { defineConfig } from "vite";
import { resolve } from "path";
import dns from 'node:dns';

// This prevents DNS resolution issues with localhost
dns.setDefaultResultOrder('verbatim');

export default defineConfig({
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'styles/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    hmr: {
      host: 'localhost',
      port: 3000,
      protocol: 'ws',
    }
  },
});
