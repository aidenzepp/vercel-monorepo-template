/**
 * The stable label rendered by the fixture component.
 */
const label = "Documented";

type DocumentedProps = {
  suffix: string;
};

/**
 * Formats a numeric fixture value.
 *
 * @param value - The numeric value to format.
 * @returns The formatted numeric value.
 */
export function formatValue(value: number): string;

/**
 * Formats a text fixture value.
 *
 * @param value - The text value to format.
 * @returns The formatted text value.
 */
export function formatValue(value: string): string;

export function formatValue(value: number | string): string {
  return String(value);
}

/**
 * Renders a fixture whose declarations satisfy the documentation contract.
 *
 * @param props - Display values owned by the fixture caller.
 * @param props.suffix - Text appended to the stable label.
 * @returns The documented fixture element.
 */
export function Documented({ suffix }: DocumentedProps) {
  /**
   * Joins the fixture label and caller-provided suffix.
   *
   * @param value - The suffix appended to the fixture label.
   * @returns The completed fixture label.
   */
  const formatLabel = (value: string) => `${label} ${value}`;

  return <div>{formatLabel(formatValue(suffix))}</div>;
}
