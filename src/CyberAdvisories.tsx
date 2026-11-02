import { getMemberById, selectByScope } from './cyberData';
import { useCyberScope } from './cyberScope';

/** Sector advisories, newest first, with the members each one exposes. */
export function CyberAdvisories() {
  const { role, facilityId } = useCyberScope();
  const { advisories } = selectByScope(role, facilityId);
  const newestFirst = [...advisories].sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );

  return (
    <section className="cyber-screen" data-testid="cyber-advisories">
      <h1>Sector advisories</h1>
      <p className="cyber-screen__lede">
        Advisories published to the programme, with the recommended action and the members
        exposed.
      </p>

      <table className="cyber-table" data-testid="advisories-table">
        <caption>Sector advisories</caption>
        <thead>
          <tr>
            <th scope="col">Published</th>
            <th scope="col">Severity</th>
            <th scope="col">Advisory</th>
            <th scope="col">Recommended action</th>
            <th scope="col">Members affected</th>
          </tr>
        </thead>
        <tbody>
          {newestFirst.map((advisory) => (
            <tr key={advisory.id} data-testid={`advisory-row-${advisory.id}`}>
              <td>{advisory.publishedAt.slice(0, 10)}</td>
              <td data-severity={advisory.severity}>{advisory.severity}</td>
              <th scope="row">
                {advisory.title}
                <span className="cyber-table__detail">{advisory.summary}</span>
              </th>
              <td>{advisory.action}</td>
              <td data-testid={`advisory-members-${advisory.id}`}>
                {advisory.affectedMemberIds
                  .map((id) => getMemberById(id)?.name ?? id)
                  .join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default CyberAdvisories;
