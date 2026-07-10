// /vite.config.ts
// Vite configuration for Workout Web.
// Keeps aliases centralized and separates heavy libraries into stable chunks.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@mui") || id.includes("@emotion")) return "vendor-mui";
          if (id.includes("react-leaflet") || id.includes("leaflet")) return "vendor-maps";
          if (id.includes("recharts")) return "vendor-charts";
          return undefined;
        },
      },
    },
  },
});
