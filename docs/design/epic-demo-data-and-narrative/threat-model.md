# Threat model — epic demo data and narrative

- Method: STRIDE
- Option: Bundled fixtures with client-side scope context
- Drafted by: Design agent

The cyber route group lives inside the existing app shell and imports the committed /data/cyber JSON directly through a small selector module, with role and facility scope held in React context and the illustrative banner carried into print via CSS. A seeded Node script is the only producer of fixture data.

## Spoofing

Not applicable: Demo roles are selected via an in-app switcher with no authentication layer in this prototype, so there is no identity to spoof.

## Tampering

### Hand-edited fixture JSON breaks funnel/ticket/SLA reconciliation shown on screen

Mitigated: Treat /data/cyber as generated-only artifacts: CI step re-runs the seeded generator and diffs output against committed files, failing the build on any mismatch so manual edits are caught before demo.

## Repudiation

Not applicable: The module is read-only demo data with no user-generated actions or transactions to later deny.

## Information disclosure

### Client-side-only facility scoping exposes all eight members' full six-month history in the bundle regardless of selected role/facility

Accepted: Data is entirely fictional fixture content with no real organisation, client or vendor data (per TA-01/AC11), so broader client-side visibility carries no confidentiality risk for this prototype.

## Denial of service

Not applicable: Fixtures are static files bundled/served locally with no external calls or shared backend, so there is no exploitable service to exhaust.

## Elevation of privilege

Not applicable: Role/facility scope is cosmetic UI filtering over fictional read-only data, not an authorization boundary, so there is no privilege to elevate.
