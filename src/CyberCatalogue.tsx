import { IllustrativeFigure } from './IllustrativeFigure';
import { getCatalogue } from './cyberData';

/**
 * The service tier catalogue, as cards.
 *
 * It keeps the presentation conventions of `TierCatalogue`: a card per tier, a
 * definition list of inclusions and every figure emitted through
 * `IllustrativeFigure` rather than as raw text.
 */
export function CyberCatalogue() {
  const entries = getCatalogue();

  return (
    <section className="cyber-screen" data-testid="cyber-catalogue">
      <h1>Catalogue</h1>
      <p className="cyber-screen__lede" data-testid="cyber-catalogue-disclaimer">
        All figures shown on this page are illustrative targets, not contractual commitments.
      </p>

      <div className="cyber-cards">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="cyber-card"
            data-testid={`catalogue-card-${entry.id}`}
            aria-labelledby={`catalogue-heading-${entry.id}`}
          >
            <h2 id={`catalogue-heading-${entry.id}`}>{entry.name}</h2>

            <dl className="cyber-card__facts">
              <div>
                <dt>Facility size</dt>
                <dd>{entry.facilitySize}</dd>
              </div>
              <div>
                <dt>Report cadence</dt>
                <dd>{entry.reportCadence}</dd>
              </div>
              <div>
                <dt>IR retainer</dt>
                <dd>
                  <IllustrativeFigure
                    value={entry.irRetainerHours}
                    unit="hours"
                    description={`${entry.name} IR retainer`}
                  />
                </dd>
              </div>
              <div>
                <dt>IR time to engage</dt>
                <dd>
                  <IllustrativeFigure
                    value={entry.irTimeToEngageMinutes}
                    unit="min"
                    description={`${entry.name} IR time to engage`}
                  />
                </dd>
              </div>
              <div>
                <dt>Members on this tier</dt>
                <dd>
                  <IllustrativeFigure
                    value={entry.memberCount}
                    description={`${entry.name} members`}
                  />
                </dd>
              </div>
            </dl>

            <ul className="cyber-card__services" data-testid={`catalogue-services-${entry.id}`}>
              {entry.services.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CyberCatalogue;
