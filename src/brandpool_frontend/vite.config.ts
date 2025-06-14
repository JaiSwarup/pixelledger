/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import {config} from 'dotenv';

config({ path: '../../.env' });

export default defineConfig({
  mode: 'development',
  build: {
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  define: {
    global: "globalThis",
    // Explicitly define environment variables for runtime access
    'import.meta.env.CANISTER_ID_BRANDPOOL_BACKEND': JSON.stringify('uxrrr-q7777-77774-qaaaq-cai'),
    'import.meta.env.CANISTER_ID_INTERNET_IDENTITY': JSON.stringify('uzt4z-lp777-77774-qaabq-cai'),
    'import.meta.env.DFX_NETWORK': JSON.stringify('local'),
    'import.meta.env.MODE': JSON.stringify('development'),
    'import.meta.env.DEV': true,
    'import.meta.env.PROD': false,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://u6s2n-gx777-77774-qaaba-cai.localhost",
        changeOrigin: true,
      },
    },
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: http: https:; connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.ic0.app https://*.internetcomputer.org https://icp-api.io ws://localhost:* wss://localhost:*;",
    },
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    nodePolyfills({
      // Enable polyfills for specific Node.js modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: 'src/setupTests.js',
  },
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(
          new URL("../declarations", import.meta.url)
        ),
      },
    ],
    dedupe: ['@dfinity/agent'],
  },
});
