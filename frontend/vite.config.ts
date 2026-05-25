import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const manualChunks = (id: string) => {
  if (!id.includes("node_modules")) return undefined;
  if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) return "react";
  if (id.includes("@tanstack/react-query") || id.includes("axios") || id.includes("zustand")) return "query";
  if (id.includes("recharts")) return "charts";
  if (id.includes("socket.io-client")) return "realtime";
  if (id.includes("three") || id.includes("@react-three")) return "three";
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
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
