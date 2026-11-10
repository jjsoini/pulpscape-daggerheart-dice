import { defineConfig, Plugin } from "vite";
// @ts-ignore
import { resolve } from "path";
// @ts-ignore
import fs from "fs";
import react from "@vitejs/plugin-react";

declare var __dirname: string;

/**
 * Serve a modified manifest in dev so the local version is distinguishable
 * from the published one when both are installed in Owlbear Rodeo.
 */
function localManifest(): Plugin {
  return {
    name: "local-manifest",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/manifest.json") return next();
        const manifest = JSON.parse(
          fs.readFileSync(resolve(__dirname, "public/manifest.json"), "utf-8")
        );
        manifest.name = manifest.name + " (local)";
        manifest.action.title = manifest.action.title + " (local)";
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(JSON.stringify(manifest));
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    // 7510 is Tales of the Old West dice, so both can run at once
    port: 7511,
    strictPort: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  plugins: [react(), localManifest()],
  assetsInclude: ["**/*.glb", "**/*.hdr"],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        popover: resolve(__dirname, "popover.html"),
        background: resolve(__dirname, "background.html"),
      },
    },
  },
});
