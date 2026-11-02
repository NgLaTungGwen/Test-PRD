import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from './App';
import { setCurrentPath } from './CyberRoutes';
import { PROGRAM_LEAD_ITEMS, sidebarItemsForRole } from './CyberSidebar';
import { ILLUSTRATIVE_BANNER_TEXT } from './IllustrativeBanner';
import {
  DEFAULT_MEMBER_ID,
  getFacilities,
  getMemberById,
  selectByScope,
} from './cyberData';
import type { CyberRole } from './cyberData';
import {
  getCyberScopeState,
  resetCyberScope,
  scopeFromSearch,
  setCyberFacility,
  setCyberRole,
} from './cyberScope';
import {
  CYBER_SEARCH_ENTITIES,
  closeSearch,
  openSearch,
  searchCyber,
  setSearchQuery,
} from './cyberSearch';

/* ------------------------------------------------------------------ *
 * Helpers. The suite runs in the `node` environment, so a screen is
 * exercised the way the rest of this repository exercises one: render it
 * to static markup and read the markup back.
 * ------------------------------------------------------------------ */

/** Returns the markup of the element carrying the given data-testid. */
function elementByTestId(markup: string, testId: string): string {
  const start = markup.indexOf(`data-testid="${testId}"`);
  expect(start, `no element with data-testid="${testId}"`).toBeGreaterThan(-1);

  const tagStart = markup.lastIndexOf('<', start);
  const tagName = /^<([a-zA-Z0-9]+)/.exec(markup.slice(tagStart))?.[1] as string;

  let cursor = markup.indexOf('>', start) + 1;
  let depth = 1;
  const opening = new RegExp(`<${tagName}[\\s>]`, 'g');
  const closing = `</${tagName}>`;

  while (depth > 0) {
    opening.lastIndex = cursor;
    const next = opening.exec(markup);
    const close = markup.indexOf(closing, cursor);
    expect(close, `unterminated <${tagName}> for data-testid="${testId}"`).toBeGreaterThan(-1);
    if (next && next.index < close) {
      depth += 1;
      cursor = next.index + 1;
    } else {
      depth -= 1;
      cursor = close + closing.length;
    }
  }

  return markup.slice(tagStart, cursor);
}

function hasTestId(markup: string, testId: string): boolean {
  return markup.includes(`data-testid="${testId}"`);
}

/** The visible text of a fragment of markup, tags stripped. */
function textOf(markup: string): string {
  return markup
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#x2014;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The app shell, rendered at a path, in whatever scope the store holds. */
function renderShell(path: string): string {
  setCurrentPath(path);
  return renderToStaticMarkup(createElement(App));
}

/** The `data-testid` values of a fragment's direct and nested elements. */
function testIdsOf(markup: string): string[] {
  return [...markup.matchAll(/data-testid="([^"]+)"/g)].map((match) => match[1] as string);
}

/** The ids of the rows a member screen listed, from their row test ids. */
function rowIds(markup: string, prefix: string): string[] {
  return testIdsOf(markup)
    .filter((id) => id.startsWith(`${prefix}-`))
    .map((id) => id.slice(prefix.length + 1));
}

beforeEach(() => {
  resetCyberScope();
  closeSearch();
});

afterEach(() => {
  resetCyberScope();
  closeSearch();
  setCurrentPath(null);
});

describe('Cyber shell', () => {
  it('selects the three demo roles', () => {
    // The role switcher offers exactly the three demo roles, and selecting one
    // drives the shared scope every screen reads.
    const markup = renderShell('/cyber/portfolio');
    const switcher = elementByTestId(markup, 'role-switcher');

    expect(textOf(switcher)).toBe(
      'Role HealthPRO Program Lead Member Executive Member IT Lead',
    );
    expect(getCyberScopeState().role).toBe('program-lead');
    // A Program Lead is not scoped to one facility, so no selector is offered.
    expect(hasTestId(markup, 'facility-selector')).toBe(false);

    for (const role of ['member-exec', 'member-it', 'program-lead'] as CyberRole[]) {
      setCyberRole(role);
      expect(getCyberScopeState().role).toBe(role);
      expect(elementByTestId(renderShell('/cyber'), 'app-shell')).toContain(
        `data-role="${role}"`,
      );
    }

    // Switching to a member role lands on a facility of the demo member, and
    // switching back to the Program Lead drops it again.
    setCyberRole('member-exec');
    expect(getCyberScopeState().facilityId).toBe(getFacilities(DEFAULT_MEMBER_ID)[0]?.id);
    setCyberRole('program-lead');
    expect(getCyberScopeState().facilityId).toBeUndefined();

    // A link may ask for a scope; anything it cannot have is ignored.
    const second = getFacilities(DEFAULT_MEMBER_ID)[1]?.id as string;
    expect(scopeFromSearch(`?role=member-it&facility=${second}`)).toEqual({
      role: 'member-it',
      facilityId: second,
    });
    expect(scopeFromSearch('?role=member-exec')).toEqual({
      role: 'member-exec',
      facilityId: getFacilities(DEFAULT_MEMBER_ID)[0]?.id,
    });
    expect(scopeFromSearch('?role=auditor&facility=fac-001')).toEqual({
      role: 'program-lead',
      facilityId: undefined,
    });
    expect(scopeFromSearch('')).toEqual({ role: 'program-lead', facilityId: undefined });
  });

  it('shows Program Lead sidebar items', () => {
    setCyberRole('program-lead');

    const sidebar = elementByTestId(renderShell('/cyber/portfolio'), 'cyber-sidebar');
    const labels = PROGRAM_LEAD_ITEMS.map((item) => item.label);

    expect(sidebarItemsForRole('program-lead').map((item) => item.label)).toEqual([
      'Portfolio',
      'Members',
      'Service performance',
      'Catalogue',
      'Sector advisories',
    ]);

    // Exactly those five, in that order, and nothing else in the section.
    expect(textOf(sidebar)).toBe(labels.join(' '));
    expect(testIdsOf(sidebar)).toEqual([
      'cyber-sidebar',
      'cyber-sidebar-item-portfolio',
      'cyber-sidebar-item-members',
      'cyber-sidebar-item-service-performance',
      'cyber-sidebar-item-catalogue',
      'cyber-sidebar-item-sector-advisories',
    ]);
    expect(textOf(elementByTestId(renderShell('/cyber/portfolio'), 'cyber-sidebar-heading'))).toBe(
      'Cybersecurity',
    );

    // Member-only screens are not offered to the Program Lead.
    for (const item of ['Incidents', 'Findings', 'Reports']) {
      expect(textOf(sidebar)).not.toContain(item);
    }

    // And every item the Program Lead is offered resolves to a screen.
    for (const item of PROGRAM_LEAD_ITEMS) {
      const screen = renderShell(item.path);
      expect(hasTestId(screen, 'cyber-not-found'), `${item.path} has no screen`).toBe(false);
      expect(hasTestId(screen, 'cyber-group')).toBe(true);
    }
  });

  it('rescopes screens on facility change', () => {
    setCyberRole('member-it');

    const facilities = getFacilities(DEFAULT_MEMBER_ID);
    expect(facilities.length, 'the demo member needs several facilities').toBeGreaterThan(1);

    const memberScreens = [
      { path: '/cyber/member/incidents', testId: 'cyber-member-incidents', rows: 'incident-row' },
      { path: '/cyber/member/findings', testId: 'cyber-member-findings', rows: 'finding-row' },
      { path: '/cyber/member/reports', testId: 'cyber-member-reports', rows: 'report-row' },
    ] as const;

    const seen = new Map<string, Record<string, string[]>>();

    for (const facility of facilities) {
      // Exactly what the header's facility selector does on change.
      setCyberFacility(facility.id);

      const header = elementByTestId(renderShell('/cyber/member/incidents'), 'facility-selector');
      // The selector lists this member's facilities and holds the chosen one.
      for (const option of facilities) expect(header).toContain(option.name);
      expect(header).toContain(`value="${facility.id}" selected=""`);

      const expected = selectByScope('member-it', facility.id);
      const byScreen: Record<string, string[]> = {};

      for (const screen of memberScreens) {
        const markup = elementByTestId(renderShell(screen.path), screen.testId);
        const ids = rowIds(markup, screen.rows);

        // Every screen shows this facility's records and no other facility's.
        expect(markup).toContain(`data-facility="${facility.id}"`);
        expect(textOf(markup)).toContain(facility.name);
        byScreen[screen.rows] = ids;
      }

      expect(byScreen['incident-row']).toEqual(expected.incidents.map((row) => row.id));
      expect(byScreen['finding-row']).toEqual(expected.findings.map((row) => row.id));
      expect(byScreen['report-row']).toEqual(
        [...expected.reports]
          .sort((left, right) => right.month.localeCompare(left.month))
          .map((row) => row.id),
      );
      expect(
        expected.findings.length + expected.reports.length,
        `${facility.name} shows nothing at all`,
      ).toBeGreaterThan(0);

      seen.set(facility.id, byScreen);
    }

    // The facilities genuinely differ: no record is shown under two of them,
    // so the screens re-scoped rather than ignoring the selection.
    const [first, second] = [...seen.values()];
    for (const key of ['incident-row', 'finding-row', 'report-row']) {
      const left = new Set((first as Record<string, string[]>)[key]);
      const overlap = ((second as Record<string, string[]>)[key] ?? []).filter((id) =>
        left.has(id),
      );
      expect(overlap, `${key} leaked between facilities`).toEqual([]);
    }
    expect(
      (first as Record<string, string[]>)['finding-row'],
    ).not.toEqual((second as Record<string, string[]>)['finding-row']);
  });

  it('shows illustrative banner', () => {
    const everyCyberScreen = [
      '/cyber',
      '/cyber/portfolio',
      '/cyber/members',
      '/cyber/service-performance',
      '/cyber/catalogue',
      '/cyber/advisories',
      '/cyber/member/incidents',
      '/cyber/member/findings',
      '/cyber/member/reports',
    ];

    for (const role of ['program-lead', 'member-exec', 'member-it'] as CyberRole[]) {
      setCyberRole(role);

      for (const path of everyCyberScreen) {
        const banner = elementByTestId(renderShell(path), 'illustrative-banner');

        expect(textOf(banner), `${path} as ${role}`).toBe(ILLUSTRATIVE_BANNER_TEXT);
        expect(textOf(banner)).toBe('Illustrative / Draft, pending HealthPRO review');
        expect(banner).toContain(`aria-label="${ILLUSTRATIVE_BANNER_TEXT}"`);
        expect(banner).toContain('data-illustrative="true"');
      }
    }
  });

  it('search indexes cyber entities', () => {
    setCyberRole('program-lead');

    const scope = { role: 'program-lead' as CyberRole, facilityId: undefined };
    const terms: Record<string, string> = {
      member: 'Lakeshore',
      incident: 'inc-001',
      finding: 'fnd-001',
      report: 'rpt-001',
      advisory: 'adv-001',
    };

    // Every entity kind is in the index and is reachable by a term of its own.
    for (const entity of CYBER_SEARCH_ENTITIES) {
      const hits = searchCyber(terms[entity] as string, scope);
      expect(hits.length, `no ${entity} result for "${terms[entity]}"`).toBeGreaterThan(0);
      expect(hits.some((hit) => hit.entity === entity)).toBe(true);
      expect(hits.every((hit) => hit.route.startsWith('/cyber'))).toBe(true);
    }

    // Case-insensitive, and matching on the entity's own text.
    expect(searchCyber('lakeshore', scope).some((hit) => hit.entity === 'member')).toBe(true);
    expect(searchCyber('   ', scope)).toEqual([]);

    // Opening ⌘K and typing shows those results in the palette itself.
    openSearch();
    setSearchQuery('Lakeshore');

    const results = elementByTestId(renderShell('/cyber/portfolio'), 'search-results');
    const shown = searchCyber('Lakeshore', scope);
    expect(shown.length).toBeGreaterThan(0);

    for (const entity of CYBER_SEARCH_ENTITIES) {
      const hit = shown.find((candidate) => candidate.entity === entity);
      if (hit === undefined) continue;
      expect(results, `${entity} missing from the palette`).toContain(
        `data-testid="search-result-${hit.id}"`,
      );
    }

    // A Lakeshore search reaches all five entity kinds: the member itself, its
    // incidents, findings and reports, and the advisories that name it.
    expect(new Set(shown.map((hit) => hit.entity))).toEqual(new Set(CYBER_SEARCH_ENTITIES));

    const memberName = getMemberById(DEFAULT_MEMBER_ID)?.name as string;
    expect(textOf(results)).toContain(memberName);

    closeSearch();
    expect(hasTestId(renderShell('/cyber/portfolio'), 'search-palette')).toBe(false);
  });
});
