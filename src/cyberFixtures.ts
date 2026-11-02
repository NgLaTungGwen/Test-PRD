/**
 * Static selector layer over the committed cyber fixtures.
 *
 * The JSON files beside this module are imported statically, at build time:
 * nothing here generates data at runtime, reads the clock, or calls out to
 * anything. They are produced once by `src/generateCyberFixtures.ts`
 * (`npm run gen:cyber-fixtures`) and committed as they come out of it.
 *
 * This module also owns the name scan the fixture spec runs over them, so the
 * deny-list of real facility, client and vendor names lives next to the data it
 * guards and is easy to extend.
 */
import controlsFixture from './cyber-controls.json';
import facilitiesFixture from './cyber-facilities.json';
import incidentsFixture from './cyber-incidents.json';
import vendorsFixture from './cyber-vendors.json';
import bundleFixture from './cyberFixtures.json';
import type {
  CyberFixtureFile,
  CyberFixtureKind,
  CyberFixtureRecord,
} from './generateCyberFixtures';

export type { CyberFixtureFile, CyberFixtureKind, CyberFixtureRecord };

/**
 * The marker every generated name carries, and the file each kind lives in.
 *
 * Declared here rather than imported from the generator so that this module
 * stays free of Node built-ins and safe to import from the browser bundle. The
 * fixture spec asserts both agree with the generator's own constants.
 */
export const SYNTHETIC_NAME_MARKER = '(Fictional)';

export const FIXTURE_FILENAMES: Record<CyberFixtureKind, string> = {
  facility: 'cyber-facilities.json',
  vendor: 'cyber-vendors.json',
  incident: 'cyber-incidents.json',
  control: 'cyber-controls.json',
};

const FIXTURES: Record<CyberFixtureKind, CyberFixtureFile> = {
  facility: facilitiesFixture as unknown as CyberFixtureFile,
  vendor: vendorsFixture as unknown as CyberFixtureFile,
  incident: incidentsFixture as unknown as CyberFixtureFile,
  control: controlsFixture as unknown as CyberFixtureFile,
};

function recordsOf(kind: CyberFixtureKind): CyberFixtureRecord[] {
  return FIXTURES[kind].records;
}

/** The committed facility fixtures. */
export function getFacilities(): CyberFixtureRecord[] {
  return recordsOf('facility');
}

/** The committed vendor fixtures. */
export function getVendors(): CyberFixtureRecord[] {
  return recordsOf('vendor');
}

/** The committed incident fixtures. */
export function getIncidents(): CyberFixtureRecord[] {
  return recordsOf('incident');
}

/** The committed control fixtures. */
export function getControls(): CyberFixtureRecord[] {
  return recordsOf('control');
}

/** Every committed fixture record, in file order, for scanning. */
export function getAllFixtureRecords(): CyberFixtureRecord[] {
  return [...getFacilities(), ...getVendors(), ...getIncidents(), ...getControls()];
}

/* ------------------------------------------------------------------ *
 * The role- and facility-scoped lookups the cyber screens render from.
 *
 * These read the committed illustrative bundle `src/cyberFixtures.json`,
 * written by `src/generateCyberFixtures.ts` (`npm run gen:cyber-parity-
 * fixtures`) and committed as it comes out of it. Nothing here generates
 * data, reads the clock or touches a Node built-in, so the module stays safe
 * to import from the browser bundle.
 * ------------------------------------------------------------------ */

export type CyberGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type CyberPriority = 'P1' | 'P2' | 'P3' | 'P4';

/** A facility in the illustrative bundle. */
export type Facility = {
  id: string;
  name: string;
  region: string;
  serviceTier: string;
  site: string;
};

/** A finding in the illustrative bundle. */
export type CyberFinding = {
  id: string;
  facilityId: string;
  title: string;
  grade: CyberGrade;
  priority: CyberPriority;
  owner?: string;
  raisedOn?: string;
  status?: string;
};

/** A role in the illustrative bundle, and the facilities it may see. */
export type CyberFixtureRole = { id: string; label: string; facilityIds: string[] };

export type CyberFixtureBundle = {
  facilities: Facility[];
  findings: CyberFinding[];
  roles: CyberFixtureRole[];
};

/** Everything the committed illustrative bundle holds, scope unapplied. */
export type ScopedFixtures = { findings: CyberFinding[]; facilities: Facility[] };

const BUNDLE = bundleFixture as unknown as CyberFixtureBundle;

/** The illustrative bundle's facilities, in file order. */
export function bundleFacilities(): Facility[] {
  return BUNDLE.facilities;
}

/** The illustrative bundle's findings, in file order. */
export function bundleFindings(): CyberFinding[] {
  return BUNDLE.findings;
}

/** The illustrative bundle's roles, in file order. */
export function bundleRoles(): CyberFixtureRole[] {
  return BUNDLE.roles;
}

/** The facilities a role may see. A role the bundle does not declare sees none. */
export function facilitiesForRole(role: string): Facility[] {
  const declared = BUNDLE.roles.find((entry) => entry.id === role);
  if (declared === undefined) return [];
  return BUNDLE.facilities.filter((facility) => declared.facilityIds.includes(facility.id));
}

/**
 * The fixtures one role sees at one facility.
 *
 * The facilities are every facility that role may see, so a scope control can
 * be built straight from the result; the findings are the ones at
 * `facilityId`, and a facility the role may not see is narrowed back to the
 * first one it may, so a caller can never be left reading data outside its
 * own scope.
 */
export function selectScopedFixtures(role: string, facilityId: string): ScopedFixtures {
  const facilities = facilitiesForRole(role);
  const scoped = facilities.some((facility) => facility.id === facilityId)
    ? facilityId
    : facilities[0]?.id;

  return {
    facilities,
    findings:
      scoped === undefined
        ? []
        : BUNDLE.findings.filter((finding) => finding.facilityId === scoped),
  };
}

/* ------------------------------------------------------------------ *
 * The real-name scan.
 * ------------------------------------------------------------------ */

/**
 * Real organisations whose names must never appear in the fixtures: security
 * and technology vendors, healthcare providers, insurers, consultancies and
 * standards bodies. Extend this list rather than weakening the scan.
 */
export const REAL_NAME_DENY_LIST: string[] = [
  // Technology and security vendors
  'Microsoft',
  'Azure',
  'Windows Defender',
  'Office 365',
  'Google',
  'Alphabet',
  'Amazon',
  'AWS',
  'Apple',
  'IBM',
  'Oracle',
  'SAP',
  'Salesforce',
  'ServiceNow',
  'Workday',
  'Atlassian',
  'Cisco',
  'Splunk',
  'CrowdStrike',
  'SentinelOne',
  'Palo Alto',
  'Fortinet',
  'Check Point',
  'Sophos',
  'Symantec',
  'McAfee',
  'Trellix',
  'Trend Micro',
  'Kaspersky',
  'Bitdefender',
  'ESET',
  'Rapid7',
  'Tenable',
  'Qualys',
  'Darktrace',
  'Mandiant',
  'FireEye',
  'Secureworks',
  'Arctic Wolf',
  'Proofpoint',
  'Mimecast',
  'Zscaler',
  'Netskope',
  'Cloudflare',
  'Akamai',
  'Okta',
  'VMware',
  'Citrix',
  'Dell',
  'Hewlett',
  'Lenovo',
  'Juniper',
  'Nokia',
  'Ericsson',
  'Huawei',
  'Siemens',
  'Schneider Electric',
  'Honeywell',
  'Johnson Controls',
  'Philips',
  'GE Healthcare',
  'Medtronic',
  'Baxter',
  'Epic Systems',
  'Cerner',
  'Meditech',
  'Allscripts',
  'Datadog',
  'Snowflake',
  'Zoom',
  'Slack',
  // Consultancies and integrators
  'Accenture',
  'Deloitte',
  'KPMG',
  'Capgemini',
  'Infosys',
  'Wipro',
  'McKinsey',
  // Healthcare providers, insurers and public bodies
  'NHS',
  'Kaiser Permanente',
  'Mayo Clinic',
  'Cleveland Clinic',
  'Johns Hopkins',
  'HCA Healthcare',
  'Bupa',
  'Ramsay Health',
  'Healthscope',
  'Medibank',
  'St Vincent',
  'Royal Melbourne',
  'Mount Sinai',
  'Cedars-Sinai',
  'Massachusetts General',
  'UnitedHealth',
  'Anthem',
  'Cigna',
  'Aetna',
  'Humana',
  'Providence Health',
  'Ascension Health',
  'Trinity Health',
  'Sutter Health',
  'Banner Health',
  'Geisinger',
  'Intermountain',
  'NewYork-Presbyterian',
  // Standards bodies and named frameworks
  'NIST',
  'HIPAA',
  'HITRUST',
  'MITRE',
  'CISA',
  'ENISA',
  'PCI DSS',
  'SOC 2',
  'Essential Eight',
];

/**
 * Corporate markers and legal suffixes. A fixture name carrying one of these
 * reads as a real registered company, so they are refused in name fields.
 * Matched case-sensitively, because words like "limited" are ordinary prose.
 */
export const CORPORATE_SUFFIX_DENY_LIST: string[] = [
  'Inc',
  'Inc.',
  'Incorporated',
  'Ltd',
  'Ltd.',
  'Limited',
  'LLC',
  'L.L.C.',
  'LLP',
  'PLC',
  'Plc',
  'GmbH',
  'S.A.',
  'N.V.',
  'B.V.',
  'Pty',
  'Pte',
  'Corp',
  'Corp.',
  'Corporation',
  'Holdings',
  'Group Plc',
];

/** Fields that name an organisation or a person, and so must carry the marker. */
export const MARKED_NAME_KEYS: string[] = [
  'name',
  'facilityName',
  'vendorName',
  'clientName',
  'contactName',
  'owner',
  'reportedBy',
];

/** Email and host suffixes reserved for documentation, so never a real address. */
const RESERVED_DOMAIN_SUFFIXES = ['.example', '.invalid', 'example.com', 'example.org', 'example.net'];

function escapeForRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A whole-word matcher for a deny-list term. */
function termPattern(term: string, flags: string): RegExp {
  const escaped = escapeForRegExp(term);
  const prefix = /^[A-Za-z0-9]/.test(term) ? '\\b' : '';
  const suffix = /[A-Za-z0-9]$/.test(term) ? '\\b' : '';
  return new RegExp(`${prefix}${escaped}${suffix}`, flags);
}

const REAL_NAME_PATTERNS = REAL_NAME_DENY_LIST.map((term) => ({
  term,
  pattern: termPattern(term, 'i'),
}));

const CORPORATE_SUFFIX_PATTERNS = CORPORATE_SUFFIX_DENY_LIST.map((term) => ({
  term,
  pattern: termPattern(term, ''),
}));

export type RealNameViolation = {
  /** The fixture file the offending record belongs to. */
  file: string;
  /** The field path inside that file, e.g. `records[3].contactName`. */
  path: string;
  /** The deny-list term that matched, or the rule that was not satisfied. */
  term: string;
  /** The offending value. */
  value: string;
  /** Which rule produced the finding. */
  rule: 'real-name' | 'corporate-suffix' | 'missing-marker' | 'non-reserved-domain';
};

function fileFor(record: CyberFixtureRecord): string {
  const filename = FIXTURE_FILENAMES[record.kind as CyberFixtureKind];
  return filename === undefined ? `<unknown fixture file for kind "${String(record.kind)}">` : `src/${filename}`;
}

function walkStrings(
  value: unknown,
  path: string,
  visit: (path: string, key: string, value: string) => void,
  key = '',
): void {
  if (typeof value === 'string') {
    visit(path, key, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, `${path}[${index}]`, visit, key));
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      walkStrings(childValue, `${path}.${childKey}`, visit, childKey);
    }
  }
}

/** Scans records for anything that reads as real organisation, client or vendor data. */
export function findRealNames(records: readonly CyberFixtureRecord[]): RealNameViolation[] {
  const violations: RealNameViolation[] = [];

  records.forEach((record, index) => {
    const file = fileFor(record);
    const base = `records[${index}](id=${String(record.id)})`;

    walkStrings(record, base, (path, key, value) => {
      for (const { term, pattern } of REAL_NAME_PATTERNS) {
        if (pattern.test(value)) {
          violations.push({ file, path, term, value, rule: 'real-name' });
        }
      }

      if (MARKED_NAME_KEYS.includes(key)) {
        for (const { term, pattern } of CORPORATE_SUFFIX_PATTERNS) {
          if (pattern.test(value)) {
            violations.push({ file, path, term, value, rule: 'corporate-suffix' });
          }
        }
        if (!value.includes(SYNTHETIC_NAME_MARKER)) {
          violations.push({
            file,
            path,
            term: `missing synthetic marker "${SYNTHETIC_NAME_MARKER}"`,
            value,
            rule: 'missing-marker',
          });
        }
      }

      const address = /[\w.+-]+@([\w.-]+)/.exec(value);
      const host = address?.[1];
      if (host !== undefined && !RESERVED_DOMAIN_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
        violations.push({
          file,
          path,
          term: `address outside the reserved documentation domains (${host})`,
          value,
          rule: 'non-reserved-domain',
        });
      }
    });
  });

  return violations;
}

/** Renders one finding as a line naming the file, the field path and the term. */
export function describeViolation(violation: RealNameViolation): string {
  return `${violation.file}: ${violation.path} matched ${violation.term} in "${violation.value}" [${violation.rule}]`;
}

/**
 * Throws if any record carries a real facility, client or vendor name.
 * The error names every offending file, field path and matched term.
 */
export function assertNoRealNames(records: readonly CyberFixtureRecord[]): void {
  const violations = findRealNames(records);
  if (violations.length === 0) {
    return;
  }

  throw new Error(
    `real organisation data found in the cyber fixtures:\n${violations
      .map((violation) => `  - ${describeViolation(violation)}`)
      .join('\n')}`,
  );
}
