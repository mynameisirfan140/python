import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  const base = process.env["VITE_BASE_PATH"] || "/";
  return {
    base,
    server: { host: "0.0.0.0", port: 8080, strictPort: true, allowedHosts: true as const },
    plugins: [
      tsconfigPaths(),
      tanstackStart({
        router: { basepath: base },
        pages: [{ path: base, prerender: { outputPath: "/" } }],
        prerender: { enabled: true, autoStaticPathsDiscovery: false, crawlLinks: false, failOnError: true },
        sitemap: { enabled: false },
      }),
      react(),
      tailwindcss(),
    ],
  };
});
