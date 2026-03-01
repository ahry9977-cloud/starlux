// vite.config.ts
import { jsxLocPlugin } from "file:///C:/Users/pc/Downloads/%D9%85%D9%86%D8%B5%D8%AA%D9%8A%20%20(1)/node_modules/@builder.io/vite-plugin-jsx-loc/dist/index.js";
import tailwindcss from "file:///C:/Users/pc/Downloads/%D9%85%D9%86%D8%B5%D8%AA%D9%8A%20%20(1)/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///C:/Users/pc/Downloads/%D9%85%D9%86%D8%B5%D8%AA%D9%8A%20%20(1)/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "file:///C:/Users/pc/Downloads/%D9%85%D9%86%D8%B5%D8%AA%D9%8A%20%20(1)/node_modules/vite/dist/node/index.js";
import { vitePluginManusRuntime } from "file:///C:/Users/pc/Downloads/%D9%85%D9%86%D8%B5%D8%AA%D9%8A%20%20(1)/node_modules/vite-plugin-manus-runtime/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/pc/Downloads/%D9%85%D9%86%D8%B5%D8%AA%D9%8A%20%20(1)/vite.config.ts";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  envDir: path.resolve(__dirname),
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Performance optimizations
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    // Code splitting - Aggressive
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("UltraFastLogin") || id.includes("UltraFastRegister")) {
            return void 0;
          }
          if (id.includes("node_modules")) {
            if (id.includes("react-dom")) return "react-vendor";
            if (id.includes("react")) return "react-vendor";
            if (id.includes("wouter")) return "router";
            if (id.includes("lucide-react")) return "ui";
            if (id.includes("@trpc") || id.includes("@tanstack")) return "trpc";
          }
          return void 0;
        },
        // Asset file naming with hash for caching
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "chunks/[name]-[hash].js",
        entryFileNames: "entries/[name]-[hash].js"
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 500
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true
      }
    },
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwY1xcXFxEb3dubG9hZHNcXFxcXHUwNjQ1XHUwNjQ2XHUwNjM1XHUwNjJBXHUwNjRBICAoMSlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHBjXFxcXERvd25sb2Fkc1xcXFxcdTA2NDVcdTA2NDZcdTA2MzVcdTA2MkFcdTA2NEEgICgxKVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvcGMvRG93bmxvYWRzLyVEOSU4NSVEOSU4NiVEOCVCNSVEOCVBQSVEOSU4QSUyMCUyMCgxKS92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGpzeExvY1BsdWdpbiB9IGZyb20gXCJAYnVpbGRlci5pby92aXRlLXBsdWdpbi1qc3gtbG9jXCI7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcIm5vZGU6dXJsXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgdml0ZVBsdWdpbk1hbnVzUnVudGltZSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1tYW51cy1ydW50aW1lXCI7XG5cblxuY29uc3QgcGx1Z2lucyA9IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpLCBqc3hMb2NQbHVnaW4oKSwgdml0ZVBsdWdpbk1hbnVzUnVudGltZSgpXTtcblxuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnMsXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUpLFxuICAgICAgXCJAc2hhcmVkXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic2hhcmVkXCIpLFxuICAgICAgXCJAYXNzZXRzXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiYXR0YWNoZWRfYXNzZXRzXCIpLFxuICAgIH0sXG4gIH0sXG4gIGVudkRpcjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSksXG4gIHJvb3Q6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUpLFxuICBidWlsZDoge1xuICAgIG91dERpcjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0L3B1YmxpY1wiKSxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICAvLyBQZXJmb3JtYW5jZSBvcHRpbWl6YXRpb25zXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgICBjc3NNaW5pZnk6IHRydWUsXG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICAvLyBDb2RlIHNwbGl0dGluZyAtIEFnZ3Jlc3NpdmVcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgLy8gVWx0cmEtZmFzdCBwYWdlcyAtIG5vIGNodW5raW5nXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdVbHRyYUZhc3RMb2dpbicpIHx8IGlkLmluY2x1ZGVzKCdVbHRyYUZhc3RSZWdpc3RlcicpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkOyAvLyBLZWVwIGluIG1haW4gYnVuZGxlIGZvciBpbnN0YW50IGxvYWRcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QtZG9tJykpIHJldHVybiAncmVhY3QtdmVuZG9yJztcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QnKSkgcmV0dXJuICdyZWFjdC12ZW5kb3InO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCd3b3V0ZXInKSkgcmV0dXJuICdyb3V0ZXInO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkgcmV0dXJuICd1aSc7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0B0cnBjJykgfHwgaWQuaW5jbHVkZXMoJ0B0YW5zdGFjaycpKSByZXR1cm4gJ3RycGMnO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9LFxuICAgICAgICAvLyBBc3NldCBmaWxlIG5hbWluZyB3aXRoIGhhc2ggZm9yIGNhY2hpbmdcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXScsXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnY2h1bmtzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2VudHJpZXMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gQ2h1bmsgc2l6ZSB3YXJuaW5nc1xuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNTAwLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICBcIi9hcGlcIjoge1xuICAgICAgICB0YXJnZXQ6IFwiaHR0cDovLzEyNy4wLjAuMTozMDAwXCIsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBhbGxvd2VkSG9zdHM6IFtcbiAgICAgIFwiLm1hbnVzcHJlLmNvbXB1dGVyXCIsXG4gICAgICBcIi5tYW51cy5jb21wdXRlclwiLFxuICAgICAgXCIubWFudXMtYXNpYS5jb21wdXRlclwiLFxuICAgICAgXCIubWFudXNjb21wdXRlci5haVwiLFxuICAgICAgXCIubWFudXN2bS5jb21wdXRlclwiLFxuICAgICAgXCJsb2NhbGhvc3RcIixcbiAgICAgIFwiMTI3LjAuMC4xXCIsXG4gICAgXSxcbiAgICBmczoge1xuICAgICAgc3RyaWN0OiB0cnVlLFxuICAgICAgZGVueTogW1wiKiovLipcIl0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5VCxTQUFTLG9CQUFvQjtBQUN0VixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFdBQVc7QUFFbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsOEJBQThCO0FBUDBJLElBQU0sMkNBQTJDO0FBVWxPLElBQU0sVUFBVSxDQUFDLE1BQU0sR0FBRyxZQUFZLEdBQUcsYUFBYSxHQUFHLHVCQUF1QixDQUFDO0FBRWpGLElBQU0sWUFBWSxLQUFLLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBRTdELElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxTQUFTO0FBQUEsTUFDM0IsV0FBVyxLQUFLLFFBQVEsV0FBVyxRQUFRO0FBQUEsTUFDM0MsV0FBVyxLQUFLLFFBQVEsV0FBVyxpQkFBaUI7QUFBQSxJQUN0RDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVEsS0FBSyxRQUFRLFNBQVM7QUFBQSxFQUM5QixNQUFNLEtBQUssUUFBUSxTQUFTO0FBQUEsRUFDNUIsT0FBTztBQUFBLElBQ0wsUUFBUSxLQUFLLFFBQVEsV0FBVyxhQUFhO0FBQUEsSUFDN0MsYUFBYTtBQUFBO0FBQUEsSUFFYixRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxXQUFXO0FBQUE7QUFBQSxJQUVYLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGFBQWEsSUFBSTtBQUVmLGNBQUksR0FBRyxTQUFTLGdCQUFnQixLQUFLLEdBQUcsU0FBUyxtQkFBbUIsR0FBRztBQUNyRSxtQkFBTztBQUFBLFVBQ1Q7QUFFQSxjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0IsZ0JBQUksR0FBRyxTQUFTLFdBQVcsRUFBRyxRQUFPO0FBQ3JDLGdCQUFJLEdBQUcsU0FBUyxPQUFPLEVBQUcsUUFBTztBQUNqQyxnQkFBSSxHQUFHLFNBQVMsUUFBUSxFQUFHLFFBQU87QUFDbEMsZ0JBQUksR0FBRyxTQUFTLGNBQWMsRUFBRyxRQUFPO0FBQ3hDLGdCQUFJLEdBQUcsU0FBUyxPQUFPLEtBQUssR0FBRyxTQUFTLFdBQVcsRUFBRyxRQUFPO0FBQUEsVUFDL0Q7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFBQTtBQUFBLFFBRUEsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxJQUNBLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxNQUNSLE1BQU0sQ0FBQyxPQUFPO0FBQUEsSUFDaEI7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
