# Backlog

Deferred-consideration items, recorded but not acted on. Each entry below is a one-line
pointer for a future pass, not a commitment or a design decision — see `docs/journal.md` /
`DESIGN.md` for what has actually shipped.

## 2026-08-19 — deferred during the improve/2026-08 hardening/UX/performance/token pass

- **Reliability / failure recovery.** No distinction today between a run that's silently
  stalled (e.g. hit the Actions runner timeout with no comment posted) and one that's still
  legitimately in progress — nor any retry or alerting path for either.
- **Cross-project observability.** No single "what's stuck across every tracked project" view
  — a requester (or the owner) has to open each project's page individually to find out.
- **State integrity.** `projects.json` is hand-maintained at provisioning time and never
  reconciled against the actual state of each repo/Actions run — it can silently drift (e.g.
  a project archived on GitHub but still listed `active` here).
- **Testing / CI on the factory itself.** `templates/`, `scripts/`, and `site/` have no
  automated tests of their own — `site/`'s `npm run build`/`lint`/`check` catch compile-time
  issues but nothing exercises `factory-new.sh`/`factory-secrets.sh` or the templates'
  rendered output.
- **Dependency hygiene.** No Dependabot (or equivalent) configured for `site/`'s npm
  dependencies or any template's own dependency manifests.
- **Cost tracking beyond tokens.** `docs/journal.md` tracks notional token cost per issue;
  nothing combines that with Actions minutes or real API $ into one view.
- **Extensibility of project types.** Only `nautobot-app`, `netbox-plugin`, `custom-script`
  exist today; no documented path for adding a fourth template type.
- **Onboarding continuity.** Unverified whether a fresh Claude Code session, given only
  `CLAUDE.md`/`README.md`/`DESIGN.md`/`docs/journal.md`, actually reconstructs the same
  mental model a human building this repo incrementally has — worth a deliberate cold-start
  test.
