import type { ChangeEvent } from 'react';

import { DEFAULT_MEMBER_ID, getFacilities } from './cyberData';
import { setCyberScope, useCyberScope } from './cyberScope';

export type FacilitySelectorProps = {
  /**
   * The member whose facilities the selector lists. Optional: with no props
   * it lists the facilities of the member the scope is acting for, which is
   * the member the URL query names.
   */
  memberId?: string;
};

/**
 * Choose a facility. This is what the selector's `onChange` calls, and what a
 * test drives when it switches facility "through the control".
 *
 * Choosing a facility of another member carries the member with it: the scope
 * resets `memberId` to the facility's owner, so no panel of the previous
 * member can survive the switch.
 */
export function chooseFacility(id: string): void {
  setCyberScope({ facilityId: id });
}

/**
 * The header's facility selector, shown for member roles only.
 *
 * It holds no selection of its own: the value comes from the scope in the URL
 * query and the change writes the query back, so every member screen — and
 * the selector itself after a deep link or a Back navigation — reads one
 * facility and one member.
 */
export function FacilitySelector({ memberId }: FacilitySelectorProps = {}) {
  const { scope } = useCyberScope();
  const owner = memberId ?? scope.memberId ?? DEFAULT_MEMBER_ID;
  const facilities = getFacilities(owner);
  const selected = facilities.some((facility) => facility.id === scope.facilityId)
    ? (scope.facilityId as string)
    : (facilities[0]?.id ?? '');

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    chooseFacility(event.target.value);
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
