"use client";

import { catchError } from "next/error.js";
import type { ErrorInfo } from "next/error.js";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

type ErrorBoundaryProps = Readonly<{
  children: ReactNode;
  fallback: ReactNode;
}>;

/**
 * Shares Next.js recovery only while an error fallback is being rendered.
 */
const RetryContext = createContext<ErrorInfo["retry"] | null>(null);

/**
 * Adapts Next.js rendering recovery to the shared fallback contract.
 *
 * @param props - The fallback rendered when a descendant fails.
 * @param props.fallback - Supplies the active error presentation.
 * @returns The fallback with its Next.js retry operation in context.
 */
const NextErrorBoundary = catchError(
  (
    { fallback }: Pick<ErrorBoundaryProps, "fallback">,
    { retry }: ErrorInfo
  ) => <RetryContext value={retry}>{fallback}</RetryContext>
);

/**
 * Contains a rendering failure to one portion of the interface.
 *
 * This boundary does not catch errors from event handlers or arbitrary
 * asynchronous callbacks. Errors thrown by the fallback continue to the nearest
 * ancestor boundary. Next prepares server-rendered fallback content eagerly,
 * so keep it inexpensive and free of unnecessary data work.
 *
 * @param props - The renderable region and its failure replacement.
 * @param props.children - Supplies the content whose rendering may fail.
 * @param props.fallback - Supplies the content shown after a rendering failure.
 * @returns The content protected by a Next.js rendering boundary.
 * @see https://nextjs.org/docs/app/getting-started/error-handling#handling-uncaught-exceptions
 */
const ErrorBoundary = ({ children, fallback }: ErrorBoundaryProps) => (
  <NextErrorBoundary fallback={fallback}>{children}</NextErrorBoundary>
);

/**
 * Returns the retry operation for the nearest ErrorBoundary currently
 * displaying its fallback.
 *
 * Retry refetches and rerenders the protected subtree using Next.js recovery
 * behavior. It should not be stored outside the fallback's lifetime.
 *
 * @returns The recovery operation supplied to the active fallback.
 * @throws {Error} When called outside an active {@link ErrorBoundary} fallback.
 */
const useErrorBoundaryRetry = (): ErrorInfo["retry"] => {
  const retry = useContext(RetryContext);

  if (retry === null) {
    throw new Error(
      "useErrorBoundaryRetry must be used within an ErrorBoundary fallback"
    );
  }

  return retry;
};

export { ErrorBoundary, useErrorBoundaryRetry };
