import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isElectronBuild = process.env.BUILD_TARGET === 'electron';

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Only inline assets for standalone web export; Electron uses dist/ folder
      ...(!isElectronBuild ? [viteSingleFile()] : []),
    ],
    define: {
      'process.env.API_KEY':        JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    /* Electron loads built files from disk — use relative base */
    base: isElectronBuild ? './' : '/',
    server: {
      port: 3000,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    preview: {
      port: 3000,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    build: {
      minify: false,
      assetsInlineLimit: isElectronBuild ? 0 : 100_000_000,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  };
});
