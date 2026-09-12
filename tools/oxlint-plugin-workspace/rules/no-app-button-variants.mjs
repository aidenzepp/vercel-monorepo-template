/**
 * @typedef {{
 *   imported?: {
 *     name?: string;
 *     type?: string;
 *   };
 *   type?: string;
 * }} ImportSpecifierNode
 *
 * @typedef {{
 *   source?: {
 *     value?: string;
 *   };
 *   specifiers?: ImportSpecifierNode[];
 * }} ImportDeclarationNode
 *
 * @typedef {{
 *   report: (descriptor: {
 *     messageId: "noAppButtonVariants";
 *     node: ImportSpecifierNode;
 *   }) => void;
 * }} RuleContext
 *
 * @typedef {{
 *   ImportDeclaration: (node: ImportDeclarationNode) => void;
 * }} RuleVisitor
 */

/**
 * The shared button module whose styling recipe must remain implementation
 * detail outside shared UI primitives.
 */
const buttonModule = "@workspace/ui/components/button";

/**
 * The rule summary exposed by Oxlint configuration and editor tooling.
 */
const description =
  "Prevent application code from styling other elements with the shared Button recipe instead of composing Button itself.";

/**
 * The actionable diagnostic for application imports of the styling recipe.
 */
const message =
  "Do not import buttonVariants in application code. Render Button with its render prop so the shared primitive owns button styling and interaction.";

/**
 * Reports application code that imports the shared button styling recipe.
 */
const noAppButtonVariants = {
  /**
   * Creates the visitor that keeps button styling inside the shared primitive.
   *
   * @param {RuleContext} context Oxlint rule context for reporting diagnostics.
   * @returns {RuleVisitor} Visitor that inspects imports from the Button
   *   module.
   */
  create(context) {
    return {
      /**
       * Reports each named buttonVariants import, including aliased imports.
       *
       * @param {ImportDeclarationNode} node Parsed import declaration.
       */
      ImportDeclaration(node) {
        if (node.source?.value !== buttonModule) {
          return;
        }

        for (const specifier of node.specifiers ?? []) {
          if (
            specifier.type === "ImportSpecifier" &&
            specifier.imported?.name === "buttonVariants"
          ) {
            context.report({
              messageId: "noAppButtonVariants",
              node: specifier,
            });
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description,
    },
    messages: {
      noAppButtonVariants: message,
    },
    schema: [],
    type: "problem",
  },
};

export default noAppButtonVariants;
