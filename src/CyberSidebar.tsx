import type { ChangeEvent } from 'react';

import { CyberLink } from './CyberRoutes';
import { CYBER_SCOPE_ROLES, setCyberScope, useCyberScope } from './cyberScope';
import type { CyberRole } from './cyberScope';
import { legacyRoleFor } from './cyberData';

export type SidebarItem = { label: string; path: string };

/** What the Program Lead sees, in order. Exactly these five, and nothing else. */
export const PROGRAM_LEAD_ITEMS: SidebarItem[] = [
  { label: 'Portfolio', path: '/cyber/portfolio' },
  { label: 'Members', path: '/cyber/members' },
  { label: 'Service performance', path: '/cyber/service-performance' },
  { label: 'Catalogue', path: '/cyber/catalogue' },
  { label: 'Sector advisories', path: '/cyber/advisories' },
];

/** The member executive's own item set: the incident and report view. */
export const MEMBER_EXEC_ITEMS: SidebarItem[] = [
  { label: 'Incidents', path: '/cyber/member/incidents' },
  { label: 'Reports', path: '/cyber/member/reports' },
];

/** The member IT lead's own item set: incidents, plus the remediation backlog. */
export const MEMBER_IT_ITEMS: SidebarItem[] = [
  { label: 'Incidents', path: '/cyber/member/incidents' },
  { label: 'Findings', path: '/cyber/member/findings' },
  { label: 'Reports', path: '/cyber/member/reports' },
];

/** The member operations crew works the backlog; it issues no reports. */
export const MEMBER_OPS_ITEMS: SidebarItem[] = [
  { label: 'Incidents', path: '/cyber/member/incidents' },
  { label: 'Findings', path: '/cyber/member/findings' },
];

/** The HealthPRO service desk: the programme, without the member directory. */
export const HEALTHPRO_ITEMS: SidebarItem[] = [
  { label: 'Portfolio', path: '/cyber/portfolio' },
  { label: 'Service performance', path: '/cyber/service-performance' },
  { label: 'Catalogue', path: '/cyber/catalogue' },
  { label: 'Sector advisories', path: '/cyber/advisories' },
];

/**
 * The "Cybersecurity" sidebar items a role may see.
 *
 * The role is the only input: a member role never sees a portfolio-wide item,
 * and a HealthPRO-side role never sees a facility-scoped one. Both spellings
 * are accepted — the five scope roles and the three the shipped shell used.
 */
export function sidebarItemsForRole(role: CyberRole | string): SidebarItem[] {
  if (role === 'MemberOps') return [...MEMBER_OPS_ITEMS];
  if (role === 'HealthPRO') return [...HEALTHPRO_ITEMS];

  const dataRole = legacyRoleFor(role);
  if (dataRole === 'member-exec') return [...MEMBER_EXEC_ITEMS];
  if (dataRole === 'member-it') return [...MEMBER_IT_ITEMS];
  return [...PROGRAM_LEAD_ITEMS];
}

/** The first screen of a role's section — where bare `/cyber` lands. */
export function landingPathForRole(role: CyberRole | string): string {
  return sidebarItemsForRole(role)[0]?.path ?? '/cyber/portfolio';
}

/** Whether a role's own navigation offers a screen. */
export function roleAllowsPath(role: CyberRole | string, path: string): boolean {
  return sidebarItemsForRole(role).some((item) => item.path === path);
}

/**
 * Select a role. This is what the role switcher's `onChange` calls, and what
 * a test drives when it switches role "through the control": the scope — and
 * with it the URL query — is rewritten, and the facility and the focused
 * member follow the new role rather than lingering from the old one.
 */
export function chooseRole(role: string): void {
  setCyberScope({ role: role as CyberRole });
}

/**
 * The role switcher: the five demo roles, driving the scope in the URL.
 *
 * It holds no selection of its own — the value comes from the scope, so a
 * deep link, a Back navigation or a switch made elsewhere leaves it in sync.
 */
export function RoleSwitcher() {
  const { scope } = useCyberScope();

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    chooseRole(event.target.value);
  }

  return (
    <label className="shell-header__role" data-testid="cyber-role-switcher">
      <span className="shell-header__label">Role</span>
      <select
        aria-label="Demo role"
        data-testid="cyber-role-select"
        value={scope.role}
        onChange={handleChange}
      >
        {CYBER_SCOPE_ROLES.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The "Cybersecurity" section of the existing left sidebar, filtered by role.
 */
export function CyberSidebar() {
  const { scope } = useCyberScope();
  const role = scope.role;
  const items = sidebarItemsForRole(role);

  return (
    <nav className="sidebar__section" aria-labelledby="cyber-sidebar-heading">
      <h2 className="sidebar__heading" id="cyber-sidebar-heading" data-testid="cyber-sidebar-heading">
        Cybersecurity
      </h2>
      <RoleSwitcher />
      <ul
        className="sidebar__items"
        data-testid="cyber-sidebar"
        data-role={legacyRoleFor(role)}
        data-scope-role={role}
      >
        {items.map((item) => (
          <li key={item.path} className="sidebar__item">
            <CyberLink
              to={item.path}
              className="sidebar__link"
              data-testid={`cyber-sidebar-item-${item.label.toLowerCase().replace(/\s+/gu, '-')}`}
            >
              {item.label}
            </CyberLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default CyberSidebar;
