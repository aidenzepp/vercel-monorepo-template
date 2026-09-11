/**
 * @typedef {{
 *   name?: {
 *     name?: string;
 *     type?: string;
 *   };
 * }} JSXOpeningElementNode
 *
 * @typedef {{
 *   report: (descriptor: {
 *     data: {
 *       direction: string;
 *       element: string;
 *     };
 *     messageId: "preferUiPrimitive";
 *     node: JSXOpeningElementNode;
 *   }) => void;
 * }} RuleContext
 *
 * @typedef {{
 *   JSXOpeningElement: (node: JSXOpeningElementNode) => void;
 * }} RuleVisitor
 */

/**
 * The rule summary exposed by Oxlint configuration and editor tooling.
 */
const description =
  "Require established workspace or framework primitives when application JSX has a direct semantic replacement.";

/**
 * The diagnostic template pairing each intrinsic tag with its replacement
 * direction.
 */
const message = "Do not use <{{element}}> in application UI. {{direction}}";

/**
 * Maps forbidden intrinsic tags to actionable workspace-specific replacement
 * guidance.
 */
const replacementDirections = new Map([
  [
    "button",
    "Use the existing shared Button or a specialized shared button primitive.",
  ],
  ["input", "Use the shared Input component."],
  ["textarea", "Use the shared Textarea component."],
  ["select", "Use the shared Select or NativeSelect component."],
  ["label", "Use the shared Label or FieldLabel component."],
  [
    "img",
    "Use Next.js Image from next/image or the shared AvatarImage component.",
  ],
  ["fieldset", "Use the shared FieldSet component."],
  ["legend", "Use the shared FieldLegend component."],
  ["option", "Use the shared NativeSelectOption component."],
  ["optgroup", "Use the shared NativeSelectOptGroup component."],
  ["progress", "Use the shared Progress component."],
  ["hr", "Use the shared Separator component."],
  ["kbd", "Use the shared Kbd component."],
  ["dialog", "Use the shared Dialog or AlertDialog component."],
  ["details", "Use the shared Collapsible or Accordion components."],
  ["summary", "Use the shared Collapsible or Accordion components."],
  ["table", "Use the shared Table component."],
  ["thead", "Use the shared TableHeader component."],
  ["tbody", "Use the shared TableBody component."],
  ["tfoot", "Use the shared TableFooter component."],
  ["tr", "Use the shared TableRow component."],
  ["th", "Use the shared TableHead component."],
  ["td", "Use the shared TableCell component."],
  ["caption", "Use the shared TableCaption component."],
]);

/**
 * Reports application JSX that bypasses an established UI primitive.
 */
const preferUiPrimitives = {
  /**
   * Creates the visitor that reports intrinsic JSX with direct primitive
   * replacements.
   *
   * @param {RuleContext} context Oxlint rule context for reporting diagnostics.
   * @returns {RuleVisitor} Visitor that inspects JSX opening elements.
   */
  create(context) {
    return {
      /**
       * Reports an intrinsic JSX element when the workspace provides its
       * semantic primitive.
       *
       * @param {JSXOpeningElementNode} node Parsed JSX opening element
       *   candidate.
       */
      JSXOpeningElement(node) {
        if (node.name?.type !== "JSXIdentifier") {
          return;
        }

        const element = node.name.name;

        if (element === undefined) {
          return;
        }

        const direction = replacementDirections.get(element);

        if (direction === undefined) {
          return;
        }

        context.report({
          data: {
            direction,
            element,
          },
          messageId: "preferUiPrimitive",
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
      preferUiPrimitive: message,
    },
    schema: [],
    type: "problem",
  },
};

export default preferUiPrimitives;
