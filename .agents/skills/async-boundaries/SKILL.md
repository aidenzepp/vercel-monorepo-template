---
name: async-boundaries
description: Use when creating or reviewing React and Next.js component-level loading, streaming, Suspense, error isolation, promise passing, async Server Components, or React use() behavior in this repository.
---

# Async Boundaries

Keep known interface available while unresolved regions load or fail.

## Place Boundaries From Facts

Before writing JSX, list:

1. content known before asynchronous work begins;
2. values produced by each asynchronous operation;
3. regions that must reveal together because they share one operation; and
4. regions that can load or fail independently.

Render known content outside every boundary. Wrap the smallest complete region
whose truth depends on the operation. An ancestor boundary is sufficient only
when every protected descendant genuinely shares the same loading or failure
fate.

Every independently loading region requires a nearby `Suspense`. Every
independently fallible rendering or data region requires a nearby
`ErrorBoundary`. Use `AsyncBoundary` when the same region owns both states.

## Load Data At The Right Layer

Prefer an async Server Component that awaits its own data beneath the boundary.
This keeps credentials and query logic on the server and sends only resolved,
serializable values into Client Components.

Start Promises higher without awaiting only when doing so starts independent
work in parallel or intentionally preloads work before its consumer renders.
The start time creates the performance benefit; `use()` does not.

Pass a Promise to a Client Component and unwrap it with React `use()` only when
the Client Component must own when that stable server-created resource is read.
Never create an uncached Promise during Client Component render. Prefer `await`
inside a Server Component when either layer can own the read.

## Choose The Boundary

| Situation | Boundary |
| --- | --- |
| Pending rendering; acceptable ancestor owns failure | `Suspense` |
| Fallible rendering with no suspension | `ErrorBoundary` |
| One region owns both pending and failed rendering | `AsyncBoundary` |
| Form submission, event handler, or mutation | Form/action state, not a rendering boundary |

This repository does not use `loading.tsx` or `error.tsx` as its normal
composition model. Treat those files as explicitly approved one-off route
architecture, outside this skill's default workflow.

## Compose States

Extract loading and failure branches as named members of the component family.
Fallbacks preserve the unresolved region's layout while leaving known labels,
headings, descriptions, and controls real. They must be inexpensive and must
not repeat the operation that activated the boundary.

Put retry behavior in the failure component with
`useErrorBoundaryRetry()` when retrying is safe and useful. An Error Boundary
does not catch failures from event handlers or arbitrary asynchronous callbacks;
those errors stay with the interaction that produced them.

Do not split one atomic result into misleading per-field boundaries. Do split
independent sibling operations so one slow or failed region does not hide the
others.

## Required Review Questions

- What exact value is unresolved?
- Which visible elements already have truthful content?
- Where does the Promise begin, and where is it read?
- Do sibling operations begin concurrently?
- Does each boundary match one loading and failure fate?
- Can the fallback render without additional data?
- Are mutation failures handled by the owning interaction?

## Labeled Examples

**REQUIRED REFERENCE:** Read [references/examples.md](references/examples.md)
before creating or reviewing asynchronous UI. Treat every `POSITIVE` and
`NEGATIVE` label as acceptance data. Match the evidence stated above each
example, not merely its syntax.

Apply `component-decomposition` to the resulting component family and
`document-code` to its program units.
