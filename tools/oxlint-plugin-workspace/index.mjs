import noAppButtonVariants from "./rules/no-app-button-variants.mjs";
import noBuiltInTryCatch from "./rules/no-built-in-try-catch.mjs";
import preferUiPrimitives from "./rules/prefer-ui-primitives.mjs";
import requireDocComment from "./rules/require-doc-comment.mjs";

export default {
  meta: {
    name: "workspace",
  },
  rules: {
    "no-app-button-variants": noAppButtonVariants,
    "no-built-in-try-catch": noBuiltInTryCatch,
    "prefer-ui-primitives": preferUiPrimitives,
    "require-doc-comment": requireDocComment,
  },
};
