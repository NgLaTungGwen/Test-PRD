import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CORPORATE_SUFFIX_DENY_LIST,
  FIXTURE_FILENAMES,
  REAL_NAME_DENY_LIST,
  SYNTHETIC_NAME_MARKER,
  assertNoRealNames,
  describeViolation,
  findRealNames,
  getAllFixtureRecords,
  getControls,
  getFacilities,
  getIncidents,
  getVendors,
} from './cyberFixtures';
import type { CyberFixtureRecord } from './cyberFixtures';
import {
  FIXTURE_FILENAMES as GENERATOR_FILENAMES,
  SYNTHETIC_NAME_MARKER as GENERATOR_MARKER,
} from './generateCyberFixtures';

const FIXTURE_DIR = dirname(fileURLToPath(import.meta.url));

/** Every committed cyber fixture file on disk, by name. */
function committedFixtureFiles(): string[] {
  return readdirSync(FIXTURE_DIR)
    .filter((entry) => /^cyber-.*\.json$/.test(entry))
    .sort();
}

/** Every string in a parsed JSON document, with its JSON path. */
function stringsWithPaths(value: unknown, path: string): { path: string; value: string }[] {
  if (typeof value === 'string') {
    return [{ path, value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => stringsWithPaths(item, `${path}[${index}]`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
      { path: `${path}.${key} (key)`, value: key },
      ...stringsWithPaths(child, `${path}.${key}`),
    ]);
  }
  return [];
}

describe('cyber fixtures', () => {
  it('contains no real organisation names', () => {
    // 1. Every record the selector module exposes, scanned field by field.
    const records = getAllFixtureRecords();
    expect(records.length, 'no cyber fixture records were loaded').toBeGreaterThan(0);

    const violations = findRealNames(records);
    expect(
      violations.map(describeViolation),
      'real organisation data in the committed cyber fixtures',
    ).toEqual([]);
    expect(() => assertNoRealNames(records)).not.toThrow();

    // 2. The committed files on disk, read raw, including keys the selector
    //    module does not surface. Nothing in /src/cyber-*.json may match.
    const files = committedFixtureFiles();
    expect(files, 'no committed cyber fixture files found').toEqual(
      Object.values(FIXTURE_FILENAMES).sort(),
    );

    const fileFindings: string[] = [];
    for (const file of files) {
      const text = readFileSync(join(FIXTURE_DIR, file), 'utf8');
      for (const { path, value } of stringsWithPaths(JSON.parse(text), '$')) {
        for (const term of REAL_NAME_DENY_LIST) {
          if (new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(value)) {
            fileFindings.push(`${file}: ${path} contains real name "${term}" in "${value}"`);
          }
        }
      }
    }
    expect(fileFindings, 'real organisation names in the committed fixture files').toEqual([]);

    // 3. Every name is an obviously invented placeholder, and no name reads as
    //    a registered company.
    for (const record of records) {
      expect(record.name, `${String(record.id)} has an unmarked name`).toContain(
        SYNTHETIC_NAME_MARKER,
      );
    }
    expect(CORPORATE_SUFFIX_DENY_LIST.length).toBeGreaterThan(0);
  });

  it('flags a planted real organisation name, naming file, field and term', () => {
    const planted: CyberFixtureRecord[] = [
      {
        id: 'ven-999',
        kind: 'vendor',
        name: 'Microsoft Managed Defence',
        contactEmail: 'soc@contoso-real-vendor.com',
      },
      {
        id: 'fac-999',
        kind: 'facility',
        name: 'Royal Melbourne Hospital',
      },
    ];

    const findings = findRealNames(planted);
    expect(findings.length).toBeGreaterThan(0);

    expect(() => assertNoRealNames(planted)).toThrow(/src\/cyber-vendors\.json/);
    expect(() => assertNoRealNames(planted)).toThrow(/records\[0\]\(id=ven-999\)\.name/);
    expect(() => assertNoRealNames(planted)).toThrow(/Microsoft/);
    expect(() => assertNoRealNames(planted)).toThrow(/src\/cyber-facilities\.json/);
    expect(() => assertNoRealNames(planted)).toThrow(/Royal Melbourne/);
    // The marker rule and the reserved-domain rule both fire as well.
    expect(findings.map((finding) => finding.rule)).toContain('missing-marker');
    expect(findings.map((finding) => finding.rule)).toContain('non-reserved-domain');
  });

  it('exposes the committed fixtures without generating anything at runtime', () => {
    expect(getFacilities().length).toBeGreaterThan(0);
    expect(getVendors().length).toBeGreaterThan(0);
    expect(getIncidents().length).toBeGreaterThan(0);
    expect(getControls().length).toBeGreaterThan(0);

    expect(getFacilities().every((record) => record.kind === 'facility')).toBe(true);
    expect(getVendors().every((record) => record.kind === 'vendor')).toBe(true);
    expect(getIncidents().every((record) => record.kind === 'incident')).toBe(true);
    expect(getControls().every((record) => record.kind === 'control')).toBe(true);

    expect(getAllFixtureRecords().length).toBe(
      getFacilities().length + getVendors().length + getIncidents().length + getControls().length,
    );

    // Every record is addressable and typed as the selector promises.
    for (const record of getAllFixtureRecords()) {
      expect(typeof record.id).toBe('string');
      expect(typeof record.name).toBe('string');
      expect(['facility', 'vendor', 'incident', 'control']).toContain(record.kind);
    }

    // The selector's constants track the generator's, so the scan cannot drift
    // away from the data it guards.
    expect(SYNTHETIC_NAME_MARKER).toBe(GENERATOR_MARKER);
    expect(FIXTURE_FILENAMES).toEqual(GENERATOR_FILENAMES);
  });
});
