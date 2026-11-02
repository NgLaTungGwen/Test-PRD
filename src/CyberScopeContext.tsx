import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import { cyberRoles, defaultCyberFacilityId, facilitiesForRole } from './cyberData';

/**
 * Who is looking at the cyber posture screens, and at which facility.
 *
 * The state lives in one module-level store rather than in component state so
 * that the overview screen, the findings screen and the filter controls all
 * read exactly the same value, and so a test can call the same setters the
 * controls call and re-render. The provider puts a snapshot of that store on
 * the React context; `useCyberScopeContext` reads it, falling back to the
 * store itself when a screen is rendered outside the provider.
 *
 * A fresh load starts as the first role in the fixture, scoped to the first
 * facility in the fixture.
 */
export type CyberScopeContextState = {
  role: string;
  facilityId: string;
};

export type CyberScopeContextValue = CyberScopeContextState & {
  setRole(role: string): void;
  setFacility(id: string): void;
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

let state: CyberScopeContextState = { ...INITIAL_CYBER_SCOPE };
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
export function getCyberScopeContextState(): CyberScopeContextState {
  return state;
}

/** Select a role. Re-scopes the facility when the new role cannot see it. */
export function setCyberScopeRole(role: string): void {
  const facilityId = facilityForRole(role, state.facilityId);
  if (state.role === role && state.facilityId === facilityId) return;
  state = { role, facilityId };
  emit();
}

/** Choose a facility. This is what the findings screen's selector calls. */
export function setCyberScopeFacility(id: string): void {
  if (state.facilityId === id) return;
  state = { ...state, facilityId: id };
  emit();
}

/** Put the scope back to a fresh load. Used by tests between cases. */
export function resetCyberScopeContext(): void {
  state = { ...INITIAL_CYBER_SCOPE };
  emit();
}

const ScopeContext = createContext<CyberScopeContextState | null>(null);

export type CyberScopeProviderProps = { children: ReactNode };

/**
 * Makes the cyber scope available to the tree. Mounted once, around the cyber
 * route group, so the screens and their filters cannot disagree.
 */
export function CyberScopeProvider({ children }: CyberScopeProviderProps) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getCyberScopeContextState,
    getCyberScopeContextState,
  );

  return <ScopeContext.Provider value={snapshot}>{children}</ScopeContext.Provider>;
}

/** The active role and facility, with the two setters the controls use. */
export function useCyberScopeContext(): CyberScopeContextValue {
  const fromContext = useContext(ScopeContext);
  const fallback = useSyncExternalStore(
    subscribe,
    getCyberScopeContextState,
    getCyberScopeContextState,
  );
  const current = fromContext ?? fallback;

  return {
    role: current.role,
    facilityId: current.facilityId,
    setRole: setCyberScopeRole,
    setFacility: setCyberScopeFacility,
  };
}

export default CyberScopeProvider;
