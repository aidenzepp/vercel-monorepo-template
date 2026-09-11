import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";

/**
 * The upstream exclusions preserved while adding workspace-specific lint
 * policy.
 */
const ultraciteIgnorePatterns = core.ignorePatterns ?? [];

/**
 * The upstream plugin registrations preserved by the composed configuration.
 */
const ultracitePlugins = core.plugins ?? [];

/**
 * Sources excluded because they are upstream-generated or intentional rule
 * fixtures.
 */
const ignorePatterns = [
  ...ultraciteIgnorePatterns,
  // The ShadCN registry currently emits package components directly under src/components.
  "packages/ui/src/components/**/*.{ts,tsx}",
  // ShadCN's generated hook is vendored source and retains upstream behavior/style.
  "packages/ui/src/hooks/use-mobile*",
  // Rule fixtures intentionally contain JSX that application code forbids.
  "tools/oxlint-plugin-workspace/test/fixtures/**/*.{ts,tsx}",
];

/**
 * The local plugin module containing workspace-specific enforcement rules.
 */
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
    {
      files: ["apps/web/db/schema/auth.ts"],
      rules: {
        "no-inline-comments": "off",
        "sort-keys": "off",
        "unicorn/numeric-separators-style": "off",
      },
    },
    {
      files: ["apps/**/*.{ts,tsx}"],
      rules: {
        "workspace/prefer-ui-primitives": "error",
      },
    },
    {
      files: [
        "apps/**/__generated__/**/*.{ts,tsx}",
        "apps/**/generated/**/*.{ts,tsx}",
        "apps/**/vendor/**/*.{ts,tsx}",
        "apps/**/vendored/**/*.{ts,tsx}",
        "apps/**/*.gen.{ts,tsx}",
        "apps/**/*.generated.{ts,tsx}",
      ],
      rules: {
        "workspace/prefer-ui-primitives": "off",
      },
    },
  ],
  plugins: [...ultracitePlugins, "react"],
  rules: {
    "workspace/no-built-in-try-catch": "error",
  },
});
