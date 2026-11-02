import { useSyncExternalStore } from 'react';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

import CyberAdvisories from './CyberAdvisories';
import CyberCatalogue from './CyberCatalogue';
import { MemberFindings, MemberIncidents, MemberReports } from './CyberMemberScreens';
import CyberMembers from './CyberMembers';
import CyberPortfolio from './CyberPortfolio';
import CyberServicePerformance from './CyberServicePerformance';
import { landingPathForRole, roleAllowsPath } from './CyberSidebar';
import IllustrativeBanner from './IllustrativeBanner';
import {
  CyberScopeProvider,
  currentCyberSearch,
  subscribeCyberScope,
  useCyberScope,
} from './cyberScope';
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

/**
 * Go to a path: history entry in the browser, notification either way.
 *
 * The scope travels with the navigation. The query string is where the role,
 * the facility and the focused member live, so walking the sidebar keeps the
 * screen deep-linkable and keeps the next screen in the same context.
 */
export function navigate(path: string): void {
  if (typeof window === 'undefined') {
    overriddenPath = path;
    emitPath();
    return;
  }
  if (overriddenPath !== null) overriddenPath = path;
  const [pathname, search] = splitPath(path);
  const target = `${pathname}${search === '' ? currentCyberSearch() : search}`;
  if (`${window.location.pathname}${window.location.search}` !== target) {
    window.history.pushState({}, '', target);
  }
  emitPath();
}

/** A link target split into its path and its own query string, if it has one. */
export function splitPath(target: string): [string, string] {
  const mark = target.indexOf('?');
  return mark === -1 ? [target, ''] : [target.slice(0, mark), target.slice(mark)];
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
  // The href carries the scope, so copying the link, opening it in a new tab
  // or reloading it all land on the same role, facility and member.
  const search = useSyncExternalStore(subscribeCyberScope, currentCyberSearch, currentCyberSearch);
  const [pathname, own] = splitPath(to);
  const href = own === '' ? `${pathname}${search}` : to;

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
      href={href}
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

/** Every screen some role's own navigation offers. */
const ROLE_SCREENS = [
  '/cyber/portfolio',
  '/cyber/members',
  '/cyber/service-performance',
  '/cyber/catalogue',
  '/cyber/advisories',
  '/cyber/member/incidents',
  '/cyber/member/findings',
  '/cyber/member/reports',
];

/**
 * The screen a role actually renders at a path.
 *
 * A path the current role's own navigation does not offer is not shown to it:
 * it lands on that role's first screen instead. That is what keeps a role
 * switch from leaving the previous role's screen — and the previous role's
 * rows — on display.
 */
export function screenPathForRole(role: string, path: string): string {
  if (path === '/cyber' || path === '/cyber/') return landingPathForRole(role);
  if (ROLE_SCREENS.includes(path) && !roleAllowsPath(role, path)) return landingPathForRole(role);
  return path;
}

/**
 * The /cyber route group: the shared scope, the banner every screen carries,
 * then the screen.
 *
 * The scope provider is mounted here as well as around the whole shell, so
 * every screen of the group reads the one scope the URL query holds. The
 * banner is rendered here, once, so no screen can be reached without it.
 */
export function CyberRoutes() {
  const path = usePath();
  const { scope } = useCyberScope();
  const resolved = screenPathForRole(scope.role, path);

  return (
    <CyberScopeProvider>
      <div
        className="cyber-group"
        data-testid="cyber-group"
        data-path={resolved}
        data-scope-role={scope.role}
      >
        <IllustrativeBanner />
        {/* Keyed by the scope: a role, facility or member change swaps the
            screen's content rather than merging into it. */}
        <Screen key={`${scope.role}|${scope.facilityId ?? ''}|${scope.memberId ?? ''}`} path={resolved} />
      </div>
    </CyberScopeProvider>
  );
}

export default CyberRoutes;
