import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    ...(command === "build"
      ? [
          nitro({
            preset: process.env["NITRO_PRESET"] || "vercel",
          }),
        ]
      : []),
  ],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    target: "es2022",
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/react(-dom)?\//.test(id) || id.includes("/react/")) return "vendor-react";
            if (id.includes("@tanstack/")) return "vendor-router";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("qrcode.react")) return "vendor-qr";
            if (id.includes("lucide-react") || id.includes("@radix-ui/") || id.includes("sonner")) {
              return "vendor-ui";
            }
            return "vendor";
          }
          return undefined;
        },
      },
    },
  },
}));
