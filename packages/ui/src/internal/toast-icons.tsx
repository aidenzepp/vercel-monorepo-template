import * as React from "react";

/**
 * Displays the Nucleo badge-check Fill Duo glyph used by success toasts.
 *
 * @param props - The SVG attributes applied by the toast presentation.
 * @param props.className - Supplies the rendered size.
 * @returns The semantically colored Nucleo success vector.
 * @see https://nucleoapp.com/license
 */
const ToastSuccessIcon = ({
  className,
  ...props
}: React.ComponentProps<"svg">) => (
  <svg
    {...props}
    className={className}
    data-nucleo-icon="badge-check"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-success"
      d="M15.5352 6.29351C15.75 5.23931 15.4327 4.11921 14.6573 3.34381C13.8819 2.56741 12.7608 2.25051 11.7071 2.46541C11.1143 1.56841 10.0977 1.00101 9.00102 1.00101C7.90432 1.00101 6.88772 1.56841 6.29492 2.46541C5.24222 2.25011 4.12111 2.56751 3.34471 3.34381C2.56931 4.11921 2.25191 5.23931 2.46681 6.29301C1.56931 6.88631 1.00201 7.90291 1.00201 9.00001C1.00201 10.0971 1.56941 11.1133 2.46681 11.7065C2.25201 12.7607 2.56931 13.8808 3.34471 14.6562C4.12111 15.4321 5.24222 15.749 6.29492 15.5346C6.88772 16.4316 7.90432 16.999 9.00102 16.999C10.0977 16.999 11.1143 16.4311 11.7071 15.5342C12.7647 15.7486 13.8819 15.4317 14.6573 14.6563C15.4337 13.8804 15.7511 12.7603 15.5352 11.7066C16.4327 11.1138 17 10.0972 17 9.00011C17 7.90301 16.4326 6.88671 15.5352 6.29351Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      className="fill-success-foreground"
      d="M8.00012 12.5C7.78822 12.5 7.58512 12.4102 7.44252 12.252L5.19252 9.752C4.91522 9.4439 4.94051 8.9698 5.24821 8.6924C5.55581 8.4155 6.02851 8.4395 6.30781 8.7481L7.95622 10.5801L11.6564 5.7915C11.9103 5.4639 12.381 5.4028 12.7091 5.6567C13.0362 5.9096 13.0968 6.3808 12.8439 6.7085L8.59391 12.2085C8.45721 12.3848 8.25012 12.4912 8.02852 12.4995C8.01872 12.5 8.00982 12.5 8.00012 12.5Z"
      data-color="color-1"
    />
  </svg>
);

/**
 * Displays the Nucleo circle-info Fill Duo glyph used by informational toasts.
 *
 * @param props - The SVG attributes applied by the toast presentation.
 * @param props.className - Supplies the rendered size.
 * @returns The directly colored Nucleo information vector.
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
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-[oklch(62.04%_0.1950_253.83)]"
      d="M9 1C4.5889 1 1 4.5889 1 9C1 13.4111 4.5889 17 9 17C13.4111 17 17 13.4111 17 9C17 4.5889 13.4111 1 9 1Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      className="fill-[oklch(49.82%_0.1370_253.91)] dark:fill-[oklch(72.11%_0.1414_253.55)]"
      d="M9.75 12.75C9.75 13.1641 9.4141 13.5 9 13.5C8.5859 13.5 8.25 13.1641 8.25 12.75V9.5H7.75C7.3359 9.5 7 9.1641 7 8.75C7 8.3359 7.3359 8 7.75 8H8.5C9.1895 8 9.75 8.5605 9.75 9.25V12.75ZM9 6.75C8.448 6.75 8 6.301 8 5.75C8 5.199 8.448 4.75 9 4.75C9.552 4.75 10 5.199 10 5.75C10 6.301 9.552 6.75 9 6.75Z"
      data-color="color-1"
    />
  </svg>
);

/**
 * Displays the Nucleo triangle-warning Fill Duo glyph used by warning toasts.
 *
 * @param props - The SVG attributes applied by the toast presentation.
 * @param props.className - Supplies the rendered size.
 * @returns The semantically colored Nucleo warning vector.
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
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-warning"
      d="M16.4364 12.5151L11.0101 3.11316C10.5902 2.39096 9.83872 1.96045 8.99982 1.96045C8.16092 1.96045 7.40952 2.39106 6.98952 3.11316C6.98902 3.11366 6.98902 3.11473 6.98852 3.11523L1.56272 12.5156C1.14332 13.2436 1.14332 14.1128 1.56372 14.8398C1.98362 15.5664 2.73562 16 3.57492 16H14.4245C15.2639 16 16.0158 15.5664 16.4357 14.8398C16.8561 14.1127 16.8563 13.2436 16.4364 12.5151Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      className="fill-warning-foreground"
      d="M9 10.5C8.5859 10.5 8.25 10.1641 8.25 9.75V6.75C8.25 6.3359 8.5859 6 9 6C9.4141 6 9.75 6.3359 9.75 6.75V9.75C9.75 10.1641 9.4141 10.5 9 10.5Z"
      data-color="color-1"
    />
    <path
      className="fill-warning-foreground"
      d="M9 13.5C8.448 13.5 8 13.05 8 12.5C8 11.95 8.448 11.5 9 11.5C9.552 11.5 10 11.9501 10 12.5C10 13.0499 9.552 13.5 9 13.5Z"
      data-color="color-1"
    />
  </svg>
);

/**
 * Displays the Nucleo octagon-warning Fill Duo glyph used by error toasts.
 *
 * @param props - The SVG attributes applied by the toast presentation.
 * @param props.className - Supplies the rendered size.
 * @returns The semantically colored Nucleo error vector.
 * @see https://nucleoapp.com/license
 */
const ToastErrorIcon = ({
  className,
  ...props
}: React.ComponentProps<"svg">) => (
  <svg
    {...props}
    className={className}
    data-nucleo-icon="octagon-warning"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-destructive"
      d="M15.695 5.08801L12.912 2.30603C12.393 1.78603 11.702 1.5 10.968 1.5H7.03297C6.29897 1.5 5.60897 1.78603 5.08897 2.30603L2.30698 5.08801C1.78698 5.60701 1.50098 6.29798 1.50098 7.03198V10.967C1.50098 11.701 1.78698 12.392 2.30698 12.911L5.08897 15.693C5.60897 16.213 6.29897 16.499 7.03297 16.499H10.968C11.702 16.499 12.393 16.213 12.912 15.693L15.695 12.911C16.214 12.392 16.5 11.701 16.5 10.967V7.03198C16.5 6.29798 16.214 5.60701 15.695 5.08801Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      className="fill-destructive-foreground"
      d="M9 10.25C8.5859 10.25 8.25 9.9141 8.25 9.5V5.43121C8.25 5.01711 8.5859 4.68121 9 4.68121C9.4141 4.68121 9.75 5.01711 9.75 5.43121V9.5C9.75 9.9141 9.4141 10.25 9 10.25Z"
      data-color="color-1"
    />
    <path
      className="fill-destructive-foreground"
      d="M9 13.417C8.448 13.417 8 12.968 8 12.417C8 11.866 8.448 11.417 9 11.417C9.552 11.417 10 11.866 10 12.417C10 12.968 9.552 13.417 9 13.417Z"
      data-color="color-1"
    />
  </svg>
);

export { ToastErrorIcon, ToastInfoIcon, ToastSuccessIcon, ToastWarningIcon };
