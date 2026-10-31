import { IllustrativeFigure } from './IllustrativeFigure';
import { PRIORITIES, loadTiers, slaTargetFor } from './tiers';

/**
 * The catalogue screen: every tier's inclusions and cadences, its per-priority
 * SLA acknowledgement/notification target pairs and its IR time-to-engage
 * target. Every figure is emitted through IllustrativeFigure, never as raw text.
 */
export function TierCatalogue() {
  const tiers = loadTiers();

  return (
    <main className="tier-catalogue" data-testid="tier-catalogue">
      <h1>Service tier catalogue</h1>
      <p data-testid="catalogue-disclaimer">
        All figures shown on this page are illustrative targets, not contractual commitments.
      </p>

      {tiers.map((tier) => (
        <section
          key={tier.id}
          className="tier"
          data-testid={`tier-${tier.id}`}
          aria-labelledby={`tier-heading-${tier.id}`}
        >
          <h2 id={`tier-heading-${tier.id}`}>{tier.name}</h2>

          <dl className="tier__inclusions">
            <div>
              <dt>Facility size</dt>
              <dd data-testid={`facility-size-${tier.id}`}>{tier.facilitySize}</dd>
            </div>
            <div>
              <dt>MDR scope</dt>
              <dd data-testid={`mdr-scope-${tier.id}`}>{tier.mdrScope}</dd>
            </div>
            <div>
              <dt>Continuous monitoring</dt>
              <dd data-testid={`monitoring-scope-${tier.id}`}>{tier.monitoringScope}</dd>
            </div>
            <div>
              <dt>IR retainer hours</dt>
              <dd data-testid={`ir-retainer-${tier.id}`}>
                <IllustrativeFigure
                  value={tier.irRetainerHours}
                  unit="hours"
                  description={`${tier.name} IR retainer`}
                />
              </dd>
            </div>
            <div>
              <dt>Remediation support</dt>
              <dd data-testid={`remediation-support-${tier.id}`}>{tier.remediationSupport}</dd>
            </div>
            <div>
              <dt>Tabletop exercises</dt>
              <dd data-testid={`tabletop-exercises-${tier.id}`}>
                <IllustrativeFigure
                  value={tier.tabletopExercises}
                  unit="per year"
                  description={`${tier.name} tabletop exercises`}
                />
              </dd>
            </div>
            <div>
              <dt>Posture assessment cadence</dt>
              <dd data-testid={`posture-cadence-${tier.id}`}>
                <IllustrativeFigure
                  value={tier.postureAssessmentCadence}
                  description={`${tier.name} posture assessment cadence`}
                />
              </dd>
            </div>
            <div>
              <dt>Report cadence</dt>
              <dd data-testid={`report-cadence-${tier.id}`}>
                <IllustrativeFigure
                  value={tier.reportCadence}
                  description={`${tier.name} report cadence`}
                />
              </dd>
            </div>
            <div>
              <dt>IR time to engage</dt>
              <dd data-testid={`ir-time-to-engage-${tier.id}`}>
                <IllustrativeFigure
                  value={tier.irTimeToEngageMinutes}
                  unit="min"
                  description={`${tier.name} IR time to engage`}
                />
              </dd>
            </div>
          </dl>

          <table className="tier__sla" data-testid={`sla-table-${tier.id}`}>
            <caption>{tier.name} illustrative SLA targets</caption>
            <thead>
              <tr>
                <th scope="col">Priority</th>
                <th scope="col">Acknowledgement time</th>
                <th scope="col">Notification time</th>
              </tr>
            </thead>
            <tbody>
              {PRIORITIES.map((priority) => {
                const target = slaTargetFor(tier, priority);
                return (
                  <tr key={priority} data-testid={`sla-row-${tier.id}-${priority}`}>
                    <th scope="row">{priority}</th>
                    <td data-testid={`sla-ack-${tier.id}-${priority}`}>
                      <IllustrativeFigure
                        value={target.ackMinutes}
                        unit="min"
                        description={`${tier.name} ${priority} acknowledgement time`}
                      />
                    </td>
                    <td data-testid={`sla-notify-${tier.id}-${priority}`}>
                      <IllustrativeFigure
                        value={target.notifyMinutes}
                        unit="min"
                        description={`${tier.name} ${priority} notification time`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}

export default TierCatalogue;
