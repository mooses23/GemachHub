import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-is/") || id.includes("node_modules/scheduler/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack/")) {
            return "vendor-query";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-") || id.includes("node_modules/victory-") || id.includes("node_modules/internmap") || id.includes("node_modules/robust-predicates")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/@stripe/") || id.includes("node_modules/stripe/")) {
            return "vendor-stripe";
          }
          if (id.includes("node_modules/framer-motion") || id.includes("node_modules/motion")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/zod") || id.includes("node_modules/drizzle-zod")) {
            return "vendor-zod";
          }
          if (id.includes("node_modules/date-fns")) {
            return "vendor-date-fns";
          }
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }
        },
      },
    },
  },
});
