# Threat model — epic sector advisories

- Method: STRIDE
- Option: Fixture-backed advisories route with one role-aware exposure projection
- Drafted by: Design agent

A single client-side route at /cyber/advisories reads the advisories fixture and the current session role, then runs one pure projection that returns the lead view (exposed member count and list) or the member view (yes/no plus affected assets) for the same advisory cards.

## Spoofing

Not applicable: Session identity is established by existing auth before reaching this screen; this change adds no new identity surface

## Tampering

Not applicable: Fixture is compiled-in and read-only at runtime; there is no write path for advisories or exposure data from this screen

## Repudiation

Not applicable: Screen is read-only with no user-initiated actions or state changes to attribute or dispute

## Information disclosure

### Browser holds full cross-member exposure dataset, so any member-side inspection or compromise reveals all members' advisory exposure, not just their own

Mitigated: Document that this screen is restricted to non-confidential fictional data only; do not reuse this projection pattern for real member exposure data

## Denial of service

Not applicable: Static in-memory fixture rendered client-side has no network or server resource to exhaust

## Elevation of privilege

### Role is read from client-side session context and used to select lead vs member projection, so a manipulated session value could let a member render the lead view and see all exposed members

Mitigated: Treat role as untrusted on the client; if this pattern is ever backed by real data, enforce role-based view selection server-side rather than in the browser projection
