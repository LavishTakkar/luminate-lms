import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev proxy target comes from VITE_API_URL if set, otherwise defaults to :5001
// (picking 5001 because macOS holds :5000 for AirPlay Receiver by default).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_URL || "http://localhost:5001";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: "es2022",
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            motion: ["framer-motion"],
            markdown: ["react-markdown"],
            query: ["@tanstack/react-query"],
            icons: ["lucide-react"],
          },
        },
      },
    },
  };
});
