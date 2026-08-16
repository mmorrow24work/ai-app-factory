# Build Journal

Per-issue record of the unattended (Lane B) build of `ai-app-factory`. One entry per Claude run, appended automatically by `.github/workflows/claude.yml` via `.github/scripts/journal-entry.sh`.

## How this file is written

**Entries are appended by the workflow, not by Claude inside its PR.** This is deliberate: in the `uk-wealth-tracker` build, having Claude append a journal entry within each PR meant every open PR touched the same file, so almost every one went `CONFLICTING` the moment any other PR merged — leaving green, auto-merge-enabled PRs sitting unmerged indefinitely. Patching from the workflow after the run sidesteps that entirely: Claude's branches never touch `docs/journal.md`.

## What "Estimated Cost" means

This pipeline authenticates via a **Claude subscription** (OAuth), not pay-per-token API billing. The cost figure is notional — what the run *would* cost at standard list rates — useful as a consistent yardstick for comparing runs, not an actual charge.

---

## Build velocity

Recomputed by `.github/scripts/journal-entry.sh` on every run.

<!-- VELOCITY_START -->
| Metric | Value |
|---|---|
| Issues with recorded metrics | 0 |
| Successful runs | 0 |
| Mean time per issue | n/a |
| Mean turns per issue | n/a |
| Mean output tokens per issue | n/a |
| Mean estimated cost per issue | n/a |
<!-- VELOCITY_END -->

---

## Entries

<!-- ENTRIES_START -->
<!-- New entries are appended below this marker, newest last. -->
