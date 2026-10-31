# Threat model — epic portfolio oversight

- Method: STRIDE
- Option: Server-loaded members page with in-browser table and median benchmark query
- Drafted by: Design agent

One Next.js route renders the whole member portfolio in a single server load; the browser handles sorting and filtering in memory, a benchmark panel is served by a facility-type median query, and clicking a row navigates to the existing member home under a read-only view-as context that drives the HealthPRO banner.

## Spoofing

Not applicable: Session and role claims are verified via the existing IdP/OIDC flow shared with the rest of the app; this screen introduces no new authentication surface.

## Tampering

### Read-only context flag bypassed, allowing writes through the shared member home while in GPO view-as mode

Mitigated: Enforce read-only at the server/API layer for the GPO view-as context (reject mutating requests server-side) rather than relying solely on client-side flag checks in the shared member home UI.

## Repudiation

### No audit trail of which Program Lead viewed which member's home under the view-as context

Mitigated: Log view-as navigation events (actor, target memberId, timestamp) server-side when the read-only context is entered.

## Information disclosure

### Full portfolio including all members' grades and metrics is loaded into the browser in one server load, exposing data beyond what is currently filtered/visible

Mitigated: Ensure the server load still scopes rows to members the Program Lead's role/facility assignment permits, so the in-browser dataset never exceeds authorized scope even though filtering happens client-side.

## Denial of service

### Unbounded facility-type median query recomputed on every benchmark render, and full-portfolio load on every page visit, enabling resource-exhaustion of the assessment store under load or abuse

Mitigated: Add query timeouts/row limits on the median aggregate and the portfolio load, and monitor for repeated rapid requests from a single session.

## Elevation of privilege

Not applicable: The screen only reads existing role claims from the IdP to gate the GPO view-as context; it adds no new privilege or role-granting logic beyond what the read-only flag enforces.
