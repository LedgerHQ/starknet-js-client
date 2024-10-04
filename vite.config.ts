import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "hw-app-starknet",
      fileName: (format) => `hw-app-starknet.${format}.js`,
    },

    rollupOptions: {
      external: ["isomorphic-fetch"],
      output: [
        {
          format: "es",
          entryFileNames: "[name].js",
          preserveModules: true,
          dir: "lib/esm",
          preserveModulesRoot: "src",
        },
        {
          format: "cjs",
          entryFileNames: "[name].cjs",
          preserveModules: true,
          dir: "lib/cjs",
          preserveModulesRoot: "src",
        },
      ],
    },
  },
  plugins: [dts({ outDir: "lib/types" })],
});
