/**
 * @typedef {{
 *   computed?: boolean;
 *   object?: { name?: string; type?: string };
 *   property?: { name?: string; type?: string; value?: unknown };
 * }} MemberExpressionNode
 *
 * @typedef {{
 *   filename?: string;
 *   getFilename?: () => string;
 *   report: (descriptor: {
 *     messageId: "noProcessEnv";
 *     node: MemberExpressionNode;
 *   }) => void;
 * }} RuleContext
 */

const description =
  "Disallow direct process.env access so configuration goes through the Zod env contract in the workspace utils package.";

const message = [
  "Avoid reading process.env directly outside the env module.",
  "Import { env } from @workspace/utils/env, or extend EnvSchema (and the variables snapshot) in packages/utils/src/env.ts.",
].join(" ");

/**
 * @param {MemberExpressionNode} node Candidate member expression.
 */
const isProcessEnvAccess = (node) => {
  if (node.object?.type !== "Identifier" || node.object.name !== "process") {
    return false;
  }

  if (node.computed === true) {
    return node.property?.type === "Literal" && node.property.value === "env";
  }

  return node.property?.type === "Identifier" && node.property.name === "env";
};

const noProcessEnv = {
  /**
   * @param {RuleContext} context Oxlint rule context for reporting diagnostics.
   */
  create(context) {
    return {
      /**
       * @param {MemberExpressionNode} node Parsed member expression candidate.
       */
      MemberExpression(node) {
        if (!isProcessEnvAccess(node)) {
          return;
        }

        context.report({
          messageId: "noProcessEnv",
          node,
        });
      },
    };
  },
  meta: {
    docs: {
      description,
    },
    messages: {
      noProcessEnv: message,
    },
    schema: [],
    type: "problem",
  },
};

export default noProcessEnv;
