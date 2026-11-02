import { useEffect } from 'react';
import type { ChangeEvent } from 'react';

import CyberRoutes, { CyberLink, isCyberPath, navigate, usePath } from './CyberRoutes';
import CyberSidebar from './CyberSidebar';
import FacilitySelector from './FacilitySelector';
import TierCatalogue from './TierCatalogue';
import { CYBER_ROLES, activeMemberId, isMemberRole } from './cyberData';
import type { CyberRole } from './cyberData';
import { CyberScopeProvider, useCyberScope } from './cyberScope';
import {
  closeSearch,
  searchCyber,
  setSearchQuery,
  toggleSearch,
  useSearchUi,
} from './cyberSearch';
import './cyber.css';

/** The app's own navigation, outside the cyber module. */
const APP_NAV = [{ label: 'Service tiers', path: '/' }];

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
          {isCyberPath(path) ? <CyberRoutes /> : <TierCatalogue />}
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
