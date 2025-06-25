/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

config({ path: '../../.env' });

/**
 * Dynamically gets canister IDs from multiple sources:
 * 1. .dfx/{network}/canister_ids.json (for local development)
 * 2. canister_ids.json (for production deployments)
 * 3. Environment variables (fallback)
 * 
 * This ensures the configuration works across different environments
 * without hardcoding canister IDs.
 */

// Function to get canister IDs dynamically
function getCanisterIds() {
  const network = process.env.DFX_NETWORK || 'local';
  
  try {
    // Try to read from .dfx/{network}/canister_ids.json first
    const canisterIdsPath = path.resolve('../../.dfx', network, 'canister_ids.json');
    if (fs.existsSync(canisterIdsPath)) {
      const canisterIds = JSON.parse(fs.readFileSync(canisterIdsPath, 'utf8'));
      return {
        CANISTER_ID_INTERNET_IDENTITY: canisterIds.internet_identity?.[network],
        CANISTER_ID_PIXELLEDGER_BACKEND: canisterIds.pixelledger_backend?.[network],
        CANISTER_ID_PIXELLEDGER_FRONTEND: canisterIds.pixelledger_frontend?.[network],
      };
    }
    
    // For production, try reading from top-level canister_ids.json
    if (network !== 'local') {
      const prodCanisterIdsPath = path.resolve('../../canister_ids.json');
      if (fs.existsSync(prodCanisterIdsPath)) {
        const canisterIds = JSON.parse(fs.readFileSync(prodCanisterIdsPath, 'utf8'));
        return {
          CANISTER_ID_INTERNET_IDENTITY: canisterIds.internet_identity?.[network],
          CANISTER_ID_PIXELLEDGER_BACKEND: canisterIds.pixelledger_backend?.[network],
          CANISTER_ID_PIXELLEDGER_FRONTEND: canisterIds.pixelledger_frontend?.[network],
        };
      }
    }
  } catch (error) {
    console.warn('Could not read canister_ids.json:', error);
  }
  
  // Fallback to environment variables
  const fallbackIds = {
    CANISTER_ID_INTERNET_IDENTITY: process.env.CANISTER_ID_INTERNET_IDENTITY,
    CANISTER_ID_PIXELLEDGER_BACKEND: process.env.CANISTER_ID_PIXELLEDGER_BACKEND,
    CANISTER_ID_PIXELLEDGER_FRONTEND: process.env.CANISTER_ID_PIXELLEDGER_FRONTEND,
  };
  
  // Validate that we have the required IDs
  if (!fallbackIds.CANISTER_ID_PIXELLEDGER_BACKEND) {
    throw new Error('CANISTER_ID_PIXELLEDGER_BACKEND is required but not found in canister_ids.json or environment variables');
  }
  
  return fallbackIds;
}

const canisterIds = getCanisterIds();
const network = process.env.DFX_NETWORK || 'local';
const isDevelopment = network === 'local';

// Log configuration for debugging
console.log('🚀 Vite Configuration:');
console.log(`   Network: ${network}`);
console.log(`   Development: ${isDevelopment}`);
console.log('   Canister IDs:');
console.log(`     - Internet Identity: ${canisterIds.CANISTER_ID_INTERNET_IDENTITY}`);
console.log(`     - PixelLedger Backend: ${canisterIds.CANISTER_ID_PIXELLEDGER_BACKEND}`);
console.log(`     - PixelLedger Frontend: ${canisterIds.CANISTER_ID_PIXELLEDGER_FRONTEND}`);

export default defineConfig({
  mode: isDevelopment ? 'development' : 'production',
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
    // Dynamically define environment variables for runtime access
    'import.meta.env.CANISTER_ID_INTERNET_IDENTITY': JSON.stringify(canisterIds.CANISTER_ID_INTERNET_IDENTITY),
    'import.meta.env.CANISTER_ID_PIXELLEDGER_BACKEND': JSON.stringify(canisterIds.CANISTER_ID_PIXELLEDGER_BACKEND),
    'import.meta.env.CANISTER_ID_PIXELLEDGER_FRONTEND': JSON.stringify(canisterIds.CANISTER_ID_PIXELLEDGER_FRONTEND),
    'import.meta.env.DFX_NETWORK': JSON.stringify(network),
    'import.meta.env.MODE': JSON.stringify(isDevelopment ? 'development' : 'production'),
    'import.meta.env.DEV': isDevelopment,
    'import.meta.env.PROD': !isDevelopment,
  },
  server: {
    proxy: isDevelopment ? {
      "/api": {
        target: `http://${canisterIds.CANISTER_ID_PIXELLEDGER_BACKEND}.localhost:4943`,
        changeOrigin: true,
      },
    } : undefined,
    // headers: {
    //   'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: http: https:; connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.ic0.app https://*.internetcomputer.org https://icp-api.io ws://localhost:* wss://localhost:*;",
    // },
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
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      }
    ],
    dedupe: ['@dfinity/agent'],
  },
});
