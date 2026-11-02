import { IllustrativeFigure } from './IllustrativeFigure';
import { getMemberById, getServicePerformance, getShellMonths } from './cyberData';

/** SLA attainment, MTTA and MTTR per member and month, newest month first. */
export function CyberServicePerformance() {
  const months = [...getShellMonths()].reverse();
  const rows = getServicePerformance();

  return (
    <section className="cyber-screen" data-testid="cyber-service-performance">
      <h1>Service performance</h1>
      <p className="cyber-screen__lede">
        Acknowledgement and resolution performance against the illustrative SLA targets, by
        member and month.
      </p>

      <table className="cyber-table" data-testid="service-performance-table">
        <caption>SLA attainment and MTTA by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Member</th>
            <th scope="col">Tickets</th>
            <th scope="col">Breached</th>
            <th scope="col">SLA attainment</th>
            <th scope="col">MTTA</th>
            <th scope="col">MTTR</th>
          </tr>
        </thead>
        <tbody>
          {months.flatMap((month) =>
            rows
              .filter((row) => row.month === month)
              .map((row) => {
                const name = getMemberById(row.memberId)?.name ?? row.memberId;
                return (
                  <tr
                    key={`${row.memberId}-${row.month}`}
                    data-testid={`service-performance-row-${row.memberId}-${row.month}`}
                  >
                    <td>{row.month}</td>
                    <th scope="row">{name}</th>
                    <td>
                      <IllustrativeFigure
                        value={row.tickets}
                        description={`${name} ${row.month} tickets`}
                      />
                    </td>
                    <td>
                      <IllustrativeFigure
                        value={row.breached}
                        description={`${name} ${row.month} breached tickets`}
                      />
                    </td>
                    <td>
                      <IllustrativeFigure
                        value={row.slaAttainmentPercent}
                        unit="%"
                        description={`${name} ${row.month} SLA attainment`}
                      />
                    </td>
                    <td>
                      <IllustrativeFigure
                        value={row.mttaMins}
                        unit="min"
                        description={`${name} ${row.month} mean time to acknowledge`}
                      />
                    </td>
                    <td>
                      <IllustrativeFigure
                        value={row.mttrMins}
                        unit="min"
                        description={`${name} ${row.month} mean time to resolve`}
                      />
                    </td>
                  </tr>
                );
              }),
          )}
        </tbody>
      </table>
    </section>
  );
}

export default CyberServicePerformance;
