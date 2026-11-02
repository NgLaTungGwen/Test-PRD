import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import App from './App';
import { CYBER_POC_NAV, isCyberPocPath } from './App';
import CyberFindings from './CyberFindings';
import CyberOverview from './CyberOverview';
import {
  BUNDLE_FILENAME,
  DEFAULT_SEED,
  buildCyberFixtureBundle,
  serialiseBundle,
} from './generateCyberFixtures';

describe('smoke', () => {
  it('runs the test toolchain', () => {
    expect(true).toBe(true);
  });

  it('loads the application entry component', () => {
    expect(typeof App).toBe('function');
  });

  it('loads the cyber screens into the existing shell', () => {
    expect(typeof CyberOverview).toBe('function');
    expect(typeof CyberFindings).toBe('function');

    // The cyber screens are entries in the shell's own navigation list, and
    // every one of them is routed by the group the shell mounts. The parity
    // review of those screens lives in `ui-parity.spec.ts`.
    expect(CYBER_POC_NAV.length).toBeGreaterThan(0);
    for (const item of CYBER_POC_NAV) {
      expect(isCyberPocPath(item.path), `${item.path} is not routed`).toBe(true);
    }
    expect(isCyberPocPath('/')).toBe(false);
    expect(isCyberPocPath('/cyber/portfolio')).toBe(false);
  });

  it('regenerates the committed cyber fixture bundle byte for byte', () => {
    // The screens read committed JSON, and the seeded script is its only
    // producer: the same seed has to write exactly the committed bytes.
    const fresh = serialiseBundle(buildCyberFixtureBundle(DEFAULT_SEED));
    expect(fresh).toBe(serialiseBundle(buildCyberFixtureBundle(DEFAULT_SEED)));

    const committed = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), BUNDLE_FILENAME),
      'utf8',
    );
    expect(
      fresh === committed,
      `src/${BUNDLE_FILENAME} is not what the generator writes for seed ${DEFAULT_SEED}; run npm run gen:cyber-parity-fixtures`,
    ).toBe(true);

    // A different seed really does produce different data.
    expect(serialiseBundle(buildCyberFixtureBundle(DEFAULT_SEED + 1))).not.toBe(fresh);
  });
});
