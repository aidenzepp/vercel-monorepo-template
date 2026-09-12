import { ErrorBoundary } from "@workspace/ui/next/error-boundary";
import type { ComponentProps, ReactNode } from "react";
import { Suspense } from "react";

type AsyncBoundaryProps = Readonly<{
  children: ComponentProps<typeof ErrorBoundary>["children"];
  failure: ComponentProps<typeof ErrorBoundary>["fallback"];
  loading: ReactNode;
}>;

/**
 * Gives one asynchronous region explicit loading and failure states.
 *
 * Place this near the data-consuming leaf so unrelated interface regions remain
 * available while this content loads or fails.
 *
 * @param props - The asynchronous region and its pending and failed states.
 * @param props.children - Supplies the content that may suspend or fail while
 *   rendering.
 * @param props.failure - Replaces the region after a rendering failure.
 * @param props.loading - Replaces the region while rendering is suspended.
 * @returns The content protected by colocated Suspense and error boundaries.
 * @see {@link ErrorBoundary}
 */
const AsyncBoundary = ({ children, failure, loading }: AsyncBoundaryProps) => (
  <ErrorBoundary fallback={failure}>
    <Suspense fallback={loading}>{children}</Suspense>
  </ErrorBoundary>
);

export { AsyncBoundary };
