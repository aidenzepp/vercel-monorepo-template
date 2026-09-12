/**
 * @typedef {{
 *   end: number;
 *   type: string;
 *   value: string;
 * }} CommentNode
 *
 * @typedef {{
 *   id?: {
 *     name?: string;
 *     type?: string;
 *   };
 *   init?: {
 *     type?: string;
 *   } | null;
 *   body?: DeclarationNode[] | object | null;
 *   declaration?: DeclarationNode | null;
 *   kind?: string;
 *   parent?: DeclarationNode;
 *   start: number;
 *   type: string;
 * }} DeclarationNode
 *
 * @typedef {{
 *   getCommentsBefore: (node: DeclarationNode) => CommentNode[];
 *   text: string;
 * }} SourceCode
 *
 * @typedef {{
 *   report: (descriptor: {
 *     data: {
 *       name: string;
 *     };
 *     messageId: "requireDocComment";
 *     node: DeclarationNode;
 *   }) => void;
 *   sourceCode: SourceCode;
 * }} RuleContext
 *
 * @typedef {{
 *   ClassDeclaration: (node: DeclarationNode) => void;
 *   FunctionDeclaration: (node: DeclarationNode) => void;
 *   TSDeclareFunction: (node: DeclarationNode) => void;
 *   TSEnumDeclaration: (node: DeclarationNode) => void;
 *   TSInterfaceDeclaration: (node: DeclarationNode) => void;
 *   TSModuleDeclaration: (node: DeclarationNode) => void;
 *   TSTypeAliasDeclaration: (node: DeclarationNode) => void;
 *   VariableDeclarator: (node: DeclarationNode) => void;
 * }} RuleVisitor
 */

/**
 * The rule summary exposed by Oxlint configuration and editor tooling.
 */
const description =
  "Require multiline JSDoc contracts for named functions and module-level declarations while leaving component props structural.";

/**
 * The diagnostic that tells authors what information the missing comment must
 * provide.
 */
const message =
  "Document `{{name}}` with a multiline JSDoc block that states its contract and system role.";

/**
 * Returns the declaration node that owns a preceding documentation comment.
 *
 * @param {DeclarationNode} node The declaration reported by the visitor.
 * @returns {DeclarationNode} The declaration or export wrapper associated with
 *   its comment.
 */
const getDocumentationTarget = (node) => {
  let target = node;

  if (target.type === "VariableDeclarator" && target.parent !== undefined) {
    target = target.parent;
  }

  if (
    (target.parent?.type === "ExportNamedDeclaration" ||
      target.parent?.type === "ExportDefaultDeclaration") &&
    target.parent !== undefined
  ) {
    target = target.parent;
  }

  return target;
};

/**
 * Returns the declaration contained by an export wrapper.
 *
 * @param {DeclarationNode} node A declaration or export wrapper.
 * @returns {DeclarationNode} The wrapped declaration when one exists.
 */
const getWrappedDeclaration = (node) => node.declaration ?? node;

/**
 * Determines whether a declaration is owned directly by the module.
 *
 * @param {DeclarationNode} node The declaration whose scope should be checked.
 * @returns {boolean} Whether the declaration is a top-level module member.
 */
const isModuleDeclaration = (node) => {
  const target = getDocumentationTarget(node);

  return target.parent?.type === "Program";
};

/**
 * Reads the identifier used to name a declaration.
 *
 * @param {DeclarationNode} node The declaration whose name should be reported.
 * @returns {string | null} The identifier when the declaration has a
 *   simple name.
 */
const getDeclarationName = (node) => {
  if (node.id?.type !== "Identifier") {
    return null;
  }

  return node.id.name;
};

/**
 * Determines whether a function body implements preceding overload
 * declarations that already own the public contract.
 *
 * @param {DeclarationNode} node The function declaration being inspected.
 * @returns {boolean} Whether a preceding overload declaration documents this
 *   implementation.
 */
const isOverloadImplementation = (node) => {
  const target = getDocumentationTarget(node);

  if (
    node.type !== "FunctionDeclaration" ||
    node.body === undefined ||
    node.body === null ||
    !Array.isArray(target.parent?.body)
  ) {
    return false;
  }

  /**
   * @type {DeclarationNode[]}
   */
  const siblings = target.parent.body;
  const index = siblings.indexOf(target);
  const previousTarget = siblings.at(index - 1);

  if (previousTarget === undefined) {
    return false;
  }

  const previous = getWrappedDeclaration(previousTarget);

  return (
    (previous.type === "TSDeclareFunction" ||
      (previous.type === "FunctionDeclaration" && previous.body === null)) &&
    getDeclarationName(previous) === getDeclarationName(node)
  );
};

/**
 * Checks whether a declaration has an adjacent multiline JSDoc block.
 *
 * @param {SourceCode} sourceCode Parsed source and comment accessors.
 * @param {DeclarationNode} node The declaration that requires documentation.
 * @returns {boolean} Whether the declaration is immediately preceded by
 * JSDoc.
 */
const hasDocComment = (sourceCode, node) => {
  const target = getDocumentationTarget(node);
  const comments = sourceCode.getCommentsBefore(target);
  const comment = comments.at(-1);

  if (comment?.type !== "Block" || !comment.value.startsWith("*")) {
    return false;
  }

  return sourceCode.text.slice(comment.end, target.start).trim().length === 0;
};

/**
 * Determines whether a variable declaration represents a named function.
 *
 * @param {DeclarationNode} node The variable declarator being inspected.
 * @returns {boolean} Whether the initializer is an arrow or function
 *   expression.
 */
const isNamedFunctionVariable = (node) =>
  node.init?.type === "ArrowFunctionExpression" ||
  node.init?.type === "FunctionExpression";

/**
 * Determines whether a structural type is owned by a component's documented
 * props contract.
 *
 * @param {string} name The declared type or interface name.
 * @returns {boolean} Whether the declaration is a props structure whose
 *   meaning belongs on the component.
 */
const isPropsStructure = (name) => name.endsWith("Props");

/**
 * Reports declarations that do not carry their required documentation
 * contract.
 */
const requireDocComment = {
  /**
   * Creates the visitor that enforces documentation coverage.
   *
   * @param {RuleContext} context Oxlint rule context and source accessors.
   * @returns {RuleVisitor} Visitor that inspects named declarations.
   */
  create(context) {
    /**
     * Reports one declaration when it has a simple name but no adjacent JSDoc
     * block.
     *
     * @param {DeclarationNode} node The declaration requiring documentation.
     */
    const reportMissingDocumentation = (node) => {
      const name = getDeclarationName(node);

      if (name === null || hasDocComment(context.sourceCode, node)) {
        return;
      }

      context.report({
        data: { name },
        messageId: "requireDocComment",
        node,
      });
    };

    /**
     * Reports a module-owned domain declaration unless it is a component props
     * structure.
     *
     * @param {DeclarationNode} node The type-like declaration candidate.
     */
    const checkDomainDeclaration = (node) => {
      const name = getDeclarationName(node);

      if (
        name === null ||
        isPropsStructure(name) ||
        !isModuleDeclaration(node)
      ) {
        return;
      }

      reportMissingDocumentation(node);
    };

    return {
      ClassDeclaration: checkDomainDeclaration,
      FunctionDeclaration(node) {
        if (!isOverloadImplementation(node)) {
          reportMissingDocumentation(node);
        }
      },
      TSDeclareFunction: reportMissingDocumentation,
      TSEnumDeclaration: checkDomainDeclaration,
      TSInterfaceDeclaration: checkDomainDeclaration,
      TSModuleDeclaration: checkDomainDeclaration,
      TSTypeAliasDeclaration: checkDomainDeclaration,
      VariableDeclarator(node) {
        if (
          getDeclarationName(node) === null ||
          (node.parent?.kind !== "const" && !isNamedFunctionVariable(node)) ||
          (!isModuleDeclaration(node) && !isNamedFunctionVariable(node))
        ) {
          return;
        }

        reportMissingDocumentation(node);
      },
    };
  },
  meta: {
    docs: {
      description,
    },
    messages: {
      requireDocComment: message,
    },
    schema: [],
    type: "problem",
  },
};

export default requireDocComment;
