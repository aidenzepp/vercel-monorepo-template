---
name: document-code
description: Use when writing or reviewing TypeScript or TSX functions, components, interfaces, types, services, callbacks, or other named program units in this repository.
---

# Document Code

Make each program unit's contract and system role clear before a reader studies its implementation.

## Required coverage

Add a `/** ... */` doc comment to every module-scope function, component, interface, type alias, class, service, enum, namespace, callback type, and `const` declaration. Also document each interface or object-type property and every named file-local helper function. Local values declared inside a function are not program units unless the declaration is itself a helper function.

## Write in the repository's voice

Follow `packages/utils/src/result.ts` and `packages/utils/src/option.ts`:

- Open with a direct, complete sentence that defines a type or states what a function does.
- Start functions with an active verb such as “Construct,” “Execute,” “Display,” or “Convert.”
- Start types with a definitional noun phrase such as “A value…” or “The failure branch…”.
- Add one concise follow-up only for a mental model, invariant, rationale, ecosystem fit, or ownership boundary.
- Describe the consumer-facing contract, not the implementation sequence.
- Reuse the exact vocabulary of the domain, framework, and underlying library.
- Omit filler. A comment that only expands the symbol's name is incomplete documentation.

## Apply tags by contract

| Program unit | Required documentation |
| --- | --- |
| Function, component, or named helper | `@param` for every argument and `@returns` for its semantic result. For destructuring, document both `props` and every `props.property`. |
| Callback signature | Describe the capability or intent, then document every callback argument with `@param` and its completion with `@returns`. |
| Interface or object type | Define the whole contract, then document every property in consumer vocabulary. Property comments are authoritative. |
| Module-scope non-callable `const` | State the invariant, policy, shared consumers, or system role that the value establishes. |
| Public overload set | Document each public overload whose contract differs. Do not separately document the implementation signature. |

For a `void` function, omit `@returns` when completion has no consumer-facing meaning. Include it when completion establishes a meaningful side-effect contract. For components, describe the rendered responsibility rather than writing “JSX.”

Reusable props types own the complete property meaning. The component's `@param props.property` entry states how that property participates in this component; it must not copy the property comment verbatim.

For an inline object parameter, the function's `@param` entry defines the object as a whole and each property entry defines one member; do not add a second standalone comment. Overloads differ when they accept different representations, return different guarantees, or expose different failures. Put shared invariants in each public contract only when callers of that overload need them.

Use optional tags only when their condition holds:

- `@see` and inline `{@link Symbol}` for a useful relationship to a real program unit, composition, counterpart, or protocol.
- `@example` for non-obvious public usage, using one focused and valid example.
- `@throws` for each failure intentionally allowed to escape and the condition that causes it.
- `@deprecated` only for a deprecated unit; name and link the supported replacement.

Do not repeat TypeScript types in prose or add tags with no information. Small file-local helpers still receive a concise purpose plus applicable `@param` and `@returns` tags; they do not receive optional tags by default.

## Labeled Examples

**REQUIRED REFERENCE:** Read [references/examples.md](references/examples.md) before writing or reviewing code documentation. Treat each `POSITIVE` and `NEGATIVE` label as acceptance data: reproduce the documented contract quality, not merely the comment shape.

## Review

Confirm every required unit, property, argument, and destructured property is documented; tags follow the unit's contract; openings define purpose with established vocabulary; follow-ups add information absent from the signature; and links resolve to useful relationships. Reject comments that narrate syntax, duplicate types, or merely restate names.
