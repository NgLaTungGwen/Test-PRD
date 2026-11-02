import { describe, expect, it } from 'vitest';

import App from './App';
import CyberFindings from './CyberFindings';
import CyberOverview from './CyberOverview';
import { PARITY_MAPPING } from './ui-parity.spec';

describe('smoke', () => {
  it('runs the test toolchain', () => {
    expect(true).toBe(true);
  });

  it('loads the application entry component', () => {
    expect(typeof App).toBe('function');
  });

  it('loads the cyber screens and their parity mapping', () => {
    expect(typeof CyberOverview).toBe('function');
    expect(typeof CyberFindings).toBe('function');

    // Every new screen is recorded against the existing POC screen it is
    // reviewed side by side with, before sign-off.
    expect(PARITY_MAPPING.length).toBeGreaterThan(0);
    for (const { cyberScreen, referenceScreen } of PARITY_MAPPING) {
      expect(cyberScreen.startsWith('/cyber-poc')).toBe(true);
      expect(referenceScreen.startsWith('/cyber-poc')).toBe(false);
      expect(referenceScreen.startsWith('/')).toBe(true);
    }
  });
});
