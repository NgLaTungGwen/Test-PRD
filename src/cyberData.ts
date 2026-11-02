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
