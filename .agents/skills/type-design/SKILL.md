---
name: type-design
description: Use when creating, changing, or reviewing TypeScript or TSX data models, public inputs, domain identifiers, state unions, Result or Option usage, or types adapted from schemas and external libraries.
---

# Type Design

Model data so invalid values and states are rejected at the highest trustworthy boundary. Optimize for the narrowest truthful contract, not the fewest type declarations.

## Work From The Owner

Before declaring a type, search for the model, primitive, schema, or upstream type that already owns the fact.

Derive in the direction of semantic ownership:

1. A runtime schema owns the data it validates; infer its TypeScript output.
2. A domain constant or object owns its finite vocabulary; derive with `typeof`, `keyof`, indexed access, and `as const`.
3. A repository model or primitive owns shared semantics; import it instead of recreating it. Use `Result` from `@workspace/utils/result` and `Option` from `@workspace/utils/option`.
4. An external type owns only the guarantees its API actually makes. When the application owns a stricter invariant, define the application model and adapt it once at that boundary.

Use `satisfies` to check conformance without widening a useful inferred type. Do not derive a domain contract from an incidental implementation merely because `ReturnType` makes that easy.

## Constrain The Entry Point

Put an invariant on the highest public input that can establish it, then preserve that type through the dependency cone. Do not accept a broad value, process it, and cast or reject it in a leaf.

When a foreign API is intentionally broader:

- expose a narrow application wrapper;
- derive downstream types from the application model; and
- widen or assert only inside the foreign adapter, with the reason documented.

Use an exhaustive `never` check once a discriminant reaches internal control flow. A fallback is not a substitute for constraining an application-owned caller.

## Model Meaning, Identity, And State

- Brand durable domain identifiers by default when equal runtime primitives are not interchangeable. `UserId` and `ProductId` must not both reduce to plain `string` aliases.
- Construct brands at centralized validation, hydration, or provenance boundaries. Never scatter `as UserId` casts.
- Keep identity brands distinct from validated values: an identifier answers “which kind of entity?”, while a validated string answers “which invariant has this value passed?”
- Use discriminated unions when fields vary by state. Each branch contains exactly the data valid in that state.
- Use the existing `Result<T, E>` for fallible operations and give `E` the narrowest known error union.

Model absence deliberately:

| Meaning | Shape |
| --- | --- |
| The caller may omit the field | `field?: T` |
| The field is part of the stable model but may have no value | `field: Option<T>` |
| Explicit empty differs from missing | `field: T | null` |

## Use TypeScript's Vocabulary

Prefer built-ins when they preserve the model:

| Need | Tools |
| --- | --- |
| Select or remove known fields | `Pick`, `Omit` |
| Change requiredness or mutability truthfully | `Partial`, `Required`, `Readonly` |
| Map a closed key set | `Record` |
| Filter unions | `Exclude`, `Extract`, `NonNullable` |
| Derive callable contracts | `Parameters`, `ReturnType`, `Awaited`, `InstanceType` |
| Derive object and literal contracts | `keyof`, indexed access, `typeof`, `as const`, `satisfies` |
| Transform type structure | mapped and conditional types |

`Partial<T>` is correct only when every independently omitted field is a valid value for that boundary. Otherwise define the operation's actual input with `Pick`, `Omit`, or an explicit type.

## Verify The Contract

Add compile-time usage tests for consequential boundaries: accepted examples compile, and rejected examples use `@ts-expect-error`. Add runtime tests when a schema or constructor validates real input. Typecheck the immediate consumers after changing a shared model.

## Stop Signs

| Rationalization | Required response |
| --- | --- |
| “Keep the public type broad; narrow it where rendered.” | Move the invariant to the trustworthy caller boundary. |
| “A cast is the smallest diff.” | Model the source correctly; isolate an unavoidable cast at an adapter. |
| “A local Result or Maybe is faster.” | Search for and reuse the repository primitive. |
| “Partial keeps this flexible.” | Name the exact states or fields the operation accepts. |

## Labeled Examples

**REQUIRED REFERENCE:** Read [references/examples.md](references/examples.md) before making a consequential type-model decision. Treat each `POSITIVE` and `NEGATIVE` label as acceptance data and follow its decisive evidence rather than copying its surface syntax.

Apply `function-decomposition` to functions using the model, `component-decomposition` to React consumers, and `document-code` to the resulting program units.
