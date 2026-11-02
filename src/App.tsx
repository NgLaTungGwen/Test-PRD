import { useEffect } from 'react';
import type { ChangeEvent } from 'react';

import CyberFindings from './CyberFindings';
import CyberOverview from './CyberOverview';
import CyberRoutes, { CyberLink, isCyberPath, navigate, usePath } from './CyberRoutes';
import { CyberScopeProvider as CyberPocScopeProvider } from './CyberScopeContext';
import CyberSidebar from './CyberSidebar';
import FacilitySelector from './FacilitySelector';
import { IllustrativeNotice } from './IllustrativeFigure';
import TierCatalogue from './TierCatalogue';
import { CYBER_ROLES } from './cyberData';
import {
  CYBER_SCOPE_ROLES,
  CyberScopeProvider,
  isMemberScope,
  normaliseRole,
  useCyberScope,
} from './cyberScope';
import type { CyberRole, CyberScope } from './cyberScope';
import {
  closeSearch,
  searchCyber,
  setSearchQuery,
  toggleSearch,
  useSearchUi,
} from './cyberSearch';
import './cyber.css';

/**
 * The cyber posture route group, mounted inside the existing shell.
 *
 * These are entries in the app's own navigation list, not a second sidebar:
 * the header, the sidebar and the content container the screens render into
 * are the ones that were already there.
 */
export const CYBER_POC_NAV = [
  { label: 'Cyber posture (POC)', path: '/cyber-poc' },
  { label: 'Cyber posture overview', path: '/cyber-poc/overview' },
  { label: 'Cyber findings', path: '/cyber-poc/findings' },
];

/** The app's own navigation, outside the cyber module. */
const APP_NAV = [{ label: 'Service tiers', path: '/' }, ...CYBER_POC_NAV];

/** Whether a path belongs to the cyber posture route group. */
export function isCyberPocPath(path: string): boolean {
  return path === '/cyber-poc' || path.startsWith('/cyber-poc/');
}

/**
 * The landing card of the cyber posture group: the existing card pattern,
 * with a link to each screen of the group.
 */
function CyberPocLanding() {
  return (
    <>
      <IllustrativeNotice />

      <section className="cyber-screen" data-testid="cyber-poc-landing">
        <h1>Cyber posture</h1>
        <p className="cyber-screen__lede">
          The cyber posture screens, inside the existing Innovation Pathway shell.
        </p>

        <div className="cyber-cards">
          {CYBER_POC_NAV.filter((item) => item.path !== '/cyber-poc').map((item) => (
            <article
              key={item.path}
              className="cyber-card"
              data-testid={`cyber-poc-landing-card-${item.path.split('/').pop() as string}`}
              aria-labelledby={`cyber-poc-landing-heading-${item.path.split('/').pop() as string}`}
            >
              <h2 id={`cyber-poc-landing-heading-${item.path.split('/').pop() as string}`}>
                {item.label}
              </h2>
              <dl className="cyber-card__facts">
                <div>
                  <dt>Screen</dt>
                  <dd>
                    <CyberLink to={item.path}>{item.label}</CyberLink>
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

/** One screen of the cyber posture group, by path. */
function CyberPocScreen({ path }: { path: string }) {
  switch (path) {
    case '/cyber-poc/overview':
      return <CyberOverview />;
    case '/cyber-poc/findings':
      return <CyberFindings />;
    default:
      return <CyberPocLanding />;
  }
}

/**
 * The cyber posture group: the shared scope, then the screen, inside the
 * existing content container. No new layout primitive is introduced — the
 * wrapper is the same `cyber-group` element the existing cyber routes use.
 */
function CyberPocRoutes() {
  const path = usePath();
  const { scope } = useCyberScope();
  const resolved = path === '/cyber-poc/' ? '/cyber-poc' : path;

  return (
    <CyberPocScopeProvider>
      <div className="cyber-group" data-testid="cyber-poc-group" data-path={resolved}>
        {/* Keyed by the scope: a role, facility or member change swaps the
            screen rather than merging into it, so no filter or list of the
            previous context can survive the switch. */}
        <CyberPocScreen key={scopeKey(scope)} path={resolved} />
      </div>
    </CyberPocScopeProvider>
  );
}

/** The scope, as one string: what a screen is keyed and re-rendered by. */
export function scopeKey(scope: CyberScope): string {
  return `${scope.role}|${scope.facilityId ?? ''}|${scope.memberId ?? ''}`;
}

/**
 * The header's role switcher: the three roles the shell shipped with.
 *
 * It reads and writes the same scope — the URL query — as the sidebar's
 * five-role switcher, so the two can never disagree. When the scope is in
 * one of the roles this requirement adds, that role is offered here too
 * rather than leaving the control showing nothing.
 */
function HeaderRoleSwitcher() {
  const { scope, setScope } = useCyberScope();
  const entry = CYBER_SCOPE_ROLES.find((candidate) => candidate.id === scope.role);
  const value = entry?.legacyId ?? scope.role;
  const extra = entry?.legacyId === undefined ? entry : undefined;

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    setScope({ role: (normaliseRole(event.target.value) ?? 'ProgramLead') as CyberRole });
  }

  return (
    <label className="shell-header__role" data-testid="role-switcher">
      <span className="shell-header__label">Role</span>
      <select aria-label="Role" data-testid="role-select" value={value} onChange={handleChange}>
        {CYBER_ROLES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
        {extra === undefined ? null : (
          <option key={extra.id} value={extra.id}>
            {extra.label}
          </option>
        )}
      </select>
    </label>
  );
}

/**
 * The ⌘K palette.
 *
 * It searches the cyber index — members, incidents, findings, reports and
 * advisories — alongside the app's own pages, within the active role and
 * facility scope.
 */
function SearchPalette() {
  const { open, query } = useSearchUi();
  const { role, facilityId } = useCyberScope();

  if (!open) return null;

  const needle = query.trim().toLowerCase();
  const pages = APP_NAV.filter((item) => needle !== '' && item.label.toLowerCase().includes(needle));
  const results = searchCyber(query, { role, facilityId });

  return (
    <div className="search-palette" role="dialog" aria-label="Search" data-testid="search-palette">
      <div className="search-palette__box">
        <input
          className="search-palette__input"
          type="search"
          aria-label="Search"
          placeholder="Search members, incidents, findings, reports, advisories…"
          autoFocus
          data-testid="search-input"
          value={query}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <button
          type="button"
          className="search-palette__close"
          data-testid="search-close"
          onClick={closeSearch}
        >
          Close
        </button>

        <ul className="search-palette__results" data-testid="search-results">
          {pages.map((page) => (
            <li key={page.path} className="search-palette__result" data-entity="page">
              <CyberLink to={page.path} onClick={closeSearch} data-testid={`search-page-${page.path}`}>
                <span className="search-palette__entity">page</span> {page.label}
              </CyberLink>
            </li>
          ))}
          {results.map((entry) => (
            <li
              key={`${entry.entity}-${entry.id}`}
              className="search-palette__result"
              data-entity={entry.entity}
              data-testid={`search-result-${entry.id}`}
            >
              <CyberLink to={entry.route} onClick={closeSearch}>
                <span className="search-palette__entity">{entry.entity}</span> {entry.label}
              </CyberLink>
            </li>
          ))}
        </ul>

        {needle !== '' && pages.length + results.length === 0 ? (
          <p data-testid="search-empty">Nothing matches “{query}”.</p>
        ) : null}
      </div>
    </div>
  );
}

/** The app shell: header, ⌘K search, role switcher, left sidebar and outlet. */
function Shell() {
  const path = usePath();
  const { scope, role } = useCyberScope();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggleSearch();
        return;
      }
      if (event.key === 'Escape') closeSearch();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      className="app-shell"
      data-testid="app-shell"
      data-role={role}
      data-scope-role={scope.role}
      data-scope-facility={scope.facilityId ?? 'none'}
      data-scope-member={scope.memberId ?? 'none'}
    >
      <header className="shell-header" data-testid="shell-header">
        <a
          className="shell-header__brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            navigate('/');
          }}
        >
          HealthPRO cyber services
        </a>

        <button
          type="button"
          className="shell-header__search"
          data-testid="search-trigger"
          onClick={toggleSearch}
        >
          Search <kbd>⌘K</kbd>
        </button>

        <HeaderRoleSwitcher />
        {isMemberScope(scope.role) ? <FacilitySelector /> : null}
      </header>

      <div className="app-shell__body">
        <aside className="sidebar" data-testid="sidebar">
          <nav className="sidebar__section" aria-label="Main">
            <h2 className="sidebar__heading">Service model</h2>
            <ul className="sidebar__items">
              {APP_NAV.map((item) => (
                <li key={item.path} className="sidebar__item">
                  <CyberLink to={item.path} className="sidebar__link">
                    {item.label}
                  </CyberLink>
                </li>
              ))}
            </ul>
          </nav>
          <CyberSidebar />
        </aside>

        <main className="app-shell__main" data-testid="app-main">
          {isCyberPocPath(path) ? (
            <CyberPocRoutes />
          ) : isCyberPath(path) ? (
            <CyberRoutes />
          ) : (
            <TierCatalogue />
          )}
        </main>
      </div>

      <SearchPalette />
    </div>
  );
}

export default function App() {
  return (
    <CyberScopeProvider>
      <Shell />
    </CyberScopeProvider>
  );
}
