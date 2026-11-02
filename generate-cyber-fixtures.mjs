#!/usr/bin/env node
/**
 * Deterministic generator for the cyber module shell's fixture file.
 *
 * It emits `src/cyberData.json`: the one bundle every /cyber screen reads
 * through `src/cyberData.ts`. The bundle adds the thing the shell needs and
 * the committed mock data set does not carry — facilities, several per member,
 * and a facility for every incident, finding and report — plus the derived
 * service-performance and catalogue rows the Program Lead screens show.
 *
 * Determinism. The only inputs are the committed mock-data JSON files beside
 * `src/cyberData.ts` and the seed. Nothing here reads the clock, calls
 * `Math.random()` or touches the network, so running it twice on the same seed
 * writes the same bytes, and `npm run gen:cyber-shell-fixtures` over a clean
 * tree leaves the tree clean.
 *
 * Usage:
 *   node generate-cyber-fixtures.mjs [--seed <int>] [--out <dir>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** The seed the committed `src/cyberData.json` was written from. */
export const DEFAULT_SEED = 20260401;

/** Where the committed bundle lives, relative to this script. */
export const DEFAULT_OUT_DIR = join(HERE, 'src');

export const OUTPUT_FILENAME = 'cyberData.json';

/** The schema version of the emitted bundle. */
export const BUNDLE_VERSION = 1;

/* ------------------------------------------------------------------ *
 * A small seeded PRNG. mulberry32: 32 bits of state, no dependencies,
 * identical sequence for an identical seed on every platform.
 * ------------------------------------------------------------------ */
function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)];
}

function readJson(name) {
  return JSON.parse(readFileSync(join(HERE, 'src', name), 'utf8'));
}

/* ------------------------------------------------------------------ *
 * Facilities. Two or three per member, named after the member so a
 * reader can always tell which organisation a facility belongs to, and
 * always obviously fictional.
 * ------------------------------------------------------------------ */

const SITE_NAMES = [
  'Main Campus',
  'North Campus',
  'Riverside Site',
  'Westgate Clinic',
  'Lakeview Annex',
  'Eastfield Site',
];

const SITE_KINDS = ['Acute site', 'Ambulatory site', 'Administrative site', 'Residential site'];

function buildFacilities(members, random) {
  const facilities = [];
  let counter = 0;

  for (const member of members) {
    const count = 2 + Math.floor(random() * 2); // 2 or 3 facilities per member
    const names = [...SITE_NAMES];

    for (let index = 0; index < count; index += 1) {
      const name = names.splice(Math.floor(random() * names.length), 1)[0];
      counter += 1;
      facilities.push({
        id: `fac-${String(counter).padStart(3, '0')}`,
        memberId: member.id,
        name: `${member.name} — ${name}`,
        kind: pick(random, SITE_KINDS),
        city: member.province,
      });
    }
  }

  return facilities;
}

function facilitiesOf(facilities, memberId) {
  return facilities.filter((facility) => facility.memberId === memberId);
}

/**
 * Spread a member's records across that member's facilities, round-robin from
 * a seeded start, so every facility holds some of the member's work and the
 * split never depends on insertion order alone.
 */
function assignFacilities(rows, facilities, random) {
  const cursors = new Map();

  return rows.map((row) => {
    const own = facilitiesOf(facilities, row.memberId);
    if (own.length === 0) return { ...row, facilityId: null };
    if (!cursors.has(row.memberId)) cursors.set(row.memberId, Math.floor(random() * own.length));
    const cursor = cursors.get(row.memberId);
    cursors.set(row.memberId, cursor + 1);
    return { ...row, facilityId: own[cursor % own.length].id };
  });
}

/* ------------------------------------------------------------------ *
 * Derived rows: service performance per member and month, catalogue
 * entries per tier.
 * ------------------------------------------------------------------ */

const MINUTE_MS = 60_000;

function round1(value) {
  return Math.round(value * 10) / 10;
}

function mean(values) {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

function buildServicePerformance(members, tickets, months) {
  const rows = [];

  for (const member of members) {
    for (const month of months) {
      const own = tickets.filter(
        (ticket) => ticket.memberId === member.id && ticket.month === month,
      );
      const breached = own.filter((ticket) => ticket.breached).length;
      rows.push({
        memberId: member.id,
        month,
        tickets: own.length,
        breached,
        slaAttainmentPercent:
          own.length === 0 ? 100 : round1(((own.length - breached) / own.length) * 100),
        mttaMins: round1(
          mean(
            own.map(
              (ticket) =>
                (Date.parse(ticket.acknowledgedAt) - Date.parse(ticket.openedAt)) / MINUTE_MS,
            ),
          ),
        ),
        mttrMins: round1(
          mean(
            own.map(
              (ticket) => (Date.parse(ticket.resolvedAt) - Date.parse(ticket.openedAt)) / MINUTE_MS,
            ),
          ),
        ),
      });
    }
  }

  return rows;
}

function buildCatalogue(tiers, tierDefinitions, members) {
  return tiers.map((tier) => {
    const definition = tierDefinitions.find((entry) => entry.id === tier.id);
    return {
      id: tier.id,
      name: tier.name,
      services: [...tier.services],
      facilitySize: definition?.facilitySize ?? '',
      reportCadence: definition?.reportCadence ?? '',
      irRetainerHours: definition?.irRetainerHours ?? 0,
      irTimeToEngageMinutes: definition?.irTimeToEngageMinutes ?? 0,
      memberCount: members.filter((member) => member.tier === tier.id).length,
    };
  });
}

/* ------------------------------------------------------------------ *
 * The bundle.
 * ------------------------------------------------------------------ */

export function buildBundle(seed = DEFAULT_SEED) {
  const random = mulberry32(seed);

  const members = readJson('cyberMembers.json').records;
  const incidents = readJson('cyberIncidents.json').records;
  const findings = readJson('cyberFindings.json').records;
  const reports = readJson('cyberReports.json').records;
  const advisories = readJson('cyberAdvisories.json').records;
  const tickets = readJson('cyberTickets.json').records;
  const tiers = readJson('cyberTiers.json').records;
  const tierDefinitions = readJson('tiers.json').tiers;

  const months = [...new Set(tickets.map((ticket) => ticket.month))].sort();
  const facilities = buildFacilities(members, random);

  return {
    generator: 'generate-cyber-fixtures.mjs',
    kind: 'cyber-shell-bundle',
    version: BUNDLE_VERSION,
    seed,
    months,
    members: members.map((member) => ({ ...member })),
    facilities,
    incidents: assignFacilities(incidents, facilities, random),
    findings: assignFacilities(findings, facilities, random),
    reports: assignFacilities(reports, facilities, random),
    advisories: advisories.map((advisory) => ({ ...advisory })),
    servicePerformance: buildServicePerformance(members, tickets, months),
    catalogue: buildCatalogue(tiers, tierDefinitions, members),
  };
}

export function serialiseBundle(bundle) {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}

export function generate(seed = DEFAULT_SEED, outDir = DEFAULT_OUT_DIR) {
  const target = resolve(outDir, OUTPUT_FILENAME);
  writeFileSync(target, serialiseBundle(buildBundle(seed)), 'utf8');
  return target;
}

function parseArgv(argv) {
  const options = { seed: DEFAULT_SEED, out: DEFAULT_OUT_DIR };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--seed') options.seed = Number.parseInt(argv[(index += 1)], 10);
    else if (flag === '--out') options.out = argv[(index += 1)];
  }
  if (!Number.isInteger(options.seed)) throw new Error('--seed must be an integer');
  return options;
}

const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const { seed, out } = parseArgv(process.argv.slice(2));
  const written = generate(seed, out);
  process.stdout.write(`wrote ${written} (seed ${seed})\n`);
}
