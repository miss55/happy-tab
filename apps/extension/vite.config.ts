import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { build as esbuildBuild } from "esbuild";
import { fileURLToPath, URL } from "node:url";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const backgroundEntry = fileURLToPath(new URL("./src/background.ts", import.meta.url));
const backgroundOutfile = fileURLToPath(new URL("./dist/background.js", import.meta.url));

const bundleBackground = (): Plugin => ({
  name: "bundle-background",
  apply: "build",
  async closeBundle() {
    await esbuildBuild({
      absWorkingDir: fileURLToPath(new URL(".", import.meta.url)),
      alias: { "@": srcDir },
      bundle: true,
      entryPoints: [backgroundEntry],
      format: "iife",
      outfile: backgroundOutfile,
      platform: "browser",
      target: ["chrome114"]
    });
  }
});

export default defineConfig({
  plugins: [vue(), bundleBackground()],
  resolve: {
    alias: {
      "@": srcDir
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
