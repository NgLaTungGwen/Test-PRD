import './IllustrativeBanner.css';

export type IllustrativeBannerProps = {
  text?: string;
};

/** The wording every cyber screen carries, top of page and on paper. */
export const ILLUSTRATIVE_BANNER_TEXT = 'Illustrative / Draft, pending HealthPRO review';

/**
 * The class the print path keys off.
 *
 * `src/print.css` keeps every element carrying it rendered, unclipped and
 * unbroken under `@media print`, so the banner survives a PDF export instead
 * of being collapsed with the rest of the shell chrome.
 */
export type PrintBannerClass = 'illustrative-banner--print';

export const PRINT_BANNER_CLASS: PrintBannerClass = 'illustrative-banner--print';

/** The class that makes the standing banner a strip at the top of the shell. */
export const STANDING_BANNER_CLASS = 'illustrative-banner--standing';

/** The marker the standing banner carries, so a screen cannot ship without it. */
export const STANDING_BANNER_TEST_ID = 'standing-illustrative-banner';

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

export type StandingIllustrativeBannerProps = {
  /** Extra classes, appended after the standing and print classes. */
  className?: string;
};

/**
 * The persistent illustrative banner.
 *
 * `CyberShell` renders it once, above every cyber screen, and the exported
 * report renders it inside the document it prints. It is the same wording,
 * the same accessible name and the same `data-illustrative` marker as the
 * in-page notice — what it adds is the standing strip styling and
 * `PRINT_BANNER_CLASS`, which is what carries it into the PDF.
 */
export function StandingIllustrativeBanner({ className }: StandingIllustrativeBannerProps) {
  const classes = ['illustrative-banner', STANDING_BANNER_CLASS, PRINT_BANNER_CLASS];
  if (className !== undefined && className !== '') classes.push(className);

  return (
    <div
      className={classes.join(' ')}
      role="note"
      aria-label={ILLUSTRATIVE_BANNER_TEXT}
      data-illustrative="true"
      data-print="true"
      data-testid={STANDING_BANNER_TEST_ID}
    >
      <span className="illustrative-banner__text">{ILLUSTRATIVE_BANNER_TEXT}</span>
    </div>
  );
}

export default IllustrativeBanner;
