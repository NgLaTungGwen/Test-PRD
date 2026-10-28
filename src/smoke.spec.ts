import { describe, expect, it } from 'vitest';

import App from './App';

describe('smoke', () => {
  it('runs the test toolchain', () => {
    expect(true).toBe(true);
  });

  it('loads the application entry component', () => {
    expect(typeof App).toBe('function');
  });
});
