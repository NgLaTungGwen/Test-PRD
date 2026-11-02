/**
 * Seeded generator for the cyber module's static fixture data.
 *
 * The prototype ships its cyber data as committed JSON fixtures: nothing is
 * generated at runtime and nothing is fetched from anywhere. This script is the
 * one place those fixtures come from. It is deterministic by construction —
 * every value is drawn from a self-contained seeded PRNG or from a fixed epoch
 * constant, so running it twice with the same seed writes byte-identical files.
 *
 * Deliberately avoided, and asserted against by the spec beside it:
 * `Math.random`, `Date.now`, the system clock, the network, and any data source
 * outside this file. Every name it emits comes from the invented pools below
 * and carries the synthetic marker, so no real organisation, client or vendor
 * name can reach the committed fixtures.
 *
 * Run it with: `npm run gen:cyber-fixtures -- --seed=<n> --out=<dir>`
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type CyberFixtureKind = 'facility' | 'vendor' | 'incident' | 'control';

export type CyberFixtureRecord = {
  id: string;
  kind: CyberFixtureKind;
  name: string;
  [key: string]: unknown;
};

export type CyberFixtureFile = {
  generator: string;
  kind: CyberFixtureKind;
  records: CyberFixtureRecord[];
  seed: number;
  version: number;
};

/** The seed the committed fixtures under `src/cyber-*.json` were generated with. */
export const DEFAULT_SEED = 20240917;

/** Every generated name carries this marker, so no name can read as a real one. */
export const SYNTHETIC_NAME_MARKER = '(Fictional)';

/** Fixture file format version, written into every file. */
export const FIXTURE_FORMAT_VERSION = 1;

/** The fixture file each kind is written to. */
export const FIXTURE_FILENAMES: Record<CyberFixtureKind, string> = {
  facility: 'cyber-facilities.json',
  vendor: 'cyber-vendors.json',
  incident: 'cyber-incidents.json',
  control: 'cyber-controls.json',
};

export const FIXTURE_KINDS: CyberFixtureKind[] = ['facility', 'vendor', 'incident', 'control'];

/** The directory the committed fixtures live in (this module's own directory). */
export const DEFAULT_OUT_DIR = dirname(fileURLToPath(import.meta.url));

/** Fixed clock: every date in the fixtures is an offset from this instant. */
const EPOCH_MS = Date.UTC(2024, 0, 1, 0, 0, 0, 0);

const DAY_MS = 86_400_000;

const HOW_MANY: Record<CyberFixtureKind, number> = {
  facility: 6,
  vendor: 8,
  incident: 12,
  control: 10,
};

/* ------------------------------------------------------------------ *
 * Invented name pools. Nothing here is, or is derived from, a real
 * organisation, client, vendor, person or system.
 * ------------------------------------------------------------------ */

const PLACE_WORDS = [
  'Aldermere',
  'Brightfen',
  'Caldermoor',
  'Dunhollow',
  'Elderwyn',
  'Fernlowe',
  'Glimmerbrook',
  'Hollowmere',
  'Ivyholt',
  'Jarrowfield',
  'Kestrelvale',
  'Larkmoor',
];

const FACILITY_TYPES = [
  'Care Campus',
  'Health Pavilion',
  'Community Clinic',
  'Day Surgery Annexe',
  'Residential Lodge',
  'Wellbeing Centre',
];

const REGIONS = [
  'North Quadrant',
  'South Quadrant',
  'East Quadrant',
  'West Quadrant',
  'Central Quadrant',
];

const SITE_PROFILES = ['Acute', 'Sub-acute', 'Residential', 'Outpatient'];

const TIERS = ['essentials', 'standard', 'advanced'];

const VENDOR_WORDS = [
  'Zephyrine',
  'Quillstone',
  'Marrowgate',
  'Vantabrook',
  'Nimbuscale',
  'Oakrift',
  'Pellucid',
  'Thornvale',
  'Umberlight',
  'Wyndholt',
];

const VENDOR_TRADES = [
  'Security Labs',
  'Managed Defence',
  'Cloud Works',
  'Data Guild',
  'Network Forge',
  'Identity Works',
];

const VENDOR_CATEGORIES = [
  'Managed detection and response',
  'Endpoint protection',
  'Email filtering',
  'Identity and access',
  'Backup and recovery',
  'Clinical device support',
  'Network infrastructure',
  'Application hosting',
];

const CRITICALITIES = ['low', 'moderate', 'high', 'critical'];

const INCIDENT_THEMES = [
  'Credential phishing wave',
  'Unpatched edge appliance',
  'Suspicious administrator logon',
  'Malware quarantined on shared workstation',
  'Clinical device left on default password',
  'Unexpected outbound data transfer',
  'Shared account used out of hours',
  'Backup job failed silently',
];

const INCIDENT_STATUSES = ['triage', 'investigating', 'contained', 'closed'];

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

const CONTROL_THEMES = [
  'Multi-factor access enforcement',
  'Privileged account review',
  'Patch currency for clinical systems',
  'Immutable backup verification',
  'Network segmentation of device estate',
  'Security awareness refresher',
  'Log retention coverage',
  'Joiner mover leaver checks',
  'Third-party access review',
  'Tabletop exercise cadence',
];

const CONTROL_STATUSES = ['planned', 'in-progress', 'operating', 'needs-attention'];

/** Invented baseline label: deliberately not a real framework or standards body. */
const CONTROL_BASELINE = 'Prototype Control Baseline';

const GIVEN_NAMES = ['Rowan', 'Marlowe', 'Soren', 'Wren', 'Peregrine', 'Isolde', 'Caspian', 'Tamsin'];

const FAMILY_NAMES = [
  'Ashgrove',
  'Berrington',
  'Cloudsley',
  'Darrowfield',
  'Everly',
  'Fairweather',
  'Greenhalgh',
  'Hartleaf',
];

/* ------------------------------------------------------------------ *
 * Seeded PRNG and small deterministic helpers.
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

/** A name with the synthetic marker appended, e.g. `Aldermere Care Campus (Fictional)`. */
function synthetic(name: string): string {
  return `${name} ${SYNTHETIC_NAME_MARKER}`;
}

function personName(random: () => number): string {
  return synthetic(`${pick(random, GIVEN_NAMES)} ${pick(random, FAMILY_NAMES)}`);
}

/** Lower-case hyphen slug of a name, with the synthetic marker stripped. */
export function slugify(name: string): string {
  return name
    .replace(SYNTHETIC_NAME_MARKER, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function identifier(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, '0')}`;
}

/** An ISO date, a whole number of days after the fixed epoch. */
function isoDate(dayOffset: number): string {
  return new Date(EPOCH_MS + dayOffset * DAY_MS).toISOString().slice(0, 10);
}

/** An ISO timestamp, a whole number of minutes after the fixed epoch. */
function isoTimestamp(minuteOffset: number): string {
  return new Date(EPOCH_MS + minuteOffset * 60_000).toISOString();
}

/** Deep-sorts object keys so serialisation order never depends on build order. */
function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortDeep(source[key]);
    }
    return sorted;
  }
  return value;
}

/** Stable JSON text: sorted keys, two-space indent, one trailing newline. */
export function serialiseFixture(file: CyberFixtureFile): string {
  return `${JSON.stringify(sortDeep(file), null, 2)}\n`;
}

/* ------------------------------------------------------------------ *
 * Record builders.
 * ------------------------------------------------------------------ */

function buildFacilities(random: () => number): CyberFixtureRecord[] {
  const used = new Set<string>();
  const records: CyberFixtureRecord[] = [];

  for (let index = 0; index < HOW_MANY.facility; index += 1) {
    let place = pick(random, PLACE_WORDS);
    while (used.has(place)) {
      place = PLACE_WORDS[(PLACE_WORDS.indexOf(place) + 1) % PLACE_WORDS.length] as string;
    }
    used.add(place);

    const name = synthetic(`${place} ${pick(random, FACILITY_TYPES)}`);
    const contactName = personName(random);

    records.push({
      id: identifier('fac', index),
      kind: 'facility',
      name,
      region: pick(random, REGIONS),
      siteProfile: pick(random, SITE_PROFILES),
      bedCount: intBetween(random, 20, 320),
      endpointCount: intBetween(random, 80, 1_400),
      serviceTier: pick(random, TIERS),
      contactName,
      contactEmail: `${slugify(contactName)}@${slugify(name)}.example`,
      onboardedOn: isoDate(intBetween(random, 0, 300)),
    });
  }

  return records;
}

function buildVendors(random: () => number): CyberFixtureRecord[] {
  const used = new Set<string>();
  const records: CyberFixtureRecord[] = [];

  for (let index = 0; index < HOW_MANY.vendor; index += 1) {
    let word = pick(random, VENDOR_WORDS);
    while (used.has(word)) {
      word = VENDOR_WORDS[(VENDOR_WORDS.indexOf(word) + 1) % VENDOR_WORDS.length] as string;
    }
    used.add(word);

    const name = synthetic(`${word} ${pick(random, VENDOR_TRADES)}`);
    const contactName = personName(random);

    records.push({
      id: identifier('ven', index),
      kind: 'vendor',
      name,
      category: pick(random, VENDOR_CATEGORIES),
      criticality: pick(random, CRITICALITIES),
      contactName,
      contactEmail: `${slugify(contactName)}@${slugify(name)}.example`,
      contractRef: `CTR-${String(intBetween(random, 1000, 9999))}`,
      dataAccess: pick(random, ['none', 'metadata only', 'clinical records', 'telemetry']),
      lastAssessedOn: isoDate(intBetween(random, 0, 330)),
      reassessmentDueOn: isoDate(intBetween(random, 331, 700)),
    });
  }

  return records;
}

function buildIncidents(
  random: () => number,
  facilities: CyberFixtureRecord[],
  vendors: CyberFixtureRecord[],
): CyberFixtureRecord[] {
  const records: CyberFixtureRecord[] = [];

  for (let index = 0; index < HOW_MANY.incident; index += 1) {
    const facility = pick(random, facilities);
    const vendor = pick(random, vendors);
    const theme = pick(random, INCIDENT_THEMES);
    const detectedMinute = intBetween(random, 0, 400 * 24 * 60);
    const containedMinute = detectedMinute + intBetween(random, 15, 2_880);

    records.push({
      id: identifier('inc', index),
      kind: 'incident',
      name: `${theme} — ${facility.name}`,
      priority: pick(random, PRIORITIES),
      status: pick(random, INCIDENT_STATUSES),
      facilityId: facility.id,
      facilityName: facility.name,
      vendorId: vendor.id,
      vendorName: vendor.name,
      detectedAt: isoTimestamp(detectedMinute),
      containedAt: isoTimestamp(containedMinute),
      timeToContainMinutes: containedMinute - detectedMinute,
      reportedBy: personName(random),
      summary: `${theme} recorded for ${facility.name}. Illustrative prototype data only.`,
    });
  }

  return records;
}

function buildControls(random: () => number, facilities: CyberFixtureRecord[]): CyberFixtureRecord[] {
  const records: CyberFixtureRecord[] = [];

  for (let index = 0; index < HOW_MANY.control; index += 1) {
    const facility = pick(random, facilities);

    records.push({
      id: identifier('ctl', index),
      kind: 'control',
      name: synthetic(CONTROL_THEMES[index % CONTROL_THEMES.length] as string),
      baseline: CONTROL_BASELINE,
      status: pick(random, CONTROL_STATUSES),
      coveragePercent: intBetween(random, 35, 100),
      facilityId: facility.id,
      facilityName: facility.name,
      owner: personName(random),
      lastReviewedOn: isoDate(intBetween(random, 0, 320)),
    });
  }

  return records;
}

/** Builds every fixture file's contents for a seed, without touching the disk. */
export function buildFixtures(seed: number = DEFAULT_SEED): Record<CyberFixtureKind, CyberFixtureFile> {
  const random = createRandom(seed);

  const facilities = buildFacilities(random);
  const vendors = buildVendors(random);
  const incidents = buildIncidents(random, facilities, vendors);
  const controls = buildControls(random, facilities);

  const byKind: Record<CyberFixtureKind, CyberFixtureRecord[]> = {
    facility: facilities,
    vendor: vendors,
    incident: incidents,
    control: controls,
  };

  const files = {} as Record<CyberFixtureKind, CyberFixtureFile>;
  for (const kind of FIXTURE_KINDS) {
    files[kind] = {
      generator: 'src/generateCyberFixtures.ts',
      kind,
      records: byKind[kind],
      seed,
      version: FIXTURE_FORMAT_VERSION,
    };
  }
  return files;
}

/**
 * Writes every cyber fixture file for `seed` into `outDir`.
 *
 * Returns the paths written, sorted, so two runs can be compared file by file.
 */
export async function generate(
  seed: number = DEFAULT_SEED,
  outDir: string = DEFAULT_OUT_DIR,
): Promise<string[]> {
  const files = buildFixtures(seed);
  await mkdir(outDir, { recursive: true });

  const written: string[] = [];
  for (const kind of FIXTURE_KINDS) {
    const target = join(outDir, FIXTURE_FILENAMES[kind]);
    await writeFile(target, serialiseFixture(files[kind]), 'utf8');
    written.push(target);
  }

  return written.sort();
}

/* ------------------------------------------------------------------ *
 * CLI entry point.
 * ------------------------------------------------------------------ */

export type CyberFixtureArgv = { seed?: string; out?: string };

/** Parses `--seed=<n> --out=<dir>` (and the two-token forms) out of argv. */
export function parseArgv(argv: readonly string[]): CyberFixtureArgv {
  const parsed: CyberFixtureArgv = {};

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
export async function main(
  argv: CyberFixtureArgv = parseArgv(process.argv.slice(2)),
): Promise<number> {
  const rawSeed = argv.seed ?? process.env.CYBER_FIXTURE_SEED;
  const seed = rawSeed === undefined ? DEFAULT_SEED : Number(rawSeed);

  if (!Number.isFinite(seed) || !Number.isInteger(seed)) {
    process.stderr.write(`gen:cyber-fixtures: seed must be an integer, got "${String(rawSeed)}"\n`);
    return 1;
  }

  const outDir = argv.out === undefined ? DEFAULT_OUT_DIR : resolve(argv.out);
  const written = await generate(seed, outDir);

  process.stdout.write(`gen:cyber-fixtures: seed ${seed} -> ${outDir}\n`);
  for (const file of written) {
    process.stdout.write(`  ${file}\n`);
  }
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
      process.stderr.write(`gen:cyber-fixtures: ${String(error)}\n`);
      process.exitCode = 1;
    },
  );
}
