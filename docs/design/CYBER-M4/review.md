# Design review: CYBER-M4

CYBER-M4: IR retainer screen for member roles

- Signed by: Quy Nguyen
- Signed at: 2026-11-02T07:11:35.488Z

## Decision

Chosen option: **A. Fixture modules rendered directly by the two route trees**

Both screens are plain route components in the existing web app that import typed fixture modules and map them to rows, timelines and retainer figures, with a role check that puts the executive AI summary panel above the rest of the detail. The declare-incident form resolves the tier target time locally, so nothing leaves the browser.

## Rationale

test

## Classification

- Layer: frontend
- Magnitude: M
- Areas: not recorded

## Options

### 1. A. Fixture modules rendered directly by the two route trees (chosen)

No feedback.

### 2. B. In-repo mock API serving fixtures over a typed client

No feedback.

### 3. C. Cyber domain package with data-source port and role policy

No feedback.

## Artefacts signed

| Kind | Path | Content sha256 | Commit |
| --- | --- | --- | --- |
| c4-component-view | `docs/design/epic-incident-response/option-1-component.mmd` | `271a7604c79e90f2107c9c9a4ac7bb3c4077104d257942bd7b8cd36ddac340ff` | `add45b2442fd9cd08c50227bd9ae0fa2ce027a6e` |
| c4-component-view | `docs/design/epic-incident-response/option-2-component.mmd` | `97f67c2ba84871e1753626f0199dfbc3151229b24348d962f5b5f67551aa98a6` | `181b4cbcbd5a1760cbeb1e947cb53c070052053c` |
| c4-component-view | `docs/design/epic-incident-response/option-3-component.mmd` | `0300e91041114e28edd854b9745eb0b8caf7493dd7fd4344f39a7b940e6c1b0e` | `919dd9319e6b7f16aaf547a8b72765c8afdd537b` |
| c4-container-view | `docs/design/epic-incident-response/option-1.mmd` | `fd93433d8af868c336f344f0bafbaf0e5083344fe436a7a8603b109df56f8a0f` | `074f44986f715e567ad91c0b970c6bb2f7c2477b` |
| c4-container-view | `docs/design/epic-incident-response/option-2.mmd` | `d714eb0ac6d31274085b019164b02211d3aa641f3bf879bd1347f7d4b31b53e1` | `2e7548011998016be8604c2cd90f689fb53002e6` |
| c4-container-view | `docs/design/epic-incident-response/option-3.mmd` | `f0fc0d67617b30ad39455655fa6f891085aab76d648946567633e8082bb1c80d` | `7de09816f61e28b4f1c2c840eb3c39a0887bdc7a` |
| c4-context-view | `docs/design/epic-incident-response/context.mmd` | `cd490f7d8b317f7235490a0acddc7fdf60dd67dd1c4c0e1eb129b32e76714002` | `add0bff72581ff896113622c307e501152c1b44f` |
| data-flow-view | `docs/design/epic-incident-response/option-1-data-flow.mmd` | `7be97b3787210faede7a95effeb7c4f32c92d3f5537a76bc4f6b3049c5d684c4` | `baece72009fbe2ad3b163860504b13bc5961d44e` |
| data-flow-view | `docs/design/epic-incident-response/option-2-data-flow.mmd` | `5ae3f777c864fbc7b5a649331f5e39e920394256de8bfe9aa9ec2f172f6a5a0f` | `9667fccac23e311be511b0a7faf4fce4c6e44931` |
| data-flow-view | `docs/design/epic-incident-response/option-3-data-flow.mmd` | `45eee3ef4ee9d375201b1f79499f71fcd76cb186bc9d3ca20cb87cd262f7d850` | `17a8530b4deee7dcab846a6a1da868e6bbf1c704` |
| threat-model | `docs/design/epic-incident-response/threat-model.md` | `54b78e7df5ae4f516da458393f56528bcfa50ce3090551b769b39dd77f026487` | `4801412574d9741a52da32ac0da004d23548b5bc` |

## Lineage

- Requirement: fc750f4f-5fb2-4e49-a3f2-6e786246a91a
- Edge: g2-sign
- Version signed: 6
