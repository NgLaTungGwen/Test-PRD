# Design review: CYBER-G4

CYBER-G4: Service catalogue screen for all roles

- Signed by: Quy Nguyen
- Signed at: 2026-11-02T07:07:48.226Z

## Decision

Chosen option: **Build-time tiers fixture rendered through one illustrative figure component**

A single schema-validated JSON fixture holds the three tiers' inclusions, cadences and SLA/IR target tables, bundled with the web app at build time; the catalogue page renders inclusions and per-priority SLA pairs from that fixture, and every numeric figure is emitted through one shared illustrative-figure component that carries the label.

## Rationale

test

## Classification

- Layer: frontend
- Magnitude: M
- Areas: not recorded

## Options

### 1. Build-time tiers fixture rendered through one illustrative figure component (chosen)

No feedback.

## Artefacts signed

| Kind | Path | Content sha256 | Commit |
| --- | --- | --- | --- |
| adr | `docs/design/epic-service-catalogue-and-tiers/adr.md` | `b0f8ed683adc8694f3be7286c4eeb4bf1010e2a323e052e66f99214cf56e1330` | `1e36754941b6ffd9c401cdba3ef6e1c7fdea66b0` |
| c4-component-view | `docs/design/epic-service-catalogue-and-tiers/option-1-component.mmd` | `f545c34ab4b9995abee04b8b115b736ea4fd61654b56f02050854fad0783647c` | `2ba3ed92e13f4011ccc017e12ff3a69c608c3816` |
| c4-container-view | `docs/design/epic-service-catalogue-and-tiers/option-1.mmd` | `536c0af0d01005e5ed424973ad8a7794922ca254838000208df2ed6ee71578c7` | `217aa2d138dfc4365350c7e42fb015567ddc12b6` |
| c4-context-view | `docs/design/epic-service-catalogue-and-tiers/context.mmd` | `85a4f6671dc0e4f4177f57099379269e912fd0210f089fc84e60ba40d3c3c0db` | `3f2cd439e0ff3499eaa0fd51827c33d550ccb8fc` |
| data-flow-view | `docs/design/epic-service-catalogue-and-tiers/option-1-data-flow.mmd` | `60247fb9488d812733964684e2e198c3818f6ae10616b4d8a80f679cfe83b047` | `649188602d7b40e7a8f73296233d01673401f1fc` |
| threat-model | `docs/design/epic-service-catalogue-and-tiers/threat-model.md` | `1e7498c7bf805d3632fe6a104b9590bee95ac6d4f25bddc5f48b7fb1a1bb9eb3` | `0b6a56139fbe700cf44763b00b8e722be19f2ecc` |

## Lineage

- Requirement: e2d00129-6ebb-4def-940e-c2f9a9357830
- Edge: g2-sign
- Version signed: 5
