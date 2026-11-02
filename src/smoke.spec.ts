import { describe, expect, it } from 'vitest';

import App from './App';
import { CYBER_POC_NAV, isCyberPocPath } from './App';
import CyberFindings from './CyberFindings';
import CyberOverview from './CyberOverview';

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
});
