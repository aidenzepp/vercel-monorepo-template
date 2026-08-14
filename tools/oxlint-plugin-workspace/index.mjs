import noBuiltInTryCatch from "./rules/no-built-in-try-catch.mjs";

export default {
  meta: {
    name: "workspace",
  },
  rules: {
    "no-built-in-try-catch": noBuiltInTryCatch,
  },
};
