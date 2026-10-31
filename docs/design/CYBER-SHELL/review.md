# Design review: CYBER-SHELL

CYBER-SHELL: Cyber module shell and navigation integrated into existing app

- Signed by: Quy Nguyen
- Signed at: 2026-10-31T01:30:59.952Z

## Decision

Chosen option: **Bundled fixtures with client-side scope context**

The cyber route group lives inside the existing app shell and imports the committed /data/cyber JSON directly through a small selector module, with role and facility scope held in React context and the illustrative banner carried into print via CSS. A seeded Node script is the only producer of fixture data.

## Rationale

test

## Classification

- Layer: fullstack
- Magnitude: L
- Areas: data/cyber, scripts/generate-cyber-fixtures

## Options

### 1. Bundled fixtures with client-side scope context (chosen)

No feedback.

### 2. Build-time view models with fixture check suite

No feedback.

### 3. Mock API layer behind a swappable data contract

No feedback.

## Artefacts signed

| Kind | Path | Content sha256 | Commit |
| --- | --- | --- | --- |
| c4-component-view | `docs/design/epic-demo-data-and-narrative/option-1-component.mmd` | `cb8f172a767e5b24f2d64a4c2cf0fc2a288bf369a2d3d71b0077bdd7c9957cba` | `6d8c24fb1e4e31cd3058f3778eb65f7adea13a36` |
| c4-component-view | `docs/design/epic-demo-data-and-narrative/option-2-component.mmd` | `a200acadd63cdef26f7aaacce42e078a7d53bda59c0a054a1bf3e38337a82df2` | `310179700b0c881aa75d154d3b98743d48f8d16c` |
| c4-component-view | `docs/design/epic-demo-data-and-narrative/option-3-component.mmd` | `eb7e77909edd0648448c9febbb1269ec0a74036b0150f33202560d6ad14140bf` | `42d5f2c298df252a4c485b03cb5a4e18152e7fde` |
| c4-container-view | `docs/design/epic-demo-data-and-narrative/option-1.mmd` | `96bcd51af7c6527f84881e1cbd7d8a73386804af57ee3cfb0cb853af8c8eb597` | `b4ba88db28baa61722a96e4b76ea1bafd9efc633` |
| c4-container-view | `docs/design/epic-demo-data-and-narrative/option-2.mmd` | `22ad789f248dafe5ceec686f21437850f11b8de9757b5cface75294287f38c7d` | `50a93fa4d70f9bd6aa15e9ac1ba42dfe28b76a65` |
| c4-container-view | `docs/design/epic-demo-data-and-narrative/option-3.mmd` | `feb8f7dedaf9976574fac7d665d2450ca10680312bbfa0859239f2e229a4dbb1` | `41cf82c8e2abd161669b4fc58483e41d7c156afd` |
| c4-context-view | `docs/design/epic-demo-data-and-narrative/context.mmd` | `75d9d2dce05543bd65ae08b9eceae8fab9244fa9f44fae925d9520dbe8751464` | `f9b4c5b51e3a9dd1bd3e36bc99a57018426fb72c` |
| data-flow-view | `docs/design/epic-demo-data-and-narrative/option-1-data-flow.mmd` | `e4ebe7f5f759a86e65e69f9fae485234e4d214c9f1f38e348b8df5f074b5b0dd` | `83aa67d06b721c9984541d5ac6edc78100505284` |
| data-flow-view | `docs/design/epic-demo-data-and-narrative/option-2-data-flow.mmd` | `4930d5503da8098c72f2169248a1ba36962920a614ff06ee4a7e502c4519bd38` | `5b72056f16c9034df6b1c52ed522252739aa6d09` |
| data-flow-view | `docs/design/epic-demo-data-and-narrative/option-3-data-flow.mmd` | `04cea19210b2b02dc5ce85ee0381785e64aff16a47dc3e1dc8561ee1a66a5868` | `8a4d78af0edb7df7d0dd27a0802c2fdfd80bffb3` |
| threat-model | `docs/design/epic-demo-data-and-narrative/threat-model.md` | `6dc440afd5d8e39b55d85786c0f7b32424443edd08af2c8bdb6cc7960118fe2a` | `44b0cd9e155bfd0f824e4eb600523cc1185b3205` |

## Lineage

- Requirement: 170ad626-438f-43f4-b9f9-e85cbc997c91
- Edge: g2-sign
- Version signed: 5
