import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const manualChunks = (id: string) => {
  if (!id.includes("node_modules")) return undefined;
  // Core framework/UI
  if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) return "vendor-react";
  // State management & data fetching
  if (id.includes("@tanstack/react-query") || id.includes("axios") || id.includes("zustand")) return "vendor-query";
  // Charts (heavy)
  if (id.includes("recharts")) return "vendor-charts";
  // Realtime (separate for lazy loading)
  if (id.includes("socket.io-client")) return "vendor-realtime";
  // 3D rendering (lazy load for classrooms)
  if (id.includes("three") || id.includes("@react-three")) return "vendor-three";
  // Framer motion (animation)
  if (id.includes("framer-motion") || id.includes("motion-dom")) return "vendor-motion";
  return undefined;
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    // Aggressive code splitting to reduce initial bundle
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
