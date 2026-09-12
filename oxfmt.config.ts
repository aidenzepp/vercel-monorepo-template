import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

/**
 * The upstream exclusions preserved while adding repository-owned formatting
 * policy.
 */
const ultraciteIgnorePatterns = ultracite.ignorePatterns ?? [];

export default defineConfig({
  ...ultracite,
  ignorePatterns: [...ultraciteIgnorePatterns, ".agents/skills/**"],
  jsdoc: {
    commentLineStrategy: "multiline",
    lineWrappingStyle: "balance",
  },
});
