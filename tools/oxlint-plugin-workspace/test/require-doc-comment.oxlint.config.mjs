import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["../index.mjs"],
  rules: {
    "workspace/require-doc-comment": "error",
  },
});
