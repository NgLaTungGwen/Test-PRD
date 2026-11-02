import type { MouseEvent } from 'react';

import { CyberLink } from './CyberRoutes';
import { IllustrativeFigure } from './IllustrativeFigure';
import { getFacilities, getMembers, isMemberScopeRole, selectForScope } from './cyberData';
import { scopeToQuery, setCyberScope, useCyberScope } from './cyberScope';
import type { CyberScope } from './cyberScope';

/** The deep link that opens this screen on one member, in the current role. */
export function memberDeepLink(scope: CyberScope, memberId: string | null): string {
  return `/cyber/members${scopeToQuery({ ...scope, memberId })}`;
}

/**
 * The member directory: the member organisations the scope may see, with the
 * facilities each one runs, and — when the scope names a member — that
 * member's own context panel.
 *
 * Every row and the panel are computed from the scope on each render, so a
 * role, facility or member change swaps them instead of leaving the previous
 * context's rows behind.
 */
export function CyberMembers() {
  const { scope } = useCyberScope();
  const selection = selectForScope(scope);
  const directory = isMemberScopeRole(scope.role) ? selection.members : getMembers();
  const focused = scope.memberId === null ? undefined : selection.members[0];

  function focusMember(event: MouseEvent<HTMLAnchorElement>, memberId: string | null): void {
    event.preventDefault();
    setCyberScope({ memberId });
  }

  return (
    <section
      className="cyber-screen"
      data-testid="cyber-members"
      data-scope-member={scope.memberId ?? 'none'}
    >
      <h1>Members</h1>
      <p className="cyber-screen__lede">
        Member organisations in the programme, with the facilities each one runs.
      </p>

      {focused === undefined ? null : (
        <div className="cyber-cards" data-testid="member-detail">
          <article
            className="cyber-card"
            data-testid={`member-detail-${focused.id}`}
            data-member={focused.id}
            aria-labelledby={`member-detail-heading-${focused.id}`}
          >
            <h2 id={`member-detail-heading-${focused.id}`}>{focused.name}</h2>
            <dl className="cyber-card__facts">
              <div>
                <dt>Tier</dt>
                <dd data-testid={`member-detail-tier-${focused.id}`}>{focused.tier}</dd>
              </div>
              <div>
                <dt>Province</dt>
                <dd>{focused.province}</dd>
              </div>
              <div>
                <dt>Open findings</dt>
                <dd data-testid={`member-detail-findings-${focused.id}`}>
                  <IllustrativeFigure
                    value={selection.findings.length}
                    description={`${focused.name} findings`}
                  />
                </dd>
              </div>
              <div>
                <dt>Incidents</dt>
                <dd data-testid={`member-detail-incidents-${focused.id}`}>
                  <IllustrativeFigure
                    value={selection.incidents.length}
                    description={`${focused.name} incidents`}
                  />
                </dd>
              </div>
              <div>
                <dt>Facilities</dt>
                <dd>
                  <span className="cyber-table__detail">
                    {getFacilities(focused.id)
                      .map((facility) => facility.site)
                      .join(', ')}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Focus</dt>
                <dd>
                  <CyberLink
                    to={memberDeepLink(scope, null)}
                    data-testid="member-detail-clear"
                    onClick={(event) => focusMember(event, null)}
                  >
                    Show every member
                  </CyberLink>
                </dd>
              </div>
            </dl>
          </article>
        </div>
      )}

      <table className="cyber-table" data-testid="members-table">
        <caption>Member organisations</caption>
        <thead>
          <tr>
            <th scope="col">Member</th>
            <th scope="col">Type</th>
            <th scope="col">Province</th>
            <th scope="col">Size</th>
            <th scope="col">Tier</th>
            <th scope="col">Facilities</th>
          </tr>
        </thead>
        <tbody>
          {directory.map((member) => {
            const facilities = getFacilities(member.id);
            return (
              <tr key={member.id} data-testid={`member-row-${member.id}`}>
                <th scope="row">
                  <CyberLink
                    to={memberDeepLink(scope, member.id)}
                    data-testid={`member-focus-${member.id}`}
                    onClick={(event) => focusMember(event, member.id)}
                  >
                    {member.name}
                  </CyberLink>
                </th>
                <td>{member.type}</td>
                <td>{member.province}</td>
                <td>{member.size}</td>
                <td>{member.tier}</td>
                <td data-testid={`member-facilities-${member.id}`}>
                  <IllustrativeFigure
                    value={facilities.length}
                    description={`${member.name} facilities`}
                  />{' '}
                  <span className="cyber-table__detail">
                    {facilities.map((facility) => facility.name).join(', ')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default CyberMembers;
