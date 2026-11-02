/**
 * The cyber mock data set, checked against the PRD it was built from.
 *
 * The expectations here are written out by hand — the PRD member table, the
 * Lakeshore P1 scenario, Maple Grove's hygiene numbers, the VPN advisory's
 * exposure — rather than read back out of the generator, so a change to the
 * generator that contradicts the brief fails here instead of passing quietly.
 */
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, describe, expect, it } from 'vitest';

import {
  MONTHS,
  NOW_ISO,
  SILENT_SOURCE_HOURS,
  acknowledgementMinutes,
  getAdvisories,
  getAdvisoriesForMember,
  getAdvisoryById,
  getFindings,
  getFunnelRow,
  getFunnelRows,
  getIncidentById,
  getIncidentReports,
  getIncidents,
  getLogSources,
  getMemberById,
  getMembers,
  getOverdueFindings,
  getPostureForMonth,
  getPostureHistory,
  getReports,
  getRetainer,
  getRetainerForMember,
  getSilentSources,
  getSlaSummary,
  getTickets,
  getTiers,
  hoursSince,
  incidentRetainerDraw,
} from './cyberData';

const run = promisify(execFile);

const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const GENERATOR = join(SRC_DIR, 'cyberFixtures.gen.ts');

const LAKESHORE_ID = 'mem-lakeshore';
const RIVERBEND_ID = 'mem-riverbend';
const MAPLE_GROVE_ID = 'mem-maple-grove';
const ST_BRENDANS_ID = 'mem-st-brendans';

const VPN_ADVISORY_ID = 'adv-004';

/** The PRD member table: 8 members, with their type, province, size, tier and October grade. */
const PRD_TABLE = [
  {
    id: LAKESHORE_ID,
    name: 'Lakeshore Regional Health Network',
    type: 'Acute hospital network',
    province: 'Ontario',
    size: 'Large',
    tier: 'advanced',
    octoberGrade: 'B',
  },
  {
    id: RIVERBEND_ID,
    name: 'Riverbend Community Health Centre',
    type: 'Community health centre',
    province: 'British Columbia',
    size: 'Medium',
    tier: 'standard',
    octoberGrade: 'C',
  },
  {
    id: MAPLE_GROVE_ID,
    name: 'Maple Grove Long-Term Care',
    type: 'Long-term care home',
    province: 'Alberta',
    size: 'Medium',
    tier: 'essentials',
    octoberGrade: 'D',
  },
  {
    id: ST_BRENDANS_ID,
    name: "St. Brendan's Memorial Hospital",
    type: 'Acute hospital',
    province: 'Nova Scotia',
    size: 'Large',
    tier: 'advanced',
    octoberGrade: 'B',
  },
  {
    id: 'mem-northern-lights',
    name: 'Northern Lights Health Centre',
    type: 'Rural health centre',
    province: 'Manitoba',
    size: 'Small',
    tier: 'essentials',
    octoberGrade: 'C',
  },
  {
    id: 'mem-pinehurst',
    name: 'Pinehurst Seniors Residence',
    type: 'Long-term care home',
    province: 'Saskatchewan',
    size: 'Small',
    tier: 'essentials',
    octoberGrade: 'C',
  },
  {
    id: 'mem-harbourview',
    name: 'Harbourview Day Surgery Centre',
    type: 'Ambulatory surgery centre',
    province: 'Quebec',
    size: 'Medium',
    tier: 'standard',
    octoberGrade: 'B',
  },
  {
    id: 'mem-cedar-valley',
    name: 'Cedar Valley Mental Health Partners',
    type: 'Mental health network',
    province: 'New Brunswick',
    size: 'Medium',
    tier: 'standard',
    octoberGrade: 'A',
  },
] as const;

const temporaryDirs: string[] = [];

function temporaryDir(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `cyber-mock-${label}-`));
  temporaryDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of temporaryDirs) rmSync(dir, { recursive: true, force: true });
});

describe('Mock data', () => {
  it('members fixture matches PRD table', () => {
    const members = getMembers();

    // Exactly the 8 members of the PRD table, in table order, with no extras.
    expect(members).toHaveLength(8);
    expect(members.map((member) => member.id)).toEqual(PRD_TABLE.map((row) => row.id));
    expect(new Set(members.map((member) => member.id)).size).toBe(8);

    for (const row of PRD_TABLE) {
      const member = getMemberById(row.id);
      expect(member, `member ${row.id} is missing from the fixture`).toBeDefined();
      expect(member).toEqual({
        id: row.id,
        name: row.name,
        type: row.type,
        province: row.province,
        size: row.size,
        tier: row.tier,
      });

      // Each member's tier is one the tiers fixture actually defines.
      expect(
        getTiers().map((tier) => tier.id),
        `tier "${row.tier}" is not defined in the tiers fixture`,
      ).toContain(row.tier);

      // Six months of posture history, and October's grade is the PRD's grade.
      const history = getPostureHistory(row.id);
      expect(history.map((point) => point.month)).toEqual(MONTHS);

      const october = getPostureForMonth(row.id, '2026-10');
      expect(october, `${row.id} has no October 2026 posture point`).toBeDefined();
      expect(october?.grade, `${row.id} October grade`).toBe(row.octoberGrade);
    }
  });

  it('funnel counts reconcile with ticket table', () => {
    const tickets = getTickets();
    const rows = getFunnelRows();

    expect(tickets.length).toBeGreaterThan(0);
    // One funnel row per member per month, and nothing else.
    expect(rows).toHaveLength(PRD_TABLE.length * MONTHS.length);

    let reconciledTickets = 0;

    for (const row of PRD_TABLE) {
      for (const month of MONTHS) {
        const funnel = getFunnelRow(row.id, month);
        expect(funnel, `no funnel row for ${row.id} in ${month}`).toBeDefined();

        const counted = tickets.filter(
          (ticket) => ticket.memberId === row.id && ticket.month === month,
        ).length;

        expect(funnel?.tickets, `funnel tickets for ${row.id} in ${month}`).toBe(counted);
        expect(funnel?.escalated, `funnel escalations for ${row.id} in ${month}`).toBe(counted);
        reconciledTickets += counted;

        // The funnel narrows at every stage: events -> alerts -> triaged -> escalated -> tickets.
        const stages = [
          funnel?.events as number,
          funnel?.alerts as number,
          funnel?.triaged as number,
          funnel?.escalated as number,
          funnel?.tickets as number,
        ];
        for (let index = 1; index < stages.length; index += 1) {
          expect(
            stages[index - 1] as number,
            `funnel stage ${index} widens for ${row.id} in ${month}`,
          ).toBeGreaterThanOrEqual(stages[index] as number);
        }
        for (const stage of stages) expect(Number.isInteger(stage)).toBe(true);
      }
    }

    // Every ticket in the table is accounted for by exactly one funnel row.
    expect(reconciledTickets).toBe(tickets.length);
    expect(rows.reduce((total, funnel) => total + funnel.tickets, 0)).toBe(tickets.length);

    // Per-member totals reconcile too.
    for (const row of PRD_TABLE) {
      expect(
        getFunnelRows(row.id).reduce((total, funnel) => total + funnel.tickets, 0),
        `funnel total for ${row.id}`,
      ).toBe(getTickets(row.id).length);
    }

    // The SLA and MTTA figures are the ticket rows' own arithmetic, and exactly
    // three P2 acknowledgement breaches are seeded across the whole data set.
    const summary = getSlaSummary();
    expect(summary.tickets).toBe(tickets.length);
    expect(summary.breached).toBe(3);
    expect(summary.withinSla).toBe(tickets.length - 3);

    const breaches = tickets.filter((ticket) => ticket.breached);
    expect(breaches).toHaveLength(3);
    expect(breaches.map((ticket) => ticket.severity)).toEqual(['P2', 'P2', 'P2']);
    for (const ticket of breaches) {
      expect(acknowledgementMinutes(ticket)).toBeGreaterThan(ticket.slaTargetMins);
    }
    for (const ticket of tickets.filter((candidate) => !candidate.breached)) {
      expect(
        acknowledgementMinutes(ticket),
        `${ticket.id} is flagged inside SLA but was acknowledged late`,
      ).toBeLessThanOrEqual(ticket.slaTargetMins);
    }

    const expectedMtta =
      tickets.reduce((total, ticket) => total + acknowledgementMinutes(ticket), 0) / tickets.length;
    expect(summary.mttaMins).toBe(Math.round(expectedMtta * 10) / 10);
  });

  it('Lakeshore P1 incident matches scenario', () => {
    const incident = getIncidentById('inc-001');
    expect(incident, 'the Lakeshore P1 incident is missing').toBeDefined();
    if (incident === undefined) return;

    expect(incident.memberId).toBe(LAKESHORE_ID);
    expect(incident.severity).toBe('P1');
    expect(getIncidents(LAKESHORE_ID).filter((row) => row.severity === 'P1')).toHaveLength(1);

    // The attack chain, told as an ordered timeline that runs from the VPN
    // login through to credential dumping and containment.
    const steps = incident.timeline.map((entry) => entry.step.toLowerCase());
    expect(steps.length).toBeGreaterThanOrEqual(5);
    const vpnLoginAt = steps.findIndex((step) => step.includes('vpn login'));
    const dumpingAt = steps.findIndex((step) => step.includes('credential dumping'));
    const containedAt = steps.findIndex((step) => step.startsWith('contained'));
    expect(vpnLoginAt, 'no VPN login step in the timeline').toBe(0);
    expect(dumpingAt, 'no credential dumping step in the timeline').toBeGreaterThan(vpnLoginAt);
    expect(containedAt, 'no containment step in the timeline').toBeGreaterThan(dumpingAt);
    expect(steps.some((step) => step.includes('lsass'))).toBe(true);

    const times = incident.timeline.map((entry) => Date.parse(entry.at));
    expect(times.every((value) => Number.isFinite(value))).toBe(true);
    expect([...times].sort((left, right) => left - right)).toEqual(times);

    // Contained in 2h10m, measured from detection rather than from first login.
    expect(incident.containmentMins).toBe(130);
    expect(incident.containmentMins).toBe(2 * 60 + 10);

    const detection = incident.timeline.find((entry) => entry.step.toLowerCase().startsWith('detection'));
    const containment = incident.timeline[incident.timeline.length - 1];
    expect(detection, 'no detection step in the timeline').toBeDefined();
    expect(
      (Date.parse(containment?.at as string) - Date.parse(detection?.at as string)) / 60_000,
      'the timeline does not span 2h10m from detection to containment',
    ).toBe(130);

    // Exactly three open member action items, each owned by the member.
    expect(incident.openActions).toHaveLength(3);
    expect(new Set(incident.openActions.map((action) => action.id)).size).toBe(3);
    for (const action of incident.openActions) {
      expect(action.owner).toMatch(/^Lakeshore /);
    }

    // The ticket table, the retainer ledger and the report list tell the same story.
    const p1Tickets = getTickets(LAKESHORE_ID).filter((ticket) => ticket.severity === 'P1');
    expect(p1Tickets).toHaveLength(1);
    expect(p1Tickets[0]?.openedAt).toBe(detection?.at);
    expect(p1Tickets[0]?.breached).toBe(false);

    const retainer = getRetainerForMember(LAKESHORE_ID);
    expect(retainer?.consumedHours).toBeGreaterThanOrEqual(incidentRetainerDraw(incident));
    expect(retainer?.consumedHours).toBeLessThanOrEqual(retainer?.purchasedHours as number);

    const incidentReports = getIncidentReports(LAKESHORE_ID);
    expect(incidentReports.some((report) => report.title.includes('inc-001'))).toBe(true);
    expect(incidentReports.some((report) => report.month === '2026-10')).toBe(true);
  });

  it('Maple Grove silent sources and overdue findings', () => {
    const sources = getLogSources(MAPLE_GROVE_ID);
    expect(sources.length).toBeGreaterThan(2);

    // Exactly 2 sources quiet for more than 72 hours against the fixed "now".
    const silent = getSilentSources(MAPLE_GROVE_ID);
    expect(silent).toHaveLength(2);
    for (const source of silent) {
      expect(hoursSince(source.lastEventAt)).toBeGreaterThan(SILENT_SOURCE_HOURS);
      expect(Date.parse(source.lastEventAt)).toBeLessThan(Date.parse(NOW_ISO));
    }
    for (const source of sources.filter((candidate) => !silent.includes(candidate))) {
      expect(
        hoursSince(source.lastEventAt),
        `${source.id} (${source.type}) is a third silent source`,
      ).toBeLessThanOrEqual(SILENT_SOURCE_HOURS);
    }

    // Exactly 3 critical findings past their due date and still open.
    const overdue = getOverdueFindings(MAPLE_GROVE_ID);
    const overdueCritical = overdue.filter((finding) => finding.severity === 'critical');
    expect(overdueCritical).toHaveLength(3);
    for (const finding of overdueCritical) {
      expect(finding.status).toBe('open');
      expect(Date.parse(`${finding.dueDate}T00:00:00.000Z`)).toBeLessThan(Date.parse(NOW_ISO));
      expect(finding.title.length).toBeGreaterThan(0);
    }
    expect(overdue).toHaveLength(3);

    // Everyone else stays inside the thresholds, so these are Maple Grove's facts.
    for (const row of PRD_TABLE.filter((member) => member.id !== MAPLE_GROVE_ID)) {
      expect(getSilentSources(row.id), `${row.id} has a silent source`).toHaveLength(0);
      expect(
        getOverdueFindings(row.id).filter((finding) => finding.severity === 'critical'),
        `${row.id} has an overdue critical finding`,
      ).toHaveLength(0);
    }
  });

  it('VPN advisory affects correct three members', () => {
    // Exactly one advisory in the data set is the VPN appliance advisory, so
    // "the VPN appliance advisory" names one row and not a family of them.
    const vpnAdvisories = getAdvisories().filter((row) => /vpn appliance/i.test(row.title));
    expect(vpnAdvisories.map((row) => row.id)).toEqual([VPN_ADVISORY_ID]);

    const advisory = getAdvisoryById(VPN_ADVISORY_ID);
    expect(advisory, 'the VPN appliance advisory is missing').toBeDefined();
    if (advisory === undefined) return;

    expect(advisory.title.toLowerCase()).toContain('vpn');
    expect(advisory.severity).toBe('critical');
    expect(advisory.summary.length).toBeGreaterThan(0);
    expect(advisory.action.length).toBeGreaterThan(0);
    expect(advisory.publishedAt.slice(0, 7)).toBe('2026-10');

    // Exactly Lakeshore, St. Brendan's and Maple Grove — no more, no fewer.
    expect(advisory.affectedMemberIds).toEqual([LAKESHORE_ID, ST_BRENDANS_ID, MAPLE_GROVE_ID]);
    expect([...advisory.affectedMemberIds].sort()).toEqual(
      [LAKESHORE_ID, ST_BRENDANS_ID, MAPLE_GROVE_ID].sort(),
    );

    const names = advisory.affectedMemberIds.map((id) => getMemberById(id)?.name);
    expect(names).toEqual([
      'Lakeshore Regional Health Network',
      "St. Brendan's Memorial Hospital",
      'Maple Grove Long-Term Care',
    ]);

    // Looked up the other way round, the same three members and only those.
    for (const id of [LAKESHORE_ID, ST_BRENDANS_ID, MAPLE_GROVE_ID]) {
      expect(
        getAdvisoriesForMember(id).map((row) => row.id),
        `${id} is not exposed by the VPN advisory`,
      ).toContain(VPN_ADVISORY_ID);
    }
    for (const row of PRD_TABLE.filter(
      (member) => ![LAKESHORE_ID, ST_BRENDANS_ID, MAPLE_GROVE_ID].includes(member.id),
    )) {
      expect(
        getAdvisoriesForMember(row.id).map((advisoryRow) => advisoryRow.id),
        `${row.id} should not be exposed by the VPN advisory`,
      ).not.toContain(VPN_ADVISORY_ID);
    }

    // The advisory is published before the Lakeshore P1 intrusion it explains.
    const lakeshoreP1 = getIncidentById('inc-001');
    expect(Date.parse(advisory.publishedAt)).toBeLessThan(
      Date.parse(lakeshoreP1?.timeline[0]?.at as string),
    );
  });

  it('covers May to October 2026 across every fixture entity', () => {
    expect(MONTHS).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);

    const members = getMembers().map((member) => member.id);

    for (const ticket of getTickets()) {
      expect(MONTHS).toContain(ticket.month);
      expect(ticket.openedAt.slice(0, 7)).toBe(ticket.month);
      expect(members).toContain(ticket.memberId);
    }
    for (const row of getFunnelRows()) expect(MONTHS).toContain(row.month);
    for (const report of getReports()) {
      expect(MONTHS).toContain(report.month);
      expect(['monthly', 'incident']).toContain(report.kind);
    }
    for (const point of getPostureHistory()) {
      expect(MONTHS).toContain(point.month);
      expect(point.score).toBeGreaterThan(0);
    }
    for (const advisory of getAdvisories()) {
      expect(MONTHS).toContain(advisory.publishedAt.slice(0, 7));
      for (const id of advisory.affectedMemberIds) expect(members).toContain(id);
    }
    for (const incident of getIncidents()) {
      expect(members).toContain(incident.memberId);
      expect(MONTHS).toContain(incident.timeline[0]?.at.slice(0, 7));
    }
    for (const finding of getFindings()) expect(members).toContain(finding.memberId);
    for (const source of getLogSources()) expect(members).toContain(source.memberId);

    // One monthly report per member per month, and one retainer record per member.
    expect(getReports().filter((report) => report.kind === 'monthly')).toHaveLength(
      members.length * MONTHS.length,
    );
    expect(getRetainer().map((record) => record.memberId)).toEqual(members);
    expect(getIncidentReports()).toHaveLength(getIncidents().length);
  });

  it('is regenerated byte for byte by the seeded generator', async () => {
    const outDir = temporaryDir('regen');
    const result = await run(process.execPath, [GENERATOR, `--out=${outDir}`], { cwd: SRC_DIR });
    expect(result.stdout).toContain('gen:cyber-mock-data: seed');

    const written = readdirSync(outDir).sort();
    expect(written.length).toBe(11);

    for (const name of written) {
      expect(
        readFileSync(join(outDir, name)).equals(readFileSync(join(SRC_DIR, name))),
        `src/${name} is not what the generator writes; run npm run gen:cyber-mock-data`,
      ).toBe(true);
    }

    // The generator reads no clock and no system randomness.
    const source = readFileSync(GENERATOR, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const forbidden of ['Math.random', 'Date.now', 'new Date()', 'fetch(', 'randomUUID']) {
      expect(source.includes(forbidden), `the generator uses ${forbidden}`).toBe(false);
    }
  });
});
