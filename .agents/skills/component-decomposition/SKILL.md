---
name: component-decomposition
description: Use when creating, changing, or reviewing React UI in this repository, especially when responsibilities, dependencies, naming, or Shadcn composition are unclear.
---

# Component Decomposition

Bias toward more named components, not fewer.

## Decompose Before JSX

1. List the feature's responsibilities.
2. Create one component per responsibility.
3. Decompose until each leaf has one job describable without “and.”
4. Make the parent read as the feature outline.

Always extract:

- a form field or field group;
- an independent action, including its pending or error presentation;
- a conditional, fallback, loading, empty, or error branch;
- a repeated structure;
- a named semantic region such as a trigger, content area, header, footer, or menu item; and
- a primitive composition that performs a distinct job.

Inline only leaf-owned text/icons, one primitive with no distinct responsibility, or DOM wrappers arranging a single leaf. A wrapper repeated across leaves becomes a named component family member; for example, repeated form-row structure may become `ProfileFormRow`. Size and single use do not determine decomposition.

## Separate Boundaries From Features

- A **boundary component** reads application context, hooks, stores, services, session, or router state. It immediately translates those dependencies into values and intent callbacks for a separate prop-driven composition. Name the boundary, such as `SidebarUserMenuBoundary`.
- A **feature component** receives all application data and capabilities through props. It does not access application state, services, clients, or routing.

A caller outside the family may serve as its boundary only when that ownership is explicit. If a subscription must stay close, add a tiny boundary immediately above the prop-driven child.

At a Server/Client split, place the boundary at the nearest Client Component that can legally read the client-only dependency. Pass serializable server data into that boundary and ordinary props beneath it; do not move ambient access into a feature leaf.

Compound library protocols are the only context exception: for example, React Hook Form's form context or a Shadcn/Base UI primitive's provider. They permit participation in that library protocol, never application or domain data. `useSession`, `useRouter`, application stores, query clients, and services remain boundary-only.

Deliberately prop drill. Keep a narrowed domain object at the family boundary; unpack precise values toward leaves. Pass intent callbacks such as `onSignOut`, never routers, clients, services, setters, or implementation-named callbacks. The interaction leaf owns local UI state; lift it only to coordinate siblings.

## Inherit Names

Choose vocabulary in order: product, domain types/fields, composed library/framework, then a new local term. Use `user` for user data and `session` only for session behavior. Preserve conventions such as `useFoo`, `url`, `Trigger`, `Content`, `Item`, `Header`, and `Footer`.

Fully qualify exported roots (`SidebarUserMenu`). Use the shortest unambiguous standard name for local children (`UserMenuTrigger`, `SettingsMenuItem`).

## Keep Families Together

One file owns one coherent family, even when members are exported or reused. Reuse and line count never trigger a split. Split only for another family, a real runtime boundary, or a dependency the family should not own.

Order files: imports; shared types; helpers before their first consumer; leaves/foundations; compositions; root/boundary; one export block. Do not add decorative section comments.

## Compose Existing Primitives

Search `@workspace/ui` before writing native controls or interactions. Compose Shadcn and Next.js through supported APIs, including `render`.

For each class or behavior ask: **Is it intrinsic to the primitive, or contextual to this feature?**

- Primitives own interaction and intrinsic presentation: hover, focus, cursor, borders, colors, control height, internal padding, icon size, disabled/loading, keyboard, and ARIA behavior.
- Features own contextual layout: width in its container, grid placement, surrounding spacing, responsive visibility, and sibling alignment.

A large intrinsic class list signals incorrect composition. Inspect the primitive and its API first. Improve an incomplete shared primitive instead of imitating it locally.

## Labeled Examples

**REQUIRED REFERENCE:** Read [references/examples.md](references/examples.md) before creating or reviewing a component family. Treat each `POSITIVE` and `NEGATIVE` label as acceptance data: match the responsibility boundary demonstrated by the label, not merely the example's names or formatting.

This skill excludes JSDoc, effects, derived state, form-state strategy, and memoization. Apply dedicated guidance separately.
