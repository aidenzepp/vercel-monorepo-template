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
  jsPlugins: [workspaceOxlintPlugin, "@shadcn/lint"],
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
        "workspace/require-doc-comment": "off",
      },
    },
    {
      files: ["apps/**/*.{ts,tsx}"],
      rules: {
        "workspace/no-app-button-variants": "error",
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
        "workspace/no-app-button-variants": "off",
        "workspace/prefer-ui-primitives": "off",
      },
    },
  ],
  plugins: [...ultracitePlugins, "jsdoc", "react"],
  rules: {
    "jsdoc/check-tag-names": "error",
    "jsdoc/require-param": "error",
    "jsdoc/require-param-description": "error",
    "jsdoc/require-returns": "error",
    "jsdoc/require-returns-description": "error",
    "shadcn/no-restyle": [
      "error",
      {
        allow: ["layout"],
        contracts: [
          {
            allow: ["layout"],
            message: {
              default:
                '"{{className}}" is not allowed on <Button>: use color (default, neutral, destructive, success, warning) and variant (primary, outline, secondary, ghost, soft, link). Add a reusable option in {{file|packages/ui/src/components/button.tsx}} only when the design system needs one.',
              spacing:
                '"{{className}}" is not allowed on <Button>: use a size ({{sizes|default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg}}) for internal spacing. Put surrounding space on the parent; add a size in {{file|packages/ui/src/components/button.tsx}} only when the design system needs one.',
            },
            pattern: "^Button$",
          },
          {
            allow: ["layout", "gap-*"],
            pattern: "^(CardFooter|Field|FieldContent|FieldGroup|FieldSet)$",
          },
        ],
      },
    ],
    "workspace/no-built-in-try-catch": "error",
    "workspace/require-doc-comment": "error",
  },
  settings: {
    shadcn: {
      ui: "@workspace/ui/components",
    },
  },
});
