import { ILLUSTRATIVE_BANNER_TEXT } from './IllustrativeBanner';

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

export type IllustrativeNoticeProps = {
  /**
   * Whether the notice must survive a print or a PDF export. Default `true`:
   * the print rules in `cyberTokens.css` key off the `data-print` marker this
   * sets, keeping the notice on the page while the shell chrome collapses.
   */
  print?: boolean;
};

/**
 * The standing illustrative-data notice the cyber screens carry.
 *
 * It is the existing banner, markup for markup: the same `illustrative-banner`
 * class, the same wording, the same accessible name and the same
 * `data-illustrative` marker the rest of the prototype uses, so nothing new is
 * introduced to the component set — only the print marker is added.
 */
export function IllustrativeNotice({ print = true }: IllustrativeNoticeProps) {
  return (
    <div
      className="illustrative-banner"
      role="note"
      aria-label={ILLUSTRATIVE_BANNER_TEXT}
      data-illustrative="true"
      data-print={print ? 'true' : 'false'}
      data-testid="illustrative-banner"
    >
      <span className="illustrative-banner__text">{ILLUSTRATIVE_BANNER_TEXT}</span>
    </div>
  );
}

export default IllustrativeFigure;
