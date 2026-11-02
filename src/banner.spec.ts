/**
 * The persistent illustrative banner.
 *
 * Two things are asserted here, and they are the two the client confirmed:
 *
 * - AC-1: every cyber screen renders the banner. Each screen of both cyber
 *   route groups is rendered through the shell, under each role, and the
 *   banner has to be there — in the content container, with the agreed
 *   wording and the accessible name that says the same thing.
 * - AC-2: a report exported to PDF carries the banner. The prototype's export
 *   is the browser's own print rendering of the report screen, so the export
 *   is generated here the way the browser generates it — the document head
 *   from `index.html`, which loads `print.css`, around the markup the report
 *   screen renders — and the banner has to survive that path: present in the
 *   exported document, inside the report table's repeating header row, and
 *   forced visible and unbroken by the print rules rather than collapsed with
 *   the rest of the shell chrome.
 *
 * The suite runs in the `node` environment, so a screen is exercised the way
 * the rest of this repository exercises one: rendered to static markup, with
 * the markup read back.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from './App';
import { setCurrentPath } from './CyberRoutes';
import { resetCyberScopeContext, setCyberScopeFacility, setCyberScopeRole } from './CyberScopeContext';
import { CYBER_EXPORT_PATH } from './CyberShell';
import {
  ILLUSTRATIVE_BANNER_TEXT,
  PRINT_BANNER_CLASS,
  STANDING_BANNER_CLASS,
  STANDING_BANNER_TEST_ID,
} from './IllustrativeBanner';
import type { CyberRole } from './cyberData';
import { bundleRoles, facilitiesForRole, selectScopedFixtures } from './cyberFixtures';
import { resetCyberScope, setCyberRole } from './cyberScope';

const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = dirname(SRC_DIR);

const INDEX_HTML = readFileSync(join(REPO_DIR, 'index.html'), 'utf8');
const PRINT_CSS = readFileSync(join(SRC_DIR, 'print.css'), 'utf8');
const BANNER_CSS = readFileSync(join(SRC_DIR, 'IllustrativeBanner.css'), 'utf8');

/** Every screen of the cyber module: both route groups, and the export. */
const EVERY_CYBER_SCREEN = [
  '/cyber',
  '/cyber/portfolio',
  '/cyber/members',
  '/cyber/service-performance',
  '/cyber/catalogue',
  '/cyber/advisories',
  '/cyber/member/incidents',
  '/cyber/member/findings',
  '/cyber/member/reports',
  '/cyber-poc',
  '/cyber-poc/overview',
  '/cyber-poc/findings',
  CYBER_EXPORT_PATH,
];

const ROLES: CyberRole[] = ['program-lead', 'member-exec', 'member-it'];

/* ------------------------------------------------------------------ *
 * Helpers.
 * ------------------------------------------------------------------ */

/** The app shell rendered at a path, exactly as the dev server serves it. */
function render(path: string): string {
  setCurrentPath(path);
  return renderToStaticMarkup(createElement(App));
}

/** The content container's inner markup: the screen, without the chrome. */
function mainOf(markup: string): string {
  const open = markup.indexOf('<main class="app-shell__main"');
  expect(open, 'no app-shell__main content container').toBeGreaterThan(-1);
  return markup.slice(markup.indexOf('>', open) + 1, markup.lastIndexOf('</main>'));
}

/** The opening tag of the element carrying a data-testid, or undefined. */
function openingTag(markup: string, testId: string): string | undefined {
  const at = markup.indexOf(`data-testid="${testId}"`);
  if (at === -1) return undefined;
  return markup.slice(markup.lastIndexOf('<', at), markup.indexOf('>', at) + 1);
}

/** The whole element carrying a data-testid, children included. */
function elementByTestId(markup: string, testId: string): string {
  const at = markup.indexOf(`data-testid="${testId}"`);
  expect(at, `no element with data-testid="${testId}"`).toBeGreaterThan(-1);

  const tagStart = markup.lastIndexOf('<', at);
  const tagName = /^<([a-zA-Z0-9]+)/.exec(markup.slice(tagStart))?.[1] as string;

  let cursor = markup.indexOf('>', at) + 1;
  let depth = 1;
  const opening = new RegExp(`<${tagName}[\\s>]`, 'g');
  const closing = `</${tagName}>`;

  while (depth > 0) {
    opening.lastIndex = cursor;
    const next = opening.exec(markup);
    const close = markup.indexOf(closing, cursor);
    expect(close, `unterminated <${tagName}> for data-testid="${testId}"`).toBeGreaterThan(-1);
    if (next && next.index < close) {
      depth += 1;
      cursor = next.index + 1;
    } else {
      depth -= 1;
      cursor = close + closing.length;
    }
  }

  return markup.slice(tagStart, cursor);
}

/** The visible text of a fragment of markup, tags stripped. */
function textOf(markup: string): string {
  return markup
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x2014;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

/** CSS with its comments stripped, so documentation is not read as code. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** The body of the `@media print` block, by brace matching. */
function mediaPrintBlock(css: string): string {
  const body = withoutComments(css);
  const at = body.search(/@media\s+print\s*\{/);
  expect(at, 'print.css declares no @media print block').toBeGreaterThan(-1);

  let cursor = body.indexOf('{', at) + 1;
  const start = cursor;
  let depth = 1;
  while (depth > 0 && cursor < body.length) {
    const char = body[cursor];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    cursor += 1;
  }
  expect(depth, 'the @media print block is not closed').toBe(0);
  return body.slice(start, cursor - 1);
}

/** Every `selector { declarations }` rule in a block of CSS. */
function rulesOf(block: string): { selectors: string[]; declarations: string }[] {
  return [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selectors: (match[1] as string)
      .split(',')
      .map((selector) => selector.trim())
      .filter((selector) => selector !== ''),
    declarations: (match[2] as string).replace(/\s+/g, ' ').trim(),
  }));
}

/** Whether a selector matches the standing banner element as it is rendered. */
function matchesStandingBanner(selector: string): boolean {
  const classes = ['illustrative-banner', STANDING_BANNER_CLASS, PRINT_BANNER_CLASS];
  const attributes = ['data-illustrative', 'data-print', 'data-testid', 'role'];
  const simple = selector.split(/\s+|>/).pop() ?? selector;

  for (const part of simple.split(/(?=[.#[])/).filter((piece) => piece !== '')) {
    if (part.startsWith('.')) {
      if (!classes.includes(part.slice(1))) return false;
    } else if (part.startsWith('[')) {
      const [name, value] = part.replace(/^\[|\]$/g, '').split('=');
      if (!attributes.includes(name as string)) return false;
      // The banner is `data-print="true"`; a hide rule keys off another value.
      if (name === 'data-print' && value !== undefined && !/'?true'?/.test(value)) return false;
    } else if (part !== '' && !/^(div|\*)$/.test(part)) {
      return false;
    }
  }
  return true;
}

/**
 * The document the browser prints when the report is exported to PDF: the
 * entry document's head, which is what loads the print stylesheet, around the
 * markup the export screen renders.
 */
function generatePdfExport(path: string): { document: string; body: string } {
  const body = render(path);
  const head = INDEX_HTML.slice(0, INDEX_HTML.indexOf('</head>') + '</head>'.length);
  return { document: `${head}<body>${body}</body></html>`, body };
}

beforeEach(() => {
  resetCyberScope();
  resetCyberScopeContext();
});

afterEach(() => {
  resetCyberScope();
  resetCyberScopeContext();
  setCurrentPath(null);
});

describe('illustrative banner', () => {
  it('visible on every cyber screen', () => {
    expect(EVERY_CYBER_SCREEN.length).toBeGreaterThan(3);

    for (const role of ROLES) {
      setCyberRole(role);
      setCyberScopeRole(role);

      for (const path of EVERY_CYBER_SCREEN) {
        const where = `${path} as ${role}`;
        const screen = mainOf(render(path));

        // It is on the screen, inside the content container, with the agreed
        // wording and an accessible name that says the same thing.
        const banner = elementByTestId(screen, STANDING_BANNER_TEST_ID);
        expect(textOf(banner), where).toBe(ILLUSTRATIVE_BANNER_TEXT);
        expect(textOf(banner), where).toBe('Illustrative / Draft, pending HealthPRO review');
        expect(banner, where).toContain(`aria-label="${ILLUSTRATIVE_BANNER_TEXT}"`);
        expect(banner, where).toContain('role="note"');
        expect(banner, where).toContain('data-illustrative="true"');

        // It carries the class the print path keys off, so the same banner is
        // the one that survives an export.
        expect(banner, where).toContain('class="illustrative-banner ');
        expect(banner, where).toContain(STANDING_BANNER_CLASS);
        expect(banner, where).toContain(PRINT_BANNER_CLASS);

        // And it is rendered by the shell above the screen, not by the screen
        // itself: the screen is the child, so no screen can opt out of it.
        const shell = screen.indexOf('data-testid="cyber-shell"');
        expect(shell, where).toBeGreaterThan(-1);
        expect(screen.indexOf(`data-testid="${STANDING_BANNER_TEST_ID}"`), where).toBeGreaterThan(
          shell,
        );
      }
    }

    // The banner belongs to the cyber module: the screen outside it is
    // unchanged, so the assertions above are a real check and not a
    // tautology about every page of the app.
    resetCyberScope();
    expect(openingTag(mainOf(render('/')), STANDING_BANNER_TEST_ID)).toBeUndefined();
  });

  it('visible on PDF export', () => {
    for (const role of bundleRoles()) {
      setCyberRole(role.id as CyberRole);
      setCyberScopeRole(role.id);

      for (const facility of facilitiesForRole(role.id)) {
        setCyberScopeFacility(facility.id);

        const where = `${role.id} at ${facility.id}`;
        const { document, body } = generatePdfExport(CYBER_EXPORT_PATH);

        /* ---------------------------------------------------------- *
         * 1. The export really is a report: the scoped findings, in
         *    the document the export is taken from.
         * ---------------------------------------------------------- */
        const exported = elementByTestId(body, 'cyber-export-document');
        const { findings } = selectScopedFixtures(role.id, facility.id);
        expect(findings.length, where).toBeGreaterThan(0);
        for (const finding of findings) {
          expect(exported, `${where}: ${finding.id} is missing from the export`).toContain(
            `data-testid="cyber-export-row-${finding.id}"`,
          );
        }
        expect(exported, where).toContain(facility.name);

        /* ---------------------------------------------------------- *
         * 2. The banner is inside the exported document, in the
         *    report table's header row, which an engine that repeats
         *    table headers carries onto each page it spans.
         * ---------------------------------------------------------- */
        const bannerRow = elementByTestId(exported, 'cyber-export-banner-row');
        const banner = elementByTestId(bannerRow, STANDING_BANNER_TEST_ID);
        expect(textOf(banner), where).toBe(ILLUSTRATIVE_BANNER_TEXT);
        expect(banner, where).toContain(`aria-label="${ILLUSTRATIVE_BANNER_TEXT}"`);
        expect(banner, where).toContain('data-illustrative="true"');
        expect(banner, where).toContain(PRINT_BANNER_CLASS);
        expect(exported.indexOf('<thead>'), where).toBeLessThan(
          exported.indexOf(`data-testid="${STANDING_BANNER_TEST_ID}"`),
        );

        /* ---------------------------------------------------------- *
         * 3. The document the browser is handed loads the print
         *    rules: without them the export is a screenshot of a page
         *    whose chrome rules could collapse the banner.
         * ---------------------------------------------------------- */
        expect(document, where).toContain('rel="stylesheet"');
        expect(document, where).toContain('/src/print.css');
        expect(document, where).toContain(
          `data-testid="${STANDING_BANNER_TEST_ID}"`,
        );
      }
    }

    // The banner's own stylesheet pulls the print rules in as well, so a
    // bundle built without the entry document's link still exports them.
    expect(withoutComments(BANNER_CSS)).toContain("@import './print.css'");

    /* -------------------------------------------------------------- *
     * 4. What those print rules do to the banner: force it rendered
     *    and unbroken, and never hide it.
     * -------------------------------------------------------------- */
    const printRules = rulesOf(mediaPrintBlock(PRINT_CSS));
    expect(printRules.length, 'the print rules are empty').toBeGreaterThan(0);

    const bannerRules = printRules.filter((rule) => rule.selectors.some(matchesStandingBanner));
    expect(bannerRules.length, 'no print rule addresses the banner').toBeGreaterThan(0);

    const bannerDeclarations = bannerRules.map((rule) => rule.declarations).join(' ');
    expect(bannerDeclarations).toContain('display: block !important');
    expect(bannerDeclarations).toContain('visibility: visible !important');
    expect(bannerDeclarations).toMatch(/(?<!-)break-inside: avoid/);
    expect(bannerDeclarations).toContain('page-break-inside: avoid');

    for (const rule of bannerRules) {
      expect(
        /display:\s*none/.test(rule.declarations),
        `a print rule hides the banner: ${rule.selectors.join(', ')}`,
      ).toBe(false);
      expect(
        /visibility:\s*hidden/.test(rule.declarations),
        `a print rule hides the banner: ${rule.selectors.join(', ')}`,
      ).toBe(false);
    }

    // The controls that trigger the export are not themselves part of it:
    // they are marked for the print path to drop, and the banner is not.
    const hidden = printRules.filter((rule) => /display:\s*none/.test(rule.declarations));
    expect(hidden.flatMap((rule) => rule.selectors)).toContain("[data-print='hide']");
    for (const rule of hidden) {
      for (const selector of rule.selectors) {
        expect(
          matchesStandingBanner(selector),
          `${selector} would drop the banner from the export`,
        ).toBe(false);
      }
    }

    const actions = openingTag(render(CYBER_EXPORT_PATH), 'cyber-shell-actions');
    expect(actions).toContain('data-print="hide"');
    expect(openingTag(render(CYBER_EXPORT_PATH), STANDING_BANNER_TEST_ID)).toContain(
      'data-print="true"',
    );
  });
});
