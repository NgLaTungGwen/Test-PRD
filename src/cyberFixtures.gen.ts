/**
 * Seeded generator for the cyber member mock data set.
 *
 * This script is the only producer of the `src/cyber<Entity>.json` fixtures the
 * cyber route group reads through `src/cyberData.ts`. It is deterministic by
 * construction: every value comes from a self-contained seeded PRNG or from a
 * fixed calendar constant, so two runs with the same seed write byte-identical
 * files. Nothing here reads the system clock, `Math.random`, or the network.
 *
 * The data set is the 8 fictional members of the PRD table, with six months of
 * history (May–October 2026) and eleven fixture entities:
 *
 *   members, tiers, funnelMonthly, tickets, incidents, logSources, findings,
 *   postureHistory, retainer, advisories, reports
 *
 * Funnel, ticket, SLA and MTTA figures are derived arithmetically from the one
 * generated ticket table, so they reconcile exactly rather than by luck, and the
 * scenario rules the PRD calls for are applied on top of the generated base:
 *
 *   - Lakeshore: a P1 intrusion that runs from a VPN login to credential
 *     dumping, contained 2h10m after detection, with three open member actions.
 *   - Riverbend: a phishing campaign, visible in its incident, its tickets and
 *     its findings.
 *   - Maple Grove: exactly 2 log sources silent for more than 72 hours and
 *     exactly 3 overdue critical findings.
 *   - A VPN appliance advisory whose exposure is exactly Lakeshore,
 *     St. Brendan's and Maple Grove.
 *   - Exactly 3 P2 SLA breaches across the whole data set.
 *
 * Run it with: `npm run gen:cyber-mock-data -- --seed=<n> --out=<dir>`
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ------------------------------------------------------------------ *
 * Shared constants: seed, calendar window and the fixed "now".
 * ------------------------------------------------------------------ */

/** The seed the committed `src/cyber*.json` fixtures were generated with. */
export const DEFAULT_SEED = 20260501;

/** Fixture file format version, written into every file. */
export const FIXTURE_FORMAT_VERSION = 1;

/** The directory the committed fixtures live in (this module's own directory). */
export const DEFAULT_OUT_DIR = dirname(fileURLToPath(import.meta.url));

/** The six months of history the data set covers, oldest first. */
export const MONTHS = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'] as const;

/**
 * The fixed "now" every freshness figure is measured against. The prototype has
 * no live clock: October 2026 is late in the window, so silence and overdue
 * findings are stable facts of the data rather than of the day it is read.
 */
export const NOW_ISO = '2026-10-31T09:00:00.000Z';

export const NOW_MS = Date.UTC(2026, 9, 31, 9, 0, 0, 0);

/** A log source is "silent" once this many hours have passed without an event. */
export const SILENT_SOURCE_HOURS = 72;

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/* ------------------------------------------------------------------ *
 * Types. These are the shapes the selector module re-exports.
 * ------------------------------------------------------------------ */

export type TierId = 'essentials' | 'standard' | 'advanced';
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

export type PostureHistoryPoint = {
  memberId: string;
  month: string;
  score: number;
  grade: Grade;
};

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
  /** Beyond the named interface: what the finding is, for the UI and reports. */
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

export type CyberMockKind =
  | 'members'
  | 'tiers'
  | 'postureHistory'
  | 'tickets'
  | 'funnelMonthly'
  | 'incidents'
  | 'logSources'
  | 'findings'
  | 'retainer'
  | 'advisories'
  | 'reports';

export type CyberMockFile<T> = {
  generator: string;
  kind: CyberMockKind;
  records: T[];
  seed: number;
  version: number;
};

/** The file each entity is written to, in generation order. */
export const MOCK_FILENAMES: Record<CyberMockKind, string> = {
  members: 'cyberMembers.json',
  tiers: 'cyberTiers.json',
  postureHistory: 'cyberPostureHistory.json',
  tickets: 'cyberTickets.json',
  funnelMonthly: 'cyberFunnelMonthly.json',
  incidents: 'cyberIncidents.json',
  logSources: 'cyberLogSources.json',
  findings: 'cyberFindings.json',
  retainer: 'cyberRetainer.json',
  advisories: 'cyberAdvisories.json',
  reports: 'cyberReports.json',
};

export const MOCK_KINDS: CyberMockKind[] = [
  'members',
  'tiers',
  'postureHistory',
  'tickets',
  'funnelMonthly',
  'incidents',
  'logSources',
  'findings',
  'retainer',
  'advisories',
  'reports',
];

/* ------------------------------------------------------------------ *
 * The PRD member table. Eight invented member organisations; nothing
 * here is, or is derived from, a real organisation or person.
 * ------------------------------------------------------------------ */

export type PrdMemberRow = CyberMember & { tier: TierId; octoberGrade: Grade };

export const LAKESHORE_ID = 'mem-lakeshore';
export const RIVERBEND_ID = 'mem-riverbend';
export const MAPLE_GROVE_ID = 'mem-maple-grove';
export const ST_BRENDANS_ID = 'mem-st-brendans';
export const NORTHERN_LIGHTS_ID = 'mem-northern-lights';
export const PINEHURST_ID = 'mem-pinehurst';
export const HARBOURVIEW_ID = 'mem-harbourview';
export const CEDAR_VALLEY_ID = 'mem-cedar-valley';

export const PRD_MEMBERS: readonly PrdMemberRow[] = [
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
    id: NORTHERN_LIGHTS_ID,
    name: 'Northern Lights Health Centre',
    type: 'Rural health centre',
    province: 'Manitoba',
    size: 'Small',
    tier: 'essentials',
    octoberGrade: 'C',
  },
  {
    id: PINEHURST_ID,
    name: 'Pinehurst Seniors Residence',
    type: 'Long-term care home',
    province: 'Saskatchewan',
    size: 'Small',
    tier: 'essentials',
    octoberGrade: 'C',
  },
  {
    id: HARBOURVIEW_ID,
    name: 'Harbourview Day Surgery Centre',
    type: 'Ambulatory surgery centre',
    province: 'Quebec',
    size: 'Medium',
    tier: 'standard',
    octoberGrade: 'B',
  },
  {
    id: CEDAR_VALLEY_ID,
    name: 'Cedar Valley Mental Health Partners',
    type: 'Mental health network',
    province: 'New Brunswick',
    size: 'Medium',
    tier: 'standard',
    octoberGrade: 'A',
  },
];

/** The service tiers the member table references. */
export const TIER_DEFINITIONS: readonly CyberTier[] = [
  {
    id: 'essentials',
    name: 'Essentials',
    services: [
      'Managed detection and response for endpoints and email',
      '8x5 analyst triage with out-of-hours escalation',
      'Quarterly posture report',
      'Annual tabletop exercise',
      '20 hours of incident response retainer',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    services: [
      'Managed detection and response for endpoints, email and cloud workloads',
      '24x7 analyst triage',
      'Monthly posture report and service review',
      'Two tabletop exercises a year',
      'Guided remediation support',
      '40 hours of incident response retainer',
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    services: [
      'Managed detection and response across endpoints, email, cloud and clinical device networks',
      '24x7 analyst triage with a named lead analyst',
      'Monthly posture report, service review and threat briefing',
      'Quarterly tabletop exercises and purple-team drills',
      'Hands-on remediation support',
      '60 hours of incident response retainer',
    ],
  },
];

/** Acknowledgement SLA target, in minutes, by tier and severity. */
export const SLA_TARGET_MINS: Record<TierId, Record<Severity, number>> = {
  essentials: { P1: 60, P2: 120, P3: 240, P4: 480 },
  standard: { P1: 30, P2: 60, P3: 120, P4: 240 },
  advanced: { P1: 15, P2: 30, P3: 60, P4: 120 },
};

/** Retainer hours each tier buys. */
export const RETAINER_HOURS: Record<TierId, number> = {
  essentials: 20,
  standard: 40,
  advanced: 60,
};

/** How many tickets a month a member of each size generates, before scenarios. */
const MONTHLY_TICKETS: Record<string, [number, number]> = {
  Large: [6, 9],
  Medium: [4, 6],
  Small: [2, 4],
};

/* ------------------------------------------------------------------ *
 * Seeded PRNG and deterministic helpers.
 * ------------------------------------------------------------------ */

/** mulberry32: a small, self-contained, fully deterministic PRNG. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function intBetween(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(random: () => number, pool: readonly T[]): T {
  return pool[Math.floor(random() * pool.length)] as T;
}

function identifier(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, '0')}`;
}

/** An ISO timestamp for an absolute epoch-milliseconds value. */
function iso(ms: number): string {
  return new Date(ms).toISOString();
}

/** An ISO calendar date (no time) for an absolute epoch-milliseconds value. */
function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** First instant of a `YYYY-MM` month, in UTC. */
export function monthStartMs(month: string): number {
  const [year, index] = month.split('-').map(Number) as [number, number];
  return Date.UTC(year, index - 1, 1, 0, 0, 0, 0);
}

/** Number of days in a `YYYY-MM` month. */
function daysInMonth(month: string): number {
  const [year, index] = month.split('-').map(Number) as [number, number];
  return Math.round((Date.UTC(year, index, 1) - Date.UTC(year, index - 1, 1)) / DAY_MS);
}

/** The `YYYY-MM` month an instant falls in. */
export function monthOf(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 7);
}

/** The posture grade a score maps to. */
export function gradeForScore(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
}

/** The inclusive score band a grade covers. */
export function scoreBandFor(grade: Grade): [number, number] {
  switch (grade) {
    case 'A':
      return [90, 97];
    case 'B':
      return [80, 89];
    case 'C':
      return [70, 79];
    case 'D':
      return [60, 69];
    case 'E':
      return [50, 59];
    default:
      return [38, 49];
  }
}

/**
 * Retainer hours an incident response draws down: the containment time rounded
 * up to the next half hour, plus two hours of forensics, reporting and debrief.
 */
export function retainerDrawHours(containmentMins: number): number {
  return Math.ceil(containmentMins / 30) / 2 + 2;
}

/** Deep-sorts object keys so serialisation order never depends on build order. */
function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) sorted[key] = sortDeep(source[key]);
    return sorted;
  }
  return value;
}

/** Stable JSON text: sorted keys, two-space indent, one trailing newline. */
export function serialiseMockFile<T>(file: CyberMockFile<T>): string {
  return `${JSON.stringify(sortDeep(file), null, 2)}\n`;
}

/* ------------------------------------------------------------------ *
 * The Lakeshore P1 scenario: the one hand-authored narrative in the
 * data set. Everything the acceptance criterion names is a constant.
 * ------------------------------------------------------------------ */

/** When the SOC raised the Lakeshore intrusion to P1 — containment runs from here. */
export const LAKESHORE_P1_DETECTED_AT = '2026-10-12T01:58:00.000Z';

/** Containment confirmed 2h10m after detection. */
export const LAKESHORE_P1_CONTAINMENT_MINS = 130;

export const LAKESHORE_P1_INCIDENT_ID = 'inc-001';

const LAKESHORE_P1_TIMELINE: { at: string; step: string }[] = [
  {
    at: '2026-10-12T01:42:00.000Z',
    step: 'VPN login: the remote access appliance accepts a successful single-factor login for a valid clinical staff account from an unrecognised overseas address.',
  },
  {
    at: LAKESHORE_P1_DETECTED_AT,
    step: 'Detection: impossible-travel VPN session correlated with the unpatched appliance advisory and raised to P1 by the SOC.',
  },
  {
    at: '2026-10-12T02:05:00.000Z',
    step: 'Acknowledged: on-call analyst engaged the member within the P1 target and opened a bridge with Lakeshore IT Operations.',
  },
  {
    at: '2026-10-12T02:21:00.000Z',
    step: 'Lateral movement: the VPN session pivots over SMB to a file server using the same stolen credentials.',
  },
  {
    at: '2026-10-12T02:44:00.000Z',
    step: 'Credential dumping: an unsigned process reads LSASS memory on the file server, harvesting cached domain credentials.',
  },
  {
    at: '2026-10-12T03:06:00.000Z',
    step: 'Containment begins: the VPN account is disabled, the appliance session is terminated and the file server is isolated from the network.',
  },
  {
    at: '2026-10-12T03:40:00.000Z',
    step: 'Credential reset: every account exposed by the dump is force-reset and the attacker address is blocked at the perimeter.',
  },
  {
    at: '2026-10-12T04:08:00.000Z',
    step: 'Contained: no further authentication from the attacker infrastructure; containment confirmed 2h10m after detection.',
  },
];

const LAKESHORE_P1_OPEN_ACTIONS: { id: string; owner: string }[] = [
  { id: 'act-001', owner: 'Lakeshore IT Operations' },
  { id: 'act-002', owner: 'Lakeshore Network Team' },
  { id: 'act-003', owner: 'Lakeshore Clinical Applications' },
];

/* ------------------------------------------------------------------ *
 * Builders.
 * ------------------------------------------------------------------ */

function buildMembers(): CyberMember[] {
  return PRD_MEMBERS.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    province: row.province,
    size: row.size,
    tier: row.tier,
  }));
}

function buildTiers(): CyberTier[] {
  return TIER_DEFINITIONS.map((tier) => ({ ...tier, services: [...tier.services] }));
}

function buildPostureHistory(random: () => number): PostureHistoryPoint[] {
  const points: PostureHistoryPoint[] = [];

  for (const member of PRD_MEMBERS) {
    const [low, high] = scoreBandFor(member.octoberGrade);
    const october = intBetween(random, low, high);
    // Six months of drift that lands on the PRD's October score exactly.
    const start = Math.max(32, Math.min(96, october - intBetween(random, 3, 9)));
    const scores: number[] = [];
    for (let index = 0; index < MONTHS.length - 1; index += 1) {
      const progress = index / (MONTHS.length - 1);
      const trend = start + (october - start) * progress;
      scores.push(Math.max(30, Math.min(98, Math.round(trend + intBetween(random, -2, 2)))));
    }
    scores.push(october);

    MONTHS.forEach((month, index) => {
      const score = scores[index] as number;
      points.push({ memberId: member.id, month, score, grade: gradeForScore(score) });
    });
  }

  return points;
}

type TicketDraft = CyberTicket & { sortKey: number };

function ticketTargetMins(tier: TierId, severity: Severity): number {
  return SLA_TARGET_MINS[tier][severity];
}

/** Minutes a ticket of this severity stays open after acknowledgement. */
function resolutionMinutes(random: () => number, severity: Severity): number {
  switch (severity) {
    case 'P1':
      return intBetween(random, 240, 600);
    case 'P2':
      return intBetween(random, 180, 540);
    case 'P3':
      return intBetween(random, 240, 1_440);
    default:
      return intBetween(random, 480, 2_880);
  }
}

function makeTicket(
  random: () => number,
  member: PrdMemberRow,
  month: string,
  severity: Severity,
  openedMs: number,
): TicketDraft {
  const target = ticketTargetMins(member.tier, severity);
  // Acknowledged comfortably inside the target: breaches are placed on purpose.
  const ackMins = Math.max(2, Math.round(target * (0.15 + random() * 0.6)));
  const resolveMins = ackMins + resolutionMinutes(random, severity);

  return {
    id: '',
    memberId: member.id,
    month,
    severity,
    openedAt: iso(openedMs),
    acknowledgedAt: iso(openedMs + ackMins * MINUTE_MS),
    resolvedAt: iso(openedMs + resolveMins * MINUTE_MS),
    slaTargetMins: target,
    breached: false,
    sortKey: openedMs,
  };
}

/**
 * Which members carry the seeded P2 acknowledgement breaches.
 *
 * Harbourview's breach is the one its October incident narrates; the other two
 * are taken from the generated P2 pool, from the first two of these members
 * that have a P2 to breach, so the count is exactly three whatever the seed.
 */
export const P2_BREACH_COUNT = 3;

const BREACH_MEMBER_ORDER: string[] = [
  MAPLE_GROVE_ID,
  RIVERBEND_ID,
  NORTHERN_LIGHTS_ID,
  PINEHURST_ID,
  CEDAR_VALLEY_ID,
  ST_BRENDANS_ID,
  LAKESHORE_ID,
];

function buildTickets(random: () => number): CyberTicket[] {
  const drafts: TicketDraft[] = [];

  for (const member of PRD_MEMBERS) {
    const [minPerMonth, maxPerMonth] = MONTHLY_TICKETS[member.size] as [number, number];

    for (const month of MONTHS) {
      const count = intBetween(random, minPerMonth, maxPerMonth);
      const start = monthStartMs(month);
      const days = daysInMonth(month);

      for (let index = 0; index < count; index += 1) {
        const roll = random();
        const severity: Severity = roll < 0.16 ? 'P2' : roll < 0.62 ? 'P3' : 'P4';
        const openedMs =
          start +
          intBetween(random, 0, days - 1) * DAY_MS +
          intBetween(random, 6, 20) * HOUR_MS +
          intBetween(random, 0, 59) * MINUTE_MS;
        drafts.push(makeTicket(random, member, month, severity, openedMs));
      }
    }
  }

  const breachOne = (draft: TicketDraft): void => {
    const openedMs = Date.parse(draft.openedAt);
    const overrunMins = draft.slaTargetMins + intBetween(random, 25, 70);
    draft.acknowledgedAt = iso(openedMs + overrunMins * MINUTE_MS);
    draft.resolvedAt = iso(openedMs + (overrunMins + resolutionMinutes(random, 'P2')) * MINUTE_MS);
    draft.breached = true;
  };

  // Scenario tickets: one per incident, so the incident log and the ticket
  // table tell the same story.
  const scenarioBreaches: TicketDraft[] = [];
  for (const scenario of SCENARIO_TICKETS) {
    const member = memberById(scenario.memberId);
    const openedMs = Date.parse(scenario.openedAt);
    const draft = makeTicket(random, member, monthOf(scenario.openedAt), scenario.severity, openedMs);
    draft.acknowledgedAt = iso(openedMs + scenario.ackMins * MINUTE_MS);
    draft.resolvedAt = iso(openedMs + scenario.resolveMins * MINUTE_MS);
    draft.breached = scenario.breachesSla === true;
    if (draft.breached) {
      if (draft.severity !== 'P2') {
        throw new Error(`scenario ticket for ${scenario.memberId}: only P2 breaches are seeded`);
      }
      if (scenario.ackMins <= draft.slaTargetMins) {
        throw new Error(
          `scenario ticket for ${scenario.memberId}: acknowledged inside its ${draft.slaTargetMins}m target`,
        );
      }
      scenarioBreaches.push(draft);
    }
    drafts.push(draft);
  }

  // Exactly three P2 acknowledgement breaches across the whole data set: the
  // scenario ones first, then one per member from the generated P2 pool.
  let remaining = P2_BREACH_COUNT - scenarioBreaches.length;
  if (remaining < 0) {
    throw new Error(`seeded scenario tickets already breach more than ${P2_BREACH_COUNT} times`);
  }

  for (const memberId of BREACH_MEMBER_ORDER) {
    if (remaining === 0) break;
    const candidates = drafts.filter(
      (draft) => draft.memberId === memberId && draft.severity === 'P2' && !draft.breached,
    );
    const chosen = candidates[candidates.length - 1];
    if (chosen === undefined) continue;
    breachOne(chosen);
    remaining -= 1;
  }

  if (remaining !== 0) {
    throw new Error(`could not place ${remaining} of the ${P2_BREACH_COUNT} seeded P2 SLA breaches`);
  }

  drafts.sort((left, right) =>
    left.sortKey === right.sortKey
      ? left.memberId.localeCompare(right.memberId)
      : left.sortKey - right.sortKey,
  );

  return drafts.map((draft, index) => ({
    id: identifier('tkt', index),
    memberId: draft.memberId,
    month: draft.month,
    severity: draft.severity,
    openedAt: draft.openedAt,
    acknowledgedAt: draft.acknowledgedAt,
    resolvedAt: draft.resolvedAt,
    slaTargetMins: draft.slaTargetMins,
    breached: draft.breached,
  }));
}

/**
 * The funnel, derived from the ticket table.
 *
 * `tickets` and `escalated` are the ticket count itself; the earlier stages are
 * multiples of it, so no funnel number can drift away from the tickets it came
 * from. Every count is an integer and the stages never widen downstream.
 */
function buildFunnel(random: () => number, tickets: CyberTicket[]): FunnelMonthRow[] {
  const rows: FunnelMonthRow[] = [];

  for (const member of PRD_MEMBERS) {
    for (const month of MONTHS) {
      const ticketCount = tickets.filter(
        (ticket) => ticket.memberId === member.id && ticket.month === month,
      ).length;

      const escalated = ticketCount;
      const triaged = escalated * intBetween(random, 4, 7) + intBetween(random, 0, 6);
      const alerts = triaged * intBetween(random, 3, 5) + intBetween(random, 0, 12);
      const events = alerts * intBetween(random, 900, 1_600) + intBetween(random, 0, 999);

      rows.push({ memberId: member.id, month, events, alerts, triaged, escalated, tickets: ticketCount });
    }
  }

  return rows;
}

type ScenarioTicket = {
  memberId: string;
  severity: Severity;
  openedAt: string;
  ackMins: number;
  resolveMins: number;
  breachesSla?: boolean;
};

/** One ticket per incident, opened when the incident was detected. */
const SCENARIO_TICKETS: ScenarioTicket[] = [
  { memberId: LAKESHORE_ID, severity: 'P1', openedAt: LAKESHORE_P1_DETECTED_AT, ackMins: 7, resolveMins: 452 },
  { memberId: RIVERBEND_ID, severity: 'P2', openedAt: '2026-09-15T08:12:00.000Z', ackMins: 21, resolveMins: 395 },
  { memberId: MAPLE_GROVE_ID, severity: 'P2', openedAt: '2026-08-07T22:35:00.000Z', ackMins: 54, resolveMins: 610 },
  { memberId: ST_BRENDANS_ID, severity: 'P2', openedAt: '2026-07-21T13:04:00.000Z', ackMins: 11, resolveMins: 268 },
  // Harbourview's P2 is acknowledged 82 minutes in, against a 60 minute target:
  // the overnight-handover breach its October incident narrates.
  {
    memberId: HARBOURVIEW_ID,
    severity: 'P2',
    openedAt: '2026-10-03T02:47:00.000Z',
    ackMins: 82,
    resolveMins: 330,
    breachesSla: true,
  },
];

function memberById(id: string): PrdMemberRow {
  const member = PRD_MEMBERS.find((row) => row.id === id);
  if (member === undefined) throw new Error(`unknown member id "${id}"`);
  return member;
}

function buildIncidents(): CyberIncident[] {
  return [
    {
      id: LAKESHORE_P1_INCIDENT_ID,
      memberId: LAKESHORE_ID,
      severity: 'P1',
      timeline: LAKESHORE_P1_TIMELINE.map((entry) => ({ ...entry })),
      containmentMins: LAKESHORE_P1_CONTAINMENT_MINS,
      openActions: LAKESHORE_P1_OPEN_ACTIONS.map((action) => ({ ...action })),
    },
    {
      id: 'inc-002',
      memberId: RIVERBEND_ID,
      severity: 'P2',
      timeline: [
        {
          at: '2026-09-15T07:56:00.000Z',
          step: 'Phishing campaign: 34 near-identical mails impersonating the payroll portal reach staff mailboxes from a look-alike domain.',
        },
        {
          at: '2026-09-15T08:12:00.000Z',
          step: 'Detection: the email gateway retro-scan flags the campaign and the SOC raises a P2.',
        },
        {
          at: '2026-09-15T08:33:00.000Z',
          step: 'Acknowledged: analyst confirms four staff submitted credentials to the harvesting page.',
        },
        {
          at: '2026-09-15T09:10:00.000Z',
          step: 'Containment: the campaign is purged from all mailboxes, the look-alike domain is blocked and the four accounts are reset with sessions revoked.',
        },
        {
          at: '2026-09-15T09:47:00.000Z',
          step: 'Contained: no successful sign-in from the harvesting infrastructure; awareness follow-up scheduled with the member.',
        },
      ],
      containmentMins: 95,
      openActions: [{ id: 'act-004', owner: 'Riverbend Practice Administration' }],
    },
    {
      id: 'inc-003',
      memberId: MAPLE_GROVE_ID,
      severity: 'P2',
      timeline: [
        {
          at: '2026-08-07T22:22:00.000Z',
          step: 'Malware detected on a shared nursing-station workstation after a USB drive is mounted out of hours.',
        },
        {
          at: '2026-08-07T22:35:00.000Z',
          step: 'Detection: endpoint agent quarantines the payload and the SOC raises a P2.',
        },
        {
          at: '2026-08-08T00:11:00.000Z',
          step: 'Containment: workstation isolated, USB device blocked estate-wide and the account re-imaged.',
        },
        {
          at: '2026-08-08T01:05:00.000Z',
          step: 'Contained: no onward connection observed; removable-media policy raised as a finding.',
        },
      ],
      containmentMins: 150,
      openActions: [
        { id: 'act-005', owner: 'Maple Grove Facilities IT' },
        { id: 'act-006', owner: 'Maple Grove Care Operations' },
      ],
    },
    {
      id: 'inc-004',
      memberId: ST_BRENDANS_ID,
      severity: 'P2',
      timeline: [
        {
          at: '2026-07-21T12:50:00.000Z',
          step: 'Unapproved remote access tool installed on a diagnostic imaging workstation by a third-party engineer.',
        },
        {
          at: '2026-07-21T13:04:00.000Z',
          step: 'Detection: the SOC raises a P2 on the unsigned remote access binary.',
        },
        {
          at: '2026-07-21T14:14:00.000Z',
          step: 'Contained: tool removed, vendor session re-established through the approved jump host, change logged with the member.',
        },
      ],
      containmentMins: 70,
      openActions: [],
    },
    {
      id: 'inc-005',
      memberId: HARBOURVIEW_ID,
      severity: 'P2',
      timeline: [
        {
          at: '2026-10-03T02:31:00.000Z',
          step: 'Out-of-hours administrator logon to the theatre scheduling server from a non-standard workstation.',
        },
        {
          at: '2026-10-03T02:47:00.000Z',
          step: 'Detection: the SOC raises a P2 and the acknowledgement target is missed during the overnight handover.',
        },
        {
          at: '2026-10-03T03:42:00.000Z',
          step: 'Contained: logon confirmed as an unsanctioned maintenance window; shared administrator account retired in favour of named accounts.',
        },
      ],
      containmentMins: 55,
      openActions: [{ id: 'act-007', owner: 'Harbourview Theatre Systems' }],
    },
  ];
}

/**
 * Telemetry source types, most universal first. A member takes the first four
 * (Small), six (Medium) or eight (Large) of these, plus the VPN appliance if it
 * is one of the members the VPN advisory exposes.
 */
const SOURCE_TYPES = [
  'firewall',
  'endpoint-detection',
  'identity-provider',
  'email-gateway',
  'backup-service',
  'clinical-device-network',
  'server-syslog',
  'vpn-appliance',
];

/** Maple Grove's two sources that have been silent for longer than 72 hours. */
const MAPLE_GROVE_SILENT_SOURCES: { type: string; cadenceHours: number; silentHours: number }[] = [
  { type: 'clinical-device-network', cadenceHours: 6, silentHours: 121 },
  { type: 'backup-service', cadenceHours: 24, silentHours: 207 },
];

function buildLogSources(random: () => number): LogSource[] {
  const sources: LogSource[] = [];
  let index = 0;

  for (const member of PRD_MEMBERS) {
    const types = SOURCE_TYPES.slice(0, member.size === 'Large' ? 8 : member.size === 'Medium' ? 6 : 4);
    if (VPN_ADVISORY_MEMBER_IDS.includes(member.id) && !types.includes('vpn-appliance')) {
      types.push('vpn-appliance');
    }

    for (const type of types) {
      const cadenceHours = type === 'backup-service' ? 24 : type === 'clinical-device-network' ? 6 : 1;
      // Healthy sources reported within the last few hours of the fixed "now".
      const quietMinutes = intBetween(random, 3, Math.min(240, cadenceHours * 60));
      sources.push({
        id: identifier('src', index),
        memberId: member.id,
        type,
        cadenceHours,
        lastEventAt: iso(NOW_MS - quietMinutes * MINUTE_MS),
      });
      index += 1;
    }
  }

  // Scenario: exactly two of Maple Grove's sources stopped reporting.
  for (const silent of MAPLE_GROVE_SILENT_SOURCES) {
    const source = sources.find(
      (candidate) => candidate.memberId === MAPLE_GROVE_ID && candidate.type === silent.type,
    );
    if (source === undefined) {
      throw new Error(`Maple Grove has no "${silent.type}" log source to silence`);
    }
    source.cadenceHours = silent.cadenceHours;
    source.lastEventAt = iso(NOW_MS - silent.silentHours * HOUR_MS);
  }

  // Scenario: Riverbend's email gateway carries the phishing campaign signal,
  // so the source feed and the incident agree.
  const riverbendGateway = sources.find(
    (candidate) => candidate.memberId === RIVERBEND_ID && candidate.type === 'email-gateway',
  );
  if (riverbendGateway !== undefined) {
    riverbendGateway.cadenceHours = 1;
    riverbendGateway.lastEventAt = iso(NOW_MS - intBetween(random, 5, 40) * MINUTE_MS);
  }

  return sources;
}

const FINDING_THEMES: { title: string; severity: FindingSeverity }[] = [
  { title: 'Multi-factor authentication not enforced for remote access', severity: 'high' },
  { title: 'Local administrator rights on shared clinical workstations', severity: 'medium' },
  { title: 'Backup restore test not evidenced this quarter', severity: 'medium' },
  { title: 'Joiner-mover-leaver reviews behind schedule', severity: 'low' },
  { title: 'Legacy TLS still enabled on the patient portal', severity: 'medium' },
  { title: 'Endpoint agent missing from four imaging workstations', severity: 'high' },
  { title: 'Guest wireless not segmented from the clinical network', severity: 'high' },
  { title: 'Password policy below the member baseline', severity: 'low' },
];

/** Maple Grove's three critical findings that are past due and still open. */
const MAPLE_GROVE_OVERDUE: { title: string; dueDate: string }[] = [
  // Raised off the 6 October VPN appliance advisory, so it falls due after it.
  { title: 'Remote access VPN appliance unpatched against the October advisory', dueDate: '2026-10-13' },
  { title: 'Domain administrator accounts without multi-factor authentication', dueDate: '2026-08-29' },
  { title: 'Backup server reachable from the general care-home network', dueDate: '2026-10-02' },
];

/** Riverbend's phishing-campaign findings, raised out of inc-002. */
const RIVERBEND_PHISHING_FINDINGS: {
  title: string;
  severity: FindingSeverity;
  dueDate: string;
  status: 'open' | 'closed';
}[] = [
  {
    title: 'Phishing campaign: payroll-portal look-alike domain harvested four staff credentials',
    severity: 'high',
    dueDate: '2026-11-13',
    status: 'open',
  },
  {
    title: 'Phishing campaign: mail gateway impersonation rules missing for the payroll sender',
    severity: 'medium',
    dueDate: '2026-11-20',
    status: 'open',
  },
  {
    title: 'Phishing campaign: security awareness refresher outstanding for affected staff',
    severity: 'low',
    dueDate: '2026-12-04',
    status: 'open',
  },
];

function buildFindings(random: () => number): Finding[] {
  const findings: Finding[] = [];
  let index = 0;

  const add = (finding: Omit<Finding, 'id'>): void => {
    findings.push({ id: identifier('fnd', index), ...finding });
    index += 1;
  };

  for (const member of PRD_MEMBERS) {
    const count = member.size === 'Large' ? 7 : member.size === 'Medium' ? 6 : 4;

    for (let slot = 0; slot < count; slot += 1) {
      const theme = FINDING_THEMES[(slot + PRD_MEMBERS.indexOf(member)) % FINDING_THEMES.length] as {
        title: string;
        severity: FindingSeverity;
      };
      // Every generated finding is either already closed or not yet due, so the
      // only overdue-and-open criticals in the data set are Maple Grove's.
      const closed = random() < 0.55;
      const dueMs = closed
        ? monthStartMs('2026-06') + intBetween(random, 0, 120) * DAY_MS
        : NOW_MS + intBetween(random, 6, 90) * DAY_MS;

      add({
        memberId: member.id,
        title: theme.title,
        severity: theme.severity,
        dueDate: isoDay(dueMs),
        status: closed ? 'closed' : 'open',
      });
    }
  }

  // Scenario: Riverbend's phishing campaign, as posture findings.
  for (const phishing of RIVERBEND_PHISHING_FINDINGS) {
    add({
      memberId: RIVERBEND_ID,
      title: phishing.title,
      severity: phishing.severity,
      dueDate: phishing.dueDate,
      status: phishing.status,
    });
  }

  // Scenario: exactly three overdue, still-open critical findings for Maple Grove.
  for (const overdue of MAPLE_GROVE_OVERDUE) {
    add({
      memberId: MAPLE_GROVE_ID,
      title: overdue.title,
      severity: 'critical',
      dueDate: overdue.dueDate,
      status: 'open',
    });
  }

  // A closed critical and a not-yet-due critical elsewhere, so "critical" alone
  // is never what makes Maple Grove's three findings overdue.
  add({
    memberId: ST_BRENDANS_ID,
    title: 'Emergency change process bypassed for a theatre system patch',
    severity: 'critical',
    dueDate: '2026-08-14',
    status: 'closed',
  });
  add({
    memberId: LAKESHORE_ID,
    title: 'Remote access VPN appliance patch rollout pending final cluster',
    severity: 'critical',
    dueDate: '2026-11-21',
    status: 'open',
  });

  return findings;
}

function buildRetainer(random: () => number, incidents: CyberIncident[]): RetainerRecord[] {
  return PRD_MEMBERS.map((member) => {
    const purchasedHours = RETAINER_HOURS[member.tier];
    const incidentHours = incidents
      .filter((incident) => incident.memberId === member.id)
      .reduce((total, incident) => total + retainerDrawHours(incident.containmentMins), 0);
    const advisoryHours = intBetween(random, 2, 6) + intBetween(random, 0, 1) / 2;
    const consumedHours = Math.min(purchasedHours, Math.round((incidentHours + advisoryHours) * 2) / 2);

    return { memberId: member.id, purchasedHours, consumedHours };
  });
}

export const VPN_ADVISORY_ID = 'adv-004';

/** The members the VPN appliance advisory exposes, in PRD table order. */
export const VPN_ADVISORY_MEMBER_IDS: string[] = [LAKESHORE_ID, ST_BRENDANS_ID, MAPLE_GROVE_ID];

function buildAdvisories(): Advisory[] {
  return [
    {
      id: 'adv-001',
      title: 'Credential-harvesting campaign targeting healthcare payroll portals',
      publishedAt: '2026-05-14T09:00:00.000Z',
      severity: 'medium',
      summary:
        'A long-running phishing campaign is impersonating payroll and benefits portals at care providers, using look-alike domains registered days before each wave.',
      action:
        'Add impersonation rules for payroll senders at the mail gateway and brief staff on the look-alike domain pattern.',
      affectedMemberIds: [RIVERBEND_ID, PINEHURST_ID, CEDAR_VALLEY_ID],
    },
    {
      id: 'adv-002',
      title: 'Ransomware operators abusing unmanaged removable media in care homes',
      publishedAt: '2026-06-23T09:00:00.000Z',
      severity: 'high',
      summary:
        'Loader malware is being delivered on USB media left at shared nursing stations, then quarantined only where endpoint agents are current.',
      action: 'Block unknown removable media estate-wide and confirm endpoint agent coverage on shared workstations.',
      affectedMemberIds: [MAPLE_GROVE_ID, PINEHURST_ID, NORTHERN_LIGHTS_ID],
    },
    {
      id: 'adv-003',
      title: 'Unsigned remote-support tooling used by imaging service engineers',
      publishedAt: '2026-07-09T09:00:00.000Z',
      severity: 'medium',
      summary:
        'Third-party engineers are installing unapproved remote-support tools on diagnostic imaging workstations, bypassing the approved jump host.',
      action: 'Block unapproved remote-support binaries and route vendor sessions through the approved jump host.',
      affectedMemberIds: [ST_BRENDANS_ID, LAKESHORE_ID, HARBOURVIEW_ID],
    },
    {
      id: VPN_ADVISORY_ID,
      title: 'Authentication bypass in a remote-access VPN appliance (exploited in the wild)',
      publishedAt: '2026-10-06T09:00:00.000Z',
      severity: 'critical',
      summary:
        'A pre-authentication bypass in a widely deployed remote-access VPN appliance allows a valid-looking session to be established without the second factor. Exploitation has been observed against healthcare members running the affected firmware, and the three members below are confirmed to run it.',
      action:
        'Apply the vendor firmware update to every affected appliance, force-reset remote access credentials and review VPN authentication logs for sessions from unrecognised networks.',
      affectedMemberIds: [...VPN_ADVISORY_MEMBER_IDS],
    },
    {
      id: 'adv-005',
      title: 'Credential dumping follow-on activity after remote-access compromise',
      publishedAt: '2026-10-14T09:00:00.000Z',
      severity: 'critical',
      summary:
        'Intrusions that begin at a compromised remote-access session are moving to file servers within the hour and dumping LSASS memory for cached domain credentials.',
      action:
        'Enable credential guard on file servers, alert on LSASS access by unsigned processes and force-reset any credentials cached on an affected host.',
      affectedMemberIds: [LAKESHORE_ID, ST_BRENDANS_ID],
    },
    {
      id: 'adv-006',
      title: 'Silent telemetry loss after clinical network maintenance windows',
      publishedAt: '2026-10-22T09:00:00.000Z',
      severity: 'medium',
      summary:
        'Clinical device and backup collectors are failing to restart after scheduled maintenance, leaving the member with no detection coverage on those sources.',
      action: 'Confirm every collector resumed after maintenance and alert on sources quiet for more than 72 hours.',
      affectedMemberIds: [MAPLE_GROVE_ID, NORTHERN_LIGHTS_ID, HARBOURVIEW_ID, CEDAR_VALLEY_ID],
    },
  ];
}

const MONTH_LABELS: Record<string, string> = {
  '2026-05': 'May 2026',
  '2026-06': 'June 2026',
  '2026-07': 'July 2026',
  '2026-08': 'August 2026',
  '2026-09': 'September 2026',
  '2026-10': 'October 2026',
};

function buildReports(incidents: CyberIncident[]): CyberReport[] {
  const reports: CyberReport[] = [];
  let index = 0;

  for (const member of PRD_MEMBERS) {
    for (const month of MONTHS) {
      reports.push({
        id: identifier('rpt', index),
        memberId: member.id,
        month,
        kind: 'monthly',
        title: `${MONTH_LABELS[month] as string} security service report — ${member.name}`,
      });
      index += 1;
    }
  }

  for (const incident of incidents) {
    const member = memberById(incident.memberId);
    const detectedAt = incident.timeline[0]?.at ?? `${MONTHS[0] as string}-01T00:00:00.000Z`;
    const month = monthOf(detectedAt);
    reports.push({
      id: identifier('rpt', index),
      memberId: incident.memberId,
      month,
      kind: 'incident',
      title: `${incident.severity} incident report ${incident.id} — ${member.name} (${MONTH_LABELS[month] as string})`,
    });
    index += 1;
  }

  return reports;
}

/* ------------------------------------------------------------------ *
 * Assembly, with the scenario rules asserted before anything is written.
 * ------------------------------------------------------------------ */

export type CyberMockData = {
  members: CyberMember[];
  tiers: CyberTier[];
  postureHistory: PostureHistoryPoint[];
  tickets: CyberTicket[];
  funnelMonthly: FunnelMonthRow[];
  incidents: CyberIncident[];
  logSources: LogSource[];
  findings: Finding[];
  retainer: RetainerRecord[];
  advisories: Advisory[];
  reports: CyberReport[];
};

/** Hours between an ISO instant and the fixed "now". */
export function hoursSince(isoTimestamp: string, nowMs: number = NOW_MS): number {
  return (nowMs - Date.parse(isoTimestamp)) / HOUR_MS;
}

/**
 * Refuses to write a data set that breaks a rule the PRD states. These are the
 * invariants the spec asserts; checking them here means a seed change can never
 * quietly produce a data set that contradicts the brief.
 */
export function assertScenarioRules(data: CyberMockData): void {
  const problems: string[] = [];

  if (data.members.length !== 8) problems.push(`members: expected 8, got ${data.members.length}`);

  const breaches = data.tickets.filter((ticket) => ticket.breached);
  if (breaches.length !== 3) problems.push(`SLA breaches: expected 3, got ${breaches.length}`);
  if (breaches.some((ticket) => ticket.severity !== 'P2')) {
    problems.push('SLA breaches: every seeded breach must be a P2');
  }

  for (const ticket of data.tickets) {
    const ackMins = (Date.parse(ticket.acknowledgedAt) - Date.parse(ticket.openedAt)) / MINUTE_MS;
    if (ticket.breached !== ackMins > ticket.slaTargetMins) {
      problems.push(`${ticket.id}: breached flag disagrees with its acknowledgement time`);
    }
    if (Date.parse(ticket.resolvedAt) < Date.parse(ticket.acknowledgedAt)) {
      problems.push(`${ticket.id}: resolved before it was acknowledged`);
    }
  }

  for (const row of data.funnelMonthly) {
    const counted = data.tickets.filter(
      (ticket) => ticket.memberId === row.memberId && ticket.month === row.month,
    ).length;
    if (row.tickets !== counted || row.escalated !== counted) {
      problems.push(`funnel ${row.memberId}/${row.month}: ${row.tickets} tickets against ${counted} rows`);
    }
    if (!(row.events >= row.alerts && row.alerts >= row.triaged && row.triaged >= row.escalated)) {
      problems.push(`funnel ${row.memberId}/${row.month}: stages do not narrow`);
    }
  }

  const lakeshore = data.incidents.find((incident) => incident.id === LAKESHORE_P1_INCIDENT_ID);
  if (lakeshore === undefined) {
    problems.push('incidents: the Lakeshore P1 incident is missing');
  } else {
    if (lakeshore.containmentMins !== LAKESHORE_P1_CONTAINMENT_MINS) {
      problems.push(`${lakeshore.id}: containment is not 2h10m`);
    }
    if (lakeshore.openActions.length !== 3) {
      problems.push(`${lakeshore.id}: expected 3 open member actions`);
    }
  }

  const silent = data.logSources.filter(
    (source) => source.memberId === MAPLE_GROVE_ID && hoursSince(source.lastEventAt) > SILENT_SOURCE_HOURS,
  );
  if (silent.length !== 2) problems.push(`Maple Grove: expected 2 silent sources, got ${silent.length}`);

  const otherSilent = data.logSources.filter(
    (source) => source.memberId !== MAPLE_GROVE_ID && hoursSince(source.lastEventAt) > SILENT_SOURCE_HOURS,
  );
  if (otherSilent.length !== 0) {
    problems.push(`log sources: ${otherSilent.length} silent sources outside Maple Grove`);
  }

  const overdue = data.findings.filter(
    (finding) =>
      finding.memberId === MAPLE_GROVE_ID &&
      finding.severity === 'critical' &&
      finding.status === 'open' &&
      Date.parse(`${finding.dueDate}T00:00:00.000Z`) < NOW_MS,
  );
  if (overdue.length !== 3) {
    problems.push(`Maple Grove: expected 3 overdue critical findings, got ${overdue.length}`);
  }

  const vpn = data.advisories.find((advisory) => advisory.id === VPN_ADVISORY_ID);
  if (vpn === undefined) {
    problems.push('advisories: the VPN appliance advisory is missing');
  } else if (vpn.affectedMemberIds.join(',') !== VPN_ADVISORY_MEMBER_IDS.join(',')) {
    problems.push('advisories: the VPN appliance advisory exposes the wrong members');
  }

  for (const record of data.retainer) {
    if (record.consumedHours > record.purchasedHours) {
      problems.push(`${record.memberId}: consumed more retainer hours than were purchased`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`cyber mock data breaks its scenario rules:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
}

/** Builds the whole data set for a seed, without touching the disk. */
export function buildMockData(seed: number = DEFAULT_SEED): CyberMockData {
  const random = createRandom(seed);

  const members = buildMembers();
  const tiers = buildTiers();
  const postureHistory = buildPostureHistory(random);
  const tickets = buildTickets(random);
  const funnelMonthly = buildFunnel(random, tickets);
  const incidents = buildIncidents();
  const logSources = buildLogSources(random);
  const findings = buildFindings(random);
  const retainer = buildRetainer(random, incidents);
  const advisories = buildAdvisories();
  const reports = buildReports(incidents);

  const data: CyberMockData = {
    members,
    tiers,
    postureHistory,
    tickets,
    funnelMonthly,
    incidents,
    logSources,
    findings,
    retainer,
    advisories,
    reports,
  };

  assertScenarioRules(data);
  return data;
}

/** Wraps each entity's records in the committed file envelope. */
export function buildMockFiles(seed: number = DEFAULT_SEED): Record<CyberMockKind, CyberMockFile<unknown>> {
  const data = buildMockData(seed);
  const files = {} as Record<CyberMockKind, CyberMockFile<unknown>>;

  for (const kind of MOCK_KINDS) {
    files[kind] = {
      generator: 'src/cyberFixtures.gen.ts',
      kind,
      records: data[kind] as unknown[],
      seed,
      version: FIXTURE_FORMAT_VERSION,
    };
  }

  return files;
}

/** Writes every fixture file for `seed` into `outDir`. Returns the paths, sorted. */
export async function generate(
  seed: number = DEFAULT_SEED,
  outDir: string = DEFAULT_OUT_DIR,
): Promise<string[]> {
  const files = buildMockFiles(seed);
  await mkdir(outDir, { recursive: true });

  const written: string[] = [];
  for (const kind of MOCK_KINDS) {
    const target = join(outDir, MOCK_FILENAMES[kind]);
    await writeFile(target, serialiseMockFile(files[kind]), 'utf8');
    written.push(target);
  }

  return written.sort();
}

/* ------------------------------------------------------------------ *
 * CLI entry point.
 * ------------------------------------------------------------------ */

export type CyberMockArgv = { seed?: string; out?: string };

/** Parses `--seed=<n> --out=<dir>` (and the two-token forms) out of argv. */
export function parseArgv(argv: readonly string[]): CyberMockArgv {
  const parsed: CyberMockArgv = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] as string;
    const [flag, inline] = token.includes('=') ? token.split(/=(.*)/s) : [token, undefined];
    const next = (): string | undefined => {
      if (inline !== undefined) return inline;
      index += 1;
      return argv[index];
    };
    if (flag === '--seed') parsed.seed = next();
    if (flag === '--out') parsed.out = next();
  }

  return parsed;
}

/** Runs the generator from parsed arguments. Resolves to the process exit code. */
export async function main(argv: CyberMockArgv = parseArgv(process.argv.slice(2))): Promise<number> {
  const rawSeed = argv.seed ?? process.env.CYBER_MOCK_SEED;
  const seed = rawSeed === undefined ? DEFAULT_SEED : Number(rawSeed);

  if (!Number.isFinite(seed) || !Number.isInteger(seed)) {
    process.stderr.write(`gen:cyber-mock-data: seed must be an integer, got "${String(rawSeed)}"\n`);
    return 1;
  }

  const outDir = argv.out === undefined ? DEFAULT_OUT_DIR : resolve(argv.out);
  const written = await generate(seed, outDir);

  process.stdout.write(`gen:cyber-mock-data: seed ${seed} -> ${outDir}\n`);
  for (const file of written) process.stdout.write(`  ${file}\n`);
  return 0;
}

const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === 'string' &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      process.stderr.write(`gen:cyber-mock-data: ${String(error)}\n`);
      process.exitCode = 1;
    },
  );
}
