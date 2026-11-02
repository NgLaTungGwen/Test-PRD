/**
 * Typed selector layer over the committed cyber mock data set.
 *
 * The JSON files beside this module are imported statically, at build time.
 * Nothing here generates data at runtime, reads the clock or calls out to
 * anything: the fixtures are produced once by `src/cyberFixtures.gen.ts`
 * (`npm run gen:cyber-mock-data`) and committed exactly as it writes them.
 *
 * Freshness — silent log sources, overdue findings — is measured against the
 * data set's fixed `NOW`, not against the system clock, so what a screen shows
 * is a property of the data and not of the day it is read.
 */
import advisoriesFixture from './cyberAdvisories.json';
import findingsFixture from './cyberFindings.json';
import funnelFixture from './cyberFunnelMonthly.json';
import incidentsFixture from './cyberIncidents.json';
import logSourcesFixture from './cyberLogSources.json';
import membersFixture from './cyberMembers.json';
import postureFixture from './cyberPostureHistory.json';
import reportsFixture from './cyberReports.json';
import retainerFixture from './cyberRetainer.json';
import ticketsFixture from './cyberTickets.json';
import tiersFixture from './cyberTiers.json';

/* ------------------------------------------------------------------ *
 * Types. Declared here rather than imported from the generator so this
 * module stays free of Node built-ins and safe in the browser bundle.
 * ------------------------------------------------------------------ */

export type Severity = 'P1' | 'P2' | 'P3' | 'P4';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export type CyberMember = {
  id: string;
  name: string;
  type: string;
  province: string;
  size: string;
  tier: string;
};

export type CyberTier = { id: string; name: string; services: string[] };

export type PostureHistoryPoint = { memberId: string; month: string; score: number; grade: Grade };

export type CyberTicket = {
  id: string;
  memberId: string;
  month: string;
  severity: Severity;
  openedAt: string;
  acknowledgedAt: string;
  resolvedAt: string;
  slaTargetMins: number;
  breached: boolean;
};

export type FunnelMonthRow = {
  memberId: string;
  month: string;
  events: number;
  alerts: number;
  triaged: number;
  escalated: number;
  tickets: number;
};

export type CyberIncident = {
  id: string;
  memberId: string;
  severity: 'P1' | 'P2';
  timeline: { at: string; step: string }[];
  containmentMins: number;
  openActions: { id: string; owner: string }[];
};

export type LogSource = {
  id: string;
  memberId: string;
  type: string;
  cadenceHours: number;
  lastEventAt: string;
};

export type Finding = {
  id: string;
  memberId: string;
  /** Beyond the named interface: what the finding is, for screens and reports. */
  title: string;
  severity: FindingSeverity;
  dueDate: string;
  status: 'open' | 'closed';
};

export type RetainerRecord = { memberId: string; purchasedHours: number; consumedHours: number };

export type Advisory = {
  id: string;
  title: string;
  publishedAt: string;
  severity: string;
  summary: string;
  action: string;
  affectedMemberIds: string[];
};

export type CyberReport = {
  id: string;
  memberId: string;
  month: string;
  kind: 'monthly' | 'incident';
  title: string;
};

/* ------------------------------------------------------------------ *
 * Data-set constants. These mirror the generator's own constants; the
 * spec asserts the two agree.
 * ------------------------------------------------------------------ */

/** The six months of history the data set covers, oldest first. */
export const MONTHS: string[] = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

/** The fixed instant every freshness figure in the data set is measured against. */
export const NOW_ISO = '2026-10-31T09:00:00.000Z';

export const NOW_MS = Date.parse(NOW_ISO);

/** A log source counts as silent once this many hours have passed without an event. */
export const SILENT_SOURCE_HOURS = 72;

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

type Envelope<T> = { generator: string; kind: string; records: T[]; seed: number; version: number };

function recordsOf<T>(fixture: unknown): T[] {
  return (fixture as Envelope<T>).records;
}

const MEMBERS = recordsOf<CyberMember>(membersFixture);
const TIERS = recordsOf<CyberTier>(tiersFixture);
const POSTURE = recordsOf<PostureHistoryPoint>(postureFixture);
const TICKETS = recordsOf<CyberTicket>(ticketsFixture);
const FUNNEL = recordsOf<FunnelMonthRow>(funnelFixture);
const INCIDENTS = recordsOf<CyberIncident>(incidentsFixture);
const LOG_SOURCES = recordsOf<LogSource>(logSourcesFixture);
const FINDINGS = recordsOf<Finding>(findingsFixture);
const RETAINER = recordsOf<RetainerRecord>(retainerFixture);
const ADVISORIES = recordsOf<Advisory>(advisoriesFixture);
const REPORTS = recordsOf<CyberReport>(reportsFixture);

/** The seed the committed fixtures carry, for provenance on screen. */
export const FIXTURE_SEED: number = (membersFixture as unknown as Envelope<CyberMember>).seed;

function forMember<T extends { memberId: string }>(rows: T[], memberId?: string): T[] {
  return memberId === undefined ? [...rows] : rows.filter((row) => row.memberId === memberId);
}

/* ------------------------------------------------------------------ *
 * Members, tiers and posture.
 * ------------------------------------------------------------------ */

/** The 8 member organisations of the PRD table, in table order. */
export function getMembers(): CyberMember[] {
  return [...MEMBERS];
}

/** One member by id, or `undefined` if nothing in the data set has that id. */
export function getMemberById(id: string): CyberMember | undefined {
  return MEMBERS.find((member) => member.id === id);
}

/** The service tier definitions the member table references. */
export function getTiers(): CyberTier[] {
  return [...TIERS];
}

/** One tier by id, or `undefined`. */
export function getTierById(id: string): CyberTier | undefined {
  return TIERS.find((tier) => tier.id === id);
}

/** The tier a member is on, or `undefined` if the member is unknown. */
export function getTierForMember(memberId: string): CyberTier | undefined {
  const member = getMemberById(memberId);
  return member === undefined ? undefined : getTierById(member.tier);
}

/** Monthly posture scores and grades, for one member or for all of them. */
export function getPostureHistory(memberId?: string): PostureHistoryPoint[] {
  return forMember(POSTURE, memberId);
}

/** One member's posture point for a `YYYY-MM` month. */
export function getPostureForMonth(memberId: string, month: string): PostureHistoryPoint | undefined {
  return POSTURE.find((point) => point.memberId === memberId && point.month === month);
}

/** One member's posture point for the last month of the window (October 2026). */
export function getLatestPosture(memberId: string): PostureHistoryPoint | undefined {
  return getPostureForMonth(memberId, MONTHS[MONTHS.length - 1] as string);
}

/* ------------------------------------------------------------------ *
 * Tickets, funnel and the SLA / MTTA figures derived from them.
 * ------------------------------------------------------------------ */

/** The ticket table, for one member or for all of them. */
export function getTickets(memberId?: string): CyberTicket[] {
  return forMember(TICKETS, memberId);
}

/** The ticket rows for one member and one `YYYY-MM` month. */
export function getTicketsForMonth(memberId: string, month: string): CyberTicket[] {
  return TICKETS.filter((ticket) => ticket.memberId === memberId && ticket.month === month);
}

/** The monthly funnel rows, for one member or for all of them. */
export function getFunnelRows(memberId?: string): FunnelMonthRow[] {
  return forMember(FUNNEL, memberId);
}

/** The funnel row for one member and one `YYYY-MM` month. */
export function getFunnelRow(memberId: string, month: string): FunnelMonthRow | undefined {
  return FUNNEL.find((row) => row.memberId === memberId && row.month === month);
}

/** Minutes between a ticket being opened and being acknowledged. */
export function acknowledgementMinutes(ticket: CyberTicket): number {
  return (Date.parse(ticket.acknowledgedAt) - Date.parse(ticket.openedAt)) / MINUTE_MS;
}

/** Minutes between a ticket being opened and being resolved. */
export function resolutionMinutes(ticket: CyberTicket): number {
  return (Date.parse(ticket.resolvedAt) - Date.parse(ticket.openedAt)) / MINUTE_MS;
}

export type SlaSummary = {
  tickets: number;
  breached: number;
  withinSla: number;
  /** Mean time to acknowledge, in minutes, rounded to one decimal place. */
  mttaMins: number;
  /** Mean time to resolve, in minutes, rounded to one decimal place. */
  mttrMins: number;
  /** Share of tickets acknowledged inside their target, as a percentage. */
  slaAttainmentPercent: number;
};

/**
 * SLA and MTTA figures, computed from the ticket rows themselves so they can
 * never drift away from the table they summarise.
 */
export function getSlaSummary(memberId?: string, month?: string): SlaSummary {
  const rows = getTickets(memberId).filter((ticket) => month === undefined || ticket.month === month);
  const breached = rows.filter((ticket) => ticket.breached).length;
  const round = (value: number): number => Math.round(value * 10) / 10;
  const mean = (values: number[]): number =>
    values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;

  return {
    tickets: rows.length,
    breached,
    withinSla: rows.length - breached,
    mttaMins: round(mean(rows.map(acknowledgementMinutes))),
    mttrMins: round(mean(rows.map(resolutionMinutes))),
    slaAttainmentPercent: rows.length === 0 ? 100 : round(((rows.length - breached) / rows.length) * 100),
  };
}

/** Every ticket that missed its acknowledgement target. */
export function getBreachedTickets(memberId?: string): CyberTicket[] {
  return getTickets(memberId).filter((ticket) => ticket.breached);
}

/* ------------------------------------------------------------------ *
 * Incidents, retainer and reports.
 * ------------------------------------------------------------------ */

/** The incident log, for one member or for all of them. */
export function getIncidents(memberId?: string): CyberIncident[] {
  return forMember(INCIDENTS, memberId);
}

/** One incident by id, or `undefined`. */
export function getIncidentById(id: string): CyberIncident | undefined {
  return INCIDENTS.find((incident) => incident.id === id);
}

/** The open member action items across one member's incidents, or all of them. */
export function getOpenIncidentActions(memberId?: string): { id: string; owner: string }[] {
  return getIncidents(memberId).flatMap((incident) => incident.openActions);
}

/**
 * Retainer hours an incident response draws down: containment time rounded up
 * to the next half hour, plus two hours of forensics, reporting and debrief.
 * The generator applies this same rule, so the retainer ledger and the incident
 * log agree.
 */
export function incidentRetainerDraw(incident: CyberIncident): number {
  return Math.ceil(incident.containmentMins / 30) / 2 + 2;
}

/** The retainer ledger, for one member or for all of them. */
export function getRetainer(memberId?: string): RetainerRecord[] {
  return forMember(RETAINER, memberId);
}

/** One member's retainer record, or `undefined`. */
export function getRetainerForMember(memberId: string): RetainerRecord | undefined {
  return RETAINER.find((record) => record.memberId === memberId);
}

/** The report list, for one member or for all of them. */
export function getReports(memberId?: string): CyberReport[] {
  return forMember(REPORTS, memberId);
}

/** The incident reports, for one member or for all of them. */
export function getIncidentReports(memberId?: string): CyberReport[] {
  return getReports(memberId).filter((report) => report.kind === 'incident');
}

/* ------------------------------------------------------------------ *
 * Log sources and findings, with their freshness helpers.
 * ------------------------------------------------------------------ */

/** Hours between an ISO instant and the data set's fixed `NOW`. */
export function hoursSince(isoTimestamp: string): number {
  return (NOW_MS - Date.parse(isoTimestamp)) / HOUR_MS;
}

/** The telemetry sources, for one member or for all of them. */
export function getLogSources(memberId?: string): LogSource[] {
  return forMember(LOG_SOURCES, memberId);
}

/** Whether a source has gone quiet for longer than the silence threshold. */
export function isSilent(source: LogSource): boolean {
  return hoursSince(source.lastEventAt) > SILENT_SOURCE_HOURS;
}

/** One member's log sources that have been silent for more than 72 hours. */
export function getSilentSources(memberId: string): LogSource[] {
  return getLogSources(memberId).filter(isSilent);
}

/** The findings, for one member or for all of them. */
export function getFindings(memberId?: string): Finding[] {
  return forMember(FINDINGS, memberId);
}

/** Whether a finding is still open and past its due date at the fixed `NOW`. */
export function isOverdue(finding: Finding): boolean {
  return finding.status === 'open' && Date.parse(`${finding.dueDate}T00:00:00.000Z`) < NOW_MS;
}

/** One member's findings that are open and past their due date. */
export function getOverdueFindings(memberId: string): Finding[] {
  return getFindings(memberId).filter(isOverdue);
}

/** One member's overdue findings at a given severity. */
export function getOverdueFindingsBySeverity(memberId: string, severity: FindingSeverity): Finding[] {
  return getOverdueFindings(memberId).filter((finding) => finding.severity === severity);
}

/* ------------------------------------------------------------------ *
 * Advisories.
 * ------------------------------------------------------------------ */

/** Every advisory published in the window, oldest first. */
export function getAdvisories(): Advisory[] {
  return [...ADVISORIES];
}

/** One advisory by id, or `undefined`. */
export function getAdvisoryById(id: string): Advisory | undefined {
  return ADVISORIES.find((advisory) => advisory.id === id);
}

/** The advisories whose exposure includes a member, oldest first. */
export function getAdvisoriesForMember(memberId: string): Advisory[] {
  return ADVISORIES.filter((advisory) => advisory.affectedMemberIds.includes(memberId));
}

/** The members an advisory exposes, as member records, in the advisory's order. */
export function getMembersForAdvisory(advisoryId: string): CyberMember[] {
  const advisory = getAdvisoryById(advisoryId);
  if (advisory === undefined) return [];
  return advisory.affectedMemberIds
    .map((id) => getMemberById(id))
    .filter((member): member is CyberMember => member !== undefined);
}

/* ------------------------------------------------------------------ *
 * The cyber module shell: facilities, role scope and the derived rows
 * the /cyber screens read.
 *
 * Everything below comes out of `src/cyberData.json`, written by
 * `generate-cyber-fixtures.mjs` (`npm run gen:cyber-shell-fixtures`) from
 * the same committed mock data the selectors above expose. The bundle adds
 * what the shell needs and the mock data set does not carry: facilities,
 * several per member, and the facility each incident, finding and report
 * belongs to.
 * ------------------------------------------------------------------ */
import shellBundle from './cyberData.json';

/** A member's site. Every member screen is scoped to exactly one of these. */
export type Facility = { id: string; memberId: string; name: string; kind: string; city: string };

/** The three demo roles the /cyber shell offers. */
export type CyberRole = 'program-lead' | 'member-exec' | 'member-it';

/** A record that belongs to one facility of one member. */
export type FacilityScoped = { facilityId: string };

export type ScopedIncident = CyberIncident & FacilityScoped;
export type ScopedFinding = Finding & FacilityScoped;
export type ScopedReport = CyberReport & FacilityScoped;

/** One member's SLA / MTTA figures for one month. */
export type ServicePerformanceRow = {
  memberId: string;
  month: string;
  tickets: number;
  breached: number;
  slaAttainmentPercent: number;
  mttaMins: number;
  mttrMins: number;
};

/** One service tier as the catalogue screen shows it. */
export type CatalogueEntry = {
  id: string;
  name: string;
  services: string[];
  facilitySize: string;
  reportCadence: string;
  irRetainerHours: number;
  irTimeToEngageMinutes: number;
  memberCount: number;
};

type ShellBundle = {
  generator: string;
  kind: string;
  version: number;
  seed: number;
  months: string[];
  members: CyberMember[];
  facilities: Facility[];
  incidents: ScopedIncident[];
  findings: ScopedFinding[];
  reports: ScopedReport[];
  advisories: Advisory[];
  servicePerformance: ServicePerformanceRow[];
  catalogue: CatalogueEntry[];
};

const SHELL = shellBundle as unknown as ShellBundle;

/** The seed `src/cyberData.json` was generated from. */
export const SHELL_SEED: number = SHELL.seed;

/**
 * The member a demo member role signs in as. The demo has one member login,
 * so a member role is always this organisation until a facility of another
 * member is selected.
 */
export const DEFAULT_MEMBER_ID = 'mem-lakeshore';

/** The three roles, in the order the role switcher lists them. */
export const CYBER_ROLES: { id: CyberRole; label: string }[] = [
  { id: 'program-lead', label: 'HealthPRO Program Lead' },
  { id: 'member-exec', label: 'Member Executive' },
  { id: 'member-it', label: 'Member IT Lead' },
];

/** The label the role switcher shows for a role. */
export function roleLabel(role: CyberRole): string {
  return CYBER_ROLES.find((entry) => entry.id === role)?.label ?? role;
}

/** Whether a role signs in on behalf of a member rather than of HealthPRO. */
export function isMemberRole(role: CyberRole): boolean {
  return role === 'member-exec' || role === 'member-it';
}

/** Every facility in the data set, members in table order. */
export function getAllFacilities(): Facility[] {
  return [...SHELL.facilities];
}

/** The facilities of one member, in id order. */
export function getFacilities(memberId: string): Facility[] {
  return SHELL.facilities.filter((facility) => facility.memberId === memberId);
}

/** One facility by id, or `undefined`. */
export function getFacilityById(id: string | undefined): Facility | undefined {
  return id === undefined ? undefined : SHELL.facilities.find((facility) => facility.id === id);
}

/** The first facility of a member — what a member role starts scoped to. */
export function getDefaultFacilityId(memberId: string): string | undefined {
  return getFacilities(memberId)[0]?.id;
}

/**
 * The member a scope is acting for: the owner of the selected facility, or the
 * demo member login when a member role has not chosen one yet. A Program Lead
 * acts for no single member, so this is `undefined` for that role.
 */
export function activeMemberId(role: CyberRole, facilityId?: string): string | undefined {
  if (!isMemberRole(role)) return undefined;
  return getFacilityById(facilityId)?.memberId ?? DEFAULT_MEMBER_ID;
}

/** Every incident with its facility, for one member, one facility, or all. */
export function getScopedIncidents(memberId?: string, facilityId?: string): ScopedIncident[] {
  return SHELL.incidents.filter(
    (incident) =>
      (memberId === undefined || incident.memberId === memberId) &&
      (facilityId === undefined || incident.facilityId === facilityId),
  );
}

/** Every finding with its facility, for one member, one facility, or all. */
export function getScopedFindings(memberId?: string, facilityId?: string): ScopedFinding[] {
  return SHELL.findings.filter(
    (finding) =>
      (memberId === undefined || finding.memberId === memberId) &&
      (facilityId === undefined || finding.facilityId === facilityId),
  );
}

/** Every report with its facility, for one member, one facility, or all. */
export function getScopedReports(memberId?: string, facilityId?: string): ScopedReport[] {
  return SHELL.reports.filter(
    (report) =>
      (memberId === undefined || report.memberId === memberId) &&
      (facilityId === undefined || report.facilityId === facilityId),
  );
}

export type CyberScopeSelection = {
  members: CyberMember[];
  incidents: ScopedIncident[];
  findings: ScopedFinding[];
  reports: ScopedReport[];
  advisories: Advisory[];
};

/**
 * The single read path every /cyber screen uses.
 *
 * A Program Lead sees the whole portfolio. A member role sees its own
 * organisation only, and — once a facility is chosen in the header selector —
 * only the records of that facility. Nothing downstream filters again: a
 * screen shows what this returns.
 */
export function selectByScope(role: CyberRole, facilityId?: string): CyberScopeSelection {
  if (!isMemberRole(role)) {
    return {
      members: getMembers(),
      incidents: getScopedIncidents(),
      findings: getScopedFindings(),
      reports: getScopedReports(),
      advisories: getAdvisories(),
    };
  }

  const memberId = activeMemberId(role, facilityId) as string;
  const facility = getFacilityById(facilityId);
  const scopedFacilityId = facility?.memberId === memberId ? facility.id : undefined;
  const member = getMemberById(memberId);

  return {
    members: member === undefined ? [] : [member],
    incidents: getScopedIncidents(memberId, scopedFacilityId),
    findings: getScopedFindings(memberId, scopedFacilityId),
    reports: getScopedReports(memberId, scopedFacilityId),
    advisories: getAdvisoriesForMember(memberId),
  };
}

/** The SLA / MTTA rows, for one member or for all of them, oldest month first. */
export function getServicePerformance(memberId?: string): ServicePerformanceRow[] {
  return memberId === undefined
    ? [...SHELL.servicePerformance]
    : SHELL.servicePerformance.filter((row) => row.memberId === memberId);
}

/** The service tier catalogue entries, cheapest tier first. */
export function getCatalogue(): CatalogueEntry[] {
  return [...SHELL.catalogue];
}

/** The months the shell data covers, oldest first. */
export function getShellMonths(): string[] {
  return [...SHELL.months];
}

/** One row of the Program Lead portfolio summary. */
export type PortfolioRow = {
  memberId: string;
  memberName: string;
  tier: string;
  facilities: number;
  openIncidents: number;
  overdueFindings: number;
  postureGrade: string;
  slaAttainmentPercent: number;
};

/** The portfolio summary: one row per member, in member table order. */
export function getPortfolioRows(): PortfolioRow[] {
  const latestMonth = SHELL.months[SHELL.months.length - 1] as string;

  return getMembers().map((member) => {
    const performance = SHELL.servicePerformance.find(
      (row) => row.memberId === member.id && row.month === latestMonth,
    );
    return {
      memberId: member.id,
      memberName: member.name,
      tier: member.tier,
      facilities: getFacilities(member.id).length,
      openIncidents: getIncidents(member.id).filter(
        (incident) => incident.openActions.length > 0,
      ).length,
      overdueFindings: getOverdueFindings(member.id).length,
      postureGrade: getLatestPosture(member.id)?.grade ?? '—',
      slaAttainmentPercent: performance?.slaAttainmentPercent ?? 100,
    };
  });
}
