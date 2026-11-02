/**
 * The typed half of the two new semantic token sets — grade A–F and
 * priority P1–P4 — declared as CSS custom properties in `cyberTokens.css`.
 *
 * These are the only tokens the cyber screens add to the Innovation Pathway
 * set. Every other colour, type size and spacing step a cyber screen uses is
 * an existing one, and the component audit in `ui-parity.spec.ts` asserts
 * exactly that: it reads the stylesheet beside this module, checks that the
 * custom properties it declares are these two sets and nothing else, and that
 * each of them resolves to a token the shell already owns.
 *
 * Nothing here imports React or the DOM: the screens use it for class names
 * and the audit uses it for the allow-list.
 */

/** The six posture grades, best first. */
export const GRADES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** The four finding priorities, most urgent first. */
export const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;

export type Grade = (typeof GRADES)[number];

export type Priority = (typeof PRIORITIES)[number];

/** Which of the two new sets a token belongs to. */
export type TokenKind = 'grade' | 'priority';

export type GradeToken = Record<Grade, string>;

export type PriorityToken = Record<Priority, string>;

/**
 * Grade -> the custom property that carries its ink colour.
 *
 * Each one is derived in `cyberTokens.css` from the existing palette value
 * named beside it; no new base colour is introduced.
 */
export const GRADE_TOKENS: GradeToken = {
  A: '--cyber-grade-a-ink',
  B: '--cyber-grade-b-ink',
  C: '--cyber-grade-c-ink',
  D: '--cyber-grade-d-ink',
  E: '--cyber-grade-e-ink',
  F: '--cyber-grade-f-ink',
};

/** Grade -> the custom property that carries its surface colour. */
export const GRADE_SURFACE_TOKENS: GradeToken = {
  A: '--cyber-grade-a-bg',
  B: '--cyber-grade-b-bg',
  C: '--cyber-grade-c-bg',
  D: '--cyber-grade-d-bg',
  E: '--cyber-grade-e-bg',
  F: '--cyber-grade-f-bg',
};

/** Priority -> the custom property that carries its ink colour. */
export const PRIORITY_TOKENS: PriorityToken = {
  P1: '--cyber-priority-p1-ink',
  P2: '--cyber-priority-p2-ink',
  P3: '--cyber-priority-p3-ink',
  P4: '--cyber-priority-p4-ink',
};

/** Priority -> the custom property that carries its surface colour. */
export const PRIORITY_SURFACE_TOKENS: PriorityToken = {
  P1: '--cyber-priority-p1-bg',
  P2: '--cyber-priority-p2-bg',
  P3: '--cyber-priority-p3-bg',
  P4: '--cyber-priority-p4-bg',
};

/**
 * The existing shell tokens every new token is derived from, as the comment
 * block in `cyberTokens.css` records them. The audit reads the stylesheet and
 * checks the derivations against this map rather than trusting the comment.
 */
export const TOKEN_DERIVATIONS: Record<string, string[]> = {
  '--cyber-grade-a-ink': ['--cyber-accent'],
  '--cyber-grade-a-bg': ['--cyber-accent', '--cyber-surface'],
  '--cyber-grade-b-ink': ['--cyber-accent', '--cyber-ink'],
  '--cyber-grade-b-bg': ['--cyber-accent', '--cyber-surface'],
  '--cyber-grade-c-ink': ['--cyber-ink'],
  '--cyber-grade-c-bg': ['--cyber-ink', '--cyber-surface'],
  '--cyber-grade-d-ink': ['--cyber-muted'],
  '--cyber-grade-d-bg': ['--cyber-muted', '--cyber-surface'],
  '--cyber-grade-e-ink': ['--cyber-warn-ink', '--cyber-muted'],
  '--cyber-grade-e-bg': ['--cyber-warn-bg', '--cyber-surface'],
  '--cyber-grade-f-ink': ['--cyber-warn-ink'],
  '--cyber-grade-f-bg': ['--cyber-warn-bg'],
  '--cyber-priority-p1-ink': ['--cyber-warn-ink'],
  '--cyber-priority-p1-bg': ['--cyber-warn-bg'],
  '--cyber-priority-p2-ink': ['--cyber-warn-ink', '--cyber-ink'],
  '--cyber-priority-p2-bg': ['--cyber-warn-bg', '--cyber-surface'],
  '--cyber-priority-p3-ink': ['--cyber-ink'],
  '--cyber-priority-p3-bg': ['--cyber-ink', '--cyber-surface'],
  '--cyber-priority-p4-ink': ['--cyber-muted'],
  '--cyber-priority-p4-bg': ['--cyber-muted', '--cyber-surface'],
};

/** Every custom property the two new sets declare. */
export const CYBER_TOKEN_NAMES: string[] = Object.keys(TOKEN_DERIVATIONS);

/**
 * The base class of the badge the new token sets are shown through, plus the
 * one modifier per grade and per priority. These are the only class names the
 * cyber screens add to the existing component set, and the audit allows
 * exactly these and no others.
 */
export const CYBER_CHIP_CLASS = 'cyber-chip';

export const CYBER_TOKEN_CLASSES: string[] = [
  CYBER_CHIP_CLASS,
  ...GRADES.map((grade) => `${CYBER_CHIP_CLASS}--grade-${grade.toLowerCase()}`),
  ...PRIORITIES.map((priority) => `${CYBER_CHIP_CLASS}--priority-${priority.toLowerCase()}`),
];

/** Whether a string is one of the six grades. */
export function isGrade(value: string): value is Grade {
  return (GRADES as readonly string[]).includes(value);
}

/** Whether a string is one of the four priorities. */
export function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}

/**
 * The custom property a grade or a priority is coloured with.
 *
 * Throws on anything outside the two sets rather than falling back to a
 * colour, so an unknown value cannot quietly reach a screen.
 */
export function tokenFor(kind: TokenKind, value: string): string {
  if (kind === 'grade') {
    if (!isGrade(value)) throw new Error(`unknown grade "${value}"`);
    return GRADE_TOKENS[value];
  }
  if (!isPriority(value)) throw new Error(`unknown priority "${value}"`);
  return PRIORITY_TOKENS[value];
}

/** The surface custom property a grade or a priority is filled with. */
export function surfaceTokenFor(kind: TokenKind, value: string): string {
  if (kind === 'grade') {
    if (!isGrade(value)) throw new Error(`unknown grade "${value}"`);
    return GRADE_SURFACE_TOKENS[value];
  }
  if (!isPriority(value)) throw new Error(`unknown priority "${value}"`);
  return PRIORITY_SURFACE_TOKENS[value];
}

/**
 * The badge class pair a grade or a priority is rendered with: the existing
 * badge shape plus the one modifier that applies its token.
 */
export function chipClassFor(kind: TokenKind, value: string): string {
  const suffix = kind === 'grade' ? `grade-${value.toLowerCase()}` : `priority-${value.toLowerCase()}`;
  // Validate through tokenFor, so an unknown value throws here too.
  tokenFor(kind, value);
  return `${CYBER_CHIP_CLASS} ${CYBER_CHIP_CLASS}--${suffix}`;
}

/**
 * Every class name and CSS custom property a fragment of rendered markup
 * uses, de-duplicated and sorted.
 *
 * This is what the component audit walks: `classes` from every `class`
 * attribute, `cssVars` from every custom property mentioned anywhere in the
 * markup — a `var(--x)` reference or an inline `--x:` declaration — so an ad
 * hoc inline style cannot slip a colour past the audit.
 */
export function collectUsedTokens(html: string): { classes: string[]; cssVars: string[] } {
  const classes = new Set<string>();
  for (const match of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const name of (match[1] as string).split(/\s+/)) {
      if (name !== '') classes.add(name);
    }
  }

  const cssVars = new Set<string>();
  // A custom property is only "used" where it is read or declared: a `var()`
  // reference anywhere, or a declaration inside an inline style attribute.
  // A class name that merely contains `--` is a BEM modifier, not a token.
  for (const match of html.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
    cssVars.add(match[1] as string);
  }
  for (const match of html.matchAll(/\sstyle="([^"]*)"/g)) {
    for (const declaration of (match[1] as string).matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) {
      cssVars.add(declaration[1] as string);
    }
  }

  return {
    classes: [...classes].sort(),
    cssVars: [...cssVars].sort(),
  };
}

/** One cyber screen and the existing POC screen it is reviewed against. */
export type ParityMapping = { cyberScreen: string; referenceScreen: string }[];
