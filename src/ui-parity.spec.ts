/**
 * Visual parity of the new cyber screens with the existing HealthPRO POC.
 *
 * Two reviews, run the way the rest of this repository exercises a screen:
 * render it to static markup in the `node` environment and read the markup
 * back.
 *
 * 1. `component audit` — every class name, CSS custom property and module a
 *    cyber screen uses has to resolve either to the component and token set
 *    the POC already ships, or to the two new semantic token sets (grade A–F,
 *    priority P1–P4). Nothing else, and no ad hoc inline style.
 * 2. `side-by-side review` — each cyber screen rendered next to the existing
 *    POC screen a reviewer would hold it against, with the mapping recorded
 *    below, asserting the shell, the heading hierarchy, the component class
 *    usage and the spacing containers all match.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from './App';
import { CYBER_POC_NAV } from './App';
import { setCurrentPath } from './CyberRoutes';
import { resetCyberScopeContext, setCyberScopeFacility } from './CyberScopeContext';
import { ILLUSTRATIVE_BANNER_TEXT } from './IllustrativeBanner';
import {
  CYBER_GRADES,
  CYBER_PRIORITIES,
  cyberFacilities,
  findingsByRole,
  gradeRollups,
} from './cyberData';
import { resetCyberScope, setCyberRole } from './cyberScope';
import type { CyberRole } from './cyberData';
import {
  CYBER_TOKEN_CLASSES,
  CYBER_TOKEN_NAMES,
  TOKEN_DERIVATIONS,
  chipClassFor,
  collectUsedTokens,
  tokenFor,
} from './cyberTokens';
import type { ParityMapping } from './cyberTokens';

const SRC_DIR = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * The two screens under review, the existing screens they are built
 * from, and the mapping a reviewer compares them under.
 * ------------------------------------------------------------------ */

/** The screens this requirement adds. */
const CYBER_SCREENS = ['/cyber-poc', '/cyber-poc/overview', '/cyber-poc/findings'];

/** The screens the POC already shipped, which define the existing set. */
const EXISTING_SCREENS = [
  '/',
  '/cyber/portfolio',
  '/cyber/members',
  '/cyber/service-performance',
  '/cyber/catalogue',
  '/cyber/advisories',
  '/cyber/member/incidents',
  '/cyber/member/findings',
  '/cyber/member/reports',
];

/**
 * Each new screen and the existing POC screen it is reviewed against.
 *
 * - the landing card and the posture overview are card screens, so both are
 *   held against the existing catalogue card screen;
 * - the findings list is a table screen, so it is held against the existing
 *   member directory table.
 *
 * The original tier catalogue at `/` is the shell and typography reference
 * for all three: it is the screen the Innovation Pathway shell was built
 * around, and every cyber screen has to sit in it unchanged.
 */
export const PARITY_MAPPING: ParityMapping = [
  { cyberScreen: '/cyber-poc', referenceScreen: '/cyber/catalogue' },
  { cyberScreen: '/cyber-poc/overview', referenceScreen: '/cyber/catalogue' },
  { cyberScreen: '/cyber-poc/findings', referenceScreen: '/cyber/members' },
];

/** The POC screen the shell and the typography of every cyber screen is held against. */
export const SHELL_REFERENCE_SCREEN = '/';

/** The modules a cyber screen may import. */
const ALLOWED_IMPORTS = [
  'react',
  './IllustrativeFigure',
  './cyberData',
  './CyberScopeContext',
  './cyberTokens',
];

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
  const start = markup.indexOf('>', open) + 1;
  const end = markup.lastIndexOf('</main>');
  return markup.slice(start, end);
}

/**
 * The shell around a screen: the markup with the content container's
 * contents taken out, and the per-path active markers normalised, so two
 * screens differing only in which nav item is current compare equal.
 */
function chromeOf(markup: string): string {
  const inner = mainOf(markup);
  return markup
    .replace(inner, '{screen}')
    .replace(/ aria-current="page"/g, '')
    .replace(/ data-active="true"/g, '');
}

/** Every `<tag class="…">` pair in a fragment, as `tag.class` strings. */
function tagClassPairs(markup: string): string[] {
  return [...markup.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\s[^>]*class="([^"]*)"/g)].map(
    (match) => `${match[1] as string}.${(match[2] as string).trim()}`,
  );
}

/** The heading levels a fragment uses, in document order. */
function headingLevels(markup: string): number[] {
  return [...markup.matchAll(/<h([1-6])[\s>]/g)].map((match) => Number(match[1]));
}

/** The class attribute of the first element of a kind, or `undefined`. */
function classOfKind(markup: string, kind: 'table' | 'cards'): string | undefined {
  if (kind === 'table') {
    return /<table\s[^>]*class="([^"]*)"/.exec(markup)?.[1];
  }
  return /<div\s[^>]*class="(cyber-cards[^"]*)"/.exec(markup)?.[1];
}

/** The skeleton of a screen: the tag and class of its first elements. */
function skeleton(markup: string, depth = 5): string[] {
  return [...markup.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g)]
    .map((match) => {
      const tag = match[1] as string;
      const className = /class="([^"]*)"/.exec(match[2] as string)?.[1];
      return className === undefined ? tag : `${tag}.${className}`;
    })
    .slice(0, depth);
}

/** CSS with its comments stripped, so documentation is not read as code. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Every custom property a stylesheet declares. */
function declaredCustomProperties(css: string): string[] {
  return [...withoutComments(css).matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map(
    (match) => match[1] as string,
  );
}

/** Every custom property a stylesheet reads through `var()`. */
function referencedCustomProperties(css: string): string[] {
  return [...withoutComments(css).matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map(
    (match) => match[1] as string,
  );
}

/** The module specifiers a TypeScript source imports from. */
function importsOf(source: string): string[] {
  return [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] as string);
}

/**
 * The existing component set, harvested from the POC as it actually renders:
 * every screen the prototype already shipped, under each of the three roles,
 * so role-only components — the header's facility selector, the member
 * sidebar — are part of the set a new screen may build from.
 */
function existingComponentSet(): { classes: Set<string>; tagClasses: Set<string> } {
  const classes = new Set<string>();
  const tagClasses = new Set<string>();

  for (const role of ['program-lead', 'member-exec', 'member-it'] as CyberRole[]) {
    setCyberRole(role);
    for (const path of EXISTING_SCREENS) {
      const markup = render(path);
      for (const name of collectUsedTokens(markup).classes) classes.add(name);
      for (const pair of tagClassPairs(markup)) tagClasses.add(pair);
    }
  }
  resetCyberScope();

  return { classes, tagClasses };
}

const CYBER_CSS = readFileSync(join(SRC_DIR, 'cyber.css'), 'utf8');
const TOKENS_CSS = readFileSync(join(SRC_DIR, 'cyberTokens.css'), 'utf8');

/** The palette, spacing and type steps the existing shell already declares. */
const EXISTING_TOKEN_NAMES = declaredCustomProperties(CYBER_CSS);

/** Every class name the existing stylesheet styles. */
const EXISTING_CSS_CLASSES = [
  ...withoutComments(CYBER_CSS).matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g),
].map((match) => match[1] as string);

beforeEach(() => {
  resetCyberScope();
  resetCyberScopeContext();
});

afterEach(() => {
  resetCyberScope();
  resetCyberScopeContext();
  setCurrentPath(null);
});

describe('component audit', () => {
  it('uses only existing tokens and components', () => {
    /* -------------------------------------------------------------- *
     * 1. The existing set: every class the POC screens actually render
     *    and every class its stylesheet styles.
     * -------------------------------------------------------------- */
    const { classes: rendered, tagClasses: existingTagClasses } = existingComponentSet();
    const existingClasses = new Set<string>([...EXISTING_CSS_CLASSES, ...rendered]);

    expect(existingClasses.size, 'no existing classes were collected').toBeGreaterThan(10);
    // The new badge is not part of the existing set, so the audit below is a
    // real comparison rather than a tautology.
    for (const chipClass of CYBER_TOKEN_CLASSES) {
      expect(existingClasses.has(chipClass), `${chipClass} already exists in the POC`).toBe(false);
    }

    /* -------------------------------------------------------------- *
     * 2. Exactly two new token sets, each derived from the existing
     *    palette: no new base colour, font or spacing step.
     * -------------------------------------------------------------- */
    const declared = declaredCustomProperties(TOKENS_CSS).sort();
    expect(declared).toEqual([...CYBER_TOKEN_NAMES].sort());

    const namespaces = new Set(
      declared.map((name) => (name.startsWith('--cyber-grade-') ? 'grade' : name.startsWith('--cyber-priority-') ? 'priority' : name)),
    );
    expect([...namespaces].sort(), 'more than the two agreed token sets').toEqual([
      'grade',
      'priority',
    ]);
    expect(declared.filter((name) => name.startsWith('--cyber-grade-')).length).toBe(
      CYBER_GRADES.length * 2,
    );
    expect(declared.filter((name) => name.startsWith('--cyber-priority-')).length).toBe(
      CYBER_PRIORITIES.length * 2,
    );

    // Every value the new stylesheet reads is an existing token or another
    // new token; nothing else is reachable from it.
    for (const name of referencedCustomProperties(TOKENS_CSS)) {
      expect(
        EXISTING_TOKEN_NAMES.includes(name) || CYBER_TOKEN_NAMES.includes(name),
        `${name} is neither an existing shell token nor one of the two new sets`,
      ).toBe(true);
    }

    // No raw colour anywhere in the new stylesheet: every colour arrives
    // through a var() reference to the existing palette.
    const tokenCssBody = withoutComments(TOKENS_CSS);
    for (const literal of tokenCssBody.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) ?? []) {
      expect(literal, 'the new stylesheet declares a raw colour').toBe(undefined);
    }

    // And no new length step: every rem/px/em value it uses is one the
    // existing stylesheet already uses.
    const existingLengths = new Set(withoutComments(CYBER_CSS).match(/\b[\d.]+(?:rem|px|em)\b/g) ?? []);
    for (const length of tokenCssBody.match(/\b[\d.]+(?:rem|px|em)\b/g) ?? []) {
      expect(
        existingLengths.has(length),
        `${length} is not a spacing or type step the shell already uses`,
      ).toBe(true);
    }

    // Each new token derives from the existing tokens recorded beside it.
    for (const [name, sources] of Object.entries(TOKEN_DERIVATIONS)) {
      const declaration = new RegExp(`${name}\\s*:([^;]*);`).exec(tokenCssBody)?.[1] as string;
      expect(declaration, `${name} is not declared in cyberTokens.css`).toBeDefined();
      expect(referencedCustomProperties(declaration).sort(), `${name} derivation`).toEqual(
        [...sources].sort(),
      );
      for (const source of sources) {
        expect(
          EXISTING_TOKEN_NAMES.includes(source),
          `${name} derives from ${source}, which the shell does not declare`,
        ).toBe(true);
      }
    }

    // The badge modifiers carry the token sets and nothing else.
    for (const grade of CYBER_GRADES) {
      expect(tokenFor('grade', grade)).toBe(`--cyber-grade-${grade.toLowerCase()}-ink`);
      expect(tokenCssBody).toContain(`.cyber-chip--grade-${grade.toLowerCase()}`);
    }
    for (const priority of CYBER_PRIORITIES) {
      expect(tokenFor('priority', priority)).toBe(
        `--cyber-priority-${priority.toLowerCase()}-ink`,
      );
      expect(tokenCssBody).toContain(`.cyber-chip--priority-${priority.toLowerCase()}`);
    }

    /* -------------------------------------------------------------- *
     * 3. The screens themselves: only existing components and classes,
     *    plus the two new token sets.
     * -------------------------------------------------------------- */
    const allowedClasses = new Set([...existingClasses, ...CYBER_TOKEN_CLASSES]);
    const allowedTagClasses = new Set([
      ...existingTagClasses,
      ...CYBER_TOKEN_CLASSES.flatMap((name) => [`span.${name}`]),
    ]);

    for (const path of CYBER_SCREENS) {
      const markup = render(path);
      const screen = mainOf(markup);
      const used = collectUsedTokens(screen);

      expect(used.classes.length, `${path} rendered nothing`).toBeGreaterThan(3);

      for (const name of used.classes) {
        expect(
          allowedClasses.has(name),
          `${path} uses "${name}", which is neither an existing component class nor one of the two new token sets`,
        ).toBe(true);
      }

      // Each class is used on the same element the POC uses it on — a card
      // class on an <article>, a table class on a <table> — so a borrowed
      // name cannot be applied to a different kind of element.
      for (const pair of tagClassPairs(screen)) {
        const [tag, className] = [pair.slice(0, pair.indexOf('.')), pair.slice(pair.indexOf('.') + 1)];
        const isNewBadge = className
          .split(/\s+/)
          .every((name) => CYBER_TOKEN_CLASSES.includes(name));
        expect(
          allowedTagClasses.has(pair) || (isNewBadge && tag === 'span'),
          `${path} renders <${tag} class="${className}">, which the POC does not`,
        ).toBe(true);
      }

      // No ad hoc inline style, and no custom property reached for outside
      // the two new sets.
      expect(/\sstyle="/.test(screen), `${path} carries an inline style`).toBe(false);
      for (const cssVar of used.cssVars) {
        expect(
          CYBER_TOKEN_NAMES.includes(cssVar),
          `${path} reaches for ${cssVar} outside the two new token sets`,
        ).toBe(true);
      }
    }

    /* -------------------------------------------------------------- *
     * 4. The modules the screens are built from.
     * -------------------------------------------------------------- */
    for (const file of ['CyberOverview.tsx', 'CyberFindings.tsx']) {
      const source = readFileSync(join(SRC_DIR, file), 'utf8');
      for (const specifier of importsOf(source)) {
        expect(
          ALLOWED_IMPORTS.includes(specifier),
          `${file} imports ${specifier}, which is outside the existing component set`,
        ).toBe(true);
      }
      // No stylesheet of its own: the screens compose existing classes.
      expect(/import\s+'[^']*\.css'/.test(source), `${file} imports a stylesheet`).toBe(false);
    }

    /* -------------------------------------------------------------- *
     * 5. The new token sets are actually what colours grade and
     *    priority on screen: every grade and every priority in the
     *    data set is rendered through its own badge class.
     * -------------------------------------------------------------- */
    setCurrentPath('/cyber-poc/findings');
    const everyGradeSeen = new Set<string>();
    const everyPrioritySeen = new Set<string>();

    for (const facility of cyberFacilities()) {
      setCyberScopeFacility(facility.id);
      const screen = mainOf(renderToStaticMarkup(createElement(App)));
      for (const grade of CYBER_GRADES) {
        if (screen.includes(`data-grade="${grade}"`)) {
          expect(screen, `grade ${grade} is not badged`).toContain(chipClassFor('grade', grade));
          everyGradeSeen.add(grade);
        }
      }
      for (const priority of CYBER_PRIORITIES) {
        if (screen.includes(`data-priority="${priority}"`)) {
          expect(screen, `priority ${priority} is not badged`).toContain(
            chipClassFor('priority', priority),
          );
          everyPrioritySeen.add(priority);
        }
      }
    }

    expect([...everyPrioritySeen].sort()).toEqual([...CYBER_PRIORITIES].sort());
    expect(everyGradeSeen.size, 'the grade token set is never exercised').toBeGreaterThan(3);
    expect(findingsByRole('program-lead').length).toBeGreaterThan(0);
    expect(gradeRollups().length).toBe(cyberFacilities().length);
  });
});

describe('side-by-side review', () => {
  it('no visual mismatch', () => {
    // The mapping covers every screen this requirement adds.
    expect([...PARITY_MAPPING.map((entry) => entry.cyberScreen)].sort()).toEqual(
      [...CYBER_SCREENS].sort(),
    );
    expect(CYBER_POC_NAV.map((item) => item.path).sort()).toEqual([...CYBER_SCREENS].sort());

    const shellReference = render(SHELL_REFERENCE_SCREEN);
    const referenceHeadings = headingLevels(mainOf(shellReference));

    for (const { cyberScreen, referenceScreen } of PARITY_MAPPING) {
      const cyberMarkup = render(cyberScreen);
      const referenceMarkup = render(referenceScreen);
      const cyber = mainOf(cyberMarkup);
      const reference = mainOf(referenceMarkup);
      const where = `${cyberScreen} vs ${referenceScreen}`;

      /* ---------------------------------------------------------- *
       * 1. The same shell, to the character: the new screen is in the
       *    existing frame, not in a parallel one.
       * ---------------------------------------------------------- */
      expect(chromeOf(cyberMarkup), `${where}: the shell differs`).toBe(
        chromeOf(referenceMarkup),
      );
      expect(chromeOf(cyberMarkup), `${cyberScreen} vs ${SHELL_REFERENCE_SCREEN}: the shell differs`).toBe(
        chromeOf(shellReference),
      );

      /* ---------------------------------------------------------- *
       * 2. The same screen skeleton: group wrapper, standing
       *    illustrative notice, screen section, title, lede.
       * ---------------------------------------------------------- */
      expect(skeleton(cyber), `${where}: the screen skeleton differs`).toEqual(skeleton(reference));
      expect(cyber, `${cyberScreen} is missing the illustrative notice`).toContain(
        ILLUSTRATIVE_BANNER_TEXT,
      );
      expect(cyber).toContain('class="illustrative-banner"');

      /* ---------------------------------------------------------- *
       * 3. The same heading hierarchy: one h1, then h2 sections, no
       *    skipped level — as on the tier catalogue the POC began with.
       * ---------------------------------------------------------- */
      const levels = headingLevels(cyber);
      expect(levels[0], `${where}: the screen does not open with an h1`).toBe(1);
      expect(levels.filter((level) => level === 1).length, `${where}: more than one h1`).toBe(1);
      expect(new Set(levels), `${where}: heading levels differ`).toEqual(
        new Set(headingLevels(reference)),
      );
      expect(Math.max(...levels), `${where}: deeper headings than the POC uses`).toBeLessThanOrEqual(
        Math.max(...referenceHeadings),
      );

      /* ---------------------------------------------------------- *
       * 4. The same component and spacing containers: where both
       *    screens use a kind, they use it with the same classes.
       * ---------------------------------------------------------- */
      for (const kind of ['table', 'cards'] as const) {
        const cyberClass = classOfKind(cyber, kind);
        if (cyberClass === undefined) continue;
        const referenceClass =
          classOfKind(reference, kind) ??
          EXISTING_SCREENS.map((path) => classOfKind(mainOf(render(path)), kind)).find(
            (value) => value !== undefined,
          );
        expect(referenceClass, `${where}: no existing screen uses a ${kind}`).toBeDefined();
        expect(cyberClass, `${where}: the ${kind} is not the POC's ${kind}`).toBe(referenceClass);
      }

      // The cards and the table carry the existing content classes too.
      for (const container of ['cyber-card__facts', 'cyber-table__detail']) {
        if (!cyber.includes(container)) continue;
        expect(
          EXISTING_SCREENS.some((path) => render(path).includes(container)),
          `${where}: ${container} is not an existing content container`,
        ).toBe(true);
      }

      /* ---------------------------------------------------------- *
       * 5. Nothing the POC does not already render: every
       *    element/class pair on the new screen appears on an
       *    existing one, apart from the two new token sets' badge.
       * ---------------------------------------------------------- */
      const existingPairs = existingComponentSet().tagClasses;
      for (const pair of tagClassPairs(cyber)) {
        const className = pair.slice(pair.indexOf('.') + 1);
        const isNewBadge = className
          .split(/\s+/)
          .every((name) => CYBER_TOKEN_CLASSES.includes(name));
        expect(
          existingPairs.has(pair) || isNewBadge,
          `${where}: <${pair}> has no counterpart in the POC`,
        ).toBe(true);
      }
    }
  });
});
