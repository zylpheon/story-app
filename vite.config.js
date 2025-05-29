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
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true, // Listen on all addresses including LAN
    hmr: {
      host: 'localhost',
      protocol: 'ws'
    }
  },
});
