import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

import {
  CYBER_ROLES,
  DEFAULT_MEMBER_ID,
  cyberFacilityById,
  getDefaultFacilityId,
  getFacilities,
  getFacilityById,
  getMemberById,
  isMemberRole,
  isMemberScopeRole,
  legacyRoleFor,
} from './cyberData';
import type { CyberRole as CyberDataRole } from './cyberData';

export type { CyberDataRole };

/* ------------------------------------------------------------------ *
 * The demo scope: who is looking at the cyber module, at which
 * facility, and with which member in focus — held in the URL query.
 *
 * The query string is the single source of truth. Nothing here keeps a
 * second copy of the scope: the store reads `window.location.search`
 * (or, where there is no browser, the search a test handed it), and the
 * setters write the query back through `pushState` / `replaceState` and
 * notify. That is what makes every screen deep-linkable — `?role=…&
 * facility=…&memberId=…` is the whole of the context — and what makes a
 * switch reach every screen at once: they all re-read the same query.
 * ------------------------------------------------------------------ */

/** The five roles the demo scope may be in. */
export type CyberRole = 'ProgramLead' | 'MemberExec' | 'MemberSecLead' | 'MemberOps' | 'HealthPRO';

/** The role, facility and member a screen renders in. */
export type CyberScope = {
  role: CyberRole;
  facilityId: string | null;
  memberId: string | null;
};

/** One role, as the role switcher lists it. */
export type CyberRoleEntry = {
  id: CyberRole;
  label: string;
  /** The id the shipped three-role switcher used, where there is one. */
  legacyId?: CyberDataRole;
};

/** The five scope roles, in the order the role switcher lists them. */
export const CYBER_SCOPE_ROLES: CyberRoleEntry[] = [
  { id: 'ProgramLead', label: 'HealthPRO Program Lead', legacyId: 'program-lead' },
  { id: 'MemberExec', label: 'Member Executive', legacyId: 'member-exec' },
  { id: 'MemberSecLead', label: 'Member Security Lead', legacyId: 'member-it' },
  { id: 'MemberOps', label: 'Member Operations', legacyId: undefined },
  { id: 'HealthPRO', label: 'HealthPRO Service Desk', legacyId: undefined },
];

/** The three roles this requirement adds to the shipped demo-role state. */
export const NEW_CYBER_ROLES: CyberRole[] = ['MemberSecLead', 'MemberOps', 'HealthPRO'];

/** The query parameter each part of the scope is carried in. */
export const SCOPE_QUERY_KEYS = { role: 'role', facility: 'facility', member: 'memberId' } as const;

/** The scope a load with no query lands in. */
export const DEFAULT_CYBER_SCOPE: CyberScope = {
  role: 'ProgramLead',
  facilityId: null,
  memberId: null,
};

/** The label the role switchers show for a role. */
export function scopeRoleLabel(role: CyberRole): string {
  return (
    CYBER_SCOPE_ROLES.find((entry) => entry.id === role)?.label ??
    CYBER_ROLES.find((entry) => entry.id === (role as unknown as CyberDataRole))?.label ??
    role
  );
}

/**
 * The scope role a query value names, or `null` when it names none.
 *
 * Both spellings are accepted — the five scope ids and the three ids the
 * shipped switcher used — so a link written before this requirement still
 * opens in the scope it asked for.
 */
export function normaliseRole(value: string | null | undefined): CyberRole | null {
  if (value === null || value === undefined || value === '') return null;

  const direct = CYBER_SCOPE_ROLES.find((entry) => entry.id === value);
  if (direct !== undefined) return direct.id;

  const legacy = CYBER_SCOPE_ROLES.find((entry) => entry.legacyId === value);
  if (legacy !== undefined) return legacy.id;

  const insensitive = CYBER_SCOPE_ROLES.find(
    (entry) => entry.id.toLowerCase() === value.toLowerCase(),
  );
  return insensitive?.id ?? null;
}

/** Whether a scope role acts for a member rather than for HealthPRO. */
export function isMemberScope(role: CyberRole): boolean {
  return isMemberScopeRole(role);
}

/** The data role a scope role reads the committed fixtures as. */
export function dataRoleFor(role: CyberRole | string): CyberDataRole {
  return legacyRoleFor(role);
}

/**
 * The facility a role should hold after a switch.
 *
 * Switching between a HealthPRO-side and a member-side role resets the
 * facility: a HealthPRO-side role is not scoped to one, and a member-side
 * role must land on a facility of its own member rather than keep whatever
 * was selected before.
 */
export function facilityAfterRoleChange(
  nextRole: CyberRole | CyberDataRole,
  currentFacilityId?: string,
): string | undefined {
  if (!isMemberScopeRole(nextRole)) return undefined;

  const memberId = getFacilityById(currentFacilityId)?.memberId;
  if (memberId === undefined) return getDefaultFacilityId(DEFAULT_MEMBER_ID);
  return currentFacilityId;
}

/**
 * A whole, coherent scope from three raw query values.
 *
 * Every value is validated against the committed fixtures and an unknown or
 * missing one falls back to a safe default, so a hand-edited link can never
 * put a screen in a scope its own controls could not reach:
 *
 * - an unknown role falls back to the Program Lead;
 * - a member-side role is always on one facility of one member, and a member
 *   named without a facility lands on that member's first facility;
 * - a facility that is not the focused member's re-points the member at the
 *   facility's owner, so the two can never disagree;
 * - an unknown facility or member is dropped rather than obeyed.
 */
export function resolveScope(raw: {
  role?: string | null;
  facilityId?: string | null;
  memberId?: string | null;
}): CyberScope {
  const role = normaliseRole(raw.role) ?? DEFAULT_CYBER_SCOPE.role;
  const shellFacility = getFacilityById(raw.facilityId ?? undefined);
  const member = raw.memberId == null ? undefined : getMemberById(raw.memberId);

  if (isMemberScopeRole(role)) {
    let facility = shellFacility;
    if (member !== undefined && facility?.memberId !== member.id) {
      facility = getFacilities(member.id)[0];
    }
    if (facility === undefined) facility = getFacilities(DEFAULT_MEMBER_ID)[0];

    return {
      role,
      facilityId: facility?.id ?? null,
      memberId: facility?.memberId ?? member?.id ?? DEFAULT_MEMBER_ID,
    };
  }

  // A HealthPRO-side role is not tied to a member's facility, but the posture
  // screens scope themselves to one of the posture fixture's own facilities,
  // so both namespaces are accepted here.
  const facilityId =
    shellFacility?.id ??
    (raw.facilityId != null ? cyberFacilityById(raw.facilityId)?.id ?? null : null);

  return { role, facilityId, memberId: member?.id ?? null };
}

/** The scope a query string asks for. */
export function scopeFromQuery(search: string): CyberScope {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  return resolveScope({
    role: params.get(SCOPE_QUERY_KEYS.role),
    facilityId: params.get(SCOPE_QUERY_KEYS.facility),
    memberId: params.get(SCOPE_QUERY_KEYS.member),
  });
}

/**
 * The query string a scope is written back as: `?role=…&facility=…&memberId=…`,
 * always in that order, with the parts the scope does not hold left out.
 */
export function scopeToQuery(scope: CyberScope): string {
  const params = new URLSearchParams();
  params.set(SCOPE_QUERY_KEYS.role, scope.role);
  if (scope.facilityId !== null) params.set(SCOPE_QUERY_KEYS.facility, scope.facilityId);
  if (scope.memberId !== null) params.set(SCOPE_QUERY_KEYS.member, scope.memberId);
  return `?${params.toString()}`;
}

/* ------------------------------------------------------------------ *
 * The store: the query string itself, read through the browser where
 * there is one and through a module-level value where there is not.
 * ------------------------------------------------------------------ */

let searchWithoutWindow = '';
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

/**
 * Hear about every scope change: a switcher, a deep link, Back or Forward.
 * The posture screens' adapter subscribes to this, so there is one store.
 */
export function subscribeCyberScope(listener: () => void): () => void {
  return subscribe(listener);
}

/** The query string the scope is currently read from. */
export function currentCyberSearch(): string {
  if (typeof window === 'undefined') return searchWithoutWindow;
  return window.location.search;
}

/**
 * Put the scope's query string, exactly as loading that URL would.
 *
 * `'push'` leaves a history entry, so Back returns to the previous scope;
 * `'replace'` rewrites the current one. Outside a browser the string is just
 * held, which is how a test loads a deep link.
 */
export function setCyberSearch(search: string, mode: 'push' | 'replace' = 'replace'): void {
  const normalised = search === '' || search === '?' ? '' : search.startsWith('?') ? search : `?${search}`;

  if (typeof window === 'undefined') {
    searchWithoutWindow = normalised;
    emit();
    return;
  }

  if (window.location.search !== normalised) {
    const url = `${window.location.pathname}${normalised}${window.location.hash}`;
    if (mode === 'push') window.history.pushState({}, '', url);
    else window.history.replaceState({}, '', url);
  }
  emit();
}

/** The current scope, outside React. */
export function getCyberScope(): CyberScope {
  return readScope();
}

/* The scope is derived from the query on every read; the last derivation is
 * cached so `useSyncExternalStore` keeps seeing one stable object for one
 * query string and React does not re-render for ever. */
let cachedSearch: string | null = null;
let cachedScope: CyberScope = { ...DEFAULT_CYBER_SCOPE };

function readScope(): CyberScope {
  const search = currentCyberSearch();
  if (cachedSearch !== search) {
    cachedSearch = search;
    cachedScope = scopeFromQuery(search);
  }
  return cachedScope;
}

/**
 * Change part of the scope.
 *
 * The patch is resolved against the fixtures before it is written, so the
 * URL never holds a scope a screen could not render:
 *
 * - switching to a HealthPRO-side role drops the facility, which that role is
 *   not scoped to, and keeps the member in focus;
 * - switching to a member-side role lands on a facility of the member already
 *   in focus, rather than on whatever facility was selected before;
 * - choosing a facility of another member carries that member with it, so no
 *   panel of the previous member can survive the change.
 */
export function setCyberScope(patch: Partial<CyberScope>, mode: 'push' | 'replace' = 'push'): void {
  const current = readScope();
  const role = patch.role ?? current.role;
  const roleChanged = role !== current.role;

  const facilityId =
    patch.facilityId !== undefined
      ? patch.facilityId
      : roleChanged && !isMemberScopeRole(role)
        ? null
        : current.facilityId;

  const chosenFacility =
    patch.facilityId === undefined ? undefined : getFacilityById(patch.facilityId ?? undefined);
  const memberId =
    patch.memberId !== undefined
      ? patch.memberId
      : chosenFacility !== undefined
        ? chosenFacility.memberId
        : current.memberId;

  setCyberSearch(scopeToQuery(resolveScope({ role, facilityId, memberId })), mode);
}

/** Put the scope back to a fresh load, query and all. Used between cases. */
export function resetCyberScope(): void {
  setCyberSearch('', 'replace');
}

if (typeof window !== 'undefined') {
  // Back and forward are scope changes like any other: the query is the state.
  window.addEventListener('popstate', emit);
}

/* ------------------------------------------------------------------ *
 * The legacy surface the shipped shell is written against.
 *
 * These read and write exactly the same query; they exist so the header's
 * three-role switcher, the search index and the screens that were written
 * before this requirement keep working unchanged.
 * ------------------------------------------------------------------ */

export type CyberScopeState = {
  role: CyberDataRole;
  facilityId?: string;
};

export type CyberScopeValue = CyberScopeState & {
  /** The whole scope, role, facility and focused member. */
  scope: CyberScope;
  /** The focused member, if the scope has one. */
  memberId?: string;
  setScope(patch: Partial<CyberScope>): void;
  setRole(role: CyberRole | CyberDataRole): void;
  setFacility(id: string): void;
};

/** The scope a fresh load starts in, in the shipped shell's own terms. */
export const INITIAL_CYBER_SCOPE: CyberScopeState = { role: 'program-lead', facilityId: undefined };

/** The current scope as the shipped shell reads it: a data role and a facility. */
export function getCyberScopeState(): CyberScopeState {
  const scope = readScope();
  return { role: dataRoleFor(scope.role), facilityId: scope.facilityId ?? undefined };
}

/**
 * The scope a link can ask for: `?role=member-it&facility=fac-002`.
 *
 * Kept in the shipped shell's terms — a data role and a facility — for the
 * callers written against it; `scopeFromQuery` is the whole scope.
 */
export function scopeFromSearch(search: string): CyberScopeState {
  const scope = scopeFromQuery(search);
  const role = dataRoleFor(scope.role);
  if (!isMemberRole(role)) return { role, facilityId: undefined };
  return { role, facilityId: facilityAfterRoleChange(scope.role, scope.facilityId ?? undefined) };
}

/** Select a role. Resets the facility when crossing the HealthPRO/member line. */
export function setCyberRole(role: CyberRole | CyberDataRole): void {
  setCyberScope({ role: normaliseRole(role) ?? DEFAULT_CYBER_SCOPE.role });
}

/** Choose a facility. This is what the header's facility selector calls. */
export function setCyberFacility(id: string): void {
  setCyberScope({ facilityId: id });
}

/** Focus one member. This is what a member link on a portfolio screen calls. */
export function setCyberMember(id: string | null): void {
  setCyberScope({ memberId: id });
}

const CyberScopeReactContext = createContext<CyberScope | null>(null);

export type CyberScopeProviderProps = {
  children: ReactNode;
};

/**
 * Makes the scope available to the tree. Mounted around the app shell and
 * around the cyber route group, so the header, the sidebar and the screens
 * cannot disagree: both read the same query.
 */
export function CyberScopeProvider({ children }: CyberScopeProviderProps) {
  const snapshot = useSyncExternalStore(subscribe, readScope, readScope);

  return (
    <CyberScopeReactContext.Provider value={snapshot}>{children}</CyberScopeReactContext.Provider>
  );
}

/**
 * The active scope, with the setter every control writes through.
 *
 * `scope` and `setScope` are the whole of it; `role`, `facilityId`,
 * `memberId`, `setRole` and `setFacility` are the shipped shell's view of the
 * same query, kept so the screens written before this requirement still read
 * the one scope rather than a copy of it.
 *
 * Usable outside the provider as well — it falls back to the store — so a
 * screen rendered on its own in a test still sees the scope it was given.
 */
export function useCyberScope(): CyberScopeValue {
  const fromContext = useContext(CyberScopeReactContext);
  const fallback = useSyncExternalStore(subscribe, readScope, readScope);
  const scope = fromContext ?? fallback;

  return {
    scope,
    role: dataRoleFor(scope.role),
    facilityId: scope.facilityId ?? undefined,
    memberId: scope.memberId ?? undefined,
    setScope: setCyberScope,
    setRole: setCyberRole,
    setFacility: setCyberFacility,
  };
}
