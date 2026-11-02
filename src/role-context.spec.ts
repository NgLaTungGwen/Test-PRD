/**
 * The demo scope — role, facility and member — as the URL query string.
 *
 * Two reviews, run the way the rest of this repository exercises a screen:
 * render the app shell to static markup in the `node` environment and read
 * the markup back.
 *
 * 1. `deep linking` — a URL carrying `role` and `memberId` (and a facility
 *    where it matters) is loaded directly and the screen comes up in that
 *    role's and that member's context, with an unknown or missing value
 *    falling back to the default scope rather than being obeyed.
 * 2. `role switching` — a screen already rendered in one role and facility is
 *    switched through the controls themselves, and every visible screen
 *    follows: the URL holds the new scope and nothing of the previous one is
 *    left in the document.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from './App';
import { setCurrentPath } from './CyberRoutes';
import { chooseRole, sidebarItemsForRole } from './CyberSidebar';
import { chooseFacility } from './FacilitySelector';
import {
  DEFAULT_MEMBER_ID,
  getFacilities,
  getMemberById,
  getScopedFindings,
  selectForScope,
} from './cyberData';
import {
  CYBER_SCOPE_ROLES,
  NEW_CYBER_ROLES,
  currentCyberSearch,
  getCyberScope,
  resetCyberScope,
  scopeFromQuery,
  scopeToQuery,
  setCyberScope,
  setCyberSearch,
} from './cyberScope';
import type { CyberRole, CyberScope } from './cyberScope';

/* ------------------------------------------------------------------ *
 * Helpers.
 * ------------------------------------------------------------------ */

/** What a render of the shell at one deep link gives a test to read. */
export type RenderResult = {
  /** The whole shell, as the dev server would serve it at that URL. */
  markup: string;
  /** The query string the shell is rendered at. */
  search: string;
  /** The scope that query resolved to. */
  scope: CyberScope;
  /** Whether an element carries this `data-testid`. */
  has(testId: string): boolean;
  /** The visible text of the whole shell. */
  text(): string;
  /** The visible text of the content container: the screen, without chrome. */
  mainText(): string;
  /** The visible text of one element, by `data-testid`. */
  textOf(testId: string): string;
  /** The `data-testid` values of the rendered shell, in document order. */
  testIds(): string[];
};

/** The visible text of a fragment of markup, tags stripped. */
function visibleText(markup: string): string {
  return markup
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#x2014;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The markup of the element carrying the given `data-testid`. */
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

/**
 * Mount the cyber route group at a deep link.
 *
 * The argument is what a browser would be pointed at — `'/cyber/members?role=
 * ProgramLead&memberId=mem-riverbend'`, or just the query — and the shell is
 * rendered exactly as a cold load of that URL would render it: the scope is
 * read from the query and from nothing else.
 */
export function renderAtQuery(query: string): RenderResult {
  const mark = query.indexOf('?');
  const path = mark === -1 ? (query.startsWith('?') ? '' : query) : query.slice(0, mark);
  const search = mark === -1 ? (query.startsWith('?') ? query : '') : query.slice(mark);

  if (path !== '') setCurrentPath(path);
  setCyberSearch(search, 'replace');

  return renderHere();
}

/** Render the shell again, at whatever path and scope it is now in. */
function renderHere(): RenderResult {
  const markup = renderToStaticMarkup(createElement(App));

  return {
    markup,
    search: currentCyberSearch(),
    scope: getCyberScope(),
    has: (testId) => markup.includes(`data-testid="${testId}"`),
    text: () => visibleText(markup),
    mainText: () => visibleText(elementByTestId(markup, 'app-main')),
    textOf: (testId) => visibleText(elementByTestId(markup, testId)),
    testIds: () => [...markup.matchAll(/data-testid="([^"]+)"/g)].map((m) => m[1] as string),
  };
}

/** The ids of the rows a screen listed, from their row test ids. */
function rowIds(result: RenderResult, prefix: string): string[] {
  return result
    .testIds()
    .filter((id) => id.startsWith(`${prefix}-`))
    .map((id) => id.slice(prefix.length + 1));
}

beforeEach(() => {
  resetCyberScope();
});

afterEach(() => {
  resetCyberScope();
  setCurrentPath(null);
});

describe('deep linking', () => {
  it('loads correct role and member from URL query', () => {
    /* -------------------------------------------------------------- *
     * 1. A HealthPRO-side role with a member in the query: the screen
     *    comes up in that role and on that member's context.
     * -------------------------------------------------------------- */
    const riverbend = getMemberById('mem-riverbend') as { id: string; name: string };
    const direct = renderAtQuery('/cyber/members?role=ProgramLead&memberId=mem-riverbend');

    expect(direct.scope).toEqual({
      role: 'ProgramLead',
      facilityId: null,
      memberId: 'mem-riverbend',
    });
    expect(direct.search).toBe('?role=ProgramLead&memberId=mem-riverbend');
    expect(direct.markup).toContain('data-scope-role="ProgramLead"');
    expect(direct.markup).toContain('data-scope-member="mem-riverbend"');

    // That member's own context panel is on the screen…
    expect(direct.has('member-detail-mem-riverbend')).toBe(true);
    expect(direct.textOf('member-detail-mem-riverbend')).toContain(riverbend.name);
    expect(direct.textOf('member-detail-findings-mem-riverbend')).toContain(
      String(getScopedFindings('mem-riverbend').length),
    );
    // …and the role's own navigation, not another role's.
    expect(direct.textOf('cyber-sidebar')).toBe(
      sidebarItemsForRole('ProgramLead')
        .map((item) => item.label)
        .join(' '),
    );
    // A HealthPRO-side role is not scoped to a facility, so no selector.
    expect(direct.has('facility-selector')).toBe(false);

    // The same query on another screen of the group: same member context.
    const portfolio = renderAtQuery('/cyber/portfolio?role=ProgramLead&memberId=mem-riverbend');
    expect(rowIds(portfolio, 'portfolio-row')).toEqual(['mem-riverbend']);
    expect(portfolio.text()).not.toContain('Lakeshore Regional Health Network');

    /* -------------------------------------------------------------- *
     * 2. A member-side role with a member in the query: the scope lands
     *    on that member's facility and every row is that facility's.
     * -------------------------------------------------------------- */
    const mapleGrove = getFacilities('mem-maple-grove');
    const asSecLead = renderAtQuery('/cyber/member/findings?role=MemberSecLead&memberId=mem-maple-grove');

    expect(asSecLead.scope).toEqual({
      role: 'MemberSecLead',
      facilityId: mapleGrove[0]?.id,
      memberId: 'mem-maple-grove',
    });
    expect(rowIds(asSecLead, 'finding-row')).toEqual(
      getScopedFindings('mem-maple-grove', mapleGrove[0]?.id).map((finding) => finding.id),
    );
    expect(asSecLead.textOf('cyber-member-findings-member')).toBe(
      getMemberById('mem-maple-grove')?.name,
    );
    expect(asSecLead.textOf('cyber-member-findings-facility')).toBe(mapleGrove[0]?.site);
    // The header's facility selector holds that facility, not a default one.
    expect(asSecLead.markup).toContain(`value="${mapleGrove[0]?.id as string}" selected=""`);

    // A facility in the query wins over the member's first one, and carries
    // its own member with it.
    const second = mapleGrove[1]?.id as string;
    const byFacility = renderAtQuery(`/cyber/member/findings?role=MemberOps&facility=${second}`);
    expect(byFacility.scope).toEqual({
      role: 'MemberOps',
      facilityId: second,
      memberId: 'mem-maple-grove',
    });
    expect(rowIds(byFacility, 'finding-row')).toEqual(
      getScopedFindings('mem-maple-grove', second).map((finding) => finding.id),
    );

    /* -------------------------------------------------------------- *
     * 3. The three roles this requirement adds are reachable by link,
     *    each with its own affordances.
     * -------------------------------------------------------------- */
    expect(NEW_CYBER_ROLES).toEqual(['MemberSecLead', 'MemberOps', 'HealthPRO']);
    expect(CYBER_SCOPE_ROLES.map((entry) => entry.id)).toEqual([
      'ProgramLead',
      'MemberExec',
      'MemberSecLead',
      'MemberOps',
      'HealthPRO',
    ]);

    for (const role of CYBER_SCOPE_ROLES.map((entry) => entry.id)) {
      const landed = renderAtQuery(`/cyber?role=${role}`);
      expect(landed.scope.role).toBe(role);
      expect(landed.markup).toContain(`data-scope-role="${role}"`);
      // The sidebar offers that role's screens, and the group lands on the
      // first of them rather than on another role's screen.
      expect(landed.textOf('cyber-sidebar')).toBe(
        sidebarItemsForRole(role)
          .map((item) => item.label)
          .join(' '),
      );
      expect(landed.markup).toContain(
        `data-path="${sidebarItemsForRole(role)[0]?.path as string}"`,
      );
      // The role switcher itself is in sync with the link, not with a default.
      expect(elementByTestId(landed.markup, 'cyber-role-select')).toContain(
        `value="${role}" selected=""`,
      );
    }

    // The new roles really are new affordances: the operations role has no
    // reports, and the service desk role has no member directory.
    expect(renderAtQuery('/cyber?role=MemberOps').textOf('cyber-sidebar')).toBe(
      'Incidents Findings',
    );
    expect(renderAtQuery('/cyber?role=HealthPRO').textOf('cyber-sidebar')).not.toContain('Members');

    /* -------------------------------------------------------------- *
     * 4. An unknown or missing parameter falls back to the default
     *    scope instead of being obeyed.
     * -------------------------------------------------------------- */
    const unknownRole = renderAtQuery('/cyber/members?role=auditor&memberId=mem-riverbend');
    expect(unknownRole.scope.role).toBe('ProgramLead');
    expect(unknownRole.has('member-detail-mem-riverbend')).toBe(true);

    const unknownMember = renderAtQuery('/cyber/members?role=ProgramLead&memberId=mem-nowhere');
    expect(unknownMember.scope).toEqual({
      role: 'ProgramLead',
      facilityId: null,
      memberId: null,
    });
    expect(unknownMember.has('member-detail')).toBe(false);
    expect(rowIds(unknownMember, 'member-row').length).toBeGreaterThan(1);

    const unknownFacility = renderAtQuery('/cyber/member/findings?role=MemberExec&facility=fac-999');
    expect(unknownFacility.scope).toEqual({
      role: 'MemberExec',
      facilityId: getFacilities(DEFAULT_MEMBER_ID)[0]?.id,
      memberId: DEFAULT_MEMBER_ID,
    });

    const noQuery = renderAtQuery('/cyber/members');
    expect(noQuery.scope).toEqual({ role: 'ProgramLead', facilityId: null, memberId: null });
    expect(noQuery.has('member-detail')).toBe(false);

    // And a scope written to the query reads back as the same scope.
    for (const query of [
      '?role=MemberOps&facility=fac-003&memberId=mem-riverbend',
      '?role=HealthPRO',
      '?role=member-it&facility=fac-002',
    ]) {
      const scope = scopeFromQuery(query);
      expect(scopeFromQuery(scopeToQuery(scope))).toEqual(scope);
    }
  });
});

describe('role switching', () => {
  it('clears stale data on role or facility change', () => {
    const lakeshore = getFacilities(DEFAULT_MEMBER_ID);
    const lakeshoreName = getMemberById(DEFAULT_MEMBER_ID)?.name as string;
    const mapleGroveName = getMemberById('mem-maple-grove')?.name as string;

    /* -------------------------------------------------------------- *
     * 1. A screen rendered for one role and member.
     * -------------------------------------------------------------- */
    const before = renderAtQuery(`/cyber/members?role=ProgramLead&memberId=${DEFAULT_MEMBER_ID}`);
    expect(before.has(`member-detail-${DEFAULT_MEMBER_ID}`)).toBe(true);
    expect(before.text()).toContain(lakeshoreName);
    expect(before.text()).toContain('Riverbend Community Health Centre');
    expect(before.textOf('cyber-sidebar')).toContain('Portfolio');

    /* -------------------------------------------------------------- *
     * 2. Switch the role, through the sidebar's own control. Every
     *    visible screen follows and nothing of the old role is left.
     * -------------------------------------------------------------- */
    chooseRole('MemberOps');
    const asOps = renderHere();

    expect(asOps.scope).toEqual({
      role: 'MemberOps',
      facilityId: lakeshore[0]?.id,
      memberId: DEFAULT_MEMBER_ID,
    });
    expect(asOps.search).toBe(
      `?role=MemberOps&facility=${lakeshore[0]?.id as string}&memberId=${DEFAULT_MEMBER_ID}`,
    );
    // The members screen is not the operations role's to see: the group has
    // moved to that role's own first screen, so no panel, no directory row
    // and no other member's name is still in the document.
    expect(asOps.has('cyber-members')).toBe(false);
    expect(asOps.has(`member-detail-${DEFAULT_MEMBER_ID}`)).toBe(false);
    expect(asOps.has('member-row-mem-riverbend')).toBe(false);
    expect(asOps.text()).not.toContain('Riverbend Community Health Centre');
    expect(asOps.textOf('cyber-sidebar')).toBe('Incidents Findings');
    expect(asOps.textOf('cyber-sidebar')).not.toContain('Portfolio');
    expect(asOps.markup).toContain(`data-path="/cyber/member/incidents"`);

    /* -------------------------------------------------------------- *
     * 3. Switch the facility, through the header's own control. The
     *    rows are the new facility's, and none of the old one's.
     * -------------------------------------------------------------- */
    setCurrentPath('/cyber/member/findings');
    const atFirst = renderHere();
    const firstRows = rowIds(atFirst, 'finding-row');
    expect(firstRows).toEqual(
      getScopedFindings(DEFAULT_MEMBER_ID, lakeshore[0]?.id).map((finding) => finding.id),
    );
    expect(firstRows.length).toBeGreaterThan(0);

    chooseFacility(lakeshore[1]?.id as string);
    const atSecond = renderHere();

    expect(atSecond.scope.facilityId).toBe(lakeshore[1]?.id);
    expect(atSecond.search).toContain(`facility=${lakeshore[1]?.id as string}`);
    expect(rowIds(atSecond, 'finding-row')).toEqual(
      getScopedFindings(DEFAULT_MEMBER_ID, lakeshore[1]?.id).map((finding) => finding.id),
    );
    for (const id of firstRows) {
      expect(atSecond.has(`finding-row-${id}`), `${id} survived the facility change`).toBe(false);
    }
    expect(atSecond.textOf('cyber-member-findings-facility')).toBe(lakeshore[1]?.site);
    // The screen itself holds nothing of the facility just left behind. (The
    // header's selector still offers it: that is the control, not the data.)
    expect(atSecond.mainText()).not.toContain(lakeshore[0]?.site as string);

    /* -------------------------------------------------------------- *
     * 4. Switch to a facility of another member: the member context
     *    goes with it, detail panel and all.
     * -------------------------------------------------------------- */
    const mapleGrove = getFacilities('mem-maple-grove');
    chooseFacility(mapleGrove[0]?.id as string);
    const atOtherMember = renderHere();

    expect(atOtherMember.scope).toEqual({
      role: 'MemberOps',
      facilityId: mapleGrove[0]?.id,
      memberId: 'mem-maple-grove',
    });
    expect(atOtherMember.search).toContain('memberId=mem-maple-grove');
    expect(atOtherMember.text()).toContain(mapleGroveName);
    expect(atOtherMember.text()).not.toContain(lakeshoreName);
    expect(rowIds(atOtherMember, 'finding-row')).toEqual(
      getScopedFindings('mem-maple-grove', mapleGrove[0]?.id).map((finding) => finding.id),
    );
    expect(selectForScope(atOtherMember.scope).members.map((member) => member.id)).toEqual([
      'mem-maple-grove',
    ]);

    /* -------------------------------------------------------------- *
     * 5. Back to a HealthPRO-side role: the facility goes out of the
     *    URL with the role that was scoped to it, the member-scoped
     *    screen goes with it, and the portfolio is the one the member
     *    in focus accounts for — not the previous role's screen.
     * -------------------------------------------------------------- */
    chooseRole('ProgramLead');
    const back = renderHere();

    expect(back.scope).toEqual({
      role: 'ProgramLead',
      facilityId: null,
      memberId: 'mem-maple-grove',
    });
    expect(back.search).toBe('?role=ProgramLead&memberId=mem-maple-grove');
    expect(back.has('facility-selector')).toBe(false);
    expect(back.has('cyber-member-findings')).toBe(false);
    expect(rowIds(back, 'finding-row')).toEqual([]);
    expect(back.markup).toContain('data-path="/cyber/portfolio"');
    expect(rowIds(back, 'portfolio-row')).toEqual(['mem-maple-grove']);
    expect(back.text()).not.toContain(lakeshoreName);

    /* -------------------------------------------------------------- *
     * 6. Clearing the focus, through the directory's own control: the
     *    whole portfolio is back and the member leaves the URL.
     * -------------------------------------------------------------- */
    setCurrentPath('/cyber/members');
    setCyberScope({ memberId: null });
    const cleared = renderHere();

    expect(cleared.scope).toEqual({ role: 'ProgramLead', facilityId: null, memberId: null });
    expect(cleared.search).toBe('?role=ProgramLead');
    expect(cleared.has('member-detail')).toBe(false);
    expect(rowIds(cleared, 'member-row').length).toBeGreaterThan(1);
    expect(cleared.text()).toContain(lakeshoreName);

    /* -------------------------------------------------------------- *
     * 7. The posture screens of the other route group read the same
     *    scope, so a role switch reaches every visible screen.
     * -------------------------------------------------------------- */
    setCurrentPath('/cyber-poc/overview');
    const postureAsLead = renderHere();
    const leadCards = rowIds(postureAsLead, 'posture-card');
    expect(leadCards.length).toBeGreaterThan(2);

    chooseRole('MemberExec' as CyberRole);
    const postureAsExec = renderHere();
    const execCards = rowIds(postureAsExec, 'posture-card');

    expect(execCards.length).toBeLessThan(leadCards.length);
    for (const facilityId of leadCards.filter((id) => !execCards.includes(id))) {
      expect(
        postureAsExec.has(`posture-card-${facilityId}`),
        `${facilityId} survived the role change`,
      ).toBe(false);
    }
  });
});
