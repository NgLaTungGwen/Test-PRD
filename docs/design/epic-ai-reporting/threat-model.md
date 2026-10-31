# Threat model — epic ai reporting

- Method: STRIDE
- Option: Fixture-resolved narratives behind a staged animation gate
- Drafted by: Design agent

Keep everything in the existing browser prototype: per-member, per-period narratives live in the reports and members fixtures, a narrative lookup resolves the member/period key, and a staged animation component holds the screen for 2-3 seconds before handing the stored report to the viewer. A shared disclosure label is rendered by the cyber screen shell so every screen and narrative carries "AI-generated, illustrative".

## Spoofing

Not applicable: There is no authentication or identity concept in this static prototype; the single demo presenter is not impersonating any other principal

## Tampering

### Fixture JSON for narratives or members edited client-side or via compromised bundle to alter report content without detection

Mitigated: Serve fixtures as read-only static assets with build-time integrity (subresource hashing) and keep them out of any writable runtime path

## Repudiation

Not applicable: No report generation action is logged or disputed; this is a local demo walkthrough with no audit requirement

## Information disclosure

### Screens or narratives rendered outside the shared cyber screen shell silently omit the 'AI-generated, illustrative' disclosure, misleading viewers about content provenance

Mitigated: Add a lint/test check that fails the build if any report or narrative component is rendered without passing through the shared disclosure-labelling shell

## Denial of service

Not applicable: All content is static fixtures served from a CDN/static host with no backend compute to exhaust; the staged animation delay is fixed and not attacker-influenced

## Elevation of privilege

### Narrative lookup key (member/period) is trusted from client-side routing/state, allowing a presenter to craft a URL or state change to view narratives for members/periods not intended to be shown in the current demo flow

Accepted: This is a static demo prototype with no access control model or sensitive real data; all fixture content is non-confidential illustrative text, so cross-member access carries no real risk
