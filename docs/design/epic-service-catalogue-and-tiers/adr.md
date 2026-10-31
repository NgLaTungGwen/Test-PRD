# ADR: service catalogue and tiers

- Scope: epic service catalogue and tiers — CYBER-G4
- Date: 2026-10-31
- Drafted by: Quy Nguyen

## Context

test

## Decision

The epic adopts **Build-time tiers fixture rendered through one illustrative figure component**.

A single schema-validated JSON fixture holds the three tiers' inclusions, cadences and SLA/IR target tables, bundled with the web app at build time; the catalogue page renders inclusions and per-priority SLA pairs from that fixture, and every numeric figure is emitted through one shared illustrative-figure component that carries the label.

## Reasoning

test

## Consequences

- Tier content is build-time data: correcting an IR retainer hour or SLA pair needs a code change and redeploy, not a content edit.
- The "illustrative" label is guaranteed only for figures routed through the shared component; a hand-written number elsewhere escapes it unless a test or lint rule forbids raw figures.
- One flat fixture couples inclusions and SLA tables, so there is no per-tier versioning or history of what a tier promised at a past date.

## Alternatives considered

Single option: requirement within the criterion ceiling
