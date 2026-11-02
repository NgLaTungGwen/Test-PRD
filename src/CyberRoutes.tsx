import { useSyncExternalStore } from 'react';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

import CyberAdvisories from './CyberAdvisories';
import CyberCatalogue from './CyberCatalogue';
import { MemberFindings, MemberIncidents, MemberReports } from './CyberMemberScreens';
import CyberMembers from './CyberMembers';
import CyberPortfolio from './CyberPortfolio';
import CyberServicePerformance from './CyberServicePerformance';
import { landingPathForRole } from './CyberSidebar';
import IllustrativeBanner from './IllustrativeBanner';
import { useCyberScope } from './cyberScope';
import './cyber.css';

/* ------------------------------------------------------------------ *
 * The smallest router that serves the /cyber group.
 *
 * The app shell is one page: the header, the ⌘K search, the role switcher and
 * the sidebar stay mounted and only the outlet below them changes, so choosing
 * a facility and then walking the sidebar keeps the scope. Links are real
 * anchors with real hrefs — a deep link to /cyber/members works on a cold load
 * through the dev server's SPA fallback — and a plain click is handled in the
 * page instead of reloading it.
 * ------------------------------------------------------------------ */

const pathListeners = new Set<() => void>();
let overriddenPath: string | null = null;

function emitPath(): void {
  for (const listener of [...pathListeners]) listener();
}

function subscribePath(listener: () => void): () => void {
  pathListeners.add(listener);
  return () => {
    pathListeners.delete(listener);
  };
}

/** The path the shell is showing. `/` when there is no browser to ask. */
export function currentPath(): string {
  if (overriddenPath !== null) return overriddenPath;
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

/**
 * Put the shell on a path without a browser — how a test renders a screen, and
 * the only way the path moves when `window` is absent.
 */
export function setCurrentPath(path: string | null): void {
  overriddenPath = path;
  emitPath();
}

/** Go to a path: history entry in the browser, notification either way. */
export function navigate(path: string): void {
  if (typeof window === 'undefined') {
    overriddenPath = path;
    emitPath();
    return;
  }
  if (overriddenPath !== null) overriddenPath = path;
  if (window.location.pathname !== path) window.history.pushState({}, '', path);
  emitPath();
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', emitPath);
}

/** The current path, re-rendering the caller when it changes. */
export function usePath(): string {
  return useSyncExternalStore(subscribePath, currentPath, currentPath);
}

export type CyberLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  children: ReactNode;
};

/** An in-page link: a real href, navigated without a reload on a plain click. */
export function CyberLink({ to, children, onClick, ...rest }: CyberLinkProps) {
  const path = usePath();

  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    navigate(to);
  }

  return (
    <a
      {...rest}
      href={to}
      aria-current={path === to ? 'page' : undefined}
      data-active={path === to ? 'true' : undefined}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

/** Whether a path belongs to the cyber route group. */
export function isCyberPath(path: string): boolean {
  return path === '/cyber' || path.startsWith('/cyber/');
}

function Screen({ path }: { path: string }) {
  switch (path) {
    case '/cyber/portfolio':
      return <CyberPortfolio />;
    case '/cyber/members':
      return <CyberMembers />;
    case '/cyber/service-performance':
      return <CyberServicePerformance />;
    case '/cyber/catalogue':
      return <CyberCatalogue />;
    case '/cyber/advisories':
      return <CyberAdvisories />;
    case '/cyber/member/incidents':
      return <MemberIncidents />;
    case '/cyber/member/findings':
      return <MemberFindings />;
    case '/cyber/member/reports':
      return <MemberReports />;
    default:
      return (
        <section className="cyber-screen" data-testid="cyber-not-found">
          <h1>Screen not found</h1>
          <p>No cyber screen answers {path}.</p>
        </section>
      );
  }
}

/**
 * The /cyber route group: the banner every screen carries, then the screen.
 *
 * The banner is rendered here, once, so no screen can be reached without it.
 */
export function CyberRoutes() {
  const path = usePath();
  const { role } = useCyberScope();
  const resolved = path === '/cyber' || path === '/cyber/' ? landingPathForRole(role) : path;

  return (
    <div className="cyber-group" data-testid="cyber-group" data-path={resolved}>
      <IllustrativeBanner />
      <Screen path={resolved} />
    </div>
  );
}

export default CyberRoutes;
