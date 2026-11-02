export type IllustrativeBannerProps = {
  text?: string;
};

/** The wording every cyber screen carries, top of page and on paper. */
export const ILLUSTRATIVE_BANNER_TEXT = 'Illustrative / Draft, pending HealthPRO review';

/**
 * The standing notice on every /cyber screen.
 *
 * It follows the conventions of `IllustrativeFigure`: a visible label, an
 * accessible name that says the same thing, and a `data-illustrative` marker so
 * nothing can ship a cyber screen without it. `cyber.css` keeps it on the page
 * when the screen is printed.
 */
export function IllustrativeBanner({ text = ILLUSTRATIVE_BANNER_TEXT }: IllustrativeBannerProps) {
  return (
    <div
      className="illustrative-banner"
      role="note"
      aria-label={text}
      data-illustrative="true"
      data-testid="illustrative-banner"
    >
      <span className="illustrative-banner__text">{text}</span>
    </div>
  );
}

export default IllustrativeBanner;
