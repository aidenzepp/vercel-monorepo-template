import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";

const ultraciteIgnorePatterns = core.ignorePatterns ?? [];
const ultracitePlugins = core.plugins ?? [];

const ignorePatterns = [
  ...ultraciteIgnorePatterns,
  // The ShadCN registry currently emits package components directly under src/components.
  "packages/ui/src/components/**/*.{ts,tsx}",
  // ShadCN's generated hook is vendored source and retains upstream behavior/style.
  "packages/ui/src/hooks/use-mobile*",
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
        "packages/ui/src/components/ui/**/*.{ts,tsx}",
        "packages/ui/src/hooks/use-mobile*",
      ],
      rules: {
        "func-style": "off",
        "no-use-before-define": "off",
      },
    },
    {
      files: ["packages/ui/src/lib/utils.ts"],
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
