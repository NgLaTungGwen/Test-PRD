import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import {
  cyberFacilityById,
  cyberRoles,
  defaultCyberFacilityId,
  facilitiesForRole,
  legacyRoleFor,
} from './cyberData';
import {
  CyberScopeProvider as ScopeStoreProvider,
  currentCyberSearch,
  getCyberScope,
  resetCyberScope,
  setCyberScope,
  subscribeCyberScope,
} from './cyberScope';
import type { CyberRole, CyberScope } from './cyberScope';

/**
 * Who is looking at the cyber posture screens, and at which facility.
 *
 * This is the posture screens' view of the one demo scope: the role, the
 * facility and the focused member all live in the URL query string, in
 * `cyberScope.tsx`, and this module only translates between that scope and
 * the posture fixture's own role and facility ids. There is no second copy
 * of the state, so a role or facility switch made anywhere — the header, the
 * sidebar, a deep link, the browser's Back button — reaches these screens
 * with no stale data left behind.
 *
 * A fresh load starts as the first role in the fixture, scoped to the first
 * facility that role may see.
 */
export type CyberScopeContextState = {
  role: string;
  facilityId: string;
};

export type CyberScopeContextValue = CyberScopeContextState & {
  /** The whole demo scope, for a screen that needs the member too. */
  scope: CyberScope;
  setRole(role: string): void;
  setFacility(id: string): void;
  setScope(patch: Partial<CyberScope>): void;
};

/** The role a fresh load starts in: the first role the fixture declares. */
export const INITIAL_CYBER_ROLE: string = cyberRoles()[0]?.id ?? 'program-lead';

/** The scope a fresh load starts in. */
export const INITIAL_CYBER_SCOPE: CyberScopeContextState = {
  role: INITIAL_CYBER_ROLE,
  facilityId: defaultCyberFacilityId(),
};

/**
 * The facility a role should hold after a switch: the one already chosen when
 * the new role may see it, and otherwise the first facility it may see. A role
 * can never be left scoped to a facility its own controls could not reach.
 */
export function facilityForRole(role: string, currentFacilityId?: string): string {
  const allowed = facilitiesForRole(role);
  if (currentFacilityId !== undefined && allowed.some((f) => f.id === currentFacilityId)) {
    return currentFacilityId;
  }
  return allowed[0]?.id ?? defaultCyberFacilityId();
}

/**
 * The posture screens' scope for a demo scope: the fixture role the scope
 * role reads as, and a facility of the posture fixture that role may see.
 */
export function postureScopeFor(scope: CyberScope): CyberScopeContextState {
  const role = legacyRoleFor(scope.role);
  const requested =
    scope.facilityId !== null && cyberFacilityById(scope.facilityId) !== undefined
      ? scope.facilityId
      : undefined;

  return { role, facilityId: facilityForRole(role, requested) };
}

/* The derivation is cached by query string so one query yields one stable
 * snapshot object and `useSyncExternalStore` has nothing to loop over. */
let cachedSearch: string | null = null;
let cachedState: CyberScopeContextState = { ...INITIAL_CYBER_SCOPE };

/** The current posture scope, outside React. */
export function getCyberScopeContextState(): CyberScopeContextState {
  const search = currentCyberSearch();
  if (cachedSearch !== search) {
    cachedSearch = search;
    cachedState = postureScopeFor(getCyberScope());
  }
  return cachedState;
}

/** Select a role. Re-scopes the facility when the new role cannot see it. */
export function setCyberScopeRole(role: string): void {
  setCyberScope({ role: role as CyberRole });
}

/** Choose a facility. This is what the findings screen's selector calls. */
export function setCyberScopeFacility(id: string): void {
  setCyberScope({ facilityId: id });
}

/** Put the scope back to a fresh load. Used by tests between cases. */
export function resetCyberScopeContext(): void {
  resetCyberScope();
}

const ScopeContext = createContext<CyberScopeContextState | null>(null);

export type CyberScopeProviderProps = { children: ReactNode };

/**
 * Makes the cyber scope available to the tree. Mounted around the cyber
 * route group, so the screens and their filters cannot disagree.
 */
export function CyberScopeProvider({ children }: CyberScopeProviderProps) {
  const snapshot = useSyncExternalStore(
    subscribeCyberScope,
    getCyberScopeContextState,
    getCyberScopeContextState,
  );

  return (
    <ScopeStoreProvider>
      <ScopeContext.Provider value={snapshot}>{children}</ScopeContext.Provider>
    </ScopeStoreProvider>
  );
}

/** The active role and facility, with the setters the controls use. */
export function useCyberScopeContext(): CyberScopeContextValue {
  const fromContext = useContext(ScopeContext);
  const fallback = useSyncExternalStore(
    subscribeCyberScope,
    getCyberScopeContextState,
    getCyberScopeContextState,
  );
  const current = fromContext ?? fallback;
  const scope = useSyncExternalStore(subscribeCyberScope, getCyberScope, getCyberScope);

  return {
    scope,
    role: current.role,
    facilityId: current.facilityId,
    setRole: setCyberScopeRole,
    setFacility: setCyberScopeFacility,
    setScope: setCyberScope,
  };
}

export default CyberScopeProvider;
