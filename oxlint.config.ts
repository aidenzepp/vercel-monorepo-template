import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

const ultraciteIgnorePatterns = core.ignorePatterns ?? [];

const ignorePatterns = [...ultraciteIgnorePatterns];

const workspaceOxlintPlugin = "./tools/oxlint-plugin-workspace/index.mjs";

export default defineConfig({
  extends: [core],
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
    {
      files: ["packages/utils/src/env.ts"],
      rules: {
        "workspace/no-process-env": "off",
      },
    },
  ],
  rules: {
    "workspace/no-built-in-try-catch": "error",
    "workspace/no-process-env": "error",
  },
});
