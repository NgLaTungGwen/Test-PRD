# Design review: TA-04

TA-04: Pre-written AI report narratives with staged generation animation

- Signed by: Quy Nguyen
- Signed at: 2026-11-02T07:07:56.778Z

## Decision

Chosen option: **Fixture-resolved narratives behind a staged animation gate**

Keep everything in the existing browser prototype: per-member, per-period narratives live in the reports and members fixtures, a narrative lookup resolves the member/period key, and a staged animation component holds the screen for 2-3 seconds before handing the stored report to the viewer. A shared disclosure label is rendered by the cyber screen shell so every screen and narrative carries "AI-generated, illustrative".

## Rationale

test

## Classification

- Layer: frontend
- Magnitude: M
- Areas: not recorded

## Options

### 1. Fixture-resolved narratives behind a staged animation gate (chosen)

No feedback.

## Artefacts signed

| Kind | Path | Content sha256 | Commit |
| --- | --- | --- | --- |
| c4-component-view | `docs/design/epic-ai-reporting/option-1-component.mmd` | `ddb95a768c95c818f625884a545d824f75dbbf84f66ed17b2147d6bba44a4bb1` | `3304c9e32c3df77a48c5afb1dc9e98e1317ab38e` |
| c4-container-view | `docs/design/epic-ai-reporting/option-1.mmd` | `7a245beaf917195827cdedf7a3b4cf99f7ef71b9d29549531bd67775447c4ef7` | `0d17ac9783751160b70e0553257d50367a9ee727` |
| c4-context-view | `docs/design/epic-ai-reporting/context.mmd` | `4c1de00a867b0788ae6a9ba8ecd5ce2a2d3c74e1cd670266fafc7686dcaf499b` | `568f068dec5144edd2e7c38dabd3b1a6ab147266` |
| data-flow-view | `docs/design/epic-ai-reporting/option-1-data-flow.mmd` | `f732d1949ec79b845d0ee1b62156f507582d7c05196efdeeccc5efd7fb8e941d` | `06e4b11fbd06ef31f2b0a505a0e62165134b3372` |
| threat-model | `docs/design/epic-ai-reporting/threat-model.md` | `74bd1e8d99d863229c45630513642b760e10763fd97f24838e43b91856ae7681` | `dc0df81be3003529ea8b8bc7d790a0c3ecdb827a` |

## Lineage

- Requirement: 67a9bf97-1e79-480f-b6b2-1797f7d9fb62
- Edge: g2-sign
- Version signed: 5
