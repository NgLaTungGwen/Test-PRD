import { useEffect } from 'react';
import type { ChangeEvent } from 'react';

import CyberFindings from './CyberFindings';
import CyberOverview from './CyberOverview';
import CyberRoutes, { CyberLink, isCyberPath, navigate, usePath } from './CyberRoutes';
import { useCyberScopeContext } from './CyberScopeContext';
import CyberShell, { CYBER_EXPORT_LABEL, CYBER_EXPORT_PATH, exportToPdf } from './CyberShell';
import CyberSidebar from './CyberSidebar';
import FacilitySelector from './FacilitySelector';
import { StandingIllustrativeBanner } from './IllustrativeBanner';
import { IllustrativeNotice } from './IllustrativeFigure';
import TierCatalogue from './TierCatalogue';
import { CYBER_ROLES, activeMemberId, isMemberRole } from './cyberData';
import type { CyberRole } from './cyberData';
import { selectScopedFixtures } from './cyberFixtures';
import { CyberScopeProvider, useCyberScope } from './cyberScope';
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

/**
 * The report export: the findings report for the facility in scope, as the
 * document the browser hands to its PDF writer.
 *
 * The prototype has no PDF engine of its own, so an export is the print
 * rendering of this screen. The banner is therefore part of the exported
 * document itself — it sits in the report table's repeating header row, which
 * a print engine repeats at the top of every page the report spans — and
 * `print.css` keeps it rendered and unbroken when the page is printed.
 */
function CyberPocExport() {
  const { role, facilityId } = useCyberScopeContext();
  const { findings, facilities } = selectScopedFixtures(role, facilityId);
  const facility = facilities.find((entry) => entry.id === facilityId) ?? facilities[0];
  const facilityName = facility?.name ?? 'no facility in scope';

  return (
    <section
      className="cyber-screen"
      data-testid="cyber-poc-export"
      data-facility={facility?.id}
      data-rows={findings.length}
    >
      <h1>Cyber posture report — PDF export</h1>
      <p className="cyber-screen__lede" data-testid="cyber-poc-export-lede">
        The report for {facilityName}, as it is exported. The illustrative banner is part of the
        exported document, so a printed or saved PDF can never be mistaken for live data.
      </p>

      <div className="cyber-cards" data-testid="cyber-export-actions" data-print="hide">
        <button
          type="button"
          className="shell-header__search"
          data-testid="cyber-export-generate"
          onClick={exportToPdf}
        >
          {CYBER_EXPORT_LABEL}
        </button>
      </div>

      <table className="cyber-table" data-testid="cyber-export-document" data-export="pdf">
        <caption>Findings at {facilityName} — illustrative report</caption>
        <thead>
          <tr data-testid="cyber-export-banner-row">
            <th scope="col" colSpan={4}>
              <StandingIllustrativeBanner />
            </th>
          </tr>
          <tr>
            <th scope="col">Finding</th>
            <th scope="col">Owner</th>
            <th scope="col">Grade</th>
            <th scope="col">Priority</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <tr key={finding.id} data-testid={`cyber-export-row-${finding.id}`}>
              <th scope="row">{finding.title}</th>
              <td>{finding.owner ?? '—'}</td>
              <td data-grade={finding.grade}>{finding.grade}</td>
              <td data-priority={finding.priority}>{finding.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** One screen of the cyber posture group, by path. */
function CyberPocScreen({ path }: { path: string }) {
  switch (path) {
    case '/cyber-poc/overview':
      return <CyberOverview />;
    case '/cyber-poc/findings':
      return <CyberFindings />;
    case CYBER_EXPORT_PATH:
      return <CyberPocExport />;
    default:
      return <CyberPocLanding />;
  }
}

/**
 * The cyber posture group: the screen, inside the existing content container.
 * No new layout primitive is introduced — the wrapper is the same
 * `cyber-group` element the existing cyber routes use. The shared scope and
 * the standing illustrative banner come from `CyberShell`, which the shell
 * mounts this group inside.
 */
function CyberPocRoutes() {
  const path = usePath();
  const resolved = path === '/cyber-poc/' ? '/cyber-poc' : path;

  return (
    <div className="cyber-group" data-testid="cyber-poc-group" data-path={resolved}>
      <CyberPocScreen path={resolved} />
    </div>
  );
}

/** The header's role switcher: the three demo roles, driving the cyber scope. */
function RoleSwitcher() {
  const { role, setRole } = useCyberScope();

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    setRole(event.target.value as CyberRole);
  }

  return (
    <label className="shell-header__role" data-testid="role-switcher">
      <span className="shell-header__label">Role</span>
      <select aria-label="Role" data-testid="role-select" value={role} onChange={handleChange}>
        {CYBER_ROLES.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.label}
          </option>
        ))}
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
  const { role, facilityId } = useCyberScope();
  const memberId = activeMemberId(role, facilityId);

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
    <div className="app-shell" data-testid="app-shell" data-role={role}>
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

        <RoleSwitcher />
        {isMemberRole(role) && memberId !== undefined ? (
          <FacilitySelector memberId={memberId} />
        ) : null}
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
            <CyberShell>
              <CyberPocRoutes />
            </CyberShell>
          ) : isCyberPath(path) ? (
            <CyberShell>
              <CyberRoutes />
            </CyberShell>
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
