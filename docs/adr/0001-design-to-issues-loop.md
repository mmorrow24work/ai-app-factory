# ADR 0001: The ask → design doc → milestones/issues → claude-go loop

## Status

Accepted (M6).

## Context

`ai-app-factory`'s whole point is to remove the by-hand steps between "someone
has a vague idea for a project" and "the unattended pipeline is grinding
through labeled issues for it." M5 and M6 are the two workflows that
automate that gap, and since neither can be exercised by a human mid-run
(both are `workflow_dispatch`/`push`-triggered, unattended Actions jobs),
the handoff between them — what file lands where, what triggers what — needs
to be written down somewhere more durable than the two workflow files
themselves.

## The loop

1. **Ask.** A requester fills in the `/new` page on the site (M5) with a
   project name and freeform requirements, and submits it — the site fires
   `draft-design-doc.yml` via `workflow_dispatch`, authenticated with the PAT
   pasted into `/settings`.
2. **Draft PR.** `draft-design-doc.yml` runs Opus against that ask, writes a
   design doc shaped like this repo's own `DESIGN.md` (Problem / Goal /
   Non-goals / Architecture / Milestones) to
   `docs/proposals/<slug>.md` on a `design/<slug>` branch, and opens it as a
   PR titled `Design: <project name>` against `main`. The target project has
   no repo of its own yet at this point, so the draft is staged here.
3. **Review and merge.** A human reviews and edits the design doc in that
   PR's normal GitHub review UI (no bespoke editor — see `DESIGN.md`'s
   non-goals) and merges it once it's a plan worth building.
4. **Milestones/issues.** The merge — a push to `main` touching
   `docs/proposals/*.md` — triggers `generate-issues.yml` (M6). It reads the
   merged doc, determines the project type, creates the target repo from the
   matching template via `scripts/factory-new.sh` if it's new (M2), then
   creates one GitHub milestone per doc milestone and one or more
   `claude-go`-labeled issues per milestone in the target repo, using this
   repo's own seed issues (#1 onward) as the quality bar for acceptance
   criteria.
5. **Register.** If `projects.json` in this repo doesn't yet have an entry
   for the new project — either because `factory-new.sh` just wrote one
   locally in step 4's checkout, or because the repo pre-existed without
   ever being registered — `generate-issues.yml` opens a small PR against
   `main` here to add it. This is a separate, deliberately reviewable PR
   rather than a direct push: every other change to `main` in this repo
   flows through PR review (`claude.yml`, `draft-design-doc.yml`), and the
   only carved-out exception is `docs/journal.md` (appended directly by the
   workflow, per `CLAUDE.md`, specifically to dodge the every-PR-touches-
   the-same-file conflict problem that doesn't apply to a one-entry JSON
   registry update). Once merged, the project shows up in the dashboard
   sidebar.
6. **Pipeline picks it up.** The target repo's own `claude.yml` (copied from
   this repo's template in step 4) fires the moment `claude-go` lands on an
   issue — which `generate-issues.yml` already applied in step 4 — so issue
   #1 starts running unattended with no further human action.

## Consequences

- Steps 2→3 and 4→5 are each a PR a human can inspect and edit before
  anything downstream acts on it; nothing about a project's shape or its
  first wave of issues is ever pushed straight to `main` unreviewed.
- `generate-issues.yml` is idempotent by design (skips milestones/issues/repo
  creation that already exist) because it's triggered by a path filter on
  `main`, which a later edit to the same design doc — or a manual
  `workflow_dispatch` re-run — can trigger again for the same project.
