import { useSyncExternalStore } from 'react';

import { getFacilityById, getMemberById, selectByScope } from './cyberData';
import type { CyberRole } from './cyberData';

/** What a cyber entity looks like once it is in the ⌘K index. */
export type CyberSearchEntry = {
  id: string;
  label: string;
  entity: 'member' | 'incident' | 'finding' | 'report' | 'advisory';
  route: string;
};

export type CyberSearchScope = { role: CyberRole; facilityId?: string };

/** The entity kinds the index covers, in the order results are grouped. */
export const CYBER_SEARCH_ENTITIES: CyberSearchEntry['entity'][] = [
  'member',
  'incident',
  'finding',
  'report',
  'advisory',
];

/**
 * The flat index over everything a scope may see.
 *
 * It is built from `selectByScope`, the same read path the screens use, so the
 * search can never offer a member role a record its screens would not show.
 */
export function buildCyberIndex(scope: CyberSearchScope): CyberSearchEntry[] {
  const { members, incidents, findings, reports, advisories } = selectByScope(
    scope.role,
    scope.facilityId,
  );
  const facilityOf = (facilityId: string): string => getFacilityById(facilityId)?.name ?? '';
  const memberOf = (memberId: string): string => getMemberById(memberId)?.name ?? memberId;

  return [
    ...members.map((member) => ({
      id: member.id,
      label: `${member.name} — ${member.type}, ${member.province}`,
      entity: 'member' as const,
      route: '/cyber/members',
    })),
    ...incidents.map((incident) => ({
      id: incident.id,
      label: `${incident.id} — ${incident.severity} incident, ${memberOf(incident.memberId)}, ${facilityOf(
        incident.facilityId,
      )}`,
      entity: 'incident' as const,
      route: '/cyber/member/incidents',
    })),
    ...findings.map((finding) => ({
      id: finding.id,
      label: `${finding.id} — ${finding.title} (${finding.severity}), ${facilityOf(finding.facilityId)}`,
      entity: 'finding' as const,
      route: '/cyber/member/findings',
    })),
    ...reports.map((report) => ({
      id: report.id,
      label: `${report.id} — ${report.title}`,
      entity: 'report' as const,
      route: '/cyber/member/reports',
    })),
    ...advisories.map((advisory) => ({
      id: advisory.id,
      label: `${advisory.id} — ${advisory.title} (${advisory.severity}) — affects ${advisory.affectedMemberIds
        .map(memberOf)
        .join(', ')}`,
      entity: 'advisory' as const,
      route: '/cyber/advisories',
    })),
  ];
}

/** How many results the ⌘K palette shows at once. */
export const CYBER_SEARCH_LIMIT = 40;

/**
 * Case-insensitive substring match over the index for a scope.
 *
 * An empty query matches nothing: the palette opens quiet rather than dumping
 * the whole data set on the screen.
 */
export function searchCyber(q: string, scope: CyberSearchScope): CyberSearchEntry[] {
  const needle = q.trim().toLowerCase();
  if (needle === '') return [];

  return buildCyberIndex(scope)
    .filter((entry) => `${entry.id} ${entry.label}`.toLowerCase().includes(needle))
    .slice(0, CYBER_SEARCH_LIMIT);
}

/* ------------------------------------------------------------------ *
 * The ⌘K palette's own state.
 *
 * It lives beside the index, in one module-level store, so the header's
 * button, the ⌘K key handler and the results list all read the same thing —
 * and so a test can open the palette and type into it without a browser.
 * ------------------------------------------------------------------ */

export type CyberSearchUiState = { open: boolean; query: string };

const INITIAL_UI: CyberSearchUiState = { open: false, query: '' };

let ui: CyberSearchUiState = { ...INITIAL_UI };
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

export function getSearchUiState(): CyberSearchUiState {
  return ui;
}

/** Open the ⌘K palette. */
export function openSearch(): void {
  if (ui.open) return;
  ui = { ...ui, open: true };
  emit();
}

/** Close the palette and forget what was typed. */
export function closeSearch(): void {
  if (!ui.open && ui.query === '') return;
  ui = { ...INITIAL_UI };
  emit();
}

export function toggleSearch(): void {
  if (ui.open) closeSearch();
  else openSearch();
}

/** Type into the palette. */
export function setSearchQuery(query: string): void {
  if (ui.query === query) return;
  ui = { ...ui, query };
  emit();
}

/** The palette's state, re-rendering the caller when it changes. */
export function useSearchUi(): CyberSearchUiState {
  return useSyncExternalStore(subscribe, getSearchUiState, getSearchUiState);
}
