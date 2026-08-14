import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";

const ultraciteIgnorePatterns = core.ignorePatterns ?? [];

const ignorePatterns = [...ultraciteIgnorePatterns];

const workspaceOxlintPlugin = "./tools/oxlint-plugin-workspace/index.mjs";

export default defineConfig({
  // Anti-slop uses a JavaScript plugin and can make linting roughly 60% slower.
  extends: [core, antiSlop],
  ignorePatterns,
  jsPlugins: [workspaceOxlintPlugin],
  options: {
    typeAware: true,
  },
  overrides: [
    {
      files: ["packages/utils/src/result.ts"],
      rules: {
        "workspace/no-built-in-try-catch": "off",
      },
    },
  ],
  rules: {
    "workspace/no-built-in-try-catch": "error",
  },
});
