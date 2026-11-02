import { useState } from 'react';
import type { ChangeEvent } from 'react';

import { IllustrativeFigure, IllustrativeNotice } from './IllustrativeFigure';
import {
  ANY_FILTER_VALUE,
  cyberFacilityName,
  facilityFilterOptions,
  filterFindings,
  gradeFilterOptions,
  priorityFilterOptions,
} from './cyberData';
import { useCyberScopeContext } from './CyberScopeContext';
import { chipClassFor } from './cyberTokens';

/**
 * The cyber findings list: every finding the current role may see at the
 * facility it is scoped to, narrowed by grade and by priority.
 *
 * The table is the existing `cyber-table` pattern, the three filter controls
 * are the existing header selector pattern (`shell-header__facility` with its
 * `shell-header__label`), laid out in the existing `cyber-cards` row, and the
 * reset control is the existing `shell-header__search` button. The grade and
 * priority badges carry the two new token sets and nothing else.
 */
export function CyberFindings() {
  const { role, facilityId, setFacility } = useCyberScopeContext();
  const [grade, setGrade] = useState<string>(ANY_FILTER_VALUE);
  const [priority, setPriority] = useState<string>(ANY_FILTER_VALUE);

  const facilities = facilityFilterOptions(role);
  const selectedFacility = facilities.some((option) => option.value === facilityId)
    ? facilityId
    : (facilities[0]?.value ?? '');
  const rows = filterFindings(role, { facilityId: selectedFacility, grade, priority });

  function handleFacility(event: ChangeEvent<HTMLSelectElement>): void {
    setFacility(event.target.value);
  }

  function handleGrade(event: ChangeEvent<HTMLSelectElement>): void {
    setGrade(event.target.value);
  }

  function handlePriority(event: ChangeEvent<HTMLSelectElement>): void {
    setPriority(event.target.value);
  }

  function clearFilters(): void {
    setGrade(ANY_FILTER_VALUE);
    setPriority(ANY_FILTER_VALUE);
  }

  return (
    <>
      <IllustrativeNotice />

      <section
        className="cyber-screen"
        data-testid="cyber-poc-findings"
        data-facility={selectedFacility}
        data-grade={grade}
        data-priority={priority}
        data-rows={rows.length}
      >
        <h1>Cyber findings</h1>
        <p className="cyber-screen__lede" data-testid="cyber-poc-findings-lede">
          {cyberFacilityName(selectedFacility)}
          {' — '}
          <IllustrativeFigure
            value={rows.length}
            unit="findings"
            description="Findings in view"
          />
        </p>

        <div className="cyber-cards" data-testid="findings-filters">
          <label className="shell-header__facility" data-testid="findings-filter-facility">
            <span className="shell-header__label">Facility</span>
            <select
              aria-label="Facility"
              data-testid="findings-facility-select"
              value={selectedFacility}
              onChange={handleFacility}
            >
              {facilities.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="shell-header__facility" data-testid="findings-filter-grade">
            <span className="shell-header__label">Grade</span>
            <select
              aria-label="Grade"
              data-testid="findings-grade-select"
              value={grade}
              onChange={handleGrade}
            >
              {gradeFilterOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="shell-header__facility" data-testid="findings-filter-priority">
            <span className="shell-header__label">Priority</span>
            <select
              aria-label="Priority"
              data-testid="findings-priority-select"
              value={priority}
              onChange={handlePriority}
            >
              {priorityFilterOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="shell-header__search"
            data-testid="findings-clear-filters"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>

        <table className="cyber-table" data-testid="findings-table">
          <caption>Findings at {cyberFacilityName(selectedFacility)}</caption>
          <thead>
            <tr>
              <th scope="col">Finding</th>
              <th scope="col">Facility</th>
              <th scope="col">Grade</th>
              <th scope="col">Priority</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((finding) => (
              <tr key={finding.id} data-testid={`finding-row-${finding.id}`}>
                <th scope="row">
                  {finding.title}
                  <span className="cyber-table__detail">
                    {finding.owner} — raised {finding.raisedOn} — {finding.status}
                  </span>
                </th>
                <td>{cyberFacilityName(finding.facilityId)}</td>
                <td data-testid={`finding-grade-${finding.id}`}>
                  <span className={chipClassFor('grade', finding.grade)} data-grade={finding.grade}>
                    {finding.grade}
                  </span>
                </td>
                <td data-testid={`finding-priority-${finding.id}`}>
                  <span
                    className={chipClassFor('priority', finding.priority)}
                    data-priority={finding.priority}
                  >
                    {finding.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 ? (
          <p className="cyber-screen__lede" data-testid="findings-empty">
            No finding at {cyberFacilityName(selectedFacility)} matches these filters.
          </p>
        ) : null}
      </section>
    </>
  );
}

export default CyberFindings;
