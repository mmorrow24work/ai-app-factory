# ADR 0001: The ask → design doc → provision → seed → claude-go loop

## Status

Accepted (M5/M6). Revised 2026-08-17: M6 no longer creates the target repo or touches it directly — see "Revision" below.

## Context

`ai-app-factory`'s whole point is to remove the by-hand steps between "someone has a vague idea for a project" and "the unattended pipeline is grinding through labeled issues for it." M5 and M6 are the workflows that automate that gap, and since none of them can be exercised by a human mid-run (all are `workflow_dispatch`/`push`-triggered, unattended Actions jobs), the handoff between them — what file lands where, what triggers what, who does what by hand in between — needs to be written down somewhere more durable than the workflow files themselves.

## The loop

1. **Ask.** A requester fills in the `/new` page on the site (M5) with a project name and freeform requirements, and submits it — the site fires `draft-design-doc.yml` via `workflow_dispatch`, authenticated with the PAT pasted into `/settings`.
2. **Draft PR.** `draft-design-doc.yml` runs Opus against that ask, writes a design doc shaped like this repo's own `DESIGN.md` (Problem / Goal / Non-goals / Architecture / Milestones) to `docs/proposals/<slug>.md` on a `design/<slug>` branch, and opens it as a PR titled `Design: <project name>` against `main`. The target project has no repo of its own yet at this point, so the draft is staged here.
3. **Review and merge — approval gate #1.** A human reviews and edits the design doc in that PR's normal GitHub review UI (no bespoke editor — see `DESIGN.md`'s non-goals) and merges it once it's a plan worth building.
4. **Provisioning plan.** The merge — a push to `main` touching `docs/proposals/*.md` — triggers `generate-issues.yml` (M6). It reads the merged doc, determines the project type, works out the exact `scripts/factory-new.sh` invocation (including any required `--set` placeholders it can infer from the doc), and opens an issue **in this repo** — `Provision mmorrow24work/<slug>` — with those commands spelled out. It does not create the target repo, does not touch any other repo, and applies no `claude-go` label to that issue: this step always needs a human.
5. **Provision — approval gate #2.** A human runs, locally, using their own `gh auth` (no stored credential involved):
   ```
   scripts/factory-new.sh <type> <slug> --ask "..." [--set KEY=VALUE ...]
   scripts/factory-secrets.sh <slug>
   git add projects.json && git commit -m "Register mmorrow24work/<slug>" && git push
   ```
   This is the point where the project actually starts to exist — a real repo, real secrets, real entry in the dashboard — and it is a deliberate second gate, separate from gate #1: it's where a human sees who's asking for what and decides whether it's worth spending real tokens on, before any Opus run against the new repo happens.
6. **Seed — manual trigger.** The human fires the new repo's own `seed-milestones.yml` (`workflow_dispatch`, no inputs — Actions tab → seed-milestones → Run workflow). It fetches the approved design doc directly from `ai-app-factory`'s public `main` branch over an unauthenticated `raw.githubusercontent.com` request (no cross-repo credential needed to *read* a public repo), then creates one GitHub milestone per doc milestone and one or more `claude-go`-labeled issues per milestone — all using *that repo's own* `CLAUDE_CODE_OAUTH_TOKEN`/`GH_PAT`, set in step 5, never reaching back into `ai-app-factory`.
7. **Pipeline picks it up.** The moment `seed-milestones.yml` applies `claude-go` to an issue, the same repo's own `claude.yml` (copied from the template in step 5) fires — issue #1 starts running unattended, no further human action needed from here on.

## Revision: why M6 stopped creating the repo itself

Originally `generate-issues.yml` called `scripts/factory-new.sh` directly and created milestones/issues in the target repo itself, which meant its `GH_PAT` needed repo-creation rights across the whole account (`Administration`, forced to "All repositories" coverage — a fine-grained PAT scoped to specific repos structurally cannot include one that doesn't exist yet). Moving repo creation to a human step, and milestone/issue seeding to a workflow that runs *inside* the new repo with *its own* secrets, means `ai-app-factory`'s `GH_PAT` never needs to leave `ai-app-factory` at all — see `DESIGN.md`'s "GH_PAT: token strategy" for the full before/after. The token-scope win was the trigger, but the second approval gate (step 5) is worth keeping even independent of that: it's a real checkpoint, not just a security boundary.

## Consequences

- Steps 2→3 are a PR a human can inspect and edit before anything downstream acts on it. Step 4→5 is a plain-text checklist, not a PR, since nothing gets written to `main` at that point — the human executes commands locally instead.
- `generate-issues.yml` and `seed-milestones.yml` are both idempotent by design (skip a provisioning issue, milestone, or issue that already exists), since either can be re-run — a path filter on `main` for the former, a manual trigger for the latter — for the same project without duplicating work.
- `seed-milestones.yml` trusts `ai-app-factory`'s `main` branch content unauthenticated. That's fine specifically because `ai-app-factory` is public and the file it fetches (`docs/proposals/<slug>.md`) already went through PR review in step 3 — it is not trusting arbitrary input, only an already-approved design doc.
