import type { ReactNode } from 'react';

import { CyberLink } from './CyberRoutes';
import { CyberScopeProvider } from './CyberScopeContext';
import { StandingIllustrativeBanner } from './IllustrativeBanner';

/**
 * The wrapper the cyber route group is mounted in.
 *
 * It does two things, and both of them are the point of this requirement:
 *
 * 1. it mounts the cyber scope, so every screen in the group and every
 *    control that scopes it read the same role and facility;
 * 2. it renders the standing illustrative banner once, above whatever screen
 *    the group routes to, so no cyber screen can be reached without it — a
 *    screen cannot opt out, because the screen is the child here.
 *
 * It renders inside the existing app shell's content container, so the
 * header, the sidebar and the spacing around it are the ones already there.
 */

/** Where the report export preview lives. */
export const CYBER_EXPORT_PATH = '/cyber-poc/export';

/** The label on the control that hands the screen to the browser's PDF export. */
export const CYBER_EXPORT_LABEL = 'Export to PDF';

/**
 * Hands the current screen to the browser's print / PDF export.
 *
 * The prototype has no PDF engine of its own: an export is the print
 * rendering of the screen, which is why `print.css` is what has to keep the
 * banner on the page. Safe to call where there is no window (a test rendering
 * the screen to static markup), where it does nothing.
 */
export function exportToPdf(): void {
  if (typeof window === 'undefined' || typeof window.print !== 'function') return;
  window.print();
}

export type CyberShellProps = { children: ReactNode };

export function CyberShell({ children }: CyberShellProps) {
  return (
    <CyberScopeProvider>
      <div data-testid="cyber-shell">
        <StandingIllustrativeBanner />

        <div className="cyber-cards" data-testid="cyber-shell-actions" data-print="hide">
          <CyberLink
            to={CYBER_EXPORT_PATH}
            className="shell-header__search"
            data-testid="cyber-export-link"
          >
            Report export (PDF)
          </CyberLink>
          <button
            type="button"
            className="shell-header__search"
            data-testid="cyber-export-print"
            onClick={exportToPdf}
          >
            {CYBER_EXPORT_LABEL}
          </button>
        </div>

        {children}
      </div>
    </CyberScopeProvider>
  );
}

export default CyberShell;
