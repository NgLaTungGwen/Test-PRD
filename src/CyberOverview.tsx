import { IllustrativeFigure, IllustrativeNotice } from './IllustrativeFigure';
import {
  CYBER_PRIORITIES,
  cyberFacilityById,
  findingsByFacility,
  gradeRollupsForRole,
} from './cyberData';
import { useCyberScopeContext } from './CyberScopeContext';
import { chipClassFor } from './cyberTokens';

/**
 * The cyber posture overview: one grade summary card per facility the current
 * role may see, each with that facility's finding counts by priority.
 *
 * Every piece of this screen is an existing Innovation Pathway pattern. The
 * cards are the `cyber-cards` / `cyber-card` / `cyber-card__facts` pattern the
 * catalogue screen already uses, the headings and the lede are the existing
 * `cyber-screen` ones, and every figure goes through `IllustrativeFigure` as
 * the rest of the prototype does. The only thing added to the existing set is
 * the grade / priority badge, which carries nothing but the two new token
 * sets from `cyberTokens.ts`.
 */
export function CyberOverview() {
  const { role, facilityId } = useCyberScopeContext();
  const rollups = gradeRollupsForRole(role);

  return (
    <>
      <IllustrativeNotice />

      <section className="cyber-screen" data-testid="cyber-poc-overview" data-facility={facilityId}>
        <h1>Cyber posture overview</h1>
        <p className="cyber-screen__lede" data-testid="cyber-poc-overview-lede">
          Posture grade and open findings by priority, for every facility this role covers.
        </p>

        <div className="cyber-cards">
          {rollups.map((rollup) => {
            const facility = cyberFacilityById(rollup.facilityId);
            const name = facility?.name ?? rollup.facilityId;
            const findings = findingsByFacility(rollup.facilityId);

            return (
              <article
                key={rollup.facilityId}
                className="cyber-card"
                data-testid={`posture-card-${rollup.facilityId}`}
                data-grade={rollup.grade}
                data-scoped={rollup.facilityId === facilityId ? 'true' : undefined}
                aria-labelledby={`posture-heading-${rollup.facilityId}`}
              >
                <h2 id={`posture-heading-${rollup.facilityId}`}>{name}</h2>

                <dl className="cyber-card__facts">
                  <div>
                    <dt>Posture grade</dt>
                    <dd data-testid={`posture-grade-${rollup.facilityId}`}>
                      <span
                        className={chipClassFor('grade', rollup.grade)}
                        data-grade={rollup.grade}
                      >
                        {rollup.grade}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Service tier</dt>
                    <dd>{facility?.serviceTier ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Region</dt>
                    <dd>{facility?.region ?? '—'}</dd>
                  </div>
                  {CYBER_PRIORITIES.map((priority) => (
                    <div key={priority}>
                      <dt>
                        <span
                          className={chipClassFor('priority', priority)}
                          data-priority={priority}
                        >
                          {priority}
                        </span>
                      </dt>
                      <dd data-testid={`priority-count-${rollup.facilityId}-${priority}`}>
                        <IllustrativeFigure
                          value={rollup.counts[priority]}
                          description={`${name} ${priority} findings`}
                        />
                      </dd>
                    </div>
                  ))}
                  <div>
                    <dt>All findings</dt>
                    <dd data-testid={`finding-total-${rollup.facilityId}`}>
                      <IllustrativeFigure
                        value={findings.length}
                        description={`${name} findings`}
                      />
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default CyberOverview;
