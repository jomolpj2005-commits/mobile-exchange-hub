import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  
  // --- Wrap your custom domain settings inside the "vite" block ---
  vite: {
    server: {
      allowedHosts: ["mobile.local", "localhost", "127.0.0.1"],
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8006",
          changeOrigin: true,
          secure: false,
        },
        "/files": {
          target: "http://127.0.0.1:8006",
          changeOrigin: true,
          secure: false,
        },
        "/assets": {
          target: "http://127.0.0.1:8006",
          changeOrigin: true,
          secure: false,
        },
      },
    }
  }
});