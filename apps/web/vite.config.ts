import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev proxy target comes from VITE_API_URL if set, otherwise defaults to :5001
// (picking 5001 because macOS holds :5000 for AirPlay Receiver by default).
//
// Base path:
//   - In dev, base is "/" so http://localhost:5173 works naturally.
//   - In production, base is "/luminate-lms/" because GitHub Pages serves the
//     site at https://<user>.github.io/luminate-lms/. All asset URLs are
//     rewritten relative to this prefix. React Router also reads this at
//     runtime via import.meta.env.BASE_URL (see main.tsx basename).
//
// Override both locally via VITE_BASE=/ if you ever preview the prod build
// outside GitHub Pages.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_URL || "http://localhost:5001";
  const base = env.VITE_BASE ?? (mode === "production" ? "/luminate-lms/" : "/");

  return {
    base,
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
