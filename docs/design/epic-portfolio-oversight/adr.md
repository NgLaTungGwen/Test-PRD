# ADR: portfolio oversight

- Scope: epic portfolio oversight — CYBER-G2
- Date: 2026-10-31
- Drafted by: Quy Nguyen

## Context

test

## Decision

The epic adopts **Server-loaded members page with in-browser table and median benchmark query**.

One Next.js route renders the whole member portfolio in a single server load; the browser handles sorting and filtering in memory, a benchmark panel is served by a facility-type median query, and clicking a row navigates to the existing member home under a read-only view-as context that drives the HealthPRO banner.

## Reasoning

test

## Consequences

- Sorting and filtering happen over the full portfolio held in the browser, so there is no server pagination; the screen degrades once the member count grows beyond a few thousand rows.
- The facility-type median is recomputed by query on each benchmark render instead of being cached or materialised, putting repeated aggregate cost on the assessment store.
- Read-only is a context flag on the shared member home rather than a separate read-only route tree, so every mutating action in that home must honour the flag or writes leak through.

## Alternatives considered

Single option: requirement within the criterion ceiling
