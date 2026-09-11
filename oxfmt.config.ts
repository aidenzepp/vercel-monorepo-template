import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

const ultraciteIgnorePatterns = ultracite.ignorePatterns ?? [];

export default defineConfig({
  ...ultracite,
  ignorePatterns: [...ultraciteIgnorePatterns, ".agents/skills/**"],
  jsdoc: {
    commentLineStrategy: "multiline",
    lineWrappingStyle: "balance",
  },
  overrides: [
    {
      files: ["packages/utils/src/option.ts", "packages/utils/src/result.ts"],
      options: { jsdoc: false },
    },
  ],
});
