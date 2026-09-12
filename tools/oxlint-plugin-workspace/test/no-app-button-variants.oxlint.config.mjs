import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["../index.mjs"],
  rules: {
    "workspace/no-app-button-variants": "error",
  },
});
