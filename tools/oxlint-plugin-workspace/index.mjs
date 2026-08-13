import noBuiltInTryCatch from "./rules/no-built-in-try-catch.mjs";
import noProcessEnv from "./rules/no-process-env.mjs";

export default {
  meta: {
    name: "workspace",
  },
  rules: {
    "no-built-in-try-catch": noBuiltInTryCatch,
    "no-process-env": noProcessEnv,
  },
};
