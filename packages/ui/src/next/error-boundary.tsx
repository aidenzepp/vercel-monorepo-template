"use client";

import { catchError } from "next/error.js";
import type { ErrorInfo } from "next/error.js";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

type ErrorBoundaryProps = Readonly<{
  /**
   * Content protected by this boundary.
   */
  children: ReactNode;

  /**
   * Content displayed when a descendant fails during rendering.
   *
   * Next prepares server-rendered fallback content eagerly, even when no error
   * occurs. Keep this content inexpensive and free of unnecessary data work.
   */
  fallback: ReactNode;
}>;

const RetryContext = createContext<ErrorInfo["retry"] | null>(null);

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
 * ancestor boundary.
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
