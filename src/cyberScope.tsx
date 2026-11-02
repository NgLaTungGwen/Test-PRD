import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import {
  CYBER_ROLES,
  DEFAULT_MEMBER_ID,
  activeMemberId,
  getDefaultFacilityId,
  getFacilityById,
  isMemberRole,
  roleLabel,
} from './cyberData';
import type { CyberRole } from './cyberData';

export type { CyberRole };
export { CYBER_ROLES, isMemberRole, roleLabel };

/**
 * Who is looking at the cyber module, and at which facility.
 *
 * The state lives in one module-level store rather than in component state so
 * that the header's role switcher, the header's facility selector, the sidebar
 * and every screen read exactly the same value, and so a test can drive the
 * same `setRole` / `setFacility` the header calls and re-render.
 */
export type CyberScopeState = {
  role: CyberRole;
  facilityId?: string;
};

export type CyberScope = CyberScopeState & {
  setRole(role: CyberRole): void;
  setFacility(id: string): void;
};

/** The scope a fresh load starts in: the Program Lead, no facility. */
export const INITIAL_CYBER_SCOPE: CyberScopeState = { role: 'program-lead', facilityId: undefined };

/**
 * The facility a role should hold after a switch.
 *
 * Switching between a program-lead and a member role resets the facility: the
 * Program Lead is not scoped to one, and a member role must land on a facility
 * of its own member rather than keep whatever was selected before.
 */
export function facilityAfterRoleChange(
  nextRole: CyberRole,
  currentFacilityId?: string,
): string | undefined {
  if (!isMemberRole(nextRole)) return undefined;

  const memberId = getFacilityById(currentFacilityId)?.memberId;
  if (memberId === undefined) return getDefaultFacilityId(DEFAULT_MEMBER_ID);
  return currentFacilityId;
}

/**
 * The scope a link can ask for: `?role=member-it&facility=fac-002`.
 *
 * It makes a cyber screen shareable in the state it was looked at, and it is
 * read once, on load — the header's switchers own the scope from then on. An
 * unknown role or a facility that is not the role's own is ignored rather than
 * obeyed, so a hand-edited link cannot put the shell in a scope its own
 * controls could not reach.
 */
export function scopeFromSearch(search: string): CyberScopeState {
  const params = new URLSearchParams(search);
  const requestedRole = params.get('role');
  const role = CYBER_ROLES.some((entry) => entry.id === requestedRole)
    ? (requestedRole as CyberRole)
    : INITIAL_CYBER_SCOPE.role;

  if (!isMemberRole(role)) return { role, facilityId: undefined };

  const requestedFacility = params.get('facility') ?? undefined;
  return { role, facilityId: facilityAfterRoleChange(role, requestedFacility) };
}

let state: CyberScopeState =
  typeof window === 'undefined'
    ? { ...INITIAL_CYBER_SCOPE }
    : scopeFromSearch(window.location.search);
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The current scope, outside React. */
export function getCyberScopeState(): CyberScopeState {
  return state;
}

/** Select a role. Resets the facility when crossing the program/member line. */
export function setCyberRole(role: CyberRole): void {
  const facilityId = facilityAfterRoleChange(role, state.facilityId);
  if (state.role === role && state.facilityId === facilityId) return;
  state = { role, facilityId };
  emit();
}

/** Choose a facility. This is what the header's facility selector calls. */
export function setCyberFacility(id: string): void {
  if (state.facilityId === id) return;
  state = { ...state, facilityId: id };
  emit();
}

/** Put the scope back to a fresh load. Used by tests between cases. */
export function resetCyberScope(): void {
  state = { ...INITIAL_CYBER_SCOPE };
  emit();
}

const CyberScopeContext = createContext<CyberScopeState | null>(null);

export type CyberScopeProviderProps = {
  children: ReactNode;
};

/**
 * Makes the scope available to the tree. Mounted once, around the whole app
 * shell, so the header, the sidebar and the screens cannot disagree.
 */
export function CyberScopeProvider({ children }: CyberScopeProviderProps) {
  const snapshot = useSyncExternalStore(subscribe, getCyberScopeState, getCyberScopeState);

  return <CyberScopeContext.Provider value={snapshot}>{children}</CyberScopeContext.Provider>;
}

/**
 * The active role and facility, with the two setters the header uses.
 *
 * Usable outside the provider as well — it falls back to the store — so a
 * screen rendered on its own in a test still sees the scope it was given.
 */
export function useCyberScope(): CyberScope {
  const fromContext = useContext(CyberScopeContext);
  const fallback = useSyncExternalStore(subscribe, getCyberScopeState, getCyberScopeState);
  const current = fromContext ?? fallback;

  return {
    role: current.role,
    facilityId: current.facilityId,
    setRole: setCyberRole,
    setFacility: setCyberFacility,
  };
}

/** The member the active scope acts for, or `undefined` for the Program Lead. */
export function useActiveMemberId(): string | undefined {
  const { role, facilityId } = useCyberScope();
  return activeMemberId(role, facilityId);
}
