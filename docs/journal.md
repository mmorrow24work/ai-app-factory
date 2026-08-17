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
| Issues with recorded metrics | 4 |
| Successful runs | 1 |
| Mean time per issue | 1m 23s |
| Mean turns per issue | 20 |
| Mean output tokens per issue | 6,623 |
| Mean estimated cost per issue | $0.0995 |
<!-- VELOCITY_END -->

---

## Entries

<!-- ENTRIES_START -->
<!-- New entries are appended below this marker, newest last. -->

## 2026-08-16 — Issue #1: M1: Scaffold custom-script template

- **Result:** failure
- **PR:** —
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 24 seconds
- **Turns:** 1
- **Input Tokens:** 0
- **Output Tokens:** 0
- **Estimated Cost:** $0.0000 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31973992916

## 2026-08-16 — Issue #1: M1: Scaffold custom-script template

- **Result:** failure
- **PR:** —
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 17 seconds
- **Turns:** 1
- **Input Tokens:** 0
- **Output Tokens:** 0
- **Estimated Cost:** $0.0000 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31974620081

## 2026-08-17 — Issue #1: M1: Scaffold custom-script template

- **Result:** failure
- **PR:** —
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 17 seconds
- **Turns:** 1
- **Input Tokens:** 0
- **Output Tokens:** 0
- **Estimated Cost:** $0.0000 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31988042935

## 2026-08-17 — Issue #1: M1: Scaffold custom-script template

- **Result:** success
- **PR:** #11
- **Milestone:** M1: Template library
- **Model:** claude-sonnet-5
- **Execution Duration:** 276 seconds
- **Turns:** 76
- **Input Tokens:** 226
- **Output Tokens:** 26492
- **Estimated Cost:** $0.3981 (notional — see above)
- **Run:** https://github.com/mmorrow24work/ai-app-factory/actions/runs/31988813715
