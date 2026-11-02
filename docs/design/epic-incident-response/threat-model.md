# Threat model — epic incident response

- Method: STRIDE
- Option: A. Fixture modules rendered directly by the two route trees
- Drafted by: Design agent

Both screens are plain route components in the existing web app that import typed fixture modules and map them to rows, timelines and retainer figures, with a role check that puts the executive AI summary panel above the rest of the detail. The declare-incident form resolves the tier target time locally, so nothing leaves the browser.

## Spoofing

Not applicable: Identity is established by the existing Identity Provider and Session Context, unchanged by this story; no new authentication surface is introduced

## Tampering

Not applicable: Fixture modules are static, build-time TypeScript bundled with the app; there is no runtime write path or user-modifiable data store for this change

## Repudiation

Not applicable: No state-changing actions are performed; the declare-incident flow explicitly makes no network call and produces no record needing non-repudiation

## Information disclosure

### Typed fixture modules bundled into the web app ship all incident and retainer records (across roles and tenants) to every client regardless of the viewer's role, since filtering happens only in rendering logic

Mitigated: Accept for now since fixtures contain only seed/demo data; flag that real feeds must be scoped server-side per role/tenant before go-live

## Denial of service

Not applicable: All data is local, in-bundle fixture data with no backend calls, so there is no network or service dependency this change could exhaust

## Elevation of privilege

### Role check for executive AI summary is a client-side UI branch in the detail page, so a non-executive member could view the executive summary by manipulating local session role state or component props

Mitigated: Treat the client-side role check as a presentation convenience only; ensure any real role-gated data is enforced server-side once real feeds replace fixtures, and keep fixture data free of anything sensitive in the interim
