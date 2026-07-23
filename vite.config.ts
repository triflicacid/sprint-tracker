import "dotenv/config";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
      "#api": path.resolve(__dirname, "src/api"),
      "#components": path.resolve(__dirname, "src/components"),
      "#pages": path.resolve(__dirname, "src/pages"),
      "#utils": path.resolve(__dirname, "src/utils"),
      "#testUtils": path.resolve(__dirname, "src/testUtils"),
      "#styles": path.resolve(__dirname, "src/styles"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        // overridable so playwright's e2e run can point this dev server at
        // its own throwaway-db express instance instead of the real one.
        target: process.env.VITE_API_PROXY_TARGET ?? `http://localhost:${process.env.PORT ?? 4000}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
});
