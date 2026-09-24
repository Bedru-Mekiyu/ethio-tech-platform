import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Socket.IO client — deferred, only for auth'd users. Keep out of initial bundle.
          if (
            id.includes("node_modules/socket.io-client") ||
            id.includes("node_modules/engine.io-client") ||
            id.includes("node_modules/engine.io-parser") ||
            id.includes("node_modules/socket.io-parser")
          ) {
            return "socket-io";
          }
          // Framer Motion — used on marketing pages but large enough to split
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/motion-")) {
            return "framer-motion";
          }
          // Recharts + D3 — dashboard charts only
          if (
            id.includes("node_modules/recharts") ||
            id.includes("node_modules/d3-") ||
            id.includes("node_modules/victory-vendor") ||
            id.includes("node_modules/recharts-scale")
          ) {
            return "charts";
          }
          // Three.js + React Three Fiber — classroom only
          if (
            id.includes("node_modules/three") ||
            id.includes("node_modules/@react-three") ||
            id.includes("node_modules/troika-") ||
            id.includes("node_modules/three-mesh-bvh") ||
            id.includes("node_modules/three-stdlib") ||
            id.includes("node_modules/maath") ||
            id.includes("node_modules/meshline") ||
            id.includes("node_modules/meshoptimizer") ||
            id.includes("node_modules/detect-gpu") ||
            id.includes("node_modules/stats-gl") ||
            id.includes("node_modules/draco3d")
          ) {
            return "three-js";
          }
          // LiveKit — classroom/meeting only
          if (id.includes("node_modules/livekit") || id.includes("node_modules/@livekit")) {
            return "livekit";
          }
          // Agora RTC SDK — classroom only
          if (id.includes("node_modules/agora-rtc-sdk-ng") || id.includes("node_modules/agora-rte-extension")) {
            return "agora";
          }
          // Konva + React Konva — whiteboard only
          if (id.includes("node_modules/konva") || id.includes("node_modules/react-konva")) {
            return "konva";
          }
        },
      },
    },
  },
});
