import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const host = process.env.TAURI_DEV_HOST;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { getRepositoryBaseUrl } = require("./scripts/repo-utils.mjs") as {
  getRepositoryBaseUrl: (pkg: Record<string, unknown>) => string;
};

const pkg = require("./package.json") as Record<string, unknown> & { version: string };
const { version } = pkg;
const repositoryUrl = getRepositoryBaseUrl(pkg);

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  define: {
    // Exposes the canonical version (from package.json) to the frontend as
    // import.meta.env.VITE_APP_VERSION — always in sync because prebuild
    // already guarantees package.json is the source of truth.
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
    // Canonical repo URL from package.json `repository` (no hardcoded org in app code).
    "import.meta.env.VITE_REPOSITORY_URL": JSON.stringify(repositoryUrl),
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/ts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["tests/ts/**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
