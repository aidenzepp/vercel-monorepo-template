import { ErrorBoundary } from "@workspace/ui/next/error-boundary";
import type { ComponentProps, ReactNode } from "react";
import { Suspense } from "react";

type ErrorBoundaryProps = ComponentProps<typeof ErrorBoundary>;

type AsyncBoundaryProps = Readonly<{
  /** Content protected by the combined asynchronous boundary. */
  children: ErrorBoundaryProps["children"];

  /**
   * Content displayed if descendant rendering fails.
   *
   * Pass `null` when silently omitting the failed content is intentional.
   */
  failure: ErrorBoundaryProps["fallback"];

  /** Content displayed while a descendant is suspended. */
  loading: ReactNode;
}>;

/**
 * Gives one asynchronous region explicit loading and failure states.
 *
 * Place this near the data-consuming leaf so unrelated interface regions
 * remain available while this content loads or fails.
 */
const AsyncBoundary = ({ children, failure, loading }: AsyncBoundaryProps) => (
  <ErrorBoundary fallback={failure}>
    <Suspense fallback={loading}>{children}</Suspense>
  </ErrorBoundary>
);

export { AsyncBoundary };
