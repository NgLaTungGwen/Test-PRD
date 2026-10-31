import tiersFixture from './tiers.json';

export type TierId = 'essentials' | 'standard' | 'advanced';

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export type SlaTarget = {
  priority: Priority;
  ackMinutes: number;
  notifyMinutes: number;
};

export type ServiceTier = {
  id: TierId;
  name: string;
  mdrScope: string;
  monitoringScope: string;
  irRetainerHours: number;
  remediationSupport: string;
  tabletopExercises: number;
  postureAssessmentCadence: string;
  reportCadence: string;
  facilitySize: string;
  slaTargets: SlaTarget[];
  irTimeToEngageMinutes: number;
};

/** Thrown when the build-time fixture does not match the service-model schema. */
export class SchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaError';
  }
}

export const TIER_IDS: TierId[] = ['essentials', 'standard', 'advanced'];

export const PRIORITIES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

const STRING_FIELDS = [
  'name',
  'mdrScope',
  'monitoringScope',
  'remediationSupport',
  'postureAssessmentCadence',
  'reportCadence',
  'facilitySize',
] as const;

const NUMBER_FIELDS = [
  'irRetainerHours',
  'tabletopExercises',
  'irTimeToEngageMinutes',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateSlaTargets(tierId: string, value: unknown): SlaTarget[] {
  if (!Array.isArray(value)) {
    throw new SchemaError(`tier "${tierId}": slaTargets must be an array`);
  }

  const targets = value.map((row, index) => {
    if (!isRecord(row)) {
      throw new SchemaError(`tier "${tierId}": slaTargets[${index}] must be an object`);
    }
    const priority = row.priority;
    if (typeof priority !== 'string' || !(PRIORITIES as string[]).includes(priority)) {
      throw new SchemaError(
        `tier "${tierId}": slaTargets[${index}] has unknown priority "${String(priority)}"`,
      );
    }
    for (const field of ['ackMinutes', 'notifyMinutes'] as const) {
      const minutes = row[field];
      if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
        throw new SchemaError(
          `tier "${tierId}": priority ${priority} is missing a valid ${field} target`,
        );
      }
    }
    return {
      priority: priority as Priority,
      ackMinutes: row.ackMinutes as number,
      notifyMinutes: row.notifyMinutes as number,
    };
  });

  for (const priority of PRIORITIES) {
    const matches = targets.filter((target) => target.priority === priority);
    if (matches.length === 0) {
      throw new SchemaError(`tier "${tierId}": missing SLA target row for priority ${priority}`);
    }
    if (matches.length > 1) {
      throw new SchemaError(`tier "${tierId}": duplicate SLA target row for priority ${priority}`);
    }
  }

  return PRIORITIES.map(
    (priority) => targets.find((target) => target.priority === priority) as SlaTarget,
  );
}

function validateTier(value: unknown, index: number): ServiceTier {
  if (!isRecord(value)) {
    throw new SchemaError(`tiers[${index}] must be an object`);
  }

  const id = value.id;
  if (typeof id !== 'string' || !(TIER_IDS as string[]).includes(id)) {
    throw new SchemaError(`tiers[${index}] has unknown tier id "${String(id)}"`);
  }

  for (const field of STRING_FIELDS) {
    const fieldValue = value[field];
    if (typeof fieldValue !== 'string' || fieldValue.trim() === '') {
      throw new SchemaError(`tier "${id}": missing required field "${field}"`);
    }
  }

  for (const field of NUMBER_FIELDS) {
    const fieldValue = value[field];
    if (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue) || fieldValue <= 0) {
      throw new SchemaError(`tier "${id}": missing required numeric field "${field}"`);
    }
  }

  return {
    id: id as TierId,
    name: value.name as string,
    mdrScope: value.mdrScope as string,
    monitoringScope: value.monitoringScope as string,
    irRetainerHours: value.irRetainerHours as number,
    remediationSupport: value.remediationSupport as string,
    tabletopExercises: value.tabletopExercises as number,
    postureAssessmentCadence: value.postureAssessmentCadence as string,
    reportCadence: value.reportCadence as string,
    facilitySize: value.facilitySize as string,
    slaTargets: validateSlaTargets(id, value.slaTargets),
    irTimeToEngageMinutes: value.irTimeToEngageMinutes as number,
  };
}

/**
 * Validates an arbitrary fixture payload against the service-model schema.
 * Exported so tests can prove the loader rejects a malformed fixture.
 */
export function parseTiers(fixture: unknown): ServiceTier[] {
  if (!isRecord(fixture) || !Array.isArray(fixture.tiers)) {
    throw new SchemaError('tiers fixture must be an object with a "tiers" array');
  }

  const tiers = fixture.tiers.map(validateTier);

  for (const tierId of TIER_IDS) {
    const matches = tiers.filter((tier) => tier.id === tierId);
    if (matches.length === 0) {
      throw new SchemaError(`tiers fixture is missing the "${tierId}" tier`);
    }
    if (matches.length > 1) {
      throw new SchemaError(`tiers fixture declares the "${tierId}" tier more than once`);
    }
  }

  return TIER_IDS.map((tierId) => tiers.find((tier) => tier.id === tierId) as ServiceTier);
}

/** Loads and schema-validates the build-time service tier fixture. */
export function loadTiers(): ServiceTier[] {
  return parseTiers(tiersFixture);
}

/** Looks up one tier's SLA pair for a priority. */
export function slaTargetFor(tier: ServiceTier, priority: Priority): SlaTarget {
  const target = tier.slaTargets.find((row) => row.priority === priority);
  if (!target) {
    throw new SchemaError(`tier "${tier.id}": no SLA target for priority ${priority}`);
  }
  return target;
}
