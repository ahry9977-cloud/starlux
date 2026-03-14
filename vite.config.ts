import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/ratings.test.ts",
    ],
  },
  envDir: path.resolve(__dirname),
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Performance optimizations
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    // Code splitting - Aggressive
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Ultra-fast pages - no chunking
          if (id.includes('UltraFastLogin') || id.includes('UltraFastRegister')) {
            return undefined; // Keep in main bundle for instant load
          }
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'react-vendor';
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('wouter')) return 'react-vendor';
            if (id.includes('lucide-react')) return 'ui';
            if (id.includes('@trpc') || id.includes('@tanstack')) return 'trpc';
          }
          return undefined;
        },
        // Asset file naming with hash for caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
});
