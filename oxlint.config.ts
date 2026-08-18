import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";

const ultraciteIgnorePatterns = core.ignorePatterns ?? [];
const ultracitePlugins = core.plugins ?? [];

const ignorePatterns = [
  ...ultraciteIgnorePatterns,
  // ShadCN's generated hook is vendored source and retains upstream behavior/style.
  "apps/*/hooks/use-mobile.ts",
];

const workspaceOxlintPlugin = "./tools/oxlint-plugin-workspace/index.mjs";

export default defineConfig({
  categories: {
    correctness: "error",
  },
  // Anti-slop uses a JavaScript plugin and can make linting roughly 60% slower.
  extends: [core, antiSlop],
  ignorePatterns,
  jsPlugins: [workspaceOxlintPlugin],
  options: {
    typeAware: true,
  },
  overrides: [
    {
      files: [
        "apps/*/components/theme-provider.tsx",
        "apps/*/components/ui/**/*.{ts,tsx}",
      ],
      rules: {
        "func-style": "off",
        "no-use-before-define": "off",
      },
    },
    {
      files: ["apps/*/lib/utils.ts"],
      rules: {
        "func-style": "off",
      },
    },
    {
      files: ["packages/utils/src/result.ts"],
      rules: {
        "workspace/no-built-in-try-catch": "off",
      },
    },
  ],
  plugins: [...ultracitePlugins, "react"],
  rules: {
    "workspace/no-built-in-try-catch": "error",
  },
});
