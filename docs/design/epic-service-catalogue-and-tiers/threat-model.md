# Threat model — epic service catalogue and tiers

- Method: STRIDE
- Option: Build-time tiers fixture rendered through one illustrative figure component
- Drafted by: Design agent

A single schema-validated JSON fixture holds the three tiers' inclusions, cadences and SLA/IR target tables, bundled with the web app at build time; the catalogue page renders inclusions and per-priority SLA pairs from that fixture, and every numeric figure is emitted through one shared illustrative-figure component that carries the label.

## Spoofing

Not applicable: Static catalogue page with no user identity, authentication or accounts involved

## Tampering

### Compromised build pipeline or repo commit alters tier fixture figures (SLA/IR hours) without schema catching semantic errors

Mitigated: Require code review and CI schema validation plus a diff/approval gate on the fixture file before merge and publish

## Repudiation

Not applicable: No user-initiated transactions or actions are recorded against this read-only informational catalogue

## Information disclosure

Not applicable: Tier fixture content is public marketing-style information intended for prospective clients, not sensitive data

## Denial of service

Not applicable: Static bundle served via CDN hosting has inherent scaling/availability resilience outside this change's scope

## Elevation of privilege

### A hand-written numeric figure bypasses the shared illustrative-figure component, escaping the 'illustrative' label and implicitly gaining unvetted display trust

Mitigated: Add a lint/test rule that fails the build if raw numeric tier figures are rendered outside the shared illustrative-figure component
