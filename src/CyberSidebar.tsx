import { CyberLink } from './CyberRoutes';
import { useCyberScope } from './cyberScope';
import type { CyberRole } from './cyberData';

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

/**
 * The "Cybersecurity" sidebar items a role may see.
 *
 * The role is the only input: a member role never sees a portfolio-wide item,
 * and the Program Lead never sees a facility-scoped one.
 */
export function sidebarItemsForRole(role: CyberRole): SidebarItem[] {
  if (role === 'member-exec') return [...MEMBER_EXEC_ITEMS];
  if (role === 'member-it') return [...MEMBER_IT_ITEMS];
  return [...PROGRAM_LEAD_ITEMS];
}

/** The first screen of a role's section — where bare `/cyber` lands. */
export function landingPathForRole(role: CyberRole): string {
  return sidebarItemsForRole(role)[0]?.path ?? '/cyber/portfolio';
}

/**
 * The "Cybersecurity" section of the existing left sidebar, filtered by role.
 */
export function CyberSidebar() {
  const { role } = useCyberScope();
  const items = sidebarItemsForRole(role);

  return (
    <nav className="sidebar__section" aria-labelledby="cyber-sidebar-heading">
      <h2 className="sidebar__heading" id="cyber-sidebar-heading" data-testid="cyber-sidebar-heading">
        Cybersecurity
      </h2>
      <ul className="sidebar__items" data-testid="cyber-sidebar" data-role={role}>
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
