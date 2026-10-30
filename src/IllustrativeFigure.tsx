export type IllustrativeFigureProps = {
  value: number | string;
  unit?: string;
  description?: string;
};

export const ILLUSTRATIVE_LABEL = 'illustrative';

/**
 * The only way a numeric tier figure reaches the screen.
 *
 * It renders the value (with an optional unit) and always emits a visible
 * "illustrative" label next to it, plus a matching accessible name, so no
 * caller can put a figure on screen without the label.
 */
export function IllustrativeFigure({ value, unit, description }: IllustrativeFigureProps) {
  const rendered = unit ? `${value} ${unit}` : `${value}`;
  const accessibleName = description
    ? `${description}: ${rendered} (${ILLUSTRATIVE_LABEL})`
    : `${rendered} (${ILLUSTRATIVE_LABEL})`;

  return (
    <span
      className="illustrative-figure"
      role="group"
      aria-label={accessibleName}
      data-illustrative="true"
      data-testid="illustrative-figure"
    >
      <span className="illustrative-figure__value">{rendered}</span>{' '}
      <span className="illustrative-figure__label">{ILLUSTRATIVE_LABEL}</span>
    </span>
  );
}

export default IllustrativeFigure;
