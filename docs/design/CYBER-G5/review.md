# Design review: CYBER-G5

CYBER-G5: Sector advisories screen for all roles

- Signed by: Quy Nguyen
- Signed at: 2026-11-02T07:07:51.157Z

## Decision

Chosen option: **Fixture-backed advisories route with one role-aware exposure projection**

A single client-side route at /cyber/advisories reads the advisories fixture and the current session role, then runs one pure projection that returns the lead view (exposed member count and list) or the member view (yes/no plus affected assets) for the same advisory cards.

## Rationale

test

## Classification

- Layer: frontend
- Magnitude: M
- Areas: not recorded

## Options

### 1. Fixture-backed advisories route with one role-aware exposure projection (chosen)

No feedback.

## Artefacts signed

| Kind | Path | Content sha256 | Commit |
| --- | --- | --- | --- |
| c4-component-view | `docs/design/epic-sector-advisories/option-1-component.mmd` | `ce798bf59425314c6a755907031ec88107700db4f64bdf60413e862cddd394ec` | `ceae676e294af1d5b0ae0383664be38b9add74a8` |
| c4-container-view | `docs/design/epic-sector-advisories/option-1.mmd` | `5f051dc06fd4ea9a156d80854c4eaba79bfa961f20041961067b4f2ea9e5c716` | `bb13a2b37276985b715e4d1fe42414f5cb90fea1` |
| c4-context-view | `docs/design/epic-sector-advisories/context.mmd` | `41cfc62e73a5ba9548207490c2ca196c9d4fde1fde4ac5e2164b0e45ff2a49ba` | `d5917fb7938c0e3e75564698e0705f651e9addf5` |
| data-flow-view | `docs/design/epic-sector-advisories/option-1-data-flow.mmd` | `2d84f2bd7573e9937c2e34d162cc7fadbfc01c1eeca6843dbc5ab91eed4a81ed` | `0f9c3ba82826bcb6d549f5b3fee37103286d5740` |
| threat-model | `docs/design/epic-sector-advisories/threat-model.md` | `a9382d22cd347b5a7736bafec91a3d4a3e855a821a35fc0a8473618827555605` | `59b53fe6d882aee719674025c98c115e9358ba40` |

## Lineage

- Requirement: 6a8e9718-cf21-4668-9e68-7b0ae426d8f8
- Edge: g2-sign
- Version signed: 5
