import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import App from './App';
import { IllustrativeFigure } from './IllustrativeFigure';
import TierCatalogue from './TierCatalogue';
import { PRIORITIES, SchemaError, loadTiers, parseTiers } from './tiers';
import type { Priority, ServiceTier, TierId } from './tiers';

/** The PRD inclusions table, transcribed independently of the fixture file. */
const PRD_INCLUSIONS: Record<TierId, Omit<ServiceTier, 'id' | 'slaTargets'>> = {
  essentials: {
    name: 'Essentials',
    facilitySize: 'Single facility, up to 250 endpoints',
    mdrScope: 'MDR across endpoints and email',
    monitoringScope: 'Continuous monitoring with 8x5 analyst triage',
    irRetainerHours: 20,
    remediationSupport: 'Remote remediation advisory guidance',
    tabletopExercises: 1,
    postureAssessmentCadence: 'Annual',
    reportCadence: 'Quarterly',
    irTimeToEngageMinutes: 240,
  },
  standard: {
    name: 'Standard',
    facilitySize: 'Up to 3 facilities, up to 1,000 endpoints',
    mdrScope: 'MDR across endpoints, email and cloud workloads',
    monitoringScope: 'Continuous 24x7 monitoring with OT network visibility',
    irRetainerHours: 40,
    remediationSupport: 'Guided remediation with analyst support',
    tabletopExercises: 2,
    postureAssessmentCadence: 'Semi-annual',
    reportCadence: 'Monthly',
    irTimeToEngageMinutes: 60,
  },
  advanced: {
    name: 'Advanced',
    facilitySize: 'Multi-facility estate, 1,000+ endpoints',
    mdrScope: 'MDR across endpoints, email, cloud, identity and OT/ICS',
    monitoringScope: 'Continuous 24x7 monitoring with proactive threat hunting',
    irRetainerHours: 80,
    remediationSupport: 'Hands-on remediation delivered by the response team',
    tabletopExercises: 4,
    postureAssessmentCadence: 'Quarterly',
    reportCadence: 'Monthly with weekly operational review',
    irTimeToEngageMinutes: 15,
  },
};

/** The PRD SLA target table: [ackMinutes, notifyMinutes] per tier and priority. */
const PRD_SLA_TARGETS: Record<TierId, Record<Priority, [number, number]>> = {
  essentials: { P1: [60, 60], P2: [120, 240], P3: [240, 480], P4: [480, 960] },
  standard: { P1: [30, 30], P2: [60, 120], P3: [120, 240], P4: [240, 480] },
  advanced: { P1: [15, 15], P2: [30, 60], P3: [60, 120], P4: [120, 240] },
};

/** Returns the markup of the element carrying the given data-testid. */
function elementByTestId(markup: string, testId: string): string {
  const start = markup.indexOf(`data-testid="${testId}"`);
  expect(start, `no element with data-testid="${testId}"`).toBeGreaterThan(-1);

  const tagStart = markup.lastIndexOf('<', start);
  const tagName = /^<([a-zA-Z0-9]+)/.exec(markup.slice(tagStart))?.[1] as string;

  let cursor = markup.indexOf('>', start) + 1;
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
    .replace(/\s+/g, ' ')
    .trim();
}

describe('Service model', () => {
  it('tier fixture matches inclusions table', () => {
    const tiers = loadTiers();

    expect(tiers.map((tier) => tier.id)).toEqual(['essentials', 'standard', 'advanced']);

    for (const tierId of ['essentials', 'standard', 'advanced'] as TierId[]) {
      const tier = tiers.find((candidate) => candidate.id === tierId) as ServiceTier;
      const expected = PRD_INCLUSIONS[tierId];

      expect(tier, `tier ${tierId} is missing from the fixture`).toBeDefined();
      expect(tier.name).toBe(expected.name);
      expect(tier.mdrScope).toBe(expected.mdrScope);
      expect(tier.monitoringScope).toBe(expected.monitoringScope);
      expect(tier.irRetainerHours).toBe(expected.irRetainerHours);
      expect(tier.remediationSupport).toBe(expected.remediationSupport);
      expect(tier.tabletopExercises).toBe(expected.tabletopExercises);
      expect(tier.postureAssessmentCadence).toBe(expected.postureAssessmentCadence);
      expect(tier.reportCadence).toBe(expected.reportCadence);
      expect(tier.facilitySize).toBe(expected.facilitySize);
      expect(tier.irTimeToEngageMinutes).toBe(expected.irTimeToEngageMinutes);

      expect(tier.slaTargets.map((target) => target.priority)).toEqual(PRIORITIES);
      for (const priority of PRIORITIES) {
        const [ackMinutes, notifyMinutes] = PRD_SLA_TARGETS[tierId][priority];
        const target = tier.slaTargets.find((row) => row.priority === priority);
        expect(target).toEqual({ priority, ackMinutes, notifyMinutes });
      }
    }
  });

  it('rejects a fixture whose tier, inclusion or SLA target is missing', () => {
    expect(() => parseTiers({ tiers: [] })).toThrow(SchemaError);
    expect(() => parseTiers({ tiers: [] })).toThrow(/missing the "essentials" tier/);

    const valid = loadTiers();
    const withoutMdrScope = JSON.parse(JSON.stringify({ tiers: valid }));
    delete withoutMdrScope.tiers[0].mdrScope;
    expect(() => parseTiers(withoutMdrScope)).toThrow(/missing required field "mdrScope"/);

    const withoutNotify = JSON.parse(JSON.stringify({ tiers: valid }));
    delete withoutNotify.tiers[2].slaTargets[0].notifyMinutes;
    expect(() => parseTiers(withoutNotify)).toThrow(/P1 is missing a valid notifyMinutes target/);
  });

  it('renders SLA targets by priority and tier', () => {
    const markup = renderToStaticMarkup(createElement(TierCatalogue));

    for (const tierId of ['essentials', 'standard', 'advanced'] as TierId[]) {
      for (const priority of PRIORITIES) {
        const [ackMinutes, notifyMinutes] = PRD_SLA_TARGETS[tierId][priority];

        const row = elementByTestId(markup, `sla-row-${tierId}-${priority}`);
        expect(textOf(row)).toContain(priority);

        const ack = elementByTestId(markup, `sla-ack-${tierId}-${priority}`);
        const notify = elementByTestId(markup, `sla-notify-${tierId}-${priority}`);

        expect(textOf(ack)).toContain(`${ackMinutes} min`);
        expect(textOf(notify)).toContain(`${notifyMinutes} min`);
      }
    }

    // The worked example from the PRD: Advanced P1 = 15 min / 15 min.
    expect(textOf(elementByTestId(markup, 'sla-ack-advanced-P1'))).toContain('15 min');
    expect(textOf(elementByTestId(markup, 'sla-notify-advanced-P1'))).toContain('15 min');
    expect(textOf(elementByTestId(markup, 'sla-ack-essentials-P1'))).toContain('60 min');

    // The IR time-to-engage target per tier.
    for (const tierId of ['essentials', 'standard', 'advanced'] as TierId[]) {
      const engage = elementByTestId(markup, `ir-time-to-engage-${tierId}`);
      expect(textOf(engage)).toContain(`${PRD_INCLUSIONS[tierId].irTimeToEngageMinutes} min`);
    }
  });

  it('tier figures labelled illustrative', () => {
    const figure = renderToStaticMarkup(
      createElement(IllustrativeFigure, {
        value: 15,
        unit: 'min',
        description: 'Advanced P1 acknowledgement time',
      }),
    );
    expect(textOf(figure)).toBe('15 min illustrative');
    expect(figure).toContain(
      'aria-label="Advanced P1 acknowledgement time: 15 min (illustrative)"',
    );

    for (const markup of [
      renderToStaticMarkup(createElement(TierCatalogue)),
      renderToStaticMarkup(createElement(App)),
    ]) {
      const figures = markup.match(/<span class="illustrative-figure"[\s\S]*?<\/span><\/span>/g);
      expect(figures, 'no tier figures rendered').not.toBeNull();
      expect((figures as string[]).length).toBeGreaterThan(0);

      for (const rendered of figures as string[]) {
        expect(textOf(rendered)).toMatch(/ illustrative$/);
        expect(rendered).toMatch(/aria-label="[^"]*\(illustrative\)"/);
      }

      // Every figure the catalogue shows goes through the labelled component.
      for (const tierId of ['essentials', 'standard', 'advanced'] as TierId[]) {
        for (const testId of [
          `ir-retainer-${tierId}`,
          `tabletop-exercises-${tierId}`,
          `posture-cadence-${tierId}`,
          `report-cadence-${tierId}`,
          `ir-time-to-engage-${tierId}`,
          ...PRIORITIES.flatMap((priority) => [
            `sla-ack-${tierId}-${priority}`,
            `sla-notify-${tierId}-${priority}`,
          ]),
        ]) {
          expect(textOf(elementByTestId(markup, testId)), testId).toMatch(/illustrative$/);
        }
      }
    }
  });
});
