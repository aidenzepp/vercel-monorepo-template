import noBuiltInTryCatch from "./rules/no-built-in-try-catch.mjs";
import preferUiPrimitives from "./rules/prefer-ui-primitives.mjs";

export default {
  meta: {
    name: "workspace",
  },
  rules: {
    "no-built-in-try-catch": noBuiltInTryCatch,
    "prefer-ui-primitives": preferUiPrimitives,
  },
};
