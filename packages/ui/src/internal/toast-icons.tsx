import * as React from "react";

/**
 * Displays the Nucleo circle-check glyph used by success toasts.
 *
 * @param props - The SVG attributes applied by the toast presentation.
 * @param props.className - Supplies the semantic color and rendered size.
 * @returns The current-color Nucleo success vector.
 * @see https://nucleoapp.com/license
 */
const ToastSuccessIcon = ({
  className,
  ...props
}: React.ComponentProps<"svg">) => (
  <svg
    {...props}
    className={className}
    data-nucleo-icon="circle-check"
    fill="none"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="9"
      cy="9"
      r="7.25"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <polyline
      points="5.75 9.25 8 11.75 12.25 6.25"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

/**
 * Displays the Nucleo circle-info glyph used by informational toasts.
 *
 * @param props - The SVG attributes applied by the toast presentation.
 * @param props.className - Supplies the semantic color and rendered size.
 * @returns The current-color Nucleo information vector.
 * @see https://nucleoapp.com/license
 */
const ToastInfoIcon = ({
  className,
  ...props
}: React.ComponentProps<"svg">) => (
  <svg
    {...props}
    className={className}
    data-nucleo-icon="circle-info"
    fill="none"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 16.25C13.004 16.25 16.25 13.004 16.25 9C16.25 4.996 13.004 1.75 9 1.75C4.996 1.75 1.75 4.996 1.75 9C1.75 13.004 4.996 16.25 9 16.25Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M9 12.75V9.25C9 8.9739 8.7761 8.75 8.5 8.75H7.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M9 6.75C8.448 6.75 8 6.301 8 5.75C8 5.199 8.448 4.75 9 4.75C9.552 4.75 10 5.199 10 5.75C10 6.301 9.552 6.75 9 6.75Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Displays the Nucleo triangle-warning glyph used by warning toasts.
 *
 * @param props - The SVG attributes applied by the toast presentation.
 * @param props.className - Supplies the semantic color and rendered size.
 * @returns The current-color Nucleo warning vector.
 * @see https://nucleoapp.com/license
 */
const ToastWarningIcon = ({
  className,
  ...props
}: React.ComponentProps<"svg">) => (
  <svg
    {...props}
    className={className}
    data-nucleo-icon="triangle-warning"
    fill="none"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.63796 3.48996L2.21295 12.89C1.60795 13.9399 2.36395 15.25 3.57495 15.25H14.425C15.636 15.25 16.392 13.9399 15.787 12.89L10.362 3.48996C9.75696 2.44996 8.24296 2.44996 7.63796 3.48996Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M9 6.75V9.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M9 13.5C8.448 13.5 8 13.05 8 12.5C8 11.95 8.448 11.5 9 11.5C9.552 11.5 10 11.9501 10 12.5C10 13.0499 9.552 13.5 9 13.5Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Displays the modified Nucleo octagon-xmark glyph used by error toasts.
 *
 * The octagon and xmark geometry come from the licensed Nucleo UI 1.8.0
 * octagon-warning and circle-xmark assets.
 *
 * @param props - The SVG attributes applied by the toast presentation.
 * @param props.className - Supplies the semantic color and rendered size.
 * @returns The current-color Nucleo error vector.
 * @see https://nucleoapp.com/license
 */
const ToastErrorIcon = ({
  className,
  ...props
}: React.ComponentProps<"svg">) => (
  <svg
    {...props}
    className={className}
    data-nucleo-icon="octagon-xmark"
    fill="none"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.968 2.25H7.03296C6.50296 2.25 5.99396 2.461 5.61896 2.836L2.83698 5.61798C2.46198 5.99298 2.25098 6.50198 2.25098 7.03198V10.967C2.25098 11.497 2.46198 12.006 2.83698 12.381L5.61896 15.163C5.99396 15.538 6.50296 15.749 7.03296 15.749H10.968C11.498 15.749 12.007 15.538 12.382 15.163L15.164 12.381C15.539 12.006 15.75 11.497 15.75 10.967V7.03198C15.75 6.50198 15.539 5.99298 15.164 5.61798L12.382 2.836C12.007 2.461 11.498 2.25 10.968 2.25Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <line
      x1="6.25"
      x2="11.75"
      y1="6.25"
      y2="11.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <line
      x1="11.75"
      x2="6.25"
      y1="6.25"
      y2="11.75"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

export { ToastErrorIcon, ToastInfoIcon, ToastSuccessIcon, ToastWarningIcon };
