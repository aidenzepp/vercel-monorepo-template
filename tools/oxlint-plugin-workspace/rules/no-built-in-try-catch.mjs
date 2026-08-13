/**
 * @typedef {{
 *   handler?: unknown;
 * }} TryStatementNode
 *
 * @typedef {{
 *   report: (descriptor: {
 *     messageId: "noBuiltInTryCatch";
 *     node: TryStatementNode;
 *   }) => void;
 * }} RuleContext
 */

const description =
  "Disallow built-in try/catch blocks so recoverable failures use result.trycatch calls and explicit error handling.";

const message = [
  "Avoid built-in try/catch blocks: they can wrap multiple operations and hide which operation failed.",
  "Prefer result.trycatch from the workspace utils package around one atomic operation and handle each error individually.",
].join(" ");

const noBuiltInTryCatch = {
  /**
   * @param {RuleContext} context Oxlint rule context for reporting diagnostics.
   */
  create(context) {
    return {
      /**
       * @param {TryStatementNode} node Parsed try statement candidate.
       */
      TryStatement(node) {
        if (node.handler === undefined) {
          return;
        }

        if (node.handler === null) {
          return;
        }

        context.report({
          messageId: "noBuiltInTryCatch",
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
      noBuiltInTryCatch: message,
    },
    schema: [],
    type: "problem",
  },
};

export default noBuiltInTryCatch;
