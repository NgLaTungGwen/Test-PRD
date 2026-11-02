import type { ReactNode } from 'react';

import { IllustrativeFigure } from './IllustrativeFigure';
import {
  activeMemberId,
  getFacilityById,
  getMemberById,
  isOverdue,
  selectByScope,
} from './cyberData';
import type { CyberScopeSelection } from './cyberData';
import { useCyberScope } from './cyberScope';

/**
 * The member-facing screens.
 *
 * Every one of them derives its rows from `selectByScope(role, facilityId)`
 * and from nothing else, so choosing a facility in the header re-scopes all of
 * them at once: there is no second, screen-local read path that could keep
 * showing another facility's work.
 */
function useMemberScope(): {
  selection: CyberScopeSelection;
  facilityId?: string;
  facilityName: string;
  facilitySite: string;
  memberName: string;
} {
  const { role, facilityId } = useCyberScope();
  const memberId = activeMemberId(role, facilityId);
  const facility = getFacilityById(facilityId);
  const inScope = facility !== undefined && facility.memberId === memberId ? facility : undefined;

  return {
    selection: selectByScope(role, facilityId),
    facilityId: inScope?.id,
    facilityName: inScope?.name ?? 'All facilities',
    facilitySite: inScope?.site ?? 'All facilities',
    memberName: memberId === undefined ? 'All members' : getMemberById(memberId)?.name ?? memberId,
  };
}

function MemberScreen({
  testId,
  title,
  facilityId,
  facilitySite,
  memberName,
  count,
  children,
}: {
  testId: string;
  title: string;
  facilityId?: string;
  facilitySite: string;
  memberName: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section
      className="cyber-screen"
      data-testid={testId}
      data-facility={facilityId ?? 'all'}
      data-rows={count}
    >
      <h1>{title}</h1>
      <p className="cyber-screen__lede">
        <span data-testid={`${testId}-member`}>{memberName}</span>
        {' — '}
        <span data-testid={`${testId}-facility`}>{facilitySite}</span>
      </p>
      {children}
    </section>
  );
}

/** Facility-scoped incidents: `GET /cyber/member/incidents`. */
export function MemberIncidents() {
  const { selection, facilityId, facilityName, facilitySite, memberName } = useMemberScope();
  const incidents = selection.incidents;

  return (
    <MemberScreen
      testId="cyber-member-incidents"
      title="Incidents"
      facilityId={facilityId}
      facilitySite={facilitySite}
      memberName={memberName}
      count={incidents.length}
    >
      <table className="cyber-table" data-testid="member-incidents-table">
        <caption>Incidents at {facilityName}</caption>
        <thead>
          <tr>
            <th scope="col">Incident</th>
            <th scope="col">Severity</th>
            <th scope="col">Detected</th>
            <th scope="col">Containment</th>
            <th scope="col">Open actions</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.id} data-testid={`incident-row-${incident.id}`}>
              <th scope="row">{incident.id}</th>
              <td>{incident.severity}</td>
              <td>{incident.timeline[0]?.at.slice(0, 10) ?? '—'}</td>
              <td>
                <IllustrativeFigure
                  value={incident.containmentMins}
                  unit="min"
                  description={`${incident.id} containment time`}
                />
              </td>
              <td>
                <IllustrativeFigure
                  value={incident.openActions.length}
                  description={`${incident.id} open actions`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {incidents.length === 0 ? (
        <p data-testid="member-incidents-empty">No incidents recorded at {facilityName}.</p>
      ) : null}
    </MemberScreen>
  );
}

/** Facility-scoped findings: `GET /cyber/member/findings`. */
export function MemberFindings() {
  const { selection, facilityId, facilityName, facilitySite, memberName } = useMemberScope();
  const findings = selection.findings;

  return (
    <MemberScreen
      testId="cyber-member-findings"
      title="Findings"
      facilityId={facilityId}
      facilitySite={facilitySite}
      memberName={memberName}
      count={findings.length}
    >
      <table className="cyber-table" data-testid="member-findings-table">
        <caption>Findings at {facilityName}</caption>
        <thead>
          <tr>
            <th scope="col">Finding</th>
            <th scope="col">Severity</th>
            <th scope="col">Due</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <tr
              key={finding.id}
              data-testid={`finding-row-${finding.id}`}
              data-overdue={isOverdue(finding) ? 'true' : 'false'}
            >
              <th scope="row">
                {finding.id}
                <span className="cyber-table__detail">{finding.title}</span>
              </th>
              <td>{finding.severity}</td>
              <td>{finding.dueDate}</td>
              <td>{isOverdue(finding) ? 'overdue' : finding.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {findings.length === 0 ? (
        <p data-testid="member-findings-empty">No findings recorded at {facilityName}.</p>
      ) : null}
    </MemberScreen>
  );
}

/** Facility-scoped reports: `GET /cyber/member/reports`. */
export function MemberReports() {
  const { selection, facilityId, facilityName, facilitySite, memberName } = useMemberScope();
  const reports = [...selection.reports].sort((left, right) =>
    right.month.localeCompare(left.month),
  );

  return (
    <MemberScreen
      testId="cyber-member-reports"
      title="Reports"
      facilityId={facilityId}
      facilitySite={facilitySite}
      memberName={memberName}
      count={reports.length}
    >
      <table className="cyber-table" data-testid="member-reports-table">
        <caption>Reports for {facilityName}</caption>
        <thead>
          <tr>
            <th scope="col">Report</th>
            <th scope="col">Month</th>
            <th scope="col">Kind</th>
            <th scope="col">Title</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} data-testid={`report-row-${report.id}`}>
              <th scope="row">{report.id}</th>
              <td>{report.month}</td>
              <td>{report.kind}</td>
              <td>{report.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {reports.length === 0 ? (
        <p data-testid="member-reports-empty">No reports issued for {facilityName}.</p>
      ) : null}
    </MemberScreen>
  );
}
