# Design review: CYBER-METRICS

CYBER-METRICS: Client-side metric catalogue (K01–K20) computed from fixtures

- Signed by: Quy Nguyen
- Signed at: 2026-11-02T07:11:38.410Z

## Decision

Chosen option: **Pure selector library inside the existing portal app**

A typed, side-effect-free metric selector library bundled in the portal app: screens and report builders call the same K01-K20 functions over raw fixture rows, and a metric registry supplies labels, report subsets and the anchor into /cyber/methodology.

## Rationale

test

## Classification

- Layer: frontend
- Magnitude: M
- Areas: not recorded

## Options

### 1. Pure selector library inside the existing portal app (chosen)

No feedback.

### 2. Memoised metric store scoped to member and period

No feedback.

### 3. Build-time metric snapshot compiled from fixtures

No feedback.

## Artefacts signed

| Kind | Path | Content sha256 | Commit |
| --- | --- | --- | --- |
| c4-component-view | `docs/design/epic-service-performance-and-sla-tracking/option-1-component.mmd` | `f50ce5b8052ed076822845bd69f78987eb39d022ddc6a8041a501623923fb1dd` | `57a558627cdf12fbd03a90ee927f6ced4eebd6aa` |
| c4-component-view | `docs/design/epic-service-performance-and-sla-tracking/option-2-component.mmd` | `b43967bb70f4ca4ee09bc1b0e297851a807c1d4fff6223f3fc064be1901d37b4` | `7972bb42805bdf97017ae79fcc5a92a4bf8f0235` |
| c4-component-view | `docs/design/epic-service-performance-and-sla-tracking/option-3-component.mmd` | `c33df47a49858baa22007f92f2e494753b82db113861ce32c7e93bb5d32bb418` | `7a12f205c331248afdc0bd376cdec1d913d2a8f3` |
| c4-container-view | `docs/design/epic-service-performance-and-sla-tracking/option-1.mmd` | `f3c422fc6b3cf9fedacd46d9620d9ca4b9d645402936160b7202b27d66aa053c` | `1c46ce4c18bdae9c9189a2f5cad984476c3cf226` |
| c4-container-view | `docs/design/epic-service-performance-and-sla-tracking/option-2.mmd` | `af88731ffc2e5706a45e1164a42e9d46f0da15e69f72e41966670049ab1fa33d` | `a8d53ff2504f6881f2858237c4e310117f2c7458` |
| c4-container-view | `docs/design/epic-service-performance-and-sla-tracking/option-3.mmd` | `f5b40f23a412abcc3637190a5024e1be3ee19c173b3fd60fb873dd453b312548` | `aeefceccc8e381ef9789da577d1d4f16fec228d4` |
| c4-context-view | `docs/design/epic-service-performance-and-sla-tracking/context.mmd` | `6626c56e80661e500db0a1337e8d6bb26280666a48106a6b3b6bacf2555d9e59` | `7e4028fcf381ee70ecc651a31ad30a52f2dbd12d` |
| data-flow-view | `docs/design/epic-service-performance-and-sla-tracking/option-1-data-flow.mmd` | `7e7216307145b3c6e35a97960cf570a3864ffeeb321195b642e0de3a6f5d93bc` | `cadf657b82faf164f55fa0c5ae06b92593b4330b` |
| data-flow-view | `docs/design/epic-service-performance-and-sla-tracking/option-2-data-flow.mmd` | `885f1d5e57691b67d7223ee26a43d9d42dc127a964b8a3165f235048ae1b4b89` | `0f97538164ece674f9ce91e3e13e614c16783e93` |
| data-flow-view | `docs/design/epic-service-performance-and-sla-tracking/option-3-data-flow.mmd` | `bf8700b43a0d0b8ff728bd8261106998c776bfb66171c1fa7994691f0b38878c` | `0b9d72104cfa50200dc392ba978d81ef1abb6dcd` |
| threat-model | `docs/design/epic-service-performance-and-sla-tracking/threat-model.md` | `807e121845153405074abd10d2472d309018e39e49bcfe6c2e522cadccdc8f68` | `2af2fce018412de734bc4edb011fdc465b67ad7f` |

## Lineage

- Requirement: 21c8bd2f-45c4-474c-bb7e-b079e4d821f4
- Edge: g2-sign
- Version signed: 5
