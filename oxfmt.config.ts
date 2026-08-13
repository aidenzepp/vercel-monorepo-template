import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

const ultraciteIgnorePatterns = ultracite.ignorePatterns ?? [];

export default defineConfig({
  ...ultracite,
  ignorePatterns: [...ultraciteIgnorePatterns],
});
