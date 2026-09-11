import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["../index.mjs"],
  rules: {
    "workspace/prefer-ui-primitives": "error",
  },
});
