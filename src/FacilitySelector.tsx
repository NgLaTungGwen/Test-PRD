import type { ChangeEvent } from 'react';

import { getFacilities } from './cyberData';
import { useCyberScope } from './cyberScope';

export type FacilitySelectorProps = {
  /** The member whose facilities the selector lists. */
  memberId: string;
};

/**
 * The header's facility selector, shown for member roles only.
 *
 * Choosing a facility writes it into the cyber scope, and every member screen
 * reads its rows back out of that scope, so one change here re-scopes all of
 * them at once.
 */
export function FacilitySelector({ memberId }: FacilitySelectorProps) {
  const { facilityId, setFacility } = useCyberScope();
  const facilities = getFacilities(memberId);
  const selected = facilities.some((facility) => facility.id === facilityId)
    ? (facilityId as string)
    : (facilities[0]?.id ?? '');

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    setFacility(event.target.value);
  }

  return (
    <label className="shell-header__facility" data-testid="facility-selector">
      <span className="shell-header__label">Facility</span>
      <select
        aria-label="Facility"
        data-testid="facility-select"
        value={selected}
        onChange={handleChange}
      >
        {facilities.map((facility) => (
          <option key={facility.id} value={facility.id}>
            {facility.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default FacilitySelector;
