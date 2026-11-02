# Threat model — epic service performance and sla tracking

- Method: STRIDE
- Option: Pure selector library inside the existing portal app
- Drafted by: Design agent

A typed, side-effect-free metric selector library bundled in the portal app: screens and report builders call the same K01-K20 functions over raw fixture rows, and a metric registry supplies labels, report subsets and the anchor into /cyber/methodology.

## Spoofing

Not applicable: All containers run inside the existing portal app's authenticated session; the selector library and methodology page introduce no new identity or principal to spoof

## Tampering

### Screen or report code bypasses the selector library and hard-codes or directly reads fixture rows, producing a metric value that silently diverges from the registry's computation

Mitigated: Enforce via code review checklist and a lint rule that forbids importing the fixture bundle outside the selector library; add a cross-screen reconciliation test (AC7) that fails CI if any screen's displayed value diverges from the selector output

## Repudiation

Not applicable: The selector library is a pure, side-effect-free read path with no write or action logging requirement; there is no user-attributable action to repudiate

## Information disclosure

### Methodology prose drifts from the actual formula implemented in the selector, causing members to see a definition that misdescribes how their metric is really computed

Mitigated: Require the registry entry and methodology anchor to be updated in the same pull request as any formula change, checked by a review template linking the two files

## Denial of service

### Large fixture sets cause every screen to recompute K01-K20 from full raw rows on each render with no shared cache, degrading the portal's responsiveness under growing fixture volume

Mitigated: Accepted for now given fixture sizes in scope, but memoize per member/period selector results client-side if render latency becomes noticeable

## Elevation of privilege

Not applicable: The selector library and registry expose no new privilege boundary; they run client-side with the same access as the rest of the portal SPA
