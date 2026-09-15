import * as React from "react";

/**
 * Applies Nucleo's shared 18px Fill Duo presentation to one licensed glyph.
 *
 * @param props - The native SVG geometry and presentation for one duo-tone
 *   icon.
 * @returns The Nucleo Fill Duo canvas supplied to a public icon.
 */
const NucleoDuoToneIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" {...props} xmlns="http://www.w3.org/2000/svg" />
);

/**
 * Displays the Nucleo badge-check Fill Duo glyph.
 *
 * The translucent badge inherits the SVG fill while the solid checkmark uses
 * currentColor, allowing callers to pair Tailwind fill and text utilities.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo badge-check vector.
 * @see https://nucleoapp.com/license
 */
const BadgeCheck = (props: React.ComponentProps<"svg">) => (
  <svg
    fill="currentColor"
    {...props}
    data-nucleo-icon="badge-check"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.5352 6.29351C15.75 5.23931 15.4327 4.11921 14.6573 3.34381C13.8819 2.56741 12.7608 2.25051 11.7071 2.46541C11.1143 1.56841 10.0977 1.00101 9.00102 1.00101C7.90432 1.00101 6.88772 1.56841 6.29492 2.46541C5.24222 2.25011 4.12111 2.56751 3.34471 3.34381C2.56931 4.11921 2.25191 5.23931 2.46681 6.29301C1.56931 6.88631 1.00201 7.90291 1.00201 9.00001C1.00201 10.0971 1.56941 11.1133 2.46681 11.7065C2.25201 12.7607 2.56931 13.8808 3.34471 14.6562C4.12111 15.4321 5.24222 15.749 6.29492 15.5346C6.88772 16.4316 7.90432 16.999 9.00102 16.999C10.0977 16.999 11.1143 16.4311 11.7071 15.5342C12.7647 15.7486 13.8819 15.4317 14.6573 14.6563C15.4337 13.8804 15.7511 12.7603 15.5352 11.7066C16.4327 11.1138 17 10.0972 17 9.00011C17 7.90301 16.4326 6.88671 15.5352 6.29351Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      d="M8.00012 12.5C7.78822 12.5 7.58512 12.4102 7.44252 12.252L5.19252 9.752C4.91522 9.4439 4.94051 8.9698 5.24821 8.6924C5.55581 8.4155 6.02851 8.4395 6.30781 8.7481L7.95622 10.5801L11.6564 5.7915C11.9103 5.4639 12.381 5.4028 12.7091 5.6567C13.0362 5.9096 13.0968 6.3808 12.8439 6.7085L8.59391 12.2085C8.45721 12.3848 8.25012 12.4912 8.02852 12.4995C8.01872 12.5 8.00982 12.5 8.00012 12.5Z"
      data-color="color-1"
      fill="currentColor"
    />
  </svg>
);

/**
 * Displays the Nucleo circle-info Fill Duo glyph.
 *
 * The translucent circle inherits the SVG fill while the solid information mark
 * uses currentColor, allowing callers to pair Tailwind fill and text
 * utilities.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo circle-info vector.
 * @see https://nucleoapp.com/license
 */
const CircleInfo = (props: React.ComponentProps<"svg">) => (
  <svg
    fill="currentColor"
    {...props}
    data-nucleo-icon="circle-info"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9 1C4.5889 1 1 4.5889 1 9C1 13.4111 4.5889 17 9 17C13.4111 17 17 13.4111 17 9C17 4.5889 13.4111 1 9 1Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      d="M9.75 12.75C9.75 13.1641 9.4141 13.5 9 13.5C8.5859 13.5 8.25 13.1641 8.25 12.75V9.5H7.75C7.3359 9.5 7 9.1641 7 8.75C7 8.3359 7.3359 8 7.75 8H8.5C9.1895 8 9.75 8.5605 9.75 9.25V12.75ZM9 6.75C8.448 6.75 8 6.301 8 5.75C8 5.199 8.448 4.75 9 4.75C9.552 4.75 10 5.199 10 5.75C10 6.301 9.552 6.75 9 6.75Z"
      data-color="color-1"
      fill="currentColor"
    />
  </svg>
);

/**
 * Displays the Nucleo incognito Fill Duo glyph.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo incognito vector.
 * @see https://nucleoapp.com/license
 */
const Incognito = (props: React.ComponentProps<"svg">) => (
  <NucleoDuoToneIcon
    {...props}
    data-nucleo-icon="incognito"
    viewBox="0 0 18 18"
  >
    <path
      d="m12.75,10c-1.0519,0-1.9791.5105-2.5734,1.2881-.7394-.3364-1.613-.3362-2.3528.0002-.5944-.7776-1.5217-1.2883-2.5737-1.2883-1.792,0-3.25,1.458-3.25,3.25s1.458,3.25,3.25,3.25,3.25-1.458,3.25-3.25c0-.2034-.0242-.4009-.0601-.5942.3531-.1729.7684-.1724,1.1202-.0005-.036.1934-.0601.3911-.0601.5947,0,1.792,1.458,3.25,3.25,3.25s3.25-1.458,3.25-3.25-1.458-3.25-3.25-3.25Zm-7.5,5c-.9648,0-1.75-.7852-1.75-1.75s.7852-1.75,1.75-1.75,1.75.7852,1.75,1.75-.7852,1.75-1.75,1.75Zm7.5,0c-.9648,0-1.75-.7852-1.75-1.75s.7852-1.75,1.75-1.75,1.75.7852,1.75,1.75-.7852,1.75-1.75,1.75Z"
      data-color="color-1"
      fill="currentColor"
    />
    <path
      d="m16.25,7h-1.8693l-.7161-4.1191c-.0806-.4653-.3555-.8784-.7529-1.1328-.3989-.2539-.8892-.3301-1.3442-.2085l-1.3989.3726c-.7646.2041-1.5718.2041-2.3374,0l-1.3979-.3726c-.4565-.1216-.9468-.0454-1.3447.2085-.3975.2544-.6724.6675-.7529,1.1328l-.7161,4.1191h-1.8693c-.4141,0-.75.3359-.75.75s.3359.75.75.75h14.5c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z"
      data-color="color-2"
      opacity="0.4"
    />
  </NucleoDuoToneIcon>
);

/**
 * Displays the Nucleo triangle-warning Fill Duo glyph.
 *
 * The translucent triangle inherits the SVG fill while the solid warning mark
 * uses currentColor, allowing callers to pair Tailwind fill and text utilities.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo triangle-warning vector.
 * @see https://nucleoapp.com/license
 */
const TriangleWarning = (props: React.ComponentProps<"svg">) => (
  <svg
    fill="currentColor"
    {...props}
    data-nucleo-icon="triangle-warning"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.4364 12.5151L11.0101 3.11316C10.5902 2.39096 9.83872 1.96045 8.99982 1.96045C8.16092 1.96045 7.40952 2.39106 6.98952 3.11316C6.98902 3.11366 6.98902 3.11473 6.98852 3.11523L1.56272 12.5156C1.14332 13.2436 1.14332 14.1128 1.56372 14.8398C1.98362 15.5664 2.73562 16 3.57492 16H14.4245C15.2639 16 16.0158 15.5664 16.4357 14.8398C16.8561 14.1127 16.8563 13.2436 16.4364 12.5151Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      d="M9 10.5C8.5859 10.5 8.25 10.1641 8.25 9.75V6.75C8.25 6.3359 8.5859 6 9 6C9.4141 6 9.75 6.3359 9.75 6.75V9.75C9.75 10.1641 9.4141 10.5 9 10.5Z"
      data-color="color-1"
      fill="currentColor"
    />
    <path
      d="M9 13.5C8.448 13.5 8 13.05 8 12.5C8 11.95 8.448 11.5 9 11.5C9.552 11.5 10 11.9501 10 12.5C10 13.0499 9.552 13.5 9 13.5Z"
      data-color="color-1"
      fill="currentColor"
    />
  </svg>
);

/**
 * Displays the Nucleo octagon-warning Fill Duo glyph.
 *
 * The translucent octagon inherits the SVG fill while the solid warning mark
 * uses currentColor, allowing callers to pair Tailwind fill and text utilities.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo octagon-warning vector.
 * @see https://nucleoapp.com/license
 */
const OctagonWarning = (props: React.ComponentProps<"svg">) => (
  <svg
    fill="currentColor"
    {...props}
    data-nucleo-icon="octagon-warning"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.695 5.08801L12.912 2.30603C12.393 1.78603 11.702 1.5 10.968 1.5H7.03297C6.29897 1.5 5.60897 1.78603 5.08897 2.30603L2.30698 5.08801C1.78698 5.60701 1.50098 6.29798 1.50098 7.03198V10.967C1.50098 11.701 1.78698 12.392 2.30698 12.911L5.08897 15.693C5.60897 16.213 6.29897 16.499 7.03297 16.499H10.968C11.702 16.499 12.393 16.213 12.912 15.693L15.695 12.911C16.214 12.392 16.5 11.701 16.5 10.967V7.03198C16.5 6.29798 16.214 5.60701 15.695 5.08801Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      d="M9 10.25C8.5859 10.25 8.25 9.9141 8.25 9.5V5.43121C8.25 5.01711 8.5859 4.68121 9 4.68121C9.4141 4.68121 9.75 5.01711 9.75 5.43121V9.5C9.75 9.9141 9.4141 10.25 9 10.25Z"
      data-color="color-1"
      fill="currentColor"
    />
    <path
      d="M9 13.417C8.448 13.417 8 12.968 8 12.417C8 11.866 8.448 11.417 9 11.417C9.552 11.417 10 11.866 10 12.417C10 12.968 9.552 13.417 9 13.417Z"
      data-color="color-1"
      fill="currentColor"
    />
  </svg>
);

/**
 * Displays the Nucleo monitor Fill Duo glyph.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo monitor vector.
 * @see https://nucleoapp.com/license
 */
const Monitor = (props: React.ComponentProps<"svg">) => (
  <NucleoDuoToneIcon {...props} data-nucleo-icon="monitor" viewBox="0 0 18 18">
    <path
      clipRule="evenodd"
      d="m9.75,13h-1.5v1.5244c-1.1273.0732-2.0577.2997-2.7255.5103-.3951.1246-.6143.5458-.4898.9408.1246.3951.5458.6143.9408.4898.7052-.2224,1.7476-.4653,3.0245-.4653.7396,0,1.8063.0819,3.0248.4654.3951.1244.8162-.0951.9406-.4902.1243-.3951-.0951-.8162-.4902-.9406-1.0292-.3239-1.9642-.4605-2.7252-.5102v-1.5244Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      d="m3.75,2c-1.5192,0-2.75,1.2308-2.75,2.75v5.5c0,1.5192,1.2308,2.75,2.75,2.75h10.5c1.5192,0,2.75-1.2308,2.75-2.75v-5.5c0-1.5192-1.2308-2.75-2.75-2.75H3.75Z"
      data-color="color-2"
      opacity="0.4"
    />
  </NucleoDuoToneIcon>
);

/**
 * Displays the Nucleo moon-stars Fill Duo glyph.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo moon-stars vector.
 * @see https://nucleoapp.com/license
 */
const MoonStars = (props: React.ComponentProps<"svg">) => (
  <NucleoDuoToneIcon
    {...props}
    data-nucleo-icon="moon-stars"
    viewBox="0 0 18 18"
  >
    <path
      clipRule="evenodd"
      d="M8.54419 1.47446C8.70875 1.73227 8.70028 2.06417 8.52278 2.31324C7.88003 3.21522 7.5 4.31129 7.5 5.49999C7.5 8.53778 9.96222 11 13 11C14.0509 11 15.029 10.7009 15.8667 10.1868C16.1275 10.0267 16.4594 10.0412 16.7053 10.2233C16.9513 10.4054 17.0619 10.7186 16.9848 11.0148C16.0904 14.4535 12.9735 17 9.25 17C4.83179 17 1.25 13.4182 1.25 8.99999C1.25 5.08452 4.06262 1.83364 7.77437 1.14073C8.07502 1.0846 8.37963 1.21666 8.54419 1.47446Z"
      data-color="color-2"
      fillRule="evenodd"
      opacity="0.4"
    />
    <path
      d="M12.743 4.49198L11.797 4.17699L11.481 3.22999C11.379 2.92399 10.872 2.92399 10.77 3.22999L10.454 4.17699L9.508 4.49198C9.355 4.54298 9.25101 4.68598 9.25101 4.84798C9.25101 5.00998 9.355 5.15299 9.508 5.20399L10.454 5.51898L10.77 6.46599C10.821 6.61899 10.964 6.72199 11.125 6.72199C11.286 6.72199 11.43 6.61799 11.48 6.46599L11.796 5.51898L12.742 5.20399C12.895 5.15299 12.999 5.00998 12.999 4.84798C12.999 4.68598 12.896 4.54298 12.743 4.49198Z"
      data-color="color-1"
      fill="currentColor"
    />
    <path
      d="M14.25 8.5C14.664 8.5 15 8.1642 15 7.75C15 7.3358 14.664 7 14.25 7C13.836 7 13.5 7.3358 13.5 7.75C13.5 8.1642 13.836 8.5 14.25 8.5Z"
      data-color="color-1"
      fill="currentColor"
    />
  </NucleoDuoToneIcon>
);

/**
 * Displays the Nucleo person-door Fill Duo glyph.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo person-door vector.
 * @see https://nucleoapp.com/license
 */
const PersonDoor = (props: React.ComponentProps<"svg">) => (
  <NucleoDuoToneIcon
    {...props}
    data-nucleo-icon="person-door"
    viewBox="0 0 18 18"
  >
    <path
      clipRule="evenodd"
      d="M4.49825 3.00175C4.49825 1.89612 5.39496 1 6.5 1C7.60504 1 8.50175 1.89612 8.50175 3.00175C8.50175 4.10738 7.60504 5.0035 6.5 5.0035C5.39496 5.0035 4.49825 4.10738 4.49825 3.00175Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M6.23707 7.94427L4.4844 16.4022C4.40035 16.8078 4.00341 17.0684 3.59781 16.9844C3.19222 16.9003 2.93155 16.5034 3.0156 16.0978L4.85761 7.20882C5.05496 6.25952 6.21038 5.88598 6.92545 6.54081L8.47618 7.9605C8.55485 8.03272 8.67163 8.04671 8.76562 7.99446L10.3858 7.09438C10.7479 6.89322 11.2045 7.02368 11.4056 7.38577C11.6068 7.74786 11.4763 8.20446 11.1142 8.40562L9.49438 9.30554C8.83654 9.67111 8.01747 9.57528 7.4622 9.06587L6.23707 7.94427Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M3.951 7.6171C4.11718 7.99652 3.94432 8.43881 3.5649 8.60499L3.1859 8.77099C3.12543 8.79743 3.07637 8.84827 3.05221 8.91245L2.45119 10.5144C2.30569 10.9023 1.87336 11.0987 1.48554 10.9532C1.09772 10.8077 0.901277 10.3754 1.04677 9.98755L1.64779 8.38555C1.8136 7.94398 2.15084 7.58659 2.5841 7.39701L2.9631 7.23101C3.34252 7.06483 3.78481 7.23769 3.951 7.6171Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M6.32478 11.2453C6.5378 10.89 6.99847 10.7748 7.35371 10.9878L7.99164 11.3703C8.42925 11.6336 8.73245 12.0756 8.8168 12.5827L9.24081 15.1267C9.30891 15.5353 9.03289 15.9217 8.62432 15.9898C8.21574 16.0579 7.82932 15.7819 7.76122 15.3733L7.33721 12.8293C7.32548 12.7587 7.28278 12.6945 7.21868 12.6558L6.58228 12.2742C6.22704 12.0612 6.11176 11.6005 6.32478 11.2453Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      d="M10.6221 17C10.9256 16.6315 11.1324 16.186 11.2131 15.7064C11.3015 15.1811 11.1963 14.669 11.1777 14.5823L10.7896 12.254C10.6784 11.5863 10.3908 10.9722 9.96927 10.4675C10.0137 10.4455 10.0578 10.4225 10.1015 10.3982L11.7213 9.49831C12.6869 8.96189 13.0347 7.74428 12.4983 6.77872C12.0372 5.9486 11.0755 5.57739 10.2023 5.82627C10.0085 5.88152 9.82827 5.97264 9.65342 6.0713L8.78858 6.55177L8.03981 5.86627C9.05879 5.31738 9.75176 4.24096 9.75176 3.00175C9.75176 2.2467 9.49438 1.55184 9.06267 1H14.25C15.7692 1 17 2.23079 17 3.75V14.25C17 15.7692 15.7692 17 14.25 17H10.6221Z"
      data-color="color-2"
      opacity="0.4"
    />
  </NucleoDuoToneIcon>
);

/**
 * Displays the Nucleo sidebar-left-hide Fill Duo glyph.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo sidebar-left-hide vector.
 * @see https://nucleoapp.com/license
 */
const SidebarLeftHide = (props: React.ComponentProps<"svg">) => (
  <NucleoDuoToneIcon
    {...props}
    data-nucleo-icon="sidebar-left-hide"
    viewBox="0 0 18 18"
  >
    <path
      d="M14.2501 2H3.75012C2.23134 2 1.00012 3.23122 1.00012 4.75V13.25C1.00012 14.7688 2.23134 16 3.75012 16H14.2501C15.7689 16 17.0001 14.7688 17.0001 13.25V4.75C17.0001 3.23122 15.7689 2 14.2501 2Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      d="M7.00012 2H3.75012C2.23352 2 1.00012 3.2334 1.00012 4.75V13.25C1.00012 14.7666 2.23352 16 3.75012 16H7.00012V2Z"
      data-color="color-1"
      fill="currentColor"
    />
    <path
      d="M12.2501 12.25C12.0577 12.25 11.8662 12.1768 11.7197 12.0303L9.21975 9.5303C8.92675 9.2373 8.92675 8.76277 9.21975 8.46987L11.7197 5.96987C12.0127 5.67687 12.4874 5.67687 12.7803 5.96987C13.0732 6.26287 13.0733 6.7374 12.7803 7.0303L10.8106 9.00002L12.7803 10.9697C13.0733 11.2627 13.0733 11.7373 12.7803 12.0302C12.6338 12.1767 12.4425 12.25 12.2501 12.25Z"
      data-color="color-1"
      fill="currentColor"
    />
  </NucleoDuoToneIcon>
);

/**
 * Displays the Nucleo sidebar-left-show Fill Duo glyph.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo sidebar-left-show vector.
 * @see https://nucleoapp.com/license
 */
const SidebarLeftShow = (props: React.ComponentProps<"svg">) => (
  <NucleoDuoToneIcon
    {...props}
    data-nucleo-icon="sidebar-left-show"
    viewBox="0 0 18 18"
  >
    <path
      d="M14.2501 2H3.75012C2.23134 2 1.00012 3.23122 1.00012 4.75V13.25C1.00012 14.7688 2.23134 16 3.75012 16H14.2501C15.7689 16 17.0001 14.7688 17.0001 13.25V4.75C17.0001 3.23122 15.7689 2 14.2501 2Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      d="M7.00012 2H3.75012C2.23352 2 1.00012 3.2334 1.00012 4.75V13.25C1.00012 14.7666 2.23352 16 3.75012 16H7.00012V2Z"
      data-color="color-1"
      fill="currentColor"
    />
    <path
      d="M10.2501 12.25C10.0577 12.25 9.86625 12.1768 9.71975 12.0303C9.42675 11.7373 9.42675 11.2627 9.71975 10.9698L11.6895 9.00011L9.71975 7.03038C9.42675 6.73738 9.42675 6.26273 9.71975 5.96983C10.0128 5.67693 10.4874 5.67683 10.7803 5.96983L13.2803 8.46983C13.5733 8.76283 13.5733 9.23748 13.2803 9.53038L10.7803 12.0304C10.6338 12.1769 10.4425 12.25 10.2501 12.25Z"
      data-color="color-1"
      fill="currentColor"
    />
  </NucleoDuoToneIcon>
);

/**
 * Displays the Nucleo sun Fill Duo glyph.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo sun vector.
 * @see https://nucleoapp.com/license
 */
const Sun = (props: React.ComponentProps<"svg">) => (
  <NucleoDuoToneIcon {...props} data-nucleo-icon="sun" viewBox="0 0 18 18">
    <path
      clipRule="evenodd"
      d="M9 0.5C9.41421 0.5 9.75 0.835786 9.75 1.25V2.25C9.75 2.66421 9.41421 3 9 3C8.58579 3 8.25 2.66421 8.25 2.25V1.25C8.25 0.835786 8.58579 0.5 9 0.5Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M15.0103 2.98966C15.3032 3.28255 15.3032 3.75743 15.0103 4.05032L14.3033 4.75732C14.0104 5.05021 13.5356 5.05021 13.2427 4.75732C12.9498 4.46443 12.9498 3.98955 13.2427 3.69666L13.9497 2.98966C14.2426 2.69677 14.7174 2.69677 15.0103 2.98966Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M15 9C15 8.58579 15.3358 8.25 15.75 8.25H16.75C17.1642 8.25 17.5 8.58579 17.5 9C17.5 9.41421 17.1642 9.75 16.75 9.75H15.75C15.3358 9.75 15 9.41421 15 9Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M13.2427 13.2427C13.5356 12.9498 14.0104 12.9498 14.3033 13.2427L15.0103 13.9497C15.3032 14.2426 15.3032 14.7174 15.0103 15.0103C14.7174 15.3032 14.2426 15.3032 13.9497 15.0103L13.2427 14.3033C12.9498 14.0104 12.9498 13.5356 13.2427 13.2427Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M9 15C9.41421 15 9.75 15.3358 9.75 15.75V16.75C9.75 17.1642 9.41421 17.5 9 17.5C8.58579 17.5 8.25 17.1642 8.25 16.75V15.75C8.25 15.3358 8.58579 15 9 15Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M4.75735 13.2427C5.05024 13.5356 5.05024 14.0104 4.75735 14.3033L4.05035 15.0103C3.75746 15.3032 3.28258 15.3032 2.98969 15.0103C2.6968 14.7174 2.6968 14.2426 2.98969 13.9497L3.69669 13.2427C3.98958 12.9498 4.46446 12.9498 4.75735 13.2427Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M0.5 9C0.5 8.58579 0.835786 8.25 1.25 8.25H2.25C2.66421 8.25 3 8.58579 3 9C3 9.41421 2.66421 9.75 2.25 9.75H1.25C0.835786 9.75 0.5 9.41421 0.5 9Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M2.98969 2.98966C3.28258 2.69677 3.75746 2.69677 4.05035 2.98966L4.75735 3.69666C5.05024 3.98955 5.05024 4.46443 4.75735 4.75732C4.46446 5.05021 3.98958 5.05021 3.69669 4.75732L2.98969 4.05032C2.6968 3.75743 2.6968 3.28255 2.98969 2.98966Z"
      data-color="color-1"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      d="M9 13.25C11.3472 13.25 13.25 11.347 13.25 9C13.25 6.653 11.3472 4.75 9 4.75C6.6528 4.75 4.75 6.653 4.75 9C4.75 11.347 6.6528 13.25 9 13.25Z"
      data-color="color-2"
      opacity="0.4"
    />
  </NucleoDuoToneIcon>
);

/**
 * Displays the Nucleo user Fill Duo glyph.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo user vector.
 * @see https://nucleoapp.com/license
 */
const User = (props: React.ComponentProps<"svg">) => (
  <NucleoDuoToneIcon {...props} data-nucleo-icon="user" viewBox="0 0 18 18">
    <path
      d="M2.60518 13.1674C3.69058 10.7157 6.14168 9 8.99999 9C11.7634 9 14.1462 10.6037 15.2822 12.9257C15.3564 13.0774 15.4289 13.2326 15.4797 13.3894C15.8649 14.5805 15.1811 15.8552 13.9874 16.2313C12.705 16.6354 11.0072 17 8.99999 17C6.99283 17 5.29503 16.6354 4.01259 16.2313C2.74425 15.8317 2.05162 14.4186 2.60518 13.1674Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      d="M9 7.50049C10.7952 7.50049 12.25 6.04543 12.25 4.25049C12.25 2.45554 10.7952 1.00049 9 1.00049C7.20482 1.00049 5.75 2.45554 5.75 4.25049C5.75 6.04543 7.20482 7.50049 9 7.50049Z"
      data-color="color-1"
      fill="currentColor"
    />
  </NucleoDuoToneIcon>
);

/**
 * Displays the Nucleo user-settings Fill Duo glyph.
 *
 * @param props - The native SVG presentation applied by the icon consumer.
 * @returns The licensed Nucleo user-settings vector.
 * @see https://nucleoapp.com/license
 */
const UserSettings = (props: React.ComponentProps<"svg">) => (
  <NucleoDuoToneIcon
    {...props}
    data-nucleo-icon="user-settings"
    viewBox="0 0 18 18"
  >
    <path
      d="M17 13H16.3829C16.3243 12.795 16.2434 12.6014 16.1414 12.4189L16.578 11.9819C16.871 11.6889 16.871 11.2138 16.578 10.9214C16.2841 10.6279 15.8094 10.6289 15.5175 10.9214L15.0808 11.3584C14.8984 11.2565 14.7048 11.1756 14.4999 11.1171V10.5C14.4999 10.0859 14.164 9.75 13.7499 9.75C13.3358 9.75 12.9999 10.0859 12.9999 10.5V11.1171C12.795 11.1756 12.6015 11.2565 12.419 11.3584L11.9823 10.9214C11.6903 10.6289 11.2157 10.6279 10.9218 10.9214C10.6288 11.2139 10.6288 11.689 10.9218 11.9819L11.3584 12.4189C11.2564 12.6014 11.1755 12.795 11.1169 13H10.4998C10.0857 13 9.74982 13.3359 9.74982 13.75C9.74982 14.1641 10.0857 14.5 10.4998 14.5H11.1169C11.1755 14.705 11.2564 14.8986 11.3584 15.0811L10.9218 15.5181C10.6288 15.8111 10.6288 16.2862 10.9218 16.5786C11.0683 16.7251 11.2607 16.7983 11.4521 16.7983C11.6445 16.7983 11.8359 16.7251 11.9824 16.5786L12.4191 16.1416C12.6015 16.2435 12.7951 16.3244 13 16.3829V17C13 17.4141 13.3359 17.75 13.75 17.75C14.1641 17.75 14.5 17.4141 14.5 17V16.3829C14.7049 16.3244 14.8984 16.2435 15.0809 16.1416L15.5176 16.5786C15.6641 16.7251 15.8555 16.7983 16.0479 16.7983C16.2393 16.7983 16.4317 16.7251 16.5782 16.5786C16.8712 16.2861 16.8712 15.811 16.5782 15.5181L16.1416 15.0811C16.2436 14.8986 16.3245 14.705 16.3831 14.5H17.0002C17.4143 14.5 17.7502 14.1641 17.7502 13.75C17.7502 13.3359 17.4141 13 17 13ZM13.75 15C13.0605 15 12.5 14.4395 12.5 13.75C12.5 13.0605 13.0605 12.5 13.75 12.5C14.4395 12.5 15 13.0605 15 13.75C15 14.4395 14.4395 15 13.75 15Z"
      data-color="color-1"
      fill="currentColor"
    />
    <path
      d="M10.9163 9.26612C10.3076 9.09282 9.6648 9 8.99999 9C6.14167 9 3.69058 10.7157 2.60517 13.1674C2.05162 14.4186 2.74425 15.8317 4.01259 16.2313C5.29503 16.6354 6.99283 17 8.99999 17C9.13817 17 9.27488 16.9983 9.41009 16.9949C9.2093 16.5618 9.15395 16.078 9.24366 15.6169C8.64414 15.2127 8.24981 14.5274 8.24981 13.75C8.24981 12.9727 8.64413 12.2873 9.24364 11.8831C9.10556 11.1733 9.31151 10.4096 9.86206 9.85985C10.164 9.55833 10.5302 9.36046 10.9163 9.26612Z"
      data-color="color-2"
      opacity="0.4"
    />
    <path
      d="M9 7.50049C10.7952 7.50049 12.25 6.04543 12.25 4.25049C12.25 2.45554 10.7952 1.00049 9 1.00049C7.20482 1.00049 5.75 2.45554 5.75 4.25049C5.75 6.04543 7.20482 7.50049 9 7.50049Z"
      data-color="color-2"
      opacity="0.4"
    />
  </NucleoDuoToneIcon>
);

export {
  BadgeCheck,
  CircleInfo,
  Incognito,
  Monitor,
  MoonStars,
  OctagonWarning,
  PersonDoor,
  SidebarLeftHide,
  SidebarLeftShow,
  Sun,
  TriangleWarning,
  User,
  UserSettings,
};
