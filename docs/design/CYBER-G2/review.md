# Design review: CYBER-G2

CYBER-G2: Members and benchmarks screen for the Program Lead

- Signed by: Quy Nguyen
- Signed at: 2026-11-02T07:07:45.231Z

## Decision

Chosen option: **Server-loaded members page with in-browser table and median benchmark query**

One Next.js route renders the whole member portfolio in a single server load; the browser handles sorting and filtering in memory, a benchmark panel is served by a facility-type median query, and clicking a row navigates to the existing member home under a read-only view-as context that drives the HealthPRO banner.

## Rationale

test

## Classification

- Layer: fullstack
- Magnitude: M
- Areas: app/cyber/members, app/cyber/members/[memberId]

## Options

### 1. Server-loaded members page with in-browser table and median benchmark query (chosen)

No feedback.

## Artefacts signed

| Kind | Path | Content sha256 | Commit |
| --- | --- | --- | --- |
| adr | `docs/design/epic-portfolio-oversight/adr.md` | `6ba8bddd4b9376b4f7bac295036f51d24c04ce18cdd4fdad59a4540c21c4f9ab` | `a2ce8945d8419f9d944f381d937e762d0755f24b` |
| c4-component-view | `docs/design/epic-portfolio-oversight/option-1-component.mmd` | `2a4f4384e2974a9e67f0910b49a7ca6258600e198facdab146d873afec10398a` | `a52dbaa378dcae38da84fc620d5e5abe8fe88fb4` |
| c4-container-view | `docs/design/epic-portfolio-oversight/option-1.mmd` | `2497db74e3747bd234c8bb97aa0da7422f7f278de6632266c7a6e5a06036798a` | `619df2defa6d2ad8197223b027ed1bb4b7999964` |
| c4-context-view | `docs/design/epic-portfolio-oversight/context.mmd` | `39225bf584dadd449c82bdedb179dd0a322f1be8ebda968897e38cbfe874ad55` | `f287a2112de07e34463162714c43fd72a48182c6` |
| data-flow-view | `docs/design/epic-portfolio-oversight/option-1-data-flow.mmd` | `9f2fc901860dcce0cab5724a2155b4aa30d03f008da016d3855f61d88721a455` | `9fdbec6887849a23751ad2308b89e423daad7e52` |
| threat-model | `docs/design/epic-portfolio-oversight/threat-model.md` | `460475391b9eb3181559879ec290ed97c039fe9ac15680f7b7ee3a8f36147eeb` | `60f9f79dfb82aa1ea7f9c63849345e6851741da0` |

## Lineage

- Requirement: 645ca58e-e92b-48b9-b7fd-c86d07d91fd3
- Edge: g2-sign
- Version signed: 6
