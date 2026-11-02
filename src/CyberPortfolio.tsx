import { IllustrativeFigure } from './IllustrativeFigure';
import { getPortfolioRows, getShellMonths } from './cyberData';

/**
 * The Program Lead's first screen: one row per member, with the figures the
 * programme is steered by. Every number goes through IllustrativeFigure.
 */
export function CyberPortfolio() {
  const rows = getPortfolioRows();
  const months = getShellMonths();
  const latestMonth = months[months.length - 1];

  return (
    <section className="cyber-screen" data-testid="cyber-portfolio">
      <h1>Portfolio</h1>
      <p className="cyber-screen__lede">
        Every member organisation in the programme, with posture, open work and service
        performance for {latestMonth}.
      </p>

      <table className="cyber-table" data-testid="portfolio-table">
        <caption>Member portfolio summary</caption>
        <thead>
          <tr>
            <th scope="col">Member</th>
            <th scope="col">Tier</th>
            <th scope="col">Facilities</th>
            <th scope="col">Posture</th>
            <th scope="col">Open incidents</th>
            <th scope="col">Overdue findings</th>
            <th scope="col">SLA attainment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.memberId} data-testid={`portfolio-row-${row.memberId}`}>
              <th scope="row">{row.memberName}</th>
              <td>{row.tier}</td>
              <td>
                <IllustrativeFigure
                  value={row.facilities}
                  description={`${row.memberName} facilities`}
                />
              </td>
              <td>
                <IllustrativeFigure
                  value={row.postureGrade}
                  description={`${row.memberName} posture grade`}
                />
              </td>
              <td>
                <IllustrativeFigure
                  value={row.openIncidents}
                  description={`${row.memberName} open incidents`}
                />
              </td>
              <td>
                <IllustrativeFigure
                  value={row.overdueFindings}
                  description={`${row.memberName} overdue findings`}
                />
              </td>
              <td>
                <IllustrativeFigure
                  value={row.slaAttainmentPercent}
                  unit="%"
                  description={`${row.memberName} SLA attainment`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default CyberPortfolio;
